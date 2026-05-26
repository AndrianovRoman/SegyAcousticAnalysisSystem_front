import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem,
    Grid, Typography, Paper
} from '@mui/material';
import { useBus, useListener } from 'react-bus';
import api from '../../api/axios';

export default function ElementFormModal() {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState('add');
    const [elementId, setElementId] = useState(null);
    const [parentObjectId, setParentObjectId] = useState(null);
    const [parentObjectName, setParentObjectName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Поля формы
    const [elementName, setElementName] = useState('');
    const [elementType, setElementType] = useState('');
    const [description, setDescription] = useState('');

    // Универсальные геометрические параметры
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [diameter, setDiameter] = useState('');

    const bus = useBus();

    // Типы элементов
    const elementTypes = [
        { value: 'pile', label: 'Свая' },
        { value: 'slab', label: 'Плита' },
    ];

    useListener('openAddElementModal', (data) => {
        setMode('add');
        setParentObjectId(data.parentId);
        setParentObjectName(data.parentName || '');
        resetForm();
        setOpen(true);
    });

    useListener('openEditElementModal', (element) => {
        setMode('edit');
        setElementId(element.id);
        setParentObjectId(element.objectId || element.parentId);
        setParentObjectName(element.objectName || '');
        fillForm(element);
        setOpen(true);
    });

    const resetForm = () => {
        setElementName('');
        setElementType('');
        setDescription('');
        setLength('');
        setWidth('');
        setHeight('');
        setDiameter('');
        setElementId(null);
        setError('');
    };

    const fillForm = (element) => {
        setElementName(element.elementName || element.name || '');
        setElementType(element.type || '');
        setDescription(element.description || '');

        // Парсим geometryData
        if (element.geometryData) {
            try {
                const geometry = typeof element.geometryData === 'string'
                    ? JSON.parse(element.geometryData)
                    : element.geometryData;

                setLength(geometry.length || '');
                setWidth(geometry.width || '');
                setHeight(geometry.height || '');
                setDiameter(geometry.diameter || '');
            } catch (e) {
                console.error('Ошибка парсинга geometryData:', e);
            }
        }
    };

    // Формирование geometryData
    const buildGeometryData = () => {
        const geometry = {};

        if (length && parseFloat(length) > 0) geometry.length = parseFloat(length);
        if (width && parseFloat(width) > 0) geometry.width = parseFloat(width);
        if (height && parseFloat(height) > 0) geometry.height = parseFloat(height);
        if (diameter && parseFloat(diameter) > 0) geometry.diameter = parseFloat(diameter);

        return Object.keys(geometry).length > 0 ? JSON.stringify(geometry) : '';
    };

    // Валидация формы
    const isFormValid = () => {
        if (!elementName.trim()) return false;
        if (!elementType) return false;

        // Хотя бы один геометрический параметр должен быть заполнен
        const hasGeometry = length || width || height || diameter;
        if (!hasGeometry) return false;

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
            setError('Пожалуйста, заполните название элемента и хотя бы один геометрический параметр');
            return;
        }

        setLoading(true);

        try {
            const geometryData = buildGeometryData();
            const requestData = {
                elementName: elementName,
                type: elementType,
                description: description,
                geometryData: geometryData,
                objectId: parentObjectId
            };

            let response;

            if (mode === 'add') {
                response = await api.post(`/api/objects/${parentObjectId}/elements`, requestData);
                bus.emit('elementAdded', response.data);
                bus.emit('success', `Элемент "${elementName}" успешно добавлен`);
            } else {
                response = await api.put(`/api/objects/${parentObjectId}/elements/${elementId}`, requestData);
                bus.emit('elementUpdated', response.data);
                bus.emit('success', `Элемент "${elementName}" успешно обновлен`);
            }

            handleClose();
        } catch (err) {
            console.error('Ошибка:', err);
            const errorMessage = err.response?.data?.message || `Не удалось ${mode === 'add' ? 'добавить' : 'обновить'} элемент`;
            setError(errorMessage);
            bus.emit('error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleTypeChange = (newType) => {
        setElementType(newType);
    };

    const getGeometryHint = () => {
        if (elementType === 'pile') {
            return 'Для сваи рекомендуется указать длину и диаметр (или длину, ширину, высоту для прямоугольной сваи)';
        } else if (elementType === 'slab') {
            return 'Для плиты рекомендуется указать длину, ширину и высоту (или диаметр для круглой плиты)';
        }
        return 'Укажите геометрические параметры элемента';
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {mode === 'add'
                    ? `Добавление элемента в "${parentObjectName}"`
                    : 'Редактирование элемента'}
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
                        label="Название элемента *"
                        value={elementName}
                        onChange={(e) => setElementName(e.target.value)}
                        required
                        margin="normal"
                        placeholder="Например: Свая П-12, Плита перекрытия 1"
                    />

                    <FormControl fullWidth margin="normal" required>
                        <InputLabel>Тип элемента *</InputLabel>
                        <Select
                            value={elementType}
                            onChange={(e) => handleTypeChange(e.target.value)}
                            label="Тип элемента *"
                        >
                            <MenuItem value="" disabled>Выберите тип</MenuItem>
                            {elementTypes.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="Описание"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        margin="normal"
                        placeholder="Дополнительная информация об элементе"
                        multiline
                        rows={3}
                    />

                    {/* Универсальные геометрические параметры */}
                    <Paper elevation={0} sx={{ p: 2, mt: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            Геометрические параметры
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                            {getGeometryHint()}
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Длина (м)"
                                    type="number"
                                    value={length}
                                    onChange={(e) => setLength(e.target.value)}
                                    InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                                    placeholder="12.5"
                                    helperText="Обязательно для всех типов"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Ширина (м)"
                                    type="number"
                                    value={width}
                                    onChange={(e) => setWidth(e.target.value)}
                                    InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                                    placeholder="3.0"
                                    helperText="Для прямоугольных сечений"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Высота (м)"
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                                    placeholder="0.25"
                                    helperText="Для плит и прямоугольных свай"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Диаметр (мм)"
                                    type="number"
                                    value={diameter}
                                    onChange={(e) => setDiameter(e.target.value)}
                                    InputProps={{ inputProps: { min: 0, step: 10 } }}
                                    placeholder="300"
                                    helperText="Для круглых сечений"
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            <strong>Примечание:</strong> Хотя бы один геометрический параметр должен быть заполнен.
                            Для свай обычно указывают длину и диаметр (или длину, ширину, высоту).
                            Для плит обычно указывают длину, ширину и высоту (или диаметр для круглых плит).
                        </Typography>
                    </Alert>
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