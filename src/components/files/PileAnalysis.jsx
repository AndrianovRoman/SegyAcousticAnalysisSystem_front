import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Tooltip,
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
            <Grid item xs={12} style={{ marginBottom: '18px' }}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            <strong>Маркеры</strong>
                        </Typography>

                        <Box style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px' }}>
                            <TextField
                                size="small"
                                label="Начало (с)"
                                type="number"
                                value={startMarker !== null ? startMarker : ''}
                                onChange={(e) => setStartMarker(parseFloat(e.target.value) || null)}
                                InputProps={{ inputProps: { step: 0.0001, min: 0 } }}
                                fullWidth
                            />
                            <Button
                                variant={markerMode === 'start' ? 'contained' : 'outlined'}
                                color="success"
                                onClick={() => setMarkerMode('start')}
                            >
                                <MarkerIcon sx={{ mr: 0.5 }} /> Начало
                            </Button>
                        </Box>

                        <Box style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <TextField
                                size="small"
                                label="Конец (с)"
                                type="number"
                                value={endMarker !== null ? endMarker : ''}
                                onChange={(e) => setEndMarker(parseFloat(e.target.value) || null)}
                                InputProps={{ inputProps: { step: 0.0001, min: 0 } }}
                                fullWidth
                            />
                            <Button
                                variant={markerMode === 'end' ? 'contained' : 'outlined'}
                                color="error"
                                onClick={() => setMarkerMode('end')}
                            >
                                <MarkerIcon sx={{ mr: 0.5 }} /> Конец
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            <strong>Расчеты</strong>
                        </Typography>

                        <Box style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                            <TextField
                                size="small"
                                label="Скорость (м/с)"
                                type="number"
                                value={waveSpeed}
                                onChange={(e) => setWaveSpeed(parseFloat(e.target.value) || 0)}
                                InputProps={{ inputProps: { min: 0, step: 100 } }}
                                fullWidth
                            />
                            <Tooltip title="Рассчитать длину">
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={onCalculateLength}
                                    disabled={startMarker === null || endMarker === null}
                                    sx={{ minWidth: 40 }}
                                >
                                    <CalculateIcon />
                                </Button>
                            </Tooltip>
                        </Box>

                        <Box style={{ display: 'flex', gap: '5px' }}>
                            <TextField
                                size="small"
                                label="Длина (м)"
                                type="number"
                                value={pileLength}
                                onChange={(e) => setPileLength(parseFloat(e.target.value) || 0)}
                                InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                                fullWidth
                            />
                            <Tooltip title="Рассчитать скорость">
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={onCalculateSpeed}
                                    disabled={startMarker === null || endMarker === null || pileLength <= 0}
                                    sx={{ minWidth: 40 }}
                                >
                                    <SpeedIcon />
                                </Button>
                            </Tooltip>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </>
    );
}