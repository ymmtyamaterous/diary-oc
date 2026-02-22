package validation

import "testing"

func strPtr(s string) *string {
	return &s
}

func TestValidateWeather(t *testing.T) {
	valid := "sunny"
	if err := ValidateWeather(&valid); err != nil {
		t.Fatalf("expected valid weather, got error: %v", err)
	}

	invalid := "typhoon"
	if err := ValidateWeather(&invalid); err == nil {
		t.Fatal("expected invalid weather error")
	}
}

func TestValidateDiaryFilled(t *testing.T) {
	empty := map[string]*string{
		"content": nil,
		"events":  strPtr("   "),
	}
	if err := ValidateDiaryFilled(empty); err == nil {
		t.Fatal("expected error for empty diary fields")
	}

	filled := map[string]*string{
		"content": strPtr("今日はよかった"),
	}
	if err := ValidateDiaryFilled(filled); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestAuthValidation(t *testing.T) {
	if err := RequireEmail("test@example.com"); err != nil {
		t.Fatalf("unexpected email error: %v", err)
	}
	if err := RequireEmail("bad-email"); err == nil {
		t.Fatal("expected email format error")
	}

	if err := RequirePassword("12345678"); err != nil {
		t.Fatalf("unexpected password error: %v", err)
	}
	if err := RequirePassword("short"); err == nil {
		t.Fatal("expected password length error")
	}

	if err := RequireDisplayName("山田"); err != nil {
		t.Fatalf("unexpected display name error: %v", err)
	}
	if err := RequireDisplayName("   "); err == nil {
		t.Fatal("expected display name required error")
	}
}
