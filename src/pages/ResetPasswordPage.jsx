

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    CircularProgress,
    Box,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../api/axios';
import { useBus } from 'react-bus';

export default function ResetPasswordPage() {
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const bus = useBus();

    useEffect(() => {
        // Извлекаем токен из URL
        const params = new URLSearchParams(location.search);
        const tokenParam = params.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError('Неверная ссылка для сброса пароля');
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setLoading(true);

        try {
            await api.post('/api/auth/reset-password', {
                token: token,
                newPassword: newPassword
            });
            setSuccess(true);
            bus.emit('success', 'Пароль успешно изменен');

            // Через 2 секунды перенаправляем на страницу входа
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error('Ошибка сброса пароля:', err);
            const errorMessage = err.response?.data?.message || 'Не удалось изменить пароль. Возможно, ссылка устарела.';
            setError(errorMessage);
            bus.emit('error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom textAlign="center">
                    Сброс пароля
                </Typography>

                {success ? (
                    <>
                        <Alert severity="success" sx={{ mt: 2 }}>
                            Пароль успешно изменен!
                        </Alert>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => navigate('/login')}
                            sx={{ mt: 3 }}
                        >
                            Перейти ко входу
                        </Button>
                    </>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            label="Новый пароль"
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            margin="normal"
                            required
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Подтверждение пароля"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            margin="normal"
                            required
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                        >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading || !token}
                            sx={{ mt: 3 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Сменить пароль'}
                        </Button>

                        <Button
                            fullWidth
                            variant="text"
                            onClick={() => navigate('/login')}
                            sx={{ mt: 2 }}
                        >
                            Вернуться ко входу
                        </Button>
                    </form>
                )}
            </Paper>
        </Container>
    );
}