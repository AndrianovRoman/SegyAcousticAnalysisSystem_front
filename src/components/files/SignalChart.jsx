import { Paper, Box, Typography } from '@mui/material';
import Plot from 'react-plotly.js';

export default function SignalChart({ plotRef, graphData, graphLayout, onPlotClick, isLoading }) {
    if (isLoading) {
        return (
            <Paper sx={{ p: 2, bgcolor: '#fafafa', minHeight: 550, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Загрузка данных...</Typography>
            </Paper>
        );
    }

    if (!graphData || graphData.length === 0) {
        return (
            <Paper sx={{ p: 2, bgcolor: '#fafafa', minHeight: 550, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Нет данных для отображения</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 2, bgcolor: '#fafafa', minHeight: 550 }}>
            <Plot
                ref={plotRef}
                data={graphData}
                layout={graphLayout}
                style={{ width: '100%', height: '100%', minHeight: 550 }}
                useResizeHandler={true}
                onClick={onPlotClick}
                config={{
                    responsive: true,
                    displayModeBar: true,
                    modeBarButtonsToAdd: ['zoom2d', 'pan2d', 'resetScale2d', 'toImage'],
                    displaylogo: false
                }}
            />
        </Paper>
    );
}