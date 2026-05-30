import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, CircularProgress, Alert, Box, Typography,
    TextField
} from '@mui/material';
import { useBus, useListener } from 'react-bus';
import api from '../../api/axios';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

export default function FileUploadModal() {
    const [open, setOpen] = useState(false);
    const [pointId, setPointId] = useState(null);
    const [pointName, setPointName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDragOver, setIsDragOver] = useState(false); // ← НОВОЕ

    const bus = useBus();

    useListener('openAddFileModal', (data) => {
        setPointId(data.parentId);
        setPointName(data.parentName || '');
        resetForm();
        setOpen(true);
    });

    const resetForm = () => {
        setSelectedFile(null);
        setDescription('');
        setError('');
        setIsDragOver(false);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.name.endsWith('.sgy')) {
                setError('Пожалуйста, выберите файл с расширением .sgy');
                return;
            }
            setSelectedFile(file);
            setError('');
        }
    };

    // ← НОВЫЕ ОБРАБОТЧИКИ
    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragOver(false);

        const file = event.dataTransfer.files[0];
        if (file) {
            if (!file.name.endsWith('.sgy')) {
                setError('Пожалуйста, выберите файл с расширением .sgy');
                return;
            }
            setSelectedFile(file);
            setError('');
        }
    };

    const handleClose = () => {
        setOpen(false);
        resetForm();
        setSelectedFile(null);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Пожалуйста, выберите файл');
            return;
        }

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('description', description);

        try {
            const response = await api.post(`/api/points/${pointId}/files/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            bus.emit('fileAdded', response.data);
            bus.emit('success', `Файл "${selectedFile.name}" успешно загружен`);
            handleClose();
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            const errorMessage = err.response?.data?.message || 'Не удалось загрузить файл';
            setError(errorMessage);
            bus.emit('error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Загрузка файла в точку "{pointName}"</DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box
                    sx={{
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        p: 3,
                        mt: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        bgcolor: isDragOver ? 'action.hover' : 'transparent',
                        borderColor: isDragOver ? 'primary.main' : '#ccc',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'action.hover'
                        }
                    }}
                    onClick={() => document.getElementById('file-input').click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        id="file-input"
                        type="file"
                        accept=".sgy"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                    />

                    {selectedFile ? (
                        <>
                            <InsertDriveFileIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                {selectedFile.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {(selectedFile.size / 1024).toFixed(2)} KB
                            </Typography>
                            {description && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                    Описание: {description}
                                </Typography>
                            )}
                        </>
                    ) : (
                        <>
                            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                Нажмите или перетащите файл для загрузки
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Поддерживаются только .sgy файлы
                            </Typography>
                        </>
                    )}
                </Box>

                <TextField
                    fullWidth
                    label="Описание файла"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    margin="normal"
                    placeholder="Введите описание файла (необязательно)"
                    multiline
                    rows={2}
                    disabled={loading}
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Отмена
                </Button>
                <Button
                    onClick={handleUpload}
                    variant="contained"
                    color="primary"
                    disabled={!selectedFile || loading}
                >
                    {loading ? <CircularProgress size={24} /> : 'Загрузить'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}