import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
    Divider
} from '@mui/material';
import {useBus, useListener} from 'react-bus';
import api from '../../api/axios';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {useAuth} from "../../context/AuthContext";

export default function ShareObjectModal() {
    const [open, setOpen] = useState(false);
    const [objectId, setObjectId] = useState(null);
    const [objectName, setObjectName] = useState('');
    const [email, setEmail] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addingUser, setAddingUser] = useState(false);

    const bus = useBus();
    const { user } = useAuth();

    useListener('openShareObjectModal', (object) => {
        console.log('openShareObjectModal:', object);
        setObjectId(object.id);
        setObjectName(object.name || object.objectName);
        resetForm();
        setOpen(true);
        fetchUsers(object.id);
    });

    const resetForm = () => {
        setEmail('');
    };

    // Получение списка пользователей
    const fetchUsers = async (id) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/objects/${id}/users`);

            const usersWithOutMe = response.data.filter(item => item.userId !== user.id);
            setUsers(usersWithOutMe);
        } catch (err) {
            console.error('Ошибка загрузки пользователей:', err);
            bus.emit('error', 'Не удалось загрузить список пользователей')
        } finally {
            setLoading(false);
        }
    };

    // Добавление пользователя
    const handleAddUser = async () => {
        if (!email.trim()) {
            bus.emit('error', 'Введите email пользователя')
            return;
        }

        setAddingUser(true);;

        try {
            await api.post(`/api/objects/${objectId}/users`, { email: email.trim() });
            bus.emit('success', `Пользователь с email "${email}" добавлен`)
            setEmail('');
            fetchUsers(objectId); // Обновляем список
        } catch (err) {
            console.error('Ошибка добавления пользователя:', err);
            const errorMessage = err.response?.data?.message || 'Не удалось добавить пользователя';
            bus.emit('error', errorMessage)
        } finally {
            setAddingUser(false);
        }
    };

    // Удаление пользователя
    const handleRemoveUser = async (userId, userEmail) => {
        try {
            await api.delete(`/api/objects/${objectId}/users/${userId}`);
            bus.emit('success', `Пользователь "${userEmail}" удален`)
            fetchUsers(objectId); // Обновляем список
        } catch (err) {
            console.error('Ошибка удаления пользователя:', err);
            const errorMessage = err.response?.data?.message || 'Не удалось удалить пользователя';
            bus.emit('error', errorMessage)
        }
    };

    const handleClose = () => {
        setOpen(false);
        resetForm();
        setUsers([]);
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                Доступ к объекту "{objectName}"
            </DialogTitle>

            <DialogContent>
                {/* Форма добавления пользователя */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Добавить пользователя
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Email пользователя"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            disabled={addingUser}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddUser();
                                }
                            }}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleAddUser}
                            disabled={addingUser || !email.trim()}
                            startIcon={<PersonAddIcon />}
                        >
                            {addingUser ? <CircularProgress size={24} /> : 'Добавить'}
                        </Button>
                    </Box>
                </Box>

                <Divider />

                {/* Список пользователей */}
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Пользователи с доступом
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={32} />
                        </Box>
                    ) : users.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                            Нет пользователей с доступом к этому объекту
                        </Typography>
                    ) : (
                        <List dense>
                            {users.map((user) => (
                                <ListItem
                                    key={user.userId}
                                    secondaryAction={
                                        <Button
                                            edge="end"
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                            style={{ minWidth: "unset" }}
                                            onClick={() => handleRemoveUser(user.userId, user.email)}
                                            title="Удалить доступ"
                                        >
                                            <DeleteIcon />
                                        </Button>
                                    }
                                >
                                    <ListItemText
                                        primary={user.email}
                                        secondary={user.userName || 'Пользователь'}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>
                    Закрыть
                </Button>
            </DialogActions>
        </Dialog>
    );
}