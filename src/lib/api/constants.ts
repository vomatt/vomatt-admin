export const API_BASE_PATH = '/api';

// Same cookie names and lifetimes as vomatt-web
export const ACCESS_TOKEN = 'accessToken';
export const REFRESH_TOKEN = 'refreshToken';
export const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes, the backend default
export const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days, the backend default
export const ACCESS_TOKEN_REFRESH_LEEWAY = 60; // seconds
