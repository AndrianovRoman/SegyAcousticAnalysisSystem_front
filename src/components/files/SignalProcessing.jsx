

import { Box, Paper, Typography, TextField, Button, FormControlLabel, Switch } from '@mui/material';
import { TrendingUp as GainIcon, Equalizer as CorrectionIcon } from '@mui/icons-material';

export default function SignalProcessing({
                                             gainValue, setGainValue,
                                             correctionValue, setCorrectionValue,
                                             showGrid, setShowGrid,
                                             onApplyGain,
                                             onApplyCorrection,
                                             onResetProcessing
                                         }) {
    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Обработка сигнала</Typography>
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={3}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">Усиление:</Typography>
                    <TextField
                        size="small"
                        type="number"
                        value={gainValue}
                        onChange={(e) => setGainValue(parseFloat(e.target.value) || 1)}
                        sx={{ width: 80 }}
                        InputProps={{ inputProps: { min: 0.1, step: 0.5 } }}
                    />
                    <Button variant="outlined" size="small" onClick={onApplyGain}>
                        <GainIcon fontSize="small" sx={{ mr: 0.5 }} /> Применить
                    </Button>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">Коррекция:</Typography>
                    <TextField
                        size="small"
                        type="number"
                        value={correctionValue}
                        onChange={(e) => setCorrectionValue(parseFloat(e.target.value) || 0)}
                        sx={{ width: 80 }}
                        InputProps={{ inputProps: { min: 0, step: 50 } }}
                    />
                    <Button variant="outlined" size="small" onClick={onApplyCorrection}>
                        <CorrectionIcon fontSize="small" sx={{ mr: 0.5 }} /> Применить
                    </Button>
                </Box>
                <Button variant="outlined" size="small" color="warning" onClick={onResetProcessing}>
                    Сбросить обработку
                </Button>
                <FormControlLabel
                    control={<Switch checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} size="small" />}
                    label="Сетка"
                />
            </Box>
        </Paper>
    );
}