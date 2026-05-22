

import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    ToggleButton,
    ToggleButtonGroup,
    Grid
} from '@mui/material';
import { Calculate as CalculateIcon, Speed as SpeedIcon, Timeline as MarkerIcon } from '@mui/icons-material';

export default function PileAnalysis({
                                         startMarker, setStartMarker,
                                         endMarker, setEndMarker,
                                         waveSpeed, setWaveSpeed,
                                         pileLength, setPileLength,
                                         markerMode, setMarkerMode,
                                         onCalculateLength,
                                         onCalculateSpeed
                                     }) {
    return (
        <>
            <Grid item xs={12} md={4}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Маркеры</Typography>
                        <Box display="flex" gap={1} mb={1}>
                            <TextField
                                size="small"
                                label="Начало (с)"
                                type="number"
                                value={startMarker !== null ? startMarker : ''}
                                onChange={(e) => setStartMarker(parseFloat(e.target.value) || null)}
                                InputProps={{ inputProps: { step: 0.0001, min: 0 } }}
                                fullWidth
                            />
                            <TextField
                                size="small"
                                label="Конец (с)"
                                type="number"
                                value={endMarker !== null ? endMarker : ''}
                                onChange={(e) => setEndMarker(parseFloat(e.target.value) || null)}
                                InputProps={{ inputProps: { step: 0.0001, min: 0 } }}
                                fullWidth
                            />
                        </Box>
                        <Box display="flex" justifyContent="center">
                            <ToggleButtonGroup
                                value={markerMode}
                                exclusive
                                onChange={(e, val) => val && setMarkerMode(val)}
                                size="small"
                            >
                                <ToggleButton value="start" color="success">
                                    <MarkerIcon sx={{ mr: 0.5 }} /> Начало
                                </ToggleButton>
                                <ToggleButton value="end" color="error">
                                    <MarkerIcon sx={{ mr: 0.5 }} /> Конец
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Расчеты</Typography>
                        <Box display="flex" gap={1} mb={1}>
                            <TextField
                                size="small"
                                label="Скорость (м/с)"
                                type="number"
                                value={waveSpeed}
                                onChange={(e) => setWaveSpeed(parseFloat(e.target.value) || 0)}
                                InputProps={{ inputProps: { min: 0, step: 100 } }}
                                fullWidth
                            />
                            <Button
                                variant="contained"
                                size="small"
                                onClick={onCalculateLength}
                                disabled={startMarker === null || endMarker === null}
                                sx={{ minWidth: 40 }}
                            >
                                <CalculateIcon />
                            </Button>
                        </Box>
                        <Box display="flex" gap={1}>
                            <TextField
                                size="small"
                                label="Длина (м)"
                                type="number"
                                value={pileLength}
                                onChange={(e) => setPileLength(parseFloat(e.target.value) || 0)}
                                InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                                fullWidth
                            />
                            <Button
                                variant="contained"
                                size="small"
                                onClick={onCalculateSpeed}
                                disabled={startMarker === null || endMarker === null || pileLength <= 0}
                                sx={{ minWidth: 40 }}
                            >
                                <SpeedIcon />
                            </Button>
                        </Box>
                        {pileLength > 0 && (
                            <Typography variant="body2" color="primary" sx={{ mt: 1, textAlign: 'center' }}>
                                Длина: {pileLength.toFixed(2)} м
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </>
    );
}