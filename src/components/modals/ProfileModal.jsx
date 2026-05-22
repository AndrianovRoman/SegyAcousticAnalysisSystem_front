
import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    Box,
    Divider
} from '@mui/material';
import { useBus, useListener } from 'react-bus';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import LockIcon from '@mui/icons-material/Lock';

export default function ProfileModal() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Данные пользователя
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [originalData, setOriginalData] = useState({});

    const bus = useBus();
    const { user, updateUser } = useAuth();

    useListener('openProfileModal', () => {
        setOpen(true);
        loadUserData();
    });

    const loadUserData = () => {
        if (user) {
            setUserName(user.userName || user.name || '');
            setEmail(user.email || '');
            setOriginalData({
                userName: user.userName || user.name || '',
                email: user.email || ''
            });
        }
    };

    const resetForm = () => {
        // Сбрасываем только данные, ошибки через bus
    };

    const handleClose = () => {
        setOpen(false);
    };

    const hasChanges = () => {
        return userName !== originalData.userName || email !== originalData.email;
    };

    const handleSave = async () => {
        if (!hasChanges()) {
            bus.emit('warning', 'Нет изменений для сохранения');
            return;
        }

        setLoading(true);

        try {
            const response = await api.put(`/api/users/${user.id}`, {
                userName: userName,
                email: email
            });

            if (updateUser) {
                updateUser(response.data);
            } else {
                const updatedUser = { ...user, userName, email };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            bus.emit('success', 'Профиль успешно обновлен');
            setOriginalData({ userName, email });
            handleClose();
        } catch (err) {
            console.error('Ошибка обновления профиля:', err);
            const errorMessage = err.response?.data?.message || 'Не удалось обновить профиль';
            bus.emit('error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = () => {
        handleClose();
        bus.emit('openChangePasswordModal');
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Профиль пользователя
            </DialogTitle>

            <DialogContent>
                <TextField
                    fullWidth
                    label="Имя пользователя"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    margin="normal"
                    disabled={loading}
                />

                <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    margin="normal"
                    disabled={loading}
                />

                <Box sx={{ mt: 3, mb: 1 }}>
                    <Divider />
                </Box>

                <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    startIcon={<LockIcon />}
                    onClick={handleChangePassword}
                    sx={{ mt: 2 }}
                >
                    Сменить пароль
                </Button>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Отмена
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    disabled={loading || !hasChanges()}
                >
                    {loading ? <CircularProgress size={24} /> : 'Сохранить'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}