

import { Grid, Card, CardContent, Typography } from '@mui/material';

export default function FileInfoCards({ file, samplesCount, intervalUs, tracesCount, elementType }) {
    return (
        <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>О файле</Typography>
                        <Typography variant="body2"><strong>Имя:</strong> {file?.fileName}</Typography>
                        <Typography variant="body2"><strong>Трасс:</strong> {tracesCount}</Typography>
                        <Typography variant="body2"><strong>Тип элемента:</strong> {elementType === 'pile' ? 'Свая' : elementType === 'slab' ? 'Плита' : 'Не определен'}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Дискретизация</Typography>
                        <Typography variant="body2"><strong>Интервал:</strong> {intervalUs} мкс</Typography>
                        <Typography variant="body2"><strong>Отсчетов:</strong> {samplesCount}</Typography>
                        <Typography variant="body2"><strong>Длительность:</strong> {(samplesCount * intervalUs / 1000000).toFixed(2)} с</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Описание</Typography>
                        <Typography variant="body2">{file?.description || 'Нет описания'}</Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}