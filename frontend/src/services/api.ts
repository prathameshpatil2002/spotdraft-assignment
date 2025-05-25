import axios from 'axios';
import { AuthResponse, Feed, ShareResponse, Comment, SharedFeed, UserShareResponse } from '../types';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: 'http://localhost:8000/api',  // This will be relative to the current domain
    withCredentials: true,  // Important for cookie handling
});

// Add request interceptor for token handling
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export const auth = {
    login: async (username: string, password: string): Promise<AuthResponse> => {
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);
            const response = await api.post('/auth/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            
            if (response.data && response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },
    register: async (username: string, email: string, password: string): Promise<AuthResponse> => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        const response = await api.post('/auth/register', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    },
};

export const feeds = {
    upload: async (file: File, title: string, description?: string): Promise<Feed> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        if (description) {
            formData.append('description', description);
        }
        const response = await api.post('/feeds', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    },
    getAll: async (): Promise<Feed[]> => {
        const response = await api.get('/feeds');
        return response.data;
    },
    getById: async (id: number): Promise<Feed> => {
        const response = await api.get(`/feeds/${id}`);
        return response.data;
    },
    search: async (query: string): Promise<Feed[]> => {
        const response = await api.get(`/feeds/search?q=${query}`);
        return response.data;
    },
    getComments: async (feedId: number): Promise<Comment[]> => {
        try {
            const response = await api.get(`/comments?feed_id=${feedId}`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Get comments error:', error);
            return [];
        }
    },
    addComment: async (feedId: number, commentBody: string): Promise<Comment> => {
        try {
            const response = await api.post(`/comments`, {
                feed_id: feedId,
                comment_body: commentBody
            });
            return response.data;
        } catch (error) {
            console.error('Add comment error:', error);
            throw error;
        }
    }
};

export const shares = {
    create: async (feedId: number, expiresInDays?: number): Promise<ShareResponse> => {
        const response = await api.post('/share/public', {
            feed_id: feedId,
            expires_in_days: expiresInDays,
        });
        return response.data;
    },
    shareWithUser: async (feedId: number, email: string): Promise<UserShareResponse> => {
        const response = await api.post('/share/user', {
            feed_id: feedId,
            email: email,
        });
        return response.data;
    },
    getSharedWithMe: async (): Promise<Feed[]> => {
        const response = await api.get('/share/user');
        return response.data;
    },
    removeUserShare: async (shareId: number): Promise<void> => {
        await api.delete(`/share/user/${shareId}`);
    },
    getSharedFile: async (token: string): Promise<Feed> => {
        const response = await api.get(`/share/public/${token}`);
        return response.data;
    },
    getComments: async (token: string): Promise<Comment[]> => {
        const response = await api.get(`/share/public/${token}/comments`);
        return response.data;
    },
    addComment: async (token: string, commenterName: string, commentBody: string): Promise<Comment> => {
        const response = await api.post(`/share/public/${token}/comments`, {
            commenter_name: commenterName,
            comment_body: commentBody,
        });
        return response.data;
    },
    getSharedUsers: async (feedId: number): Promise<UserShareResponse[]> => {
        const response = await api.get(`/share/user/feed/${feedId}`);
        return response.data;
    },
}; 