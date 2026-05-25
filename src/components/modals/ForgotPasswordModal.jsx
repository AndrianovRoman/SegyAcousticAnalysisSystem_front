import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import { useListener, useBus } from 'react-bus';
import api from '../../api/axios';

export default function ForgotPasswordModal() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const bus = useBus();

    // Слушаем событие открытия модалки
    useListener('openForgotPasswordModal', () => {
        console.log('c.lf ljikb')
        setOpen(true);
        setEmail('');
        setError('');
        setSuccess(false);
    });

    const handleClose = () => {
        setOpen(false);
        setEmail('');
        setError('');
        setSuccess(false);
    };

    const handleSubmit = async () => {
        if (!email.trim()) {
            setError('Введите email');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/api/auth/forgot-password', { email: email.trim() });
            setSuccess(true);
        } catch (err) {
            console.error('Ошибка сброса пароля:', err);
            const errorMessage = err.response?.data?.message || 'Не удалось отправить запрос на сброс пароля';
            setError(errorMessage);
            bus.emit('error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Сброс пароля</DialogTitle>
            <DialogContent>
                {success ? (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        Инструкция по сбросу пароля отправлена на ваш email
                    </Alert>
                ) : (
                    <>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                        <TextField
                            autoFocus
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            placeholder="user@example.com"
                            disabled={loading}
                        />
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    {success ? 'Закрыть' : 'Отмена'}
                </Button>
                {!success && (
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        disabled={loading || !email.trim()}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Отправить'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}