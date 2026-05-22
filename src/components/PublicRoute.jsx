import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Загрузка...</div>;
    }

    // Если пользователь уже авторизован, перенаправляем на Главную страницу
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
}