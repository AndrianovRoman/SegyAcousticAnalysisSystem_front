

import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    IconButton,
    InputAdornment
} from '@mui/material';
import { useBus, useListener } from 'react-bus';
import api from '../../api/axios';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function ChangePasswordModal() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Поля формы
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Показать/скрыть пароль
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const bus = useBus();

    useListener('openChangePasswordModal', () => {
        setOpen(true);
        resetForm();
    });

    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleClose = () => {
        setOpen(false);
        resetForm();
    };

    const validateForm = () => {
        if (!currentPassword) {
            bus.emit('error', 'Введите текущий пароль');
            return false;
        }
        if (!newPassword) {
            bus.emit('error', 'Введите новый пароль');
            return false;
        }
        if (newPassword.length < 6) {
            bus.emit('error', 'Новый пароль должен содержать минимум 6 символов');
            return false;
        }
        if (newPassword !== confirmPassword) {
            bus.emit('error', 'Новый пароль и подтверждение не совпадают');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            await api.put('/api/users/me/password', {
                currentPassword: currentPassword,
                newPassword: newPassword
            });

            bus.emit('success', 'Пароль успешно изменен');
            handleClose();
        } catch (err) {
            console.error('Ошибка смены пароля:', err);
            const errorMessage = err.response?.data?.message || 'Не удалось изменить пароль';
            bus.emit('error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Смена пароля
            </DialogTitle>

            <DialogContent>
                <TextField
                    fullWidth
                    label="Текущий пароль"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    margin="normal"
                    disabled={loading}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    edge="end"
                                >
                                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                <TextField
                    fullWidth
                    label="Новый пароль"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    margin="normal"
                    disabled={loading}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    edge="end"
                                >
                                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                <TextField
                    fullWidth
                    label="Подтверждение нового пароля"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    margin="normal"
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
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Отмена
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                >
                    {loading ? <CircularProgress size={24} /> : 'Сменить пароль'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}