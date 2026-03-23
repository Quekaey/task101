import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';
const AUTH_STORAGE_KEY = 'video-app-auth';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed?.jwt) {
      config.headers.Authorization = `Bearer ${parsed.jwt}`;
    }
  }
  return config;
});

export async function loginWithPassword({ identifier, password }) {
  const response = await api.post('/api/auth/local', {
    identifier,
    password,
  });
  return response.data;
}

export async function getVideos() {
  const response = await api.get('/api/videos', {
    params: {
      'pagination[pageSize]': 1,
      sort: 'id:asc',
    },
  });

  return (response.data?.data || []).map((entry) => ({
    id: entry.id,
    ...entry.attributes,
  }));
}

export async function getMyProgress(videoId) {
  const response = await api.get(`/api/video-progress/me/${videoId}`);
  return response.data?.data || null;
}

export async function saveMyProgress(payload) {
  const response = await api.post('/api/video-progress/me', payload);
  return response.data?.data || null;
}
