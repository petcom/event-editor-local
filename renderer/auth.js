let authToken = null;

export function getAuthToken() {
  return authToken;
}

export function setAuthToken(token) {
  authToken = token;
  console.log('[AUTH] Token set');
}

export function clearAuthToken() {
  authToken = null;
  console.log('[AUTH] Token cleared');
}