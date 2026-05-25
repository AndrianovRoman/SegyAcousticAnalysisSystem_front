import { useState } from 'react';
import {
    Paper, Box, Typography, Button, TextField,
    FormControl, InputLabel, Select, MenuItem,
    Grid, Card, CardContent, CircularProgress
} from '@mui/material';
import { Calculate as CalculateIcon } from '@mui/icons-material';

const getColorForValue = (value, minValue, maxValue) => {
    if (maxValue === minValue) return '#00ff00';
    const normalized = (value - minValue) / (maxValue - minValue);
    if (normalized < 0.25) {
        const g = Math.floor(255 * (normalized / 0.25));
        return `rgb(255, ${g}, 0)`;
    } else if (normalized < 0.5) {
        const r = 255 - Math.floor(255 * ((normalized - 0.25) / 0.25));
        return `rgb(${r}, 255, 0)`;
    } else if (normalized < 0.75) {
        const b = Math.floor(255 * ((normalized - 0.5) / 0.25));
        return `rgb(0, 255, ${b})`;
    } else {
        const g = 255 - Math.floor(255 * ((normalized - 0.75) / 0.25));
        return `rgb(0, ${g}, 255)`;
    }
};

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
    const getLegendItems = () => {
        if (minAttributeValue === maxAttributeValue) {
            return [{ value: minAttributeValue.toFixed(4) }];
        }

        const step = (maxAttributeValue - minAttributeValue) / 4;
        const items = [];

        for (let i = 0; i <= 4; i++) {
            const value = minAttributeValue + i * step;
            items.push({ value: value.toFixed(4) });
        }
        return items;
    };

    const legendItems = heatmapData ? getLegendItems() : [];

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


                <TextField
                    style={{ width: '100px' }}
                    size="small"
                    label="Точки по X"
                    type="number"
                    value={interpPointsX}
                    onChange={(e) => setInterpPointsX(Math.max(1, parseInt(e.target.value) || 1))}
                />

                <TextField
                    style={{ width: '100px' }}
                    size="small"
                    label="Точки по Y"
                    type="number"
                    value={interpPointsY}
                    onChange={(e) => setInterpPointsY(Math.max(1, parseInt(e.target.value) || 1))}
                />


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

            {/* Легенда с числами */}
            {showLegend && heatmapData && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" gutterBottom sx={{ display: 'block' }}>
                        Цветовая шкала значений атрибута
                    </Typography>
                    <Box style={{ display: 'flex', gap: '10px', flexDirection: 'column' }} sx={{ mt: 1 }}>
                        {legendItems.map((item, idx) => (
                            <Box style={{display: 'flex', alignItems: 'center', gap: '15px'}} key={idx}>
                                <Box
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        bgcolor: getColorForValue(
                                            parseFloat(item.value),
                                            minAttributeValue,
                                            maxAttributeValue
                                        )
                                    }}
                                />
                                <Typography variant="caption" fontWeight="bold">
                                    {item.value}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Min: {minAttributeValue.toFixed(4)} | Max: {maxAttributeValue.toFixed(4)}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
}