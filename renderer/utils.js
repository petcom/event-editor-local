export function getAuthToken() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.warn('[AUTH] No auth token found in localStorage');
  }
  return token;
}