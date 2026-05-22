import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Проверяем сохраненного пользователя при загрузке
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        // Пока имитация, позже заменишь на реальный API
        try {

            // const mockUser = { id: 1, email, name: 'Тестовый пользователь' };
            // const mockToken = 'fake-jwt-token';
            // localStorage.setItem('user', JSON.stringify(mockUser));
            // localStorage.setItem('token', mockToken);
            // setUser(mockUser);

            const response = await api.post('/api/auth/login', {
                email,
                password
            });

            const { user, accessToken } = response.data;
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', accessToken);

            setUser(user);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (userName, email, password) => {
        // Пока имитация, позже заменишь на реальный API
        try {
            await api.post('/api/auth/register', {
                userName,
                email,
                password
            }).then(() => {
                login(email, password)
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    const updateUser = (updatedUserData) => {
        const updatedUser = { ...user, ...updatedUserData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const value = {
        user,
        login,
        register,
        logout,
        updateUser,
        loading,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}