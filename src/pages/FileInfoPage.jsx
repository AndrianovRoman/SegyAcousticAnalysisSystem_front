import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Paper, Box, Breadcrumbs, Link, Typography, Button, CircularProgress, Grid } from '@mui/material';
import { useBus } from 'react-bus';
import Plotly from 'plotly.js-dist';
import api from '../api/axios';
import { buildChartData, buildChartLayout, calculatePileLength, calculateWaveSpeed, generateTestData } from '../utils/sgyUtils';
import FileHeader from '../components/files/FileHeader';
import FileInfoCards from '../components/files/FileInfoCards';
import SignalProcessing from '../components/files/SignalProcessing';
import SignalChart from '../components/files/SignalChart';
import PileAnalysis from '../components/files/PileAnalysis';
import SlabAnalysis from '../components/files/SlabAnalysis';
import fft from 'fft-js';

export default function FileInfoPage() {
    const { fileId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const bus = useBus();

    const pointId = location.state?.pointId;
    const navigationElementGeometryData = location.state?.elementGeometryData;

    // Состояния для UI
    const [showGrid, setShowGrid] = useState(true);
    const [startMarker, setStartMarker] = useState(null);
    const [endMarker, setEndMarker] = useState(null);
    const [pileLength, setPileLength] = useState(0);
    const [markerMode, setMarkerMode] = useState('start');

    // Состояния для фильтров
    const [gainValue, setGainValue] = useState(1);
    const [correctionValue, setCorrectionValue] = useState(0);
    const [isDcRemoval, setIsDcRemoval] = useState(false);
    const [isStaticCorrection, setIsStaticCorrection] = useState(false);
    const [isGainApplied, setIsGainApplied] = useState(false);
    const [isCorrectionApplied, setIsCorrectionApplied] = useState(false);

    // Состояния для графика
    const [graphData, setGraphData] = useState([]);
    const [graphLayout, setGraphLayout] = useState({});

    // Состояния для плиты
    const [interpPointsX, setInterpPointsX] = useState(20);
    const [interpPointsY, setInterpPointsY] = useState(20);
    const [attributeType, setAttributeType] = useState(1);
    const [heatmapData, setHeatmapData] = useState(null);
    const [showLegend, setShowLegend] = useState(false);
    const [minAttributeValue, setMinAttributeValue] = useState(0);
    const [maxAttributeValue, setMaxAttributeValue] = useState(0);
    const [pointsCoords, setPointsCoords] = useState([]);
    const [isCalculating, setIsCalculating] = useState(false);

    // Состояния из данных файла
    const [fileData, setFileData] = useState(null);
    const [elementId, setElementId] = useState(null);
    const [elementType, setElementType] = useState(null);
    const [originalTraces, setOriginalTraces] = useState([]);
    const [timeAxis, setTimeAxis] = useState([]);
    const [maxAmplitude, setMaxAmplitude] = useState(1);
    const [samplesCount, setSamplesCount] = useState(0);
    const [intervalUs, setIntervalUs] = useState(0);
    const [waveSpeed, setWaveSpeed] = useState(4000);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const plotRef = useRef(null);
    const canvasRef = useRef(null);

    // Загрузка данных
    useEffect(() => {
        const fetchData = async () => {
            if (!pointId || !fileId) return;

            setLoading(true);

            try {
                // 1. Получаем информацию о файле
                const fileResponse = await api.get(`/api/points/${pointId}/files/${fileId}`);
                const fileData = fileResponse.data;
                setFileData(fileData);
                setElementId(fileData.elementId);
                setElementType(fileData.elementType);

                // 2. Если это плита и есть elementId, сразу загружаем точки
                if (fileData.elementType === 'slab' && fileData.elementId) {
                    try {
                        const pointsResponse = await api.get(`/api/elements/${fileData.elementId}/points`);

                        const points = pointsResponse.data.map(p => ({
                            id: p.id,
                            x: p.x,
                            y: p.y,
                            name: p.pointName
                        }));
                        setPointsCoords(points);
                    } catch (pointsErr) {
                        bus.emit('error', 'Не удалось загрузить точки для плиты');
                    }
                }

                // 3. Парсим SGY данные
                const parseRes = await api.post(`/api/points/${pointId}/files/${fileId}/parse?includeSamples=true`);
                const parseData = parseRes.data;

                const samples = parseData.binaryHeader?.samplesPerTrace || 2048;
                const interval = parseData.binaryHeader?.sampleIntervalMicroseconds || 31;
                setSamplesCount(samples);
                setIntervalUs(interval);

                const time = Array.from({ length: samples }, (_, i) => (i * interval) / 1000000);
                setTimeAxis(time);

                let traces = [];
                let maxAmp = 0;

                if (parseData.traces && parseData.traces.length > 0) {
                    for (let t = 0; t < parseData.traces.length; t++) {
                        const trace = parseData.traces[t];

                        let amplitudes = [];
                        if (trace.samples && trace.samples.length > 0) {
                            amplitudes = trace.samples;
                        } else if (trace.samplePreview && trace.samplePreview.length > 0) {
                            amplitudes = trace.samplePreview;
                        }

                        if (amplitudes.length > 0) {
                            if (amplitudes.length < samples) {
                                const interpolated = new Array(samples);
                                const step = (amplitudes.length - 1) / (samples - 1);
                                for (let i = 0; i < samples; i++) {
                                    const index = i * step;
                                    const idx1 = Math.floor(index);
                                    const idx2 = Math.min(idx1 + 1, amplitudes.length - 1);
                                    const fraction = index - idx1;
                                    interpolated[i] = amplitudes[idx1] * (1 - fraction) + amplitudes[idx2] * fraction;
                                }
                                amplitudes = interpolated;
                            } else if (amplitudes.length > samples) {
                                amplitudes = amplitudes.slice(0, samples);
                            }

                            traces.push(amplitudes);
                            const traceMax = Math.max(...amplitudes.map(Math.abs));
                            if (traceMax > maxAmp) maxAmp = traceMax;
                        }
                    }
                }

                if (traces.length === 0) {
                    const testData = generateTestData(samples, interval);
                    traces = [testData];
                    maxAmp = Math.max(...testData.map(Math.abs));
                }

                setOriginalTraces(traces);
                setMaxAmplitude(maxAmp);

                const speedMatch = parseData.textHeaderContent?.match(/waveSpeed:\s*(\d+)/);
                if (speedMatch) {
                    setWaveSpeed(parseInt(speedMatch[1]));
                }

            } catch (err) {
                console.error('Ошибка загрузки:', err);
                setError(err.response?.data?.message || 'Не удалось загрузить файл');
                bus.emit('error', 'Не удалось загрузить файл');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [pointId, fileId]);

    // Сброс маркеров и фильтров при смене файла
    useEffect(() => {
        setStartMarker(null);
        setEndMarker(null);
        setPileLength(0);
        setIsDcRemoval(false);
        setIsStaticCorrection(false);
        setIsGainApplied(false);
        setIsCorrectionApplied(false);
        setGainValue(1);
        setCorrectionValue(0);
        setHeatmapData(null);
        setShowLegend(false);
        setPointsCoords([]);
    }, [fileId]);

    // Функция применения всех фильтров
    const updateChart = useCallback(() => {
        if (!originalTraces.length || !timeAxis.length) return;

        let tracesForChart = [...originalTraces];

        if (isDcRemoval) {
            tracesForChart = tracesForChart.map(trace => {
                const avg = trace.reduce((a, b) => a + b, 0) / trace.length;
                return trace.map(v => v - avg);
            });
        }

        if (isStaticCorrection && tracesForChart.length > 1) {
            const findPeakIndex = (signal) => {
                let maxIndex = 0;
                let maxValue = Math.abs(signal[0]);
                for (let i = 1; i < signal.length; i++) {
                    if (Math.abs(signal[i]) > maxValue) {
                        maxValue = Math.abs(signal[i]);
                        maxIndex = i;
                    }
                }
                return maxIndex;
            };

            const firstTracePeakIndex = findPeakIndex(tracesForChart[0]);
            const firstTracePeakTime = timeAxis[firstTracePeakIndex];

            tracesForChart = tracesForChart.map(trace => {
                const peakIndex = findPeakIndex(trace);
                const peakTime = timeAxis[peakIndex];
                const diff = peakTime - firstTracePeakTime;
                if (Math.abs(diff) < 0.000001) return trace;

                const shifted = new Array(trace.length);
                for (let i = 0; i < trace.length; i++) {
                    const newTime = timeAxis[i] - diff;
                    if (newTime <= timeAxis[0]) {
                        shifted[i] = trace[0];
                    } else if (newTime >= timeAxis[timeAxis.length - 1]) {
                        shifted[i] = trace[trace.length - 1];
                    } else {
                        let idx = 1;
                        while (idx < timeAxis.length && timeAxis[idx] < newTime) idx++;
                        const t1 = timeAxis[idx - 1];
                        const t2 = timeAxis[idx];
                        const v1 = trace[idx - 1];
                        const v2 = trace[idx];
                        shifted[i] = v1 + (v2 - v1) * (newTime - t1) / (t2 - t1);
                    }
                }
                return shifted;
            });
        }

        let maxAmp = Math.max(...tracesForChart.flat().map(Math.abs));
        if (maxAmp === 0) maxAmp = 1;

        const data = buildChartData(
            tracesForChart, timeAxis, maxAmp,
            isGainApplied, gainValue,
            isCorrectionApplied, correctionValue
        );
        setGraphData(data);

        const layout = buildChartLayout(
            fileData?.fileName || 'Сигнал',
            startMarker, endMarker, showGrid,
            [0, timeAxis[timeAxis.length - 1] || 0.03],
            originalTraces.length,
            pileLength
        );
        setGraphLayout(layout);
    }, [originalTraces, timeAxis, isDcRemoval, isStaticCorrection, isGainApplied, gainValue, isCorrectionApplied, correctionValue, showGrid, startMarker, endMarker, pileLength, fileData]);

    useEffect(() => {
        updateChart();
    }, [updateChart]);

    // Обработчики
    const handlePlotClick = (event) => {
        if (elementType === 'pile' && event.points && event.points.length > 0) {
            const x = event.points[0].x;
            if (x === undefined) return;

            if (markerMode === 'start') {
                setStartMarker(x);
                if (endMarker !== null && endMarker <= x) setEndMarker(null);
                bus.emit('info', `Маркер начала установлен на ${x.toFixed(4)} с`);
            } else {
                if (startMarker !== null && x <= startMarker) {
                    bus.emit('error', 'Маркер конца должен быть позже маркера начала');
                    return;
                }
                setEndMarker(x);
                bus.emit('info', `Маркер конца установлен на ${x.toFixed(4)} с`);
            }
        }
    };

    const handleCalculateLength = () => {
        const length = calculatePileLength(startMarker, endMarker, waveSpeed);
        setPileLength(length);
        bus.emit('success', `Расчетная длина сваи: ${length.toFixed(2)} м`);
    };

    const handleCalculateSpeed = () => {
        const speed = calculateWaveSpeed(startMarker, endMarker, pileLength);
        if (speed > 0) {
            setWaveSpeed(Math.round(speed));
            bus.emit('success', `Расчетная скорость волны: ${Math.round(speed)} м/с`);
        } else {
            bus.emit('error', 'Проверьте маркеры и длину сваи');
        }
    };

    const handleApplyGain = () => {
        if (gainValue <= 0) {
            bus.emit('error', 'Коэффициент усиления должен быть больше 0');
            return;
        }
        setIsGainApplied(true);
        bus.emit('success', `Усиление сигнала (x${gainValue}) применено`);
    };

    const handleApplyCorrection = () => {
        if (correctionValue < 0) {
            bus.emit('error', 'Коэффициент коррекции должен быть неотрицательным');
            return;
        }
        setIsCorrectionApplied(true);
        bus.emit('success', `Амплитудная коррекция (коэф. ${correctionValue}) применена`);
    };

    const handleApplyDcRemoval = (checked) => {
        setIsDcRemoval(checked);
        bus.emit('info', checked ? 'Удаление постоянной составляющей включено' : 'Удаление постоянной составляющей выключено');
    };

    const handleApplyStaticCorrection = (checked) => {
        setIsStaticCorrection(checked);
        bus.emit('info', checked ? 'Автостатическая поправка включена' : 'Автостатическая поправка выключена');
    };

    const handleResetProcessing = () => {
        setIsDcRemoval(false);
        setIsStaticCorrection(false);
        setIsGainApplied(false);
        setIsCorrectionApplied(false);
        setGainValue(1);
        setCorrectionValue(0);
        bus.emit('success', 'Обработка сигнала сброшена');
    };

    const handleResetAll = () => {
        handleResetProcessing();
        setStartMarker(null);
        setEndMarker(null);
        setPileLength(0);
        bus.emit('success', 'Все настройки сброшены');
    };

    const handleClearMarkers = () => {
        setStartMarker(null);
        setEndMarker(null);
        bus.emit('info', 'Маркеры сброшены');
    };

    const handleExportGraph = async () => {
        if (!plotRef.current) {
            bus.emit('error', 'График еще не загружен');
            return;
        }

        try {
            // ✅ Получаем DOM-элемент
            const plotElement = plotRef.current;
            const plotDiv = plotElement?.el || plotElement;

            if (!plotDiv) {
                bus.emit('error', 'Не удалось найти элемент графика');
                return;
            }

            const imageData = await Plotly.toImage(plotDiv, {
                format: 'png',
                width: 1200,
                height: 700,
                scale: 2
            });

            const link = document.createElement('a');
            link.download = `sgy_graph_${fileData?.fileName || 'signal'}.png`;
            link.href = imageData;
            link.click();
            bus.emit('success', 'График сохранен');
        } catch (err) {
            console.error('Ошибка сохранения:', err);
            bus.emit('error', 'Не удалось сохранить график');
        }
    };

    // ============= Функции для плиты =============

    const calculateEnergy = (signal, dt) => {
        let energy = 0;
        for (let i = 0; i < signal.length; i++) {
            energy += Math.pow(signal[i], 2) * dt;
        }
        return energy;
    };

    const normalizeSignal = (signal) => {
        const max = Math.max(...signal.map(Math.abs));
        if (max === 0) return signal;
        return signal.map(v => v / max);
    };

    const calculateFourierSpectrum = (signal) => {
        const complexSignal = signal.map(v => [v, 0]);
        const phasors = fft.fft(complexSignal);
        const magnitudes = phasors.map(p => Math.sqrt(p[0] * p[0] + p[1] * p[1]));
        return magnitudes.slice(0, Math.floor(magnitudes.length / 2));
    };

    const calculateMaxFrequency = (signal, dt) => {
        const magnitudes = calculateFourierSpectrum(signal);
        const df = 1 / (dt * (signal.length - 1));

        let maxMagnitude = -Infinity;
        let maxIndex = 0;
        for (let i = 0; i < magnitudes.length; i++) {
            if (magnitudes[i] > maxMagnitude) {
                maxMagnitude = magnitudes[i];
                maxIndex = i;
            }
        }
        return maxIndex * df;
    };

    const calculateSpectrumArea = (signal, dt, normalize = false) => {
        let magnitudes = calculateFourierSpectrum(signal);
        const df = 1 / (dt * (signal.length - 1));

        if (normalize) {
            const max = Math.max(...magnitudes);
            if (max > 0) {
                magnitudes = magnitudes.map(v => v / max);
            }
        }

        let area = 0;
        for (let i = 0; i < magnitudes.length; i++) {
            area += Math.pow(magnitudes[i], 2) * df;
        }
        return area;
    };

    const calculateWeightedFrequency = (signal, dt) => {
        const magnitudes = calculateFourierSpectrum(signal);
        const df = 1 / (dt * (signal.length - 1));

        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < magnitudes.length; i++) {
            const freq = i * df;
            numerator += magnitudes[i] * freq;
            denominator += magnitudes[i];
        }
        return denominator > 0 ? numerator / denominator : 0;
    };

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

    const parseGeometryData = (geometryData) => {
        if (!geometryData) return null;

        try {
            return typeof geometryData === 'string' ? JSON.parse(geometryData) : geometryData;
        } catch (err) {
            console.error('Ошибка парсинга geometryData:', err);
            return null;
        }
    };

    const getSlabBounds = (points = []) => {
        const geometry = parseGeometryData(
            navigationElementGeometryData ||
            fileData?.geometryData ||
            fileData?.elementGeometryData ||
            fileData?.element?.geometryData
        );

        const slabLength = Number(geometry?.length) > 0 ? Number(geometry.length) : Number(geometry?.diameter) / 1000;
        const slabWidth = Number(geometry?.width) > 0 ? Number(geometry.width) : Number(geometry?.diameter) / 1000;

        if (Number(slabLength) > 0 && Number(slabWidth) > 0) {
            return { minX: 0, maxX: slabLength, minY: 0, maxY: slabWidth };
        }

        if (points.length === 0) {
            return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
        }

        const xs = points.map(point => point.x);
        const ys = points.map(point => point.y);
        let minX = Math.min(...xs);
        let maxX = Math.max(...xs);
        let minY = Math.min(...ys);
        let maxY = Math.max(...ys);

        if (minX === maxX) maxX = minX + 1;
        if (minY === maxY) maxY = minY + 1;

        return { minX, maxX, minY, maxY };
    };

    const drawHeatmap = (matrix, xValues, yValues, minValue, maxValue, measuredPoints = []) => {
        if (!canvasRef.current || !matrix.length || !matrix[0].length) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const paddingLeft = 54;
        const paddingRight = 18;
        const paddingTop = 18;
        const paddingBottom = 42;
        const plotX = paddingLeft;
        const plotY = paddingTop;
        const plotWidth = width - paddingLeft - paddingRight;
        const plotHeight = height - paddingTop - paddingBottom;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        const cellWidth = plotWidth / matrix.length;
        const cellHeight = plotHeight / matrix[0].length;

        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[0].length; j++) {
                const color = getColorForValue(matrix[i][j], minValue, maxValue);
                ctx.fillStyle = color;
                ctx.fillRect(plotX + i * cellWidth, plotY + j * cellHeight, cellWidth, cellHeight);
            }
        }

        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= matrix.length; i++) {
            ctx.beginPath();
            ctx.moveTo(plotX + i * cellWidth, plotY);
            ctx.lineTo(plotX + i * cellWidth, plotY + plotHeight);
            ctx.stroke();
        }
        for (let j = 0; j <= matrix[0].length; j++) {
            ctx.beginPath();
            ctx.moveTo(plotX, plotY + j * cellHeight);
            ctx.lineTo(plotX + plotWidth, plotY + j * cellHeight);
            ctx.stroke();
        }

        ctx.strokeStyle = '#455a64';
        ctx.lineWidth = 1;
        ctx.strokeRect(plotX, plotY, plotWidth, plotHeight);

        const minX = xValues[0];
        const maxX = xValues[xValues.length - 1];
        const minY = yValues[0];
        const maxY = yValues[yValues.length - 1];
        const xRange = maxX - minX || 1;
        const yRange = maxY - minY || 1;

        ctx.fillStyle = '#455a64';
        ctx.font = '12px Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`X: ${minX.toFixed(2)}-${maxX.toFixed(2)} м`, plotX + plotWidth / 2, height - 12);

        ctx.save();
        ctx.translate(14, plotY + plotHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`Y: ${minY.toFixed(2)}-${maxY.toFixed(2)} м`, 0, 0);
        ctx.restore();

        measuredPoints.forEach((point, index) => {
            const px = plotX + ((point.x - minX) / xRange) * plotWidth;
            const py = plotY + ((point.y - minY) / yRange) * plotHeight;

            if (px < plotX || px > plotX + plotWidth || py < plotY || py > plotY + plotHeight) return;

            ctx.beginPath();
            ctx.fillStyle = '#111827';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#111827';
            ctx.font = '11px Roboto, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(String(index + 1), px + 7, py - 7);
        });
    };

    const interpolatePoints = (points, bounds, countX, countY) => {
        if (points.length === 0) return { matrix: [], xValues: [], yValues: [] };

        const safeCountX = Math.max(2, countX);
        const safeCountY = Math.max(2, countY);
        const stepX = (bounds.maxX - bounds.minX) / (safeCountX - 1);
        const stepY = (bounds.maxY - bounds.minY) / (safeCountY - 1);
        const newX = Array.from({ length: safeCountX }, (_, i) => bounds.minX + i * stepX);
        const newY = Array.from({ length: safeCountY }, (_, i) => bounds.minY + i * stepY);

        const result = Array(safeCountX).fill().map(() => Array(safeCountY).fill(0));
        for (let i = 0; i < safeCountX; i++) {
            for (let j = 0; j < safeCountY; j++) {
                let sum = 0, weightSum = 0;

                points.forEach((point) => {
                    const distance = Math.sqrt(Math.pow(newX[i] - point.x, 2) + Math.pow(newY[j] - point.y, 2));
                    const weight = 1 / (distance + 0.001);
                    sum += point.value * weight;
                    weightSum += weight;
                });

                result[i][j] = weightSum > 0 ? sum / weightSum : 0;
            }
        }
        return { matrix: result, xValues: newX, yValues: newY };
    };

    const calculateAttributesForPoints = async () => {
        if (pointsCoords.length === 0) {
            bus.emit('error', 'Нет данных для анализа плиты');
            return;
        }

        setIsCalculating(true);

        try {
            const results = [];
            for (const point of pointsCoords) {
                try {
                    const filesRes = await api.get(`/api/points/${point.id}/files`);
                    if (filesRes.data.length === 0) continue;

                    const file = filesRes.data[0];
                    const parseRes = await api.post(`/api/points/${point.id}/files/${file.id}/parse?includeSamples=true`);
                    const parseData = parseRes.data;

                    if (!parseData.traces || parseData.traces.length === 0) continue;

                    const signal = parseData.traces[0].samples || parseData.traces[0].samplePreview || [];
                    if (signal.length === 0) continue;

                    const dt = (parseData.binaryHeader?.sampleIntervalMicroseconds || 31) / 1000000;
                    let value = 0;

                    switch (attributeType) {
                        case 1: value = calculateEnergy(signal, dt); break;
                        case 2: value = calculateEnergy(normalizeSignal(signal), dt); break;
                        case 3: value = calculateMaxFrequency(signal, dt); break;
                        case 4: value = calculateSpectrumArea(signal, dt, false); break;
                        case 5: value = calculateSpectrumArea(signal, dt, true); break;
                        case 6: value = calculateWeightedFrequency(signal, dt); break;
                        default: value = calculateEnergy(signal, dt);
                    }

                    results.push({ x: point.x, y: point.y, value: value });
                } catch (err) {
                    console.error(`Ошибка обработки точки ${point.id}:`, err);
                }
            }

            if (results.length === 0) {
                bus.emit('error', 'Не удалось рассчитать атрибуты');
                return;
            }

            const values = results.map(r => r.value);
            const minValue = Math.min(...values);
            const maxValue = Math.max(...values);
            setMinAttributeValue(minValue);
            setMaxAttributeValue(maxValue);

            const bounds = getSlabBounds(results);
            const { matrix, xValues, yValues } = interpolatePoints(results, bounds, interpPointsX, interpPointsY);

            if (matrix.length === 0) {
                bus.emit('error', 'Ошибка интерполяции данных');
                return;
            }

            setHeatmapData({ matrix, xValues, yValues, minValue, maxValue, points: results });
            setTimeout(() => drawHeatmap(matrix, xValues, yValues, minValue, maxValue, results), 100);
            bus.emit('success', 'Тепловая карта построена');

        } catch (err) {
            bus.emit('error', 'Не удалось рассчитать атрибуты для плиты');
        } finally {
            setIsCalculating(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="error" gutterBottom>{error}</Typography>
                    <Button variant="contained" onClick={() => navigate('/')}>Вернуться на главную</Button>
                </Paper>
            </Container>
        );
    }

    const tracesCount = originalTraces.length || 1;
    const isPile = elementType === 'pile';
    const isSlab = elementType === 'slab';

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Box mb={3}>
                    <Breadcrumbs>
                        <Link color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>Главная</Link>
                        <Typography color="textPrimary">Файл: {fileData?.fileName}</Typography>
                    </Breadcrumbs>
                </Box>

                <FileHeader
                    fileName={fileData?.fileName}
                    elementType={elementType}
                    onResetAll={handleResetAll}
                    onExportGraph={handleExportGraph}
                    onClearMarkers={handleClearMarkers}
                />

                <FileInfoCards
                    file={fileData}
                    samplesCount={samplesCount}
                    intervalUs={intervalUs}
                    tracesCount={tracesCount}
                    elementType={elementType}
                />

                {isPile && (
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        <PileAnalysis
                            startMarker={startMarker}
                            setStartMarker={setStartMarker}
                            endMarker={endMarker}
                            setEndMarker={setEndMarker}
                            waveSpeed={waveSpeed}
                            setWaveSpeed={setWaveSpeed}
                            pileLength={pileLength}
                            setPileLength={setPileLength}
                            markerMode={markerMode}
                            setMarkerMode={setMarkerMode}
                            onCalculateLength={handleCalculateLength}
                            onCalculateSpeed={handleCalculateSpeed}
                        />
                    </Grid>
                )}

                {isSlab && (
                    <SlabAnalysis
                        pointsCoords={pointsCoords}
                        interpPointsX={interpPointsX}
                        setInterpPointsX={setInterpPointsX}
                        interpPointsY={interpPointsY}
                        setInterpPointsY={setInterpPointsY}
                        attributeType={attributeType}
                        setAttributeType={setAttributeType}
                        onCalculate={calculateAttributesForPoints}
                        heatmapData={heatmapData}
                        showLegend={showLegend}
                        setShowLegend={setShowLegend}
                        minAttributeValue={minAttributeValue}
                        maxAttributeValue={maxAttributeValue}
                        isCalculating={isCalculating}
                    />
                )}

                {isSlab && heatmapData && (
                    <Paper sx={{ p: 2, mt: 3, bgcolor: '#fafafa', textAlign: 'center' }}>
                        <Typography variant="subtitle2" gutterBottom>Тепловая карта состояния плиты</Typography>
                        <canvas
                            ref={canvasRef}
                            width={500}
                            height={500}
                            style={{
                                width: '100%',
                                maxWidth: 500,
                                height: 'auto',
                                border: '1px solid #ccc',
                                margin: '0 auto',
                                display: 'block'
                            }}
                        />
                    </Paper>
                )}

                {isPile && (
                    <SignalProcessing
                        gainValue={gainValue}
                        setGainValue={setGainValue}
                        correctionValue={correctionValue}
                        setCorrectionValue={setCorrectionValue}
                        showGrid={showGrid}
                        setShowGrid={setShowGrid}
                        onApplyGain={handleApplyGain}
                        onApplyCorrection={handleApplyCorrection}
                        onApplyDcRemoval={handleApplyDcRemoval}
                        onApplyStaticCorrection={handleApplyStaticCorrection}
                        onResetProcessing={handleResetProcessing}
                        isDcRemoval={isDcRemoval}
                        isStaticCorrection={isStaticCorrection}
                    />
                )}

                <SignalChart
                    plotRef={plotRef}
                    graphData={graphData}
                    graphLayout={graphLayout}
                    onPlotClick={handlePlotClick}
                    isLoading={loading}
                />

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    💡 {isPile ? 'Кликните по графику, чтобы установить маркер' : isSlab ? 'Выберите атрибут и нажмите "Построить карту"' : 'Загрузите файл для анализа'}
                </Typography>
            </Paper>
        </Container>
    );
}
