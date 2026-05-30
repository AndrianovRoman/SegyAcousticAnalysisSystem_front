import { useMemo, useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';

// Вспомогательные функции
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

const getGridStep = (size) => {
    if (!Number.isFinite(size) || size <= 0) return 1;

    const targetStep = size / 24;
    const magnitude = Math.pow(10, Math.floor(Math.log10(targetStep)));
    const normalized = targetStep / magnitude;

    if (normalized <= 1) return magnitude;
    if (normalized <= 2) return 2 * magnitude;
    if (normalized <= 5) return 5 * magnitude;
    return 10 * magnitude;
};

const getPrecision = (step) => {
    const text = String(step);
    return text.includes('.') ? text.split('.')[1].length : 0;
};

const snapToGrid = (value, step, maxValue) => {
    const precision = getPrecision(step);
    const snapped = Math.round(value / step) * step;
    const clamped = Math.min(Math.max(snapped, 0), maxValue);
    return Number(clamped.toFixed(Math.max(precision, 2)));
};

const buildGridValues = (size, step) => {
    const values = [];
    const precision = getPrecision(step);

    for (let value = 0; value <= size + step / 2; value += step) {
        const normalized = Number(Math.min(value, size).toFixed(Math.max(precision, 2)));
        if (values[values.length - 1] !== normalized) {
            values.push(normalized);
        }
    }

    if (values[values.length - 1] !== size) {
        values.push(Number(size.toFixed(Math.max(precision, 2))));
    }

    return values;
};

const shouldShowGridLabel = (index, values) => {
    const labelEvery = Math.max(1, Math.ceil((values.length - 1) / 6));
    return index === 0 || index === values.length - 1 || index % labelEvery === 0;
};

// Проверка наличия файлов у точки
const hasFiles = (point) => {
    // Проверяем children
    if (Array.isArray(point.children) && point.children.some(child => child.typeLevel === 'file')) {
        return true;
    }
    // Проверяем files
    if (Array.isArray(point.files) && point.files.length > 0) {
        return true;
    }
    // Проверяем filesCount
    const filesCount = Number(point.filesCount ?? point.fileCount ?? 0);
    if (filesCount > 0) return true;
    // Проверяем hasFiles
    if (point.hasFiles === true) return true;

    return false;
};

export default function SlabPointMap({ slab, points = [], onAddPoint }) {
    const svgRef = useRef(null);
    const geometry = useMemo(() => parseGeometry(slab.geometryData), [slab.geometryData]);

    const length = Number(geometry?.length) > 0 ? Number(geometry.length) : Number(geometry?.diameter) / 1000;
    const width = Number(geometry?.width) > 0 ? Number(geometry.width) : Number(geometry?.diameter) / 1000;
    const isRound = !geometry?.length && !geometry?.width && Number(geometry?.diameter) > 0;
    const hasSize = length > 0 && width > 0;

    const viewWidth = 360;
    const viewHeight = 240;
    const paddingLeft = 50;
    const paddingRight = 24;
    const paddingTop = 24;
    const paddingBottom = 38;
    const drawableWidth = viewWidth - paddingLeft - paddingRight;
    const drawableHeight = viewHeight - paddingTop - paddingBottom;
    const scale = hasSize ? Math.min(drawableWidth / length, drawableHeight / width) : 1;
    const slabWidth = hasSize ? length * scale : drawableWidth;
    const slabHeight = hasSize ? width * scale : drawableHeight;
    const slabX = paddingLeft + (drawableWidth - slabWidth) / 2;
    const slabY = paddingTop + (drawableHeight - slabHeight) / 2;
    const gridStepX = getGridStep(length);
    const gridStepY = getGridStep(width);
    const gridValuesX = hasSize ? buildGridValues(length, gridStepX) : [];
    const gridValuesY = hasSize ? buildGridValues(width, gridStepY) : [];

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

        const rawX = ((px - slabX) / slabWidth) * length;
        const rawY = ((py - slabY) / slabHeight) * width;

        return {
            x: snapToGrid(rawX, gridStepX, length),
            y: snapToGrid(rawY, gridStepY, width)
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

        // Определяем цвет точки в зависимости от наличия файлов
        const pointColor = hasFiles(point) ? '#1976d2' : '#d32f2f';

        return (
            <g key={point.id || `${pointX}-${pointY}-${index}`}>
                <circle
                    cx={cx}
                    cy={cy}
                    r="5"
                    fill={pointColor}
                    stroke="#ffffff"
                    strokeWidth="2"
                />
                <text
                    x={cx + 7}
                    y={cy - 7}
                    fontSize="10"
                    fill="#263238"
                >
                    {index + 1}
                </text>
            </g>
        );
    };

    const renderGrid = () => (
        <g>
            {/* Вертикальные линии сетки */}
            {gridValuesX.map((value, index) => {
                const x = slabX + (value / length) * slabWidth;
                const isEdge = value === 0 || value === length;
                const showLabel = shouldShowGridLabel(index, gridValuesX);

                return (
                    <g key={`grid-x-${value}`}>
                        <line
                            x1={x}
                            y1={slabY}
                            x2={x}
                            y2={slabY + slabHeight}
                            stroke={isEdge ? '#90a4ae' : '#bbdefb'}
                            strokeWidth={isEdge ? '1' : '0.75'}
                        />
                        {showLabel && (
                            <text
                                x={x}
                                y={slabY + slabHeight + 12}
                                fontSize="9"
                                textAnchor="middle"
                                fill="#607d8b"
                            >
                                {formatNumber(value)}
                            </text>
                        )}
                    </g>
                );
            })}

            {/* Горизонтальные линии сетки */}
            {gridValuesY.map((value, index) => {
                const y = slabY + (value / width) * slabHeight;
                const isEdge = value === 0 || value === width;
                const showLabel = shouldShowGridLabel(index, gridValuesY);

                return (
                    <g key={`grid-y-${value}`}>
                        <line
                            x1={slabX}
                            y1={y}
                            x2={slabX + slabWidth}
                            y2={y}
                            stroke={isEdge ? '#90a4ae' : '#bbdefb'}
                            strokeWidth={isEdge ? '1' : '0.75'}
                        />
                        {showLabel && (
                            <text
                                x={slabX - 7}
                                y={y + 3}
                                fontSize="9"
                                textAnchor="end"
                                fill="#607d8b"
                            >
                                {formatNumber(value)}
                            </text>
                        )}
                    </g>
                );
            })}
        </g>
    );

    return (
        <Paper
            variant="outlined"
            sx={{ mx: 1.5, my: 1, p: 1.5, bgcolor: '#fafafa' }}
            onClick={(event) => event.stopPropagation()}
        >
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1 }}
            >
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
                        {/* Фон */}
                        <rect x="0" y="0" width={viewWidth} height={viewHeight} fill="#ffffff" />

                        {/* Контур плиты */}
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

                        {/* Сетка */}
                        {renderGrid()}

                        {/* Точки */}
                        {points.map(renderPoint)}
                    </svg>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                    >
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