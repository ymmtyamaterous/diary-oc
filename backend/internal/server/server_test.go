package server

import "testing"

func strPtr(v string) *string {
	return &v
}

func TestAudioContentTypeFromExt(t *testing.T) {
	tests := []struct {
		name string
		ext  string
		want string
	}{
		{name: "mp3", ext: ".mp3", want: "audio/mpeg"},
		{name: "m4a", ext: ".m4a", want: "audio/mp4"},
		{name: "aac", ext: ".aac", want: "audio/aac"},
		{name: "webm", ext: ".webm", want: "audio/webm"},
		{name: "unsupported", ext: ".flac", want: ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := audioContentTypeFromExt(tt.ext)
			if got != tt.want {
				t.Fatalf("audioContentTypeFromExt(%q) = %q, want %q", tt.ext, got, tt.want)
			}
		})
	}
}

func TestValidateDiaryPayload(t *testing.T) {
	valid := diaryCreatePayload{
		Date:    "2026-02-22",
		Content: strPtr("今日は進捗が出た"),
	}
	if err := validateDiaryPayload(valid); err != nil {
		t.Fatalf("valid payload should pass: %v", err)
	}

	noDate := valid
	noDate.Date = ""
	if err := validateDiaryPayload(noDate); err == nil {
		t.Fatal("missing date should fail")
	}

	badDate := valid
	badDate.Date = "2026/02/22"
	if err := validateDiaryPayload(badDate); err == nil {
		t.Fatal("invalid date format should fail")
	}

	invalidWeather := valid
	invalidWeather.Weather = strPtr("typhoon")
	if err := validateDiaryPayload(invalidWeather); err == nil {
		t.Fatal("invalid weather should fail")
	}

	emptyBody := diaryCreatePayload{Date: "2026-02-22"}
	if err := validateDiaryPayload(emptyBody); err == nil {
		t.Fatal("empty diary body should fail")
	}
}
