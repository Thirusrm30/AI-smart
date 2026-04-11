import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, UPLOADS_URL } from './config';

export { API_URL, UPLOADS_URL };

const request = async (endpoint, options = {}) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};

export const api = {
  auth: {
    register: (userData) => request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
    login: (email, password) => request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
    forgotPassword: (email) => request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
    resetPassword: (token, password) => request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    })
  },

  users: {
    getMe: () => request('/api/users/me'),
    updateMe: (data) => request('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  reports: {
    getAll: () => request('/reports'),
    getOne: (id) => request(`/reports/${id}`),
    create: (data) => request('/report', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    updateStatus: (id, status) => request(`/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
    delete: (id) => request(`/reports/${id}`, {
      method: 'DELETE'
    })
  },

  upload: {
    uploadImage: async (file, reportData = {}) => {
      try {
        const token = await AsyncStorage.getItem('token');
        const formData = new FormData();

        if (file) {
          formData.append('image', {
            uri: file.uri,
            type: file.mimeType || file.type || 'image/jpeg',
            name: file.fileName || 'photo.jpg'
          });
        }

        Object.keys(reportData).forEach(key => {
          if (reportData[key] !== undefined && reportData[key] !== null) {
            formData.append(key, String(reportData[key]));
          }
        });

        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          },
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `Upload failed (${response.status})`);
        }

        return data;
      } catch (error) {
        console.error('Upload Error:', error.message);
        throw error;
      }
    },

    uploadImageWithReport: (file, reportData) => {
      return api.upload.uploadImage(file, reportData);
    }
  }
};
