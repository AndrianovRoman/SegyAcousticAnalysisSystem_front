
import fft from 'fft-js';

// Генерация тестовых данных
export const generateTestData = (samplesCount, intervalUs) => {
    const amplitudes = new Array(samplesCount);
    for (let i = 0; i < samplesCount; i++) {
        const t = i * intervalUs / 1000000;

        let impact = 0;
        if (t < 0.002) {
            impact = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 800) * 1.2;
        }

        let reflection = 0;
        if (t > 0.004 && t < 0.006) {
            const reflectionTime = t - 0.0045;
            reflection = Math.sin(2 * Math.PI * 300 * reflectionTime) * 0.6 * Math.exp(-reflectionTime * 400);
        }

        let secondary = 0;
        if (t > 0.008 && t < 0.01) {
            const secTime = t - 0.0085;
            secondary = Math.sin(2 * Math.PI * 200 * secTime) * 0.25 * Math.exp(-secTime * 300);
        }

        const lowFreqNoise = Math.sin(2 * Math.PI * 50 * t) * 0.03;
        const randomNoise = (Math.random() - 0.5) * 0.02;

        amplitudes[i] = impact + reflection + secondary + lowFreqNoise + randomNoise;
    }
    return amplitudes;
};

// Построение данных для графика
export const buildChartData = (traces, timeAxis, maxAmplitude, isGainApplied, gainValue, isCorrectionApplied, correctionValue) => {
    const colors = ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0'];

    return traces.map((trace, idx) => {
        let normalizedY;
        if (isGainApplied && gainValue !== 1) {
            normalizedY = trace.map(value => ((value / maxAmplitude) * gainValue) + idx + 1);
        } else if (isCorrectionApplied && correctionValue > 0) {
            const avg = trace.reduce((a, b) => a + b, 0) / trace.length;
            normalizedY = trace.map((value, j) => {
                const gain = Math.exp(timeAxis[j] * correctionValue);
                return ((value - avg) * gain / maxAmplitude) + idx + 1;
            });
        } else {
            normalizedY = trace.map(value => (value / maxAmplitude) + idx + 1);
        }

        return {
            name: `Трасса ${idx + 1}`,
            x: timeAxis,
            y: normalizedY,
            type: 'scatter',
            mode: 'lines',
            line: { color: colors[idx % colors.length], width: 1.5 },
            hovertemplate: 'Время: %{x:.6f} с<br>Амплитуда: %{y:.3f}<extra></extra>'
        };
    });
};

// Создание layout для графика
export const buildChartLayout = (fileName, startMarker, endMarker, showGrid, timeRange, tracesCount, pileLength) => {
    const shapes = [];

    if (startMarker !== null) {
        shapes.push({
            type: 'line',
            x0: startMarker, x1: startMarker,
            y0: 0, y1: tracesCount + 1,
            line: { color: '#4caf50', width: 2.5, dash: 'dash' }
        });
    }

    if (endMarker !== null) {
        shapes.push({
            type: 'line',
            x0: endMarker, x1: endMarker,
            y0: 0, y1: tracesCount + 1,
            line: { color: '#f44336', width: 2.5, dash: 'dash' }
        });
    }

    const annotations = [];

    if (startMarker !== null) {
        annotations.push({
            x: startMarker,
            y: tracesCount + 0.5,
            xref: 'x',
            yref: 'y',
            text: `Начало: ${startMarker.toFixed(4)} с`,
            showarrow: true,
            arrowhead: 1,
            ax: 0,
            ay: -30,
            bgcolor: '#4caf50',
            font: { color: 'white', size: 10 }
        });
    }

    if (endMarker !== null) {
        annotations.push({
            x: endMarker,
            y: tracesCount + 0.5,
            xref: 'x',
            yref: 'y',
            text: `Конец: ${endMarker.toFixed(4)} с`,
            showarrow: true,
            arrowhead: 1,
            ax: 0,
            ay: -30,
            bgcolor: '#f44336',
            font: { color: 'white', size: 10 }
        });
    }

    return {
        title: {
            text: `${fileName}${pileLength > 0 ? ` (длина: ${pileLength.toFixed(2)} м)` : ''}`,
            font: { size: 16 }
        },
        xaxis: {
            title: { text: 'Время (с)', font: { size: 12 } },
            gridcolor: showGrid ? '#e0e0e0' : 'white',
            showgrid: showGrid,
            range: timeRange
        },
        yaxis: {
            title: { text: 'Номер трассы / Смещение', font: { size: 12 } },
            tickvals: Array.from({ length: tracesCount }, (_, i) => i + 1),
            ticktext: Array.from({ length: tracesCount }, (_, i) => `Трасса ${i + 1}`),
            range: [0, tracesCount + 1],
            gridcolor: showGrid ? '#e0e0e0' : 'white',
            showgrid: showGrid
        },
        hovermode: 'closest',
        margin: { l: 65, r: 50, t: 60, b: 50 },
        autosize: true,
        shapes: shapes,
        annotations: annotations
    };
};

// Расчет длины сваи
export const calculatePileLength = (startMarker, endMarker, waveSpeed) => {
    if (startMarker === null || endMarker === null) return 0;
    const deltaTime = endMarker - startMarker;
    if (deltaTime <= 0) return 0;
    return (deltaTime * waveSpeed) / 2;
};

// Расчет скорости волны
export const calculateWaveSpeed = (startMarker, endMarker, pileLength) => {
    if (startMarker === null || endMarker === null || pileLength <= 0) return 0;
    const deltaTime = endMarker - startMarker;
    if (deltaTime <= 0) return 0;
    return (2 * pileLength) / deltaTime;
};