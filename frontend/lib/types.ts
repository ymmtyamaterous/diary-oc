export type NullableString = string | null;

export type User = {
  id: string;
  email: string;
  display_name: string;
  profile_image_url: NullableString;
  created_at: string;
};

export type AuthResponseData = {
  token: string;
  user: User;
};

export type DiaryEntry = {
  id: string;
  user_id: string;
  content: NullableString;
  date: string;
  weather: NullableString;
  is_public: boolean;
  image_url: NullableString;
  image_name: NullableString;
  audio_url: NullableString;
  audio_name: NullableString;
  events: NullableString;
  emotions: NullableString;
  good_things: NullableString;
  reflections: NullableString;
  gratitude: NullableString;
  tomorrow_goals: NullableString;
  tomorrow_looking_forward: NullableString;
  learnings: NullableString;
  health_habits: NullableString;
  today_in_one_word: NullableString;
  created_at: string;
  updated_at: string;
};

export type PublicDiaryEntry = {
  id: string;
  content: NullableString;
  date: string;
  weather: NullableString;
  image_url: NullableString;
  audio_url: NullableString;
  events: NullableString;
  emotions: NullableString;
  good_things: NullableString;
  reflections: NullableString;
  gratitude: NullableString;
  tomorrow_goals: NullableString;
  tomorrow_looking_forward: NullableString;
  learnings: NullableString;
  health_habits: NullableString;
  today_in_one_word: NullableString;
  created_at: string;
  author_name: string;
  author_photo: NullableString;
};

export type ApiResponse<T> = {
  data: T;
};

export type ApiError = {
  error: string;
};

export type DiaryFieldKey =
  | "events"
  | "emotions"
  | "good_things"
  | "reflections"
  | "gratitude"
  | "tomorrow_goals"
  | "tomorrow_looking_forward"
  | "learnings"
  | "health_habits"
  | "today_in_one_word";

export type DiaryFieldSettings = Record<DiaryFieldKey, boolean>;
