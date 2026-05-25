import { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, FormControlLabel, Switch, Divider } from '@mui/material';
import { TrendingUp as GainIcon, Equalizer as CorrectionIcon, RemoveCircle as DcIcon, AutoFixHigh as StaticIcon } from '@mui/icons-material';

export default function SignalProcessing({
                                             gainValue, setGainValue,
                                             correctionValue, setCorrectionValue,
                                             showGrid, setShowGrid,
                                             onApplyGain,
                                             onApplyCorrection,
                                             onApplyDcRemoval,
                                             onApplyStaticCorrection,
                                             onResetProcessing,
                                             isDcRemoval,
                                             isStaticCorrection
                                         }) {
    // Локальные состояния для включения фильтров
    const [isGainEnabled, setIsGainEnabled] = useState(false);
    const [isCorrectionEnabled, setIsCorrectionEnabled] = useState(false);
    // Сохраняем значения до применения
    const [savedGainValue, setSavedGainValue] = useState(1);
    const [savedCorrectionValue, setSavedCorrectionValue] = useState(0);

    const handleGainToggle = (checked) => {
        setIsGainEnabled(checked);
        if (checked) {
            // Включаем: применяем текущее значение
            setSavedGainValue(gainValue);
            onApplyGain();
        } else {
            // Выключаем: применяем значение 1 (нет усиления)
            setGainValue(1);
            onApplyGain(); // Это применит gainValue=1
        }
    };

    const handleCorrectionToggle = (checked) => {
        setIsCorrectionEnabled(checked);
        if (checked) {
            setSavedCorrectionValue(correctionValue);
            onApplyCorrection();
        } else {
            setCorrectionValue(0);
            onApplyCorrection(); // Это применит correctionValue=0
        }
    };

    const handleGainValueChange = (newValue) => {
        setGainValue(newValue);
        if (isGainEnabled) {
            onApplyGain(); // Автоматически применяем при изменении значения
        }
    };

    const handleCorrectionValueChange = (newValue) => {
        setCorrectionValue(newValue);
        if (isCorrectionEnabled) {
            onApplyCorrection(); // Автоматически применяем при изменении значения
        }
    };

    const handleResetAll = () => {
        setIsGainEnabled(false);
        setIsCorrectionEnabled(false);
        setGainValue(1);
        setCorrectionValue(0);
        setSavedGainValue(1);
        setSavedCorrectionValue(0);
        onResetProcessing();
    };

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Обработка сигнала</Typography>

            <Box style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Фильтры первого уровня */}
                <Box style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isDcRemoval}
                                onChange={(e) => onApplyDcRemoval(e.target.checked)}
                                size="small"
                                color="primary"
                            />
                        }
                        label={
                            <Typography variant="body2">Удаление постоянной составляющей</Typography>
                        }
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={isStaticCorrection}
                                onChange={(e) => onApplyStaticCorrection(e.target.checked)}
                                size="small"
                                color="primary"
                            />
                        }
                        label={
                            <Typography variant="body2">Автостатическая поправка</Typography>
                        }
                    />

                    <Divider orientation="vertical" flexItem />

                    <FormControlLabel
                        control={<Switch checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} size="small" />}
                        label="Сетка"
                    />
                </Box>

                <Divider />

                {/* Усиление сигнала */}
                <Box style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isGainEnabled}
                                onChange={(e) => handleGainToggle(e.target.checked)}
                                size="small"
                                color="secondary"
                            />
                        }
                        label="Усиление сигнала"
                    />
                    <TextField
                        size="small"
                        type="number"
                        label="Коэффициент"
                        value={gainValue}
                        onChange={(e) => handleGainValueChange(parseFloat(e.target.value) || 1)}
                        disabled={!isGainEnabled}
                        sx={{ width: 120 }}
                        InputProps={{ inputProps: { min: 0.1, step: 0.5 } }}
                    />
                </Box>

                {/* Амплитудная коррекция */}
                <Box style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isCorrectionEnabled}
                                onChange={(e) => handleCorrectionToggle(e.target.checked)}
                                size="small"
                                color="secondary"
                            />
                        }
                        label="Амплитудная коррекция"
                    />
                    <TextField
                        size="small"
                        type="number"
                        label="Коэффициент"
                        value={correctionValue}
                        onChange={(e) => handleCorrectionValueChange(parseFloat(e.target.value) || 0)}
                        disabled={!isCorrectionEnabled}
                        sx={{ width: 120 }}
                        InputProps={{ inputProps: { min: 0, step: 50 } }}
                    />
                </Box>

                <Divider />

                <Box display="flex" justifyContent="flex-end">
                    <Button variant="outlined" size="small" color="warning" onClick={handleResetAll}>
                        Сбросить все фильтры
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
}