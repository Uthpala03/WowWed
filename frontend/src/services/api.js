const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function fetchApi(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}
