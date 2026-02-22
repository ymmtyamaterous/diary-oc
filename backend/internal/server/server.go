package server

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ymmtyamaterous/diary-oc-api/internal/auth"
	"github.com/ymmtyamaterous/diary-oc-api/internal/config"
	"github.com/ymmtyamaterous/diary-oc-api/internal/model"
	"github.com/ymmtyamaterous/diary-oc-api/internal/validation"
)

type Server struct {
	cfg config.Config
	db  *pgxpool.Pool
}

type contextKey string

const userIDKey contextKey = "userID"

func New(cfg config.Config, db *pgxpool.Pool) *Server {
	return &Server{cfg: cfg, db: db}
}

func (s *Server) Router() http.Handler {
	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: s.cfg.AllowedOrigins,
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"},
		MaxAge:         300,
	}))

	r.Route("/api", func(api chi.Router) {
		api.Get("/health", s.handleHealth)

		api.Post("/auth/register", s.handleRegister)
		api.Post("/auth/login", s.handleLogin)
		api.With(s.authMiddleware).Get("/auth/me", s.handleMe)

		api.Get("/diaries/public", s.handleListPublicDiaries)
		api.With(s.authMiddleware).Get("/diaries", s.handleListMyDiaries)
		api.With(s.authMiddleware).Post("/diaries", s.handleCreateDiary)
		api.With(s.authMiddleware).Put("/diaries/{id}", s.handleUpdateDiary)
		api.With(s.authMiddleware).Delete("/diaries/{id}", s.handleDeleteDiary)
		api.With(s.authMiddleware).Patch("/diaries/{id}/visibility", s.handleUpdateVisibility)

		api.With(s.authMiddleware).Post("/upload/image", s.handleUploadImage)
		api.With(s.authMiddleware).Post("/upload/audio", s.handleUploadAudio)
		api.With(s.authMiddleware).Delete("/files/{filename}", s.handleDeleteFile)
	})

	r.Get("/api/files/images/{filename}", s.serveImage)
	r.Get("/api/files/audio/{filename}", s.serveAudio)

	return r
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if err := s.db.Ping(r.Context()); err != nil {
		writeError(w, http.StatusServiceUnavailable, "データベース接続に失敗しました")
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "ok"})
}

type authPayload struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
}

type authResponse struct {
	Token string     `json:"token"`
	User  model.User `json:"user"`
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	var payload authPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "不正なリクエストです")
		return
	}

	if err := validation.RequireEmail(payload.Email); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := validation.RequirePassword(payload.Password); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := validation.RequireDisplayName(payload.DisplayName); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	hash, err := auth.HashPassword(payload.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "パスワード処理に失敗しました")
		return
	}

	var user model.User
	err = s.db.QueryRow(r.Context(), `
		INSERT INTO users (email, password_hash, display_name)
		VALUES ($1, $2, $3)
		RETURNING id, email, display_name, profile_image_url, created_at
	`, strings.TrimSpace(payload.Email), hash, strings.TrimSpace(payload.DisplayName)).Scan(
		&user.ID,
		&user.Email,
		&user.DisplayName,
		newNullableString(&user.ProfileImageURL),
		&user.CreatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			writeError(w, http.StatusConflict, "このメールアドレスはすでに登録されています")
			return
		}
		writeError(w, http.StatusInternalServerError, "ユーザー登録に失敗しました")
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Email, s.cfg.JWTSecret, s.cfg.TokenHours)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "トークン生成に失敗しました")
		return
	}

	writeData(w, http.StatusCreated, authResponse{Token: token, User: user})
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var payload authPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "不正なリクエストです")
		return
	}

	if err := validation.RequireEmail(payload.Email); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	var user model.User
	var hash string
	err := s.db.QueryRow(r.Context(), `
		SELECT id, email, display_name, profile_image_url, created_at, password_hash
		FROM users
		WHERE email = $1
	`, strings.TrimSpace(payload.Email)).Scan(
		&user.ID,
		&user.Email,
		&user.DisplayName,
		newNullableString(&user.ProfileImageURL),
		&user.CreatedAt,
		&hash,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusUnauthorized, "メールアドレスまたはパスワードが正しくありません")
			return
		}
		writeError(w, http.StatusInternalServerError, "ログインに失敗しました")
		return
	}

	if err := auth.VerifyPassword(hash, payload.Password); err != nil {
		writeError(w, http.StatusUnauthorized, "メールアドレスまたはパスワードが正しくありません")
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Email, s.cfg.JWTSecret, s.cfg.TokenHours)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "トークン生成に失敗しました")
		return
	}

	writeData(w, http.StatusOK, authResponse{Token: token, User: user})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "認証トークンが無効です")
		return
	}

	var user model.User
	err := s.db.QueryRow(r.Context(), `
		SELECT id, email, display_name, profile_image_url, created_at
		FROM users
		WHERE id = $1
	`, userID).Scan(
		&user.ID,
		&user.Email,
		&user.DisplayName,
		newNullableString(&user.ProfileImageURL),
		&user.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusUnauthorized, "認証トークンが無効です")
			return
		}
		writeError(w, http.StatusInternalServerError, "ユーザー情報取得に失敗しました")
		return
	}

	writeData(w, http.StatusOK, user)
}

type diaryCreatePayload struct {
	Content                *string `json:"content"`
	Date                   string  `json:"date"`
	Weather                *string `json:"weather"`
	IsPublic               bool    `json:"is_public"`
	ImageURL               *string `json:"image_url"`
	ImageName              *string `json:"image_name"`
	AudioURL               *string `json:"audio_url"`
	AudioName              *string `json:"audio_name"`
	Events                 *string `json:"events"`
	Emotions               *string `json:"emotions"`
	GoodThings             *string `json:"good_things"`
	Reflections            *string `json:"reflections"`
	Gratitude              *string `json:"gratitude"`
	TomorrowGoals          *string `json:"tomorrow_goals"`
	TomorrowLookingForward *string `json:"tomorrow_looking_forward"`
	Learnings              *string `json:"learnings"`
	HealthHabits           *string `json:"health_habits"`
	TodayInOneWord         *string `json:"today_in_one_word"`
}

func (s *Server) handleListMyDiaries(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "認証トークンが無効です")
		return
	}

	rows, err := s.db.Query(r.Context(), `
		SELECT
			id, user_id, content, date, weather, is_public,
			image_url, image_name, audio_url, audio_name,
			events, emotions, good_things, reflections, gratitude,
			tomorrow_goals, tomorrow_looking_forward, learnings,
			health_habits, today_in_one_word,
			created_at, updated_at
		FROM diary_entries
		WHERE user_id = $1
		ORDER BY date DESC, created_at DESC
	`, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "日記一覧の取得に失敗しました")
		return
	}
	defer rows.Close()

	entries := make([]model.DiaryEntry, 0)
	for rows.Next() {
		entry, err := scanDiaryEntry(rows)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "日記一覧の取得に失敗しました")
			return
		}
		entries = append(entries, entry)
	}

	writeData(w, http.StatusOK, entries)
}

func (s *Server) handleCreateDiary(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "認証トークンが無効です")
		return
	}

	var payload diaryCreatePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "不正なリクエストです")
		return
	}

	if err := validateDiaryPayload(payload); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	var entry model.DiaryEntry
	var entryDate pgtype.Date
	err := s.db.QueryRow(r.Context(), `
		INSERT INTO diary_entries (
			user_id, content, date, weather, is_public,
			image_url, image_name, audio_url, audio_name,
			events, emotions, good_things, reflections,
			gratitude, tomorrow_goals, tomorrow_looking_forward,
			learnings, health_habits, today_in_one_word
		)
		VALUES (
			$1, $2, $3, $4, $5,
			$6, $7, $8, $9,
			$10, $11, $12, $13,
			$14, $15, $16,
			$17, $18, $19
		)
		RETURNING
			id, user_id, content, date, weather, is_public,
			image_url, image_name, audio_url, audio_name,
			events, emotions, good_things, reflections, gratitude,
			tomorrow_goals, tomorrow_looking_forward, learnings,
			health_habits, today_in_one_word,
			created_at, updated_at
	`,
		userID,
		emptyToNil(payload.Content),
		payload.Date,
		emptyToNil(payload.Weather),
		payload.IsPublic,
		emptyToNil(payload.ImageURL),
		emptyToNil(payload.ImageName),
		emptyToNil(payload.AudioURL),
		emptyToNil(payload.AudioName),
		emptyToNil(payload.Events),
		emptyToNil(payload.Emotions),
		emptyToNil(payload.GoodThings),
		emptyToNil(payload.Reflections),
		emptyToNil(payload.Gratitude),
		emptyToNil(payload.TomorrowGoals),
		emptyToNil(payload.TomorrowLookingForward),
		emptyToNil(payload.Learnings),
		emptyToNil(payload.HealthHabits),
		emptyToNil(payload.TodayInOneWord),
	).Scan(
		&entry.ID,
		&entry.UserID,
		newNullableString(&entry.Content),
		&entryDate,
		newNullableString(&entry.Weather),
		&entry.IsPublic,
		newNullableString(&entry.ImageURL),
		newNullableString(&entry.ImageName),
		newNullableString(&entry.AudioURL),
		newNullableString(&entry.AudioName),
		newNullableString(&entry.Events),
		newNullableString(&entry.Emotions),
		newNullableString(&entry.GoodThings),
		newNullableString(&entry.Reflections),
		newNullableString(&entry.Gratitude),
		newNullableString(&entry.TomorrowGoals),
		newNullableString(&entry.TomorrowLookingForward),
		newNullableString(&entry.Learnings),
		newNullableString(&entry.HealthHabits),
		newNullableString(&entry.TodayInOneWord),
		&entry.CreatedAt,
		&entry.UpdatedAt,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "日記の保存に失敗しました")
		return
	}
	if entryDate.Valid {
		entry.Date = entryDate.Time.Format("2006-01-02")
	}

	writeData(w, http.StatusCreated, entry)
}

func (s *Server) handleUpdateDiary(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "認証トークンが無効です")
		return
	}

	id := chi.URLParam(r, "id")
	if _, err := uuid.Parse(id); err != nil {
		writeError(w, http.StatusBadRequest, "日記IDが不正です")
		return
	}

	var payload diaryCreatePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "不正なリクエストです")
		return
	}
	if err := validateDiaryPayload(payload); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	var ownerID string
	err := s.db.QueryRow(r.Context(), `
		SELECT user_id
		FROM diary_entries
		WHERE id = $1
	`, id).Scan(&ownerID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "日記が見つかりません")
			return
		}
		writeError(w, http.StatusInternalServerError, "日記更新に失敗しました")
		return
	}
	if ownerID != userID {
		writeError(w, http.StatusForbidden, "この日記を変更する権限がありません")
		return
	}

	var entry model.DiaryEntry
	var entryDate pgtype.Date
	err = s.db.QueryRow(r.Context(), `
		UPDATE diary_entries
		SET
			content = $1,
			date = $2,
			weather = $3,
			is_public = $4,
			image_url = $5,
			image_name = $6,
			audio_url = $7,
			audio_name = $8,
			events = $9,
			emotions = $10,
			good_things = $11,
			reflections = $12,
			gratitude = $13,
			tomorrow_goals = $14,
			tomorrow_looking_forward = $15,
			learnings = $16,
			health_habits = $17,
			today_in_one_word = $18,
			updated_at = NOW()
		WHERE id = $19
		RETURNING
			id, user_id, content, date, weather, is_public,
			image_url, image_name, audio_url, audio_name,
			events, emotions, good_things, reflections, gratitude,
			tomorrow_goals, tomorrow_looking_forward, learnings,
			health_habits, today_in_one_word,
			created_at, updated_at
	`,
		emptyToNil(payload.Content),
		payload.Date,
		emptyToNil(payload.Weather),
		payload.IsPublic,
		emptyToNil(payload.ImageURL),
		emptyToNil(payload.ImageName),
		emptyToNil(payload.AudioURL),
		emptyToNil(payload.AudioName),
		emptyToNil(payload.Events),
		emptyToNil(payload.Emotions),
		emptyToNil(payload.GoodThings),
		emptyToNil(payload.Reflections),
		emptyToNil(payload.Gratitude),
		emptyToNil(payload.TomorrowGoals),
		emptyToNil(payload.TomorrowLookingForward),
		emptyToNil(payload.Learnings),
		emptyToNil(payload.HealthHabits),
		emptyToNil(payload.TodayInOneWord),
		id,
	).Scan(
		&entry.ID,
		&entry.UserID,
		newNullableString(&entry.Content),
		&entryDate,
		newNullableString(&entry.Weather),
		&entry.IsPublic,
		newNullableString(&entry.ImageURL),
		newNullableString(&entry.ImageName),
		newNullableString(&entry.AudioURL),
		newNullableString(&entry.AudioName),
		newNullableString(&entry.Events),
		newNullableString(&entry.Emotions),
		newNullableString(&entry.GoodThings),
		newNullableString(&entry.Reflections),
		newNullableString(&entry.Gratitude),
		newNullableString(&entry.TomorrowGoals),
		newNullableString(&entry.TomorrowLookingForward),
		newNullableString(&entry.Learnings),
		newNullableString(&entry.HealthHabits),
		newNullableString(&entry.TodayInOneWord),
		&entry.CreatedAt,
		&entry.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "日記が見つかりません")
			return
		}
		writeError(w, http.StatusInternalServerError, "日記更新に失敗しました")
		return
	}
	if entryDate.Valid {
		entry.Date = entryDate.Time.Format("2006-01-02")
	}

	writeData(w, http.StatusOK, entry)
}

func (s *Server) handleDeleteDiary(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "認証トークンが無効です")
		return
	}

	id := chi.URLParam(r, "id")
	if _, err := uuid.Parse(id); err != nil {
		writeError(w, http.StatusBadRequest, "日記IDが不正です")
		return
	}

	var imageName *string
	var audioName *string
	var tempImage pgtype.Text
	var tempAudio pgtype.Text
	err := s.db.QueryRow(r.Context(), `
		SELECT image_name, audio_name
		FROM diary_entries
		WHERE id = $1 AND user_id = $2
	`, id, userID).Scan(&tempImage, &tempAudio)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "日記が見つかりません")
			return
		}
		writeError(w, http.StatusInternalServerError, "日記削除に失敗しました")
		return
	}
	if tempImage.Valid {
		imageName = &tempImage.String
	}
	if tempAudio.Valid {
		audioName = &tempAudio.String
	}

	cmd, err := s.db.Exec(r.Context(), `
		DELETE FROM diary_entries
		WHERE id = $1 AND user_id = $2
	`, id, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "日記削除に失敗しました")
		return
	}
	if cmd.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "日記が見つかりません")
		return
	}

	if imageName != nil {
		_ = os.Remove(filepath.Join(s.cfg.UploadDir, "images", *imageName))
	}
	if audioName != nil {
		_ = os.Remove(filepath.Join(s.cfg.UploadDir, "audio", *audioName))
	}

	writeData(w, http.StatusOK, map[string]string{"message": "日記を削除しました"})
}

func (s *Server) handleUpdateVisibility(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "認証トークンが無効です")
		return
	}

	id := chi.URLParam(r, "id")
	if _, err := uuid.Parse(id); err != nil {
		writeError(w, http.StatusBadRequest, "日記IDが不正です")
		return
	}

	var payload struct {
		IsPublic bool `json:"is_public"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "不正なリクエストです")
		return
	}

	var response struct {
		ID        string    `json:"id"`
		IsPublic  bool      `json:"is_public"`
		UpdatedAt time.Time `json:"updated_at"`
	}
	err := s.db.QueryRow(r.Context(), `
		UPDATE diary_entries
		SET is_public = $1, updated_at = NOW()
		WHERE id = $2 AND user_id = $3
		RETURNING id, is_public, updated_at
	`, payload.IsPublic, id, userID).Scan(&response.ID, &response.IsPublic, &response.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusForbidden, "この日記を変更する権限がありません")
			return
		}
		writeError(w, http.StatusInternalServerError, "公開設定の更新に失敗しました")
		return
	}

	writeData(w, http.StatusOK, response)
}

func (s *Server) handleListPublicDiaries(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(r.Context(), `
		SELECT
			de.id, de.content, de.date, de.weather,
			de.image_url, de.audio_url,
			de.events, de.emotions, de.good_things,
			de.reflections, de.gratitude, de.tomorrow_goals,
			de.tomorrow_looking_forward, de.learnings,
			de.health_habits, de.today_in_one_word,
			de.created_at,
			u.display_name AS author_name,
			u.profile_image_url AS author_photo
		FROM diary_entries de
		JOIN users u ON u.id = de.user_id
		WHERE de.is_public = TRUE
		ORDER BY de.created_at DESC
		LIMIT 50
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "公開日記の取得に失敗しました")
		return
	}
	defer rows.Close()

	entries := make([]model.PublicDiaryEntry, 0)
	for rows.Next() {
		entry, err := scanPublicDiaryEntry(rows)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "公開日記の取得に失敗しました")
			return
		}
		entries = append(entries, entry)
	}

	writeData(w, http.StatusOK, entries)
}

func (s *Server) handleUploadImage(w http.ResponseWriter, r *http.Request) {
	file, header, err := r.FormFile("image")
	if err != nil {
		writeError(w, http.StatusBadRequest, "画像ファイルが必要です")
		return
	}
	defer file.Close()

	if header.Size > 5*1024*1024 {
		writeError(w, http.StatusBadRequest, "画像サイズは5MB以下にしてください")
		return
	}

	if err := ensureDir(filepath.Join(s.cfg.UploadDir, "images")); err != nil {
		writeError(w, http.StatusInternalServerError, "アップロード先ディレクトリ作成に失敗しました")
		return
	}

	name, relURL, err := saveUpload(file, header, filepath.Join(s.cfg.UploadDir, "images"), "diary-image", true)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeData(w, http.StatusCreated, map[string]string{
		"url":  "/api/files/images/" + name,
		"name": name,
		"path": relURL,
	})
}

func (s *Server) handleUploadAudio(w http.ResponseWriter, r *http.Request) {
	file, header, err := r.FormFile("audio")
	if err != nil {
		writeError(w, http.StatusBadRequest, "音声ファイルが必要です")
		return
	}
	defer file.Close()

	if header.Size > 10*1024*1024 {
		writeError(w, http.StatusBadRequest, "音声サイズは10MB以下にしてください")
		return
	}

	if err := ensureDir(filepath.Join(s.cfg.UploadDir, "audio")); err != nil {
		writeError(w, http.StatusInternalServerError, "アップロード先ディレクトリ作成に失敗しました")
		return
	}

	name, relURL, err := saveUpload(file, header, filepath.Join(s.cfg.UploadDir, "audio"), "diary-audio", false)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeData(w, http.StatusCreated, map[string]string{
		"url":  "/api/files/audio/" + name,
		"name": name,
		"path": relURL,
	})
}

func (s *Server) handleDeleteFile(w http.ResponseWriter, r *http.Request) {
	filename := filepath.Base(chi.URLParam(r, "filename"))
	if filename == "" {
		writeError(w, http.StatusBadRequest, "ファイル名が不正です")
		return
	}

	imagePath := filepath.Join(s.cfg.UploadDir, "images", filename)
	audioPath := filepath.Join(s.cfg.UploadDir, "audio", filename)
	if err := os.Remove(imagePath); err == nil {
		writeData(w, http.StatusOK, map[string]string{"message": "ファイルを削除しました"})
		return
	}
	if err := os.Remove(audioPath); err == nil {
		writeData(w, http.StatusOK, map[string]string{"message": "ファイルを削除しました"})
		return
	}

	writeError(w, http.StatusNotFound, "ファイルが見つかりません")
}

func (s *Server) serveImage(w http.ResponseWriter, r *http.Request) {
	filename := filepath.Base(chi.URLParam(r, "filename"))
	http.ServeFile(w, r, filepath.Join(s.cfg.UploadDir, "images", filename))
}

func (s *Server) serveAudio(w http.ResponseWriter, r *http.Request) {
	filename := filepath.Base(chi.URLParam(r, "filename"))
	http.ServeFile(w, r, filepath.Join(s.cfg.UploadDir, "audio", filename))
}

func (s *Server) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			writeError(w, http.StatusUnauthorized, "認証トークンが無効です")
			return
		}

		token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		claims, err := auth.ParseToken(token, s.cfg.JWTSecret)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "認証トークンが無効です")
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getUserID(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(userIDKey).(string)
	return userID, ok
}

func writeData(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]any{"data": data})
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func newNullableString(target **string) any {
	return &nullableString{target: target}
}

type nullableString struct {
	target **string
}

func (n *nullableString) ScanText(v pgtype.Text) error {
	if !v.Valid {
		*n.target = nil
		return nil
	}
	value := v.String
	*n.target = &value
	return nil
}

func (n *nullableString) Scan(src any) error {
	switch value := src.(type) {
	case nil:
		*n.target = nil
		return nil
	case string:
		v := value
		*n.target = &v
		return nil
	case []byte:
		v := string(value)
		*n.target = &v
		return nil
	default:
		return fmt.Errorf("unsupported nullable string type: %T", src)
	}
}

func emptyToNil(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func scanDiaryEntry(row pgx.Row) (model.DiaryEntry, error) {
	entry := model.DiaryEntry{}
	var date pgtype.Date
	err := row.Scan(
		&entry.ID,
		&entry.UserID,
		newNullableString(&entry.Content),
		&date,
		newNullableString(&entry.Weather),
		&entry.IsPublic,
		newNullableString(&entry.ImageURL),
		newNullableString(&entry.ImageName),
		newNullableString(&entry.AudioURL),
		newNullableString(&entry.AudioName),
		newNullableString(&entry.Events),
		newNullableString(&entry.Emotions),
		newNullableString(&entry.GoodThings),
		newNullableString(&entry.Reflections),
		newNullableString(&entry.Gratitude),
		newNullableString(&entry.TomorrowGoals),
		newNullableString(&entry.TomorrowLookingForward),
		newNullableString(&entry.Learnings),
		newNullableString(&entry.HealthHabits),
		newNullableString(&entry.TodayInOneWord),
		&entry.CreatedAt,
		&entry.UpdatedAt,
	)
	if err == nil && date.Valid {
		entry.Date = date.Time.Format("2006-01-02")
	}
	return entry, err
}

func scanPublicDiaryEntry(row pgx.Row) (model.PublicDiaryEntry, error) {
	entry := model.PublicDiaryEntry{}
	var date pgtype.Date
	err := row.Scan(
		&entry.ID,
		newNullableString(&entry.Content),
		&date,
		newNullableString(&entry.Weather),
		newNullableString(&entry.ImageURL),
		newNullableString(&entry.AudioURL),
		newNullableString(&entry.Events),
		newNullableString(&entry.Emotions),
		newNullableString(&entry.GoodThings),
		newNullableString(&entry.Reflections),
		newNullableString(&entry.Gratitude),
		newNullableString(&entry.TomorrowGoals),
		newNullableString(&entry.TomorrowLookingForward),
		newNullableString(&entry.Learnings),
		newNullableString(&entry.HealthHabits),
		newNullableString(&entry.TodayInOneWord),
		&entry.CreatedAt,
		&entry.AuthorName,
		newNullableString(&entry.AuthorPhoto),
	)
	if err == nil && date.Valid {
		entry.Date = date.Time.Format("2006-01-02")
	}
	return entry, err
}

func ensureDir(dir string) error {
	return os.MkdirAll(dir, 0o755)
}

func validateDiaryPayload(payload diaryCreatePayload) error {
	if strings.TrimSpace(payload.Date) == "" {
		return errors.New("日付は必須です")
	}
	if _, err := time.Parse("2006-01-02", payload.Date); err != nil {
		return errors.New("日付形式が不正です")
	}
	if err := validation.ValidateWeather(payload.Weather); err != nil {
		return err
	}
	if err := validation.ValidateDiaryFilled(map[string]*string{
		"content":                  payload.Content,
		"events":                   payload.Events,
		"emotions":                 payload.Emotions,
		"good_things":              payload.GoodThings,
		"reflections":              payload.Reflections,
		"gratitude":                payload.Gratitude,
		"tomorrow_goals":           payload.TomorrowGoals,
		"tomorrow_looking_forward": payload.TomorrowLookingForward,
		"learnings":                payload.Learnings,
		"health_habits":            payload.HealthHabits,
		"today_in_one_word":        payload.TodayInOneWord,
	}); err != nil {
		return err
	}
	return nil
}

func saveUpload(file multipart.File, header *multipart.FileHeader, destDir, prefix string, imageOnly bool) (string, string, error) {
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" {
		return "", "", errors.New("拡張子付きのファイルをアップロードしてください")
	}
	if imageOnly {
		if !isAllowedImageExt(ext) {
			return "", "", errors.New("画像ファイルのみアップロードできます")
		}
	} else {
		if !isAllowedAudioExt(ext) {
			return "", "", errors.New("対応していない音声形式です")
		}
	}

	if imageOnly {
		head := make([]byte, 512)
		n, _ := file.Read(head)
		if _, err := file.Seek(0, io.SeekStart); err != nil {
			return "", "", errors.New("アップロード処理に失敗しました")
		}
		contentType := http.DetectContentType(head[:n])
		if !strings.HasPrefix(contentType, "image/") {
			return "", "", errors.New("画像ファイルのみアップロードできます")
		}
	} else if audioContentTypeFromExt(ext) == "" {
		return "", "", errors.New("音声ファイルのみアップロードできます")
	}

	name := fmt.Sprintf("%s-%d-%s%s", prefix, time.Now().UnixMilli(), uuid.NewString(), ext)
	fullPath := filepath.Join(destDir, name)

	dst, err := os.Create(fullPath)
	if err != nil {
		return "", "", errors.New("ファイル保存に失敗しました")
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", "", errors.New("ファイル保存に失敗しました")
	}

	return name, fullPath, nil
}

func isAllowedImageExt(ext string) bool {
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp":
		return true
	default:
		return false
	}
}

func isAllowedAudioExt(ext string) bool {
	switch ext {
	case ".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm":
		return true
	default:
		return false
	}
}

func isAllowedAudioContentType(contentType string) bool {
	return contentType != ""
}

func audioContentTypeFromExt(ext string) string {
	switch ext {
	case ".mp3":
		return "audio/mpeg"
	case ".wav":
		return "audio/wav"
	case ".ogg":
		return "audio/ogg"
	case ".m4a":
		return "audio/mp4"
	case ".aac":
		return "audio/aac"
	case ".webm":
		return "audio/webm"
	default:
		return ""
	}
}
