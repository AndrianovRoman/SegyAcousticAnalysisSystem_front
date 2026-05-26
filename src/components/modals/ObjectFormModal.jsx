import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, CircularProgress, Alert, Box
} from '@mui/material';
import { useBus, useListener } from 'react-bus';
import api from '../../api/axios';

export default function ObjectFormModal() {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState('add');
    const [objectId, setObjectId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Поля формы
    const [objectName, setObjectName] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Координаты (объединенное поле)
    const [coordinates, setCoordinates] = useState('');

    const bus = useBus();

    useListener('openAddObjectModal', () => {
        setMode('add');
        resetForm();
        setOpen(true);
    });

    useListener('openEditObjectModal', (object) => {
        setMode('edit');
        setObjectId(object.id);
        fillForm(object);
        setOpen(true);
    });

    const resetForm = () => {
        setObjectName('');
        setAddress('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setCoordinates('');
        setObjectId(null);
        setError('');
    };

    const fillForm = (object) => {
        setObjectName(object.objectName);
        setAddress(object.address || '');
        setDescription(object.description || '');
        setDate(object.date || new Date().toISOString().split('T')[0]);
        setCoordinates(object.coordinates || '');
    };

    // Формирование ссылки для Яндекс.Карт
    const getMapUrl = () => {
        if (coordinates && coordinates.includes(',')) {
            // Если есть координаты, открываем по ним
            const [lat, lng] = coordinates.split(',').map(part => part.trim());
            return `https://yandex.ru/maps/?pt=${lng},${lat}&z=15&l=map`;
        } else if (address) {
            // Если есть адрес, открываем по адресу
            return `https://yandex.ru/maps/?text=${encodeURIComponent(address)}&z=15`;
        }
        // По умолчанию карта России
        return 'https://yandex.ru/maps/?ll=37.964662%2C55.759685&z=8.55';
    };

    const handleClose = () => {
        setOpen(false);
        resetForm();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let response;
            const requestData = {
                objectName: objectName,
                address: address,
                description: description,
                date: date,
                coordinates: coordinates || null  // Отправляем строку координат
            };

            if (mode === 'add') {
                response = await api.post('/api/objects', requestData);
                bus.emit('objectAdded', response.data);
                bus.emit('success', 'Объект успешно добавлен');
            } else {
                response = await api.put(`/api/objects/${objectId}`, requestData);
                bus.emit('objectUpdated', response.data);
                bus.emit('success', 'Объект успешно обновлен');
            }

            handleClose();
        } catch (err) {
            console.error('Ошибка:', err);
            const errorMessage = err.response?.data?.message || `Не удалось ${mode === 'add' ? 'добавить' : 'обновить'} объект`;
            setError(errorMessage);
            bus.emit('error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                {mode === 'add' ? 'Добавление нового объекта' : 'Редактирование объекта'}
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        fullWidth
                        label="Название объекта *"
                        value={objectName}
                        onChange={(e) => setObjectName(e.target.value)}
                        required
                        margin="normal"
                        placeholder="Например: Жилой комплекс 'Солнечный'"
                    />

                    <TextField
                        fullWidth
                        label="Адрес"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        margin="normal"
                        placeholder="Город, улица, дом"
                        multiline
                        rows={2}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            target="_blank"
                            href={getMapUrl()}
                            size="small"
                            variant="outlined"
                        >
                            Открыть карту
                        </Button>
                    </Box>

                    <TextField
                        fullWidth
                        label="Описание"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        margin="normal"
                        placeholder="Дополнительная информация об объекте"
                        multiline
                        rows={3}
                    />

                    <TextField
                        fullWidth
                        label="Дата проведения работ"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        fullWidth
                        label="Широта, Долгота"
                        value={coordinates}
                        onChange={(e) => setCoordinates(e.target.value)}
                        margin="normal"
                        placeholder="56.126856, 40.397088"
                        helperText="Формат: широта, долгота (через запятую)"
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button
                            target="_blank"
                            href={getMapUrl()}
                            size="small"
                            variant="outlined"
                            disabled={!coordinates && !address}
                        >
                            Открыть карту по координатам
                        </Button>
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>
                        Отмена
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <CircularProgress size={24} />
                        ) : (
                            mode === 'add' ? 'Добавить' : 'Сохранить'
                        )}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}