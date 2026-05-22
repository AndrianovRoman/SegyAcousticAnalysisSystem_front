

import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { RestartAlt as RestartAltIcon, Save as SaveIcon, Clear as ClearIcon } from '@mui/icons-material';

export default function FileHeader({ fileName, elementType, onResetAll, onExportGraph, onClearMarkers }) {
    return (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
            <Typography variant="h4">
                {elementType === 'pile' ? 'Анализ сигнала (свая)' :
                    elementType === 'slab' ? 'Анализ сигнала (плита)' :
                        'Анализ сигнала'}
            </Typography>
            <Box>
                <Tooltip title="Сбросить все">
                    <IconButton onClick={onResetAll} sx={{ mr: 1 }}>
                        <RestartAltIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Сохранить график">
                    <IconButton onClick={onExportGraph} sx={{ mr: 1 }}>
                        <SaveIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Сбросить маркеры">
                    <IconButton onClick={onClearMarkers}>
                        <ClearIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
}