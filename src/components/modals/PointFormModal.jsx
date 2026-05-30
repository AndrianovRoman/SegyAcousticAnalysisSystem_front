

import { useState } from 'react';
import {Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, CircularProgress, Alert, Grid, Typography, Paper} from '@mui/material';
import { useBus, useListener } from 'react-bus';
import api from '../../api/axios';

export default function PointFormModal() {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState('add'); // 'add' или 'edit'
    const [pointId, setPointId] = useState(null);
    const [parentElementId, setParentElementId] = useState(null);
    const [parentElementName, setParentElementName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Поля формы
    const [pointName, setPointName] = useState('');
    const [x, setX] = useState('');
    const [y, setY] = useState('');
    const [description, setDescription] = useState('');

    const bus = useBus();

    // Открытие модалки для создания точки
    useListener('openAddPointModal', (data) => {
        setMode('add');
        setParentElementId(data.parentId);
        setParentElementName(data.parentName || '');
        resetForm();
        if (data.pointName) setPointName(data.pointName);
        if (data.x !== undefined && data.x !== null) setX(String(data.x));
        if (data.y !== undefined && data.y !== null) setY(String(data.y));
        if (data.description) setDescription(data.description);
        setOpen(true);
    });

    // Открытие модалки для редактирования точки
    useListener('openEditPointModal', (point) => {
        setMode('edit');
        setPointId(point.id);
        setParentElementId(point.elementId || point.parentId);
        setParentElementName(point.elementName || '');
        fillForm(point);
        setOpen(true);
    });

    const resetForm = () => {
        setPointName('');
        setX('');
        setY('');
        setDescription('');
        setPointId(null);
        setError('');
    };

    const fillForm = (point) => {
        setPointName(point.pointName || point.name || '');
        setX(point.x !== undefined && point.x !== null ? String(point.x) : '');
        setY(point.y !== undefined && point.y !== null ? String(point.y) : '');
        setDescription(point.description || '');
    };

    const isFormValid = () => {
        if (!pointName.trim()) return false;
        return true;
    };

    const handleClose = () => {
        setOpen(false);
        resetForm();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isFormValid()) {
            setError('Пожалуйста, заполните все обязательные поля');
            return;
        }

        setLoading(true);

        try {
            const requestData = {
                pointName: pointName,
                x: parseFloat(x),
                y: parseFloat(y),
                description: description,
                elementId: parentElementId
            };

            let response;

            if (mode === 'add') {
                response = await api.post(`/api/elements/${parentElementId}/points`, requestData);
                bus.emit('pointAdded', response.data);
                bus.emit('success', `Точка "${pointName}" успешно добавлена`);
            } else {
                response = await api.put(`/api/elements/${parentElementId}/points/${pointId}`, requestData);
                bus.emit('pointUpdated', response.data);
                bus.emit('success', `Точка "${pointName}" успешно обновлена`);
            }

            handleClose();
        } catch (err) {
            console.error('Ошибка:', err);
            const errorMessage = err.response?.data?.message || `Не удалось ${mode === 'add' ? 'добавить' : 'обновить'} точку`;
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
                {mode === 'add'
                    ? `Добавление точки в "${parentElementName}"`
                    : 'Редактирование точки'}
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
                        label="Название точки *"
                        value={pointName}
                        onChange={(e) => setPointName(e.target.value)}
                        required
                        margin="normal"
                        placeholder="Например: Точка 1, Измерение 1"
                    />

                    <Paper elevation={0} sx={{ p: 2, mt: 2, mb: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            Координаты
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Координата X *"
                                    type="number"
                                    value={x}
                                    onChange={(e) => setX(e.target.value)}
                                    InputProps={{ inputProps: { step: 0.01 } }}
                                    placeholder="0.00"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Координата Y *"
                                    type="number"
                                    value={y}
                                    onChange={(e) => setY(e.target.value)}
                                    InputProps={{ inputProps: { step: 0.01 } }}
                                    placeholder="0.00"
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    <TextField
                        fullWidth
                        label="Описание"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        margin="normal"
                        placeholder="Дополнительная информация о точке измерения"
                        multiline
                        rows={3}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>
                        Отмена
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading || !isFormValid()}
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
