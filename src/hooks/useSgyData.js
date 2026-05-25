import { useState, useEffect } from 'react';
import api from '../api/axios';
import { generateTestData } from '../utils/sgyUtils';

export const useSgyData = (fileId, pointId, elementId) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [file, setFile] = useState(null);
    const [sgyData, setSgyData] = useState(null);
    const [elementType, setElementType] = useState(null);
    const [originalTraces, setOriginalTraces] = useState([]);
    const [timeAxis, setTimeAxis] = useState([]);
    const [maxAmplitude, setMaxAmplitude] = useState(1);
    const [samplesCount, setSamplesCount] = useState(0);
    const [intervalUs, setIntervalUs] = useState(0);
    const [waveSpeed, setWaveSpeed] = useState(4000);

    useEffect(() => {
        const fetchData = async () => {
            if (!pointId || !fileId) return;

            setLoading(true);
            try {
                // Загружаем информацию о файле
                const fileResponse = await api.get(`/api/points/${pointId}/files/${fileId}`);
                const fileData = fileResponse.data;
                setFile(fileData);

                if (fileData.elementType) {
                    setElementType(fileData.elementType);
                }

                // Парсим SGY данные
                const parseRes = await api.post(`/api/points/${pointId}/files/${fileId}/parse?includeSamples=true`);
                const parseData = parseRes.data;
                setSgyData(parseData);

                const samples = parseData.binaryHeader?.samplesPerTrace || 2048;
                const interval = parseData.binaryHeader?.sampleIntervalMicroseconds || 31;
                setSamplesCount(samples);
                setIntervalUs(interval);

                const time = Array.from({ length: samples }, (_, i) => (i * interval) / 1000000);
                setTimeAxis(time);

                let traces = [];
                let maxAmp = 0;

                // ✅ ИСПРАВЛЕНО: Обрабатываем ВСЕ трассы
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
                            // Если амплитуд меньше чем samples, интерполируем
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

                // Если нет данных — генерируем тестовые
                if (traces.length === 0) {
                    const testData = generateTestData(samples, interval);
                    traces = [testData];
                    maxAmp = Math.max(...testData.map(Math.abs));
                }

                console.log(`Загружено трасс: ${traces.length}`);
                setOriginalTraces(traces);
                setMaxAmplitude(maxAmp);

                // Извлекаем скорость волны из текстового заголовка
                const speedMatch = parseData.textHeaderContent?.match(/waveSpeed:\s*(\d+)/);
                if (speedMatch) {
                    setWaveSpeed(parseInt(speedMatch[1]));
                }

            } catch (err) {
                console.error('Ошибка загрузки:', err);
                setError(err.response?.data?.message || 'Не удалось загрузить файл');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fileId, pointId]);

    return {
        loading,
        error,
        file,
        sgyData,
        elementType,
        originalTraces,
        timeAxis,
        maxAmplitude,
        samplesCount,
        intervalUs,
        waveSpeed,
        setWaveSpeed
    };
};