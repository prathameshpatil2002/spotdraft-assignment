import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [tokenError, setTokenError] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token) {
            setToken(token);
        }
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await auth.login(email, password);
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));
            setToken(response.access_token);
            navigate('/dashboard');
        } catch (error) {
            throw error;
        }
    };

    const register = async (username: string, email: string, password: string) => {
        try {
            const response = await auth.register(username, email, password);
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));
            setToken(response.access_token);
            navigate('/dashboard');
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ token, login, register, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 