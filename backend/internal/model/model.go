package model

import "time"

type User struct {
	ID              string    `json:"id"`
	Email           string    `json:"email"`
	DisplayName     string    `json:"display_name"`
	ProfileImageURL *string   `json:"profile_image_url"`
	CreatedAt       time.Time `json:"created_at"`
}

type DiaryEntry struct {
	ID                     string    `json:"id"`
	UserID                 string    `json:"user_id"`
	Content                *string   `json:"content"`
	Date                   string    `json:"date"`
	Weather                *string   `json:"weather"`
	IsPublic               bool      `json:"is_public"`
	ImageURL               *string   `json:"image_url"`
	ImageName              *string   `json:"image_name"`
	AudioURL               *string   `json:"audio_url"`
	AudioName              *string   `json:"audio_name"`
	Events                 *string   `json:"events"`
	Emotions               *string   `json:"emotions"`
	GoodThings             *string   `json:"good_things"`
	Reflections            *string   `json:"reflections"`
	Gratitude              *string   `json:"gratitude"`
	TomorrowGoals          *string   `json:"tomorrow_goals"`
	TomorrowLookingForward *string   `json:"tomorrow_looking_forward"`
	Learnings              *string   `json:"learnings"`
	HealthHabits           *string   `json:"health_habits"`
	TodayInOneWord         *string   `json:"today_in_one_word"`
	CreatedAt              time.Time `json:"created_at"`
	UpdatedAt              time.Time `json:"updated_at"`
}

type PublicDiaryEntry struct {
	ID                     string    `json:"id"`
	Content                *string   `json:"content"`
	Date                   string    `json:"date"`
	Weather                *string   `json:"weather"`
	ImageURL               *string   `json:"image_url"`
	AudioURL               *string   `json:"audio_url"`
	Events                 *string   `json:"events"`
	Emotions               *string   `json:"emotions"`
	GoodThings             *string   `json:"good_things"`
	Reflections            *string   `json:"reflections"`
	Gratitude              *string   `json:"gratitude"`
	TomorrowGoals          *string   `json:"tomorrow_goals"`
	TomorrowLookingForward *string   `json:"tomorrow_looking_forward"`
	Learnings              *string   `json:"learnings"`
	HealthHabits           *string   `json:"health_habits"`
	TodayInOneWord         *string   `json:"today_in_one_word"`
	CreatedAt              time.Time `json:"created_at"`
	AuthorName             string    `json:"author_name"`
	AuthorPhoto            *string   `json:"author_photo"`
}
