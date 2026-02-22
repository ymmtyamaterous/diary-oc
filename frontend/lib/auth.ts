const TOKEN_KEY = "diary_token";
const USER_KEY = "diary_user";

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
}

export function setUserCache(user: string): void {
  localStorage.setItem(USER_KEY, user);
}

export function getUserCache(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(USER_KEY);
}
