// src/utils/auth.ts
//
// Utility helpers for authentication and user session state.
// Designed to work even before login is implemented.
// Later, you can hook this into Supabase, FastAPI JWT, or OAuth easily.

const ACCESS_TOKEN_KEY = "access_token";
const USER_DATA_KEY = "user_data";

/**
 * Check if the user is currently logged in.
 * Returns `true` if there's a valid token in localStorage.
 */
export function isLoggedIn(): boolean {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    return !!token;
}

/**
 * Get the currently stored access token (JWT or session ID).
 */
export function getToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Save token and optional user data (e.g., email, name).
 */
export function saveSession(token: string, user?: any): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    if (user) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    }
}

/**
 * Get stored user data.
 */
export function getUser(): any | null {
    const user = localStorage.getItem(USER_DATA_KEY);
    try {
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

/**
 * Remove all stored session data.
 * Typically used on logout or token expiration.
 */
export function clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
}

/**
 * Redirect helper to /login if not authenticated.
 * (You can call this in any protected component.)
 */
export function requireLogin(): void {
    if (!isLoggedIn()) {
        window.location.href = "/login";
    }
}
