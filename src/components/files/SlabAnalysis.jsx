

import { useState } from 'react';
import {
    Paper, Box, Typography, Button, TextField,
    FormControl, InputLabel, Select, MenuItem,
    Grid, Card, CardContent, CircularProgress
} from '@mui/material';
import { Calculate as CalculateIcon } from '@mui/icons-material';

export default function SlabAnalysis({
                                         pointsCoords,
                                         interpPointsX,
                                         setInterpPointsX,
                                         interpPointsY,
                                         setInterpPointsY,
                                         attributeType,
                                         setAttributeType,
                                         onCalculate,
                                         heatmapData,
                                         showLegend,
                                         setShowLegend,
                                         minAttributeValue,
                                         maxAttributeValue,
                                         isCalculating
                                     }) {
    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Анализ состояния плиты</Typography>

            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Атрибут</InputLabel>
                        <Select
                            value={attributeType}
                            onChange={(e) => setAttributeType(e.target.value)}
                            label="Атрибут"
                        >
                            <MenuItem value={1}>Энергия сигнала</MenuItem>
                            <MenuItem value={2}>Нормированная энергия</MenuItem>
                            <MenuItem value={3}>Частота максимума спектра</MenuItem>
                            <MenuItem value={4}>Площадь спектра</MenuItem>
                            <MenuItem value={5}>Площадь нормированного спектра</MenuItem>
                            <MenuItem value={6}>Средневзвешенная частота</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Точки по X"
                        type="number"
                        value={interpPointsX}
                        onChange={(e) => setInterpPointsX(Math.max(2, parseInt(e.target.value) || 2))}
                    />
                </Grid>

                <Grid item xs={12} md={2}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Точки по Y"
                        type="number"
                        value={interpPointsY}
                        onChange={(e) => setInterpPointsY(Math.max(2, parseInt(e.target.value) || 2))}
                    />
                </Grid>

                <Grid item xs={12} md={2}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={onCalculate}
                        disabled={pointsCoords.length === 0 || isCalculating}
                        startIcon={isCalculating ? <CircularProgress size={20} /> : <CalculateIcon />}
                    >
                        {isCalculating ? 'Расчет...' : 'Построить карту'}
                    </Button>
                </Grid>

                {heatmapData && (
                    <Grid item xs={12} md={2}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => setShowLegend(!showLegend)}
                        >
                            {showLegend ? 'Скрыть легенду' : 'Показать легенду'}
                        </Button>
                    </Grid>
                )}
            </Grid>

            {/* Информация о точках */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Найдено точек для анализа: {pointsCoords.length}
            </Typography>

            {/* Легенда */}
            {showLegend && heatmapData && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" gutterBottom>Цветовая шкала:</Typography>
                    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" sx={{ mt: 1 }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <Box sx={{ width: 20, height: 20, bgcolor: '#ff0000' }} />
                            <Typography variant="caption">Очень плохо</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <Box sx={{ width: 20, height: 20, bgcolor: '#ffff00' }} />
                            <Typography variant="caption">Плохо</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <Box sx={{ width: 20, height: 20, bgcolor: '#00ff00' }} />
                            <Typography variant="caption">Хорошо</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <Box sx={{ width: 20, height: 20, bgcolor: '#0000ff' }} />
                            <Typography variant="caption">Отлично</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ ml: 2 }}>
                            Min: {minAttributeValue.toFixed(4)} | Max: {maxAttributeValue.toFixed(4)}
                        </Typography>
                    </Box>
                </Box>
            )}
        </Paper>
    );
}