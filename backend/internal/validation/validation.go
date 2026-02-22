package validation

import (
	"errors"
	"strings"
)

var validWeather = map[string]struct{}{
	"sunny":         {},
	"cloudy":        {},
	"rainy":         {},
	"snowy":         {},
	"stormy":        {},
	"foggy":         {},
	"partly-cloudy": {},
	"windy":         {},
}

func RequireEmail(email string) error {
	trimmed := strings.TrimSpace(email)
	if trimmed == "" {
		return errors.New("メールアドレスは必須です")
	}
	if !strings.Contains(trimmed, "@") {
		return errors.New("メールアドレスの形式が正しくありません")
	}
	return nil
}

func RequirePassword(password string) error {
	if len(password) < 8 {
		return errors.New("パスワードは8文字以上で入力してください")
	}
	return nil
}

func RequireDisplayName(displayName string) error {
	if strings.TrimSpace(displayName) == "" {
		return errors.New("表示名は必須です")
	}
	return nil
}

func ValidateWeather(weather *string) error {
	if weather == nil || strings.TrimSpace(*weather) == "" {
		return nil
	}
	if _, ok := validWeather[*weather]; !ok {
		return errors.New("天気の値が不正です")
	}
	return nil
}

func ValidateDiaryFilled(fields map[string]*string) error {
	for _, value := range fields {
		if value != nil && strings.TrimSpace(*value) != "" {
			return nil
		}
	}
	return errors.New("少なくとも1つの項目を入力してください")
}
