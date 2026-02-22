package config

import (
	"os"
	"strings"
)

type Config struct {
	Host           string
	APIPort        string
	AllowedOrigins []string
	DatabaseURL    string
	JWTSecret      string
	UploadDir      string
	TokenHours     int
}

func Load() Config {
	allowedOrigins := splitCSV(getEnv("ALLOWED_ORIGINS", "http://localhost:3000"))
	if len(allowedOrigins) == 0 {
		allowedOrigins = []string{"http://localhost:3000"}
	}

	return Config{
		Host:           getEnv("HOST", "0.0.0.0"),
		APIPort:        getEnv("API_PORT", "8000"),
		AllowedOrigins: allowedOrigins,
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		JWTSecret:      getEnv("JWT_SECRET", "dev-secret-change-me"),
		UploadDir:      getEnv("UPLOAD_DIR", "./uploads"),
		TokenHours:     24,
	}
}

func getEnv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
