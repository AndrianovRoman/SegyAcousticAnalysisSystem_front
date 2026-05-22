import { useState } from 'react';
import {Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress} from '@mui/material';
import { useBus, useListener } from 'react-bus';

export default function ConfirmDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        title: 'Подтверждение',
        message: 'Вы уверены?',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        confirmColor: 'error', // 'error', 'primary', 'warning'
        onConfirm: null
    });

    const bus = useBus();

    useListener('confirmDelete', (data) => {
        setConfig({
            title: data.title || 'Подтверждение удаления',
            message: data.message || `Вы действительно хотите удалить "${data.name || 'элемент'}"?`,
            confirmText: data.confirmText || 'Удалить',
            cancelText: data.cancelText || 'Отмена',
            confirmColor: data.confirmColor || 'error',
            onConfirm: data.onConfirm
        });
        setOpen(true);
    });

    const handleConfirm = async () => {
        if (config.onConfirm) {
            setLoading(true);
            try {
                await config.onConfirm();
            } catch (error) {
                console.error('Ошибка при выполнении действия:', error);
                bus.emit('error', 'Произошла ошибка');
            } finally {
                setLoading(false);
                setOpen(false);
            }
        } else {
            setOpen(false);
        }
    };

    const handleCancel = () => {
        setOpen(false);
    };

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>{config.title}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {config.message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel} disabled={loading}>
                    {config.cancelText}
                </Button>
                <Button
                    onClick={handleConfirm}
                    color={config.confirmColor}
                    variant="contained"
                    disabled={loading}
                    autoFocus
                >
                    {loading ? <CircularProgress size={24} /> : config.confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}