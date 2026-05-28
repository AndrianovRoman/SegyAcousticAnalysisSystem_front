import { useMemo, useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';

const parseGeometry = (geometryData) => {
    if (!geometryData) return null;

    try {
        return typeof geometryData === 'string' ? JSON.parse(geometryData) : geometryData;
    } catch (error) {
        console.error('Ошибка парсинга geometryData:', error);
        return null;
    }
};

const formatNumber = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return '0';
    return Number.isInteger(number) ? String(number) : number.toFixed(2);
};

const hasFiles = (point) => (
    (Array.isArray(point.children) && point.children.some(child => child.typeLevel === 'file')) ||
    (Array.isArray(point.files) && point.files.length > 0) ||
    point.filesCount > 0 ||
    point.fileCount > 0 ||
    point.hasFiles === true
);

export default function SlabPointMap({ slab, points = [], onAddPoint }) {
    const svgRef = useRef(null);
    const geometry = useMemo(() => parseGeometry(slab.geometryData), [slab.geometryData]);

    const length = Number(geometry?.length) > 0 ? Number(geometry.length) : Number(geometry?.diameter) / 1000;
    const width = Number(geometry?.width) > 0 ? Number(geometry.width) : Number(geometry?.diameter) / 1000;
    const isRound = !geometry?.length && !geometry?.width && Number(geometry?.diameter) > 0;
    const hasSize = Number(length) > 0 && Number(width) > 0;

    const viewWidth = 360;
    const viewHeight = 240;
    const padding = 28;
    const drawableWidth = viewWidth - padding * 2;
    const drawableHeight = viewHeight - padding * 2;
    const scale = hasSize ? Math.min(drawableWidth / length, drawableHeight / width) : 1;
    const slabWidth = hasSize ? length * scale : drawableWidth;
    const slabHeight = hasSize ? width * scale : drawableHeight;
    const slabX = (viewWidth - slabWidth) / 2;
    const slabY = (viewHeight - slabHeight) / 2;

    const getCoordinatesFromEvent = (event) => {
        if (!svgRef.current || !hasSize) return null;

        const rect = svgRef.current.getBoundingClientRect();
        const px = ((event.clientX - rect.left) / rect.width) * viewWidth;
        const py = ((event.clientY - rect.top) / rect.height) * viewHeight;

        if (px < slabX || px > slabX + slabWidth || py < slabY || py > slabY + slabHeight) {
            return null;
        }

        if (isRound) {
            const centerX = slabX + slabWidth / 2;
            const centerY = slabY + slabHeight / 2;
            const radius = Math.min(slabWidth, slabHeight) / 2;
            const distance = Math.sqrt(Math.pow(px - centerX, 2) + Math.pow(py - centerY, 2));
            if (distance > radius) return null;
        }

        return {
            x: Number((((px - slabX) / slabWidth) * length).toFixed(2)),
            y: Number((((py - slabY) / slabHeight) * width).toFixed(2))
        };
    };

    const handleClick = (event) => {
        event.stopPropagation();
        const coordinates = getCoordinatesFromEvent(event);
        if (coordinates) {
            onAddPoint(coordinates);
        }
    };

    const renderPoint = (point, index) => {
        const pointX = Number(point.x);
        const pointY = Number(point.y);
        if (!Number.isFinite(pointX) || !Number.isFinite(pointY) || !hasSize) return null;

        const cx = slabX + (pointX / length) * slabWidth;
        const cy = slabY + (pointY / width) * slabHeight;
        if (cx < slabX || cx > slabX + slabWidth || cy < slabY || cy > slabY + slabHeight) return null;

        return (
            <g key={point.id || `${pointX}-${pointY}-${index}`}>
                <circle cx={cx} cy={cy} r="5" fill={hasFiles(point) ? '#1976d2' : '#d32f2f'} stroke="#ffffff" strokeWidth="2" />
                <text x={cx + 7} y={cy - 7} fontSize="10" fill="#263238">
                    {index + 1}
                </text>
            </g>
        );
    };

    return (
        <Paper
            variant="outlined"
            sx={{ mx: 1.5, my: 1, p: 1.5, bgcolor: '#fafafa' }}
            onClick={(event) => event.stopPropagation()}
        >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                План плиты: кликните по области, чтобы добавить точку
            </Typography>

            {hasSize ? (
                <Box>
                    <svg
                        ref={svgRef}
                        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                        width="100%"
                        height="auto"
                        role="img"
                        aria-label="План плиты"
                        onClick={handleClick}
                        style={{ display: 'block', cursor: 'crosshair' }}
                    >
                        <rect x="0" y="0" width={viewWidth} height={viewHeight} fill="#ffffff" />
                        {isRound ? (
                            <circle
                                cx={slabX + slabWidth / 2}
                                cy={slabY + slabHeight / 2}
                                r={Math.min(slabWidth, slabHeight) / 2}
                                fill="#e3f2fd"
                                stroke="#1976d2"
                                strokeWidth="2"
                            />
                        ) : (
                            <rect
                                x={slabX}
                                y={slabY}
                                width={slabWidth}
                                height={slabHeight}
                                fill="#e3f2fd"
                                stroke="#1976d2"
                                strokeWidth="2"
                            />
                        )}

                        <line x1={slabX} y1={slabY + slabHeight + 14} x2={slabX + slabWidth} y2={slabY + slabHeight + 14} stroke="#607d8b" />
                        <line x1={slabX - 14} y1={slabY} x2={slabX - 14} y2={slabY + slabHeight} stroke="#607d8b" />
                        <text x={slabX + slabWidth / 2} y={slabY + slabHeight + 27} fontSize="11" textAnchor="middle" fill="#455a64">
                            X: {formatNumber(length)} м
                        </text>
                        <text x={slabX - 19} y={slabY + slabHeight / 2} fontSize="11" textAnchor="middle" fill="#455a64" transform={`rotate(-90 ${slabX - 19} ${slabY + slabHeight / 2})`}>
                            Y: {formatNumber(width)} м
                        </text>

                        {points.map(renderPoint)}
                    </svg>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Точек: {points.length}
                    </Typography>
                </Box>
            ) : (
                <Typography variant="caption" color="error">
                    У плиты не указаны длина и ширина.
                </Typography>
            )}
        </Paper>
    );
}
