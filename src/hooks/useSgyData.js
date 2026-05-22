import { useState, useEffect } from 'react';
import api from '../api/axios';
import { generateTestData } from '../utils/sgyUtils';

export const useSgyData = (fileId, pointId) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [file, setFile] = useState(null);
    const [sgyData, setSgyData] = useState(null);
    const [elementType, setElementType] = useState(null);
    const [elementId, setElementId] = useState(null);
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

                // Получаем elementId из файла или из точки
                if (fileData.elementId) {
                    setElementId(fileData.elementId);
                } else {
                    // Пытаемся получить через точку
                    try {
                        // Получаем элемент по точке (нужно знать elementId)
                        // Если у тебя нет такого эндпоинта, нужно передавать elementId через state
                        console.log('elementId не найден в файле');
                    } catch (err) {
                        console.error('Ошибка получения elementId:', err);
                    }
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

                if (parseData.traces && parseData.traces.length > 0) {
                    const trace = parseData.traces[0];

                    if (trace.samples && trace.samples.length > 0) {
                        traces = [trace.samples];
                        maxAmp = Math.max(...trace.samples.map(Math.abs));
                    } else if (trace.samplePreview && trace.samplePreview.length > 0) {
                        traces = [trace.samplePreview];
                        maxAmp = Math.max(...trace.samplePreview.map(Math.abs));
                    } else {
                        const testData = generateTestData(samples, interval);
                        traces = [testData];
                        maxAmp = Math.max(...testData.map(Math.abs));
                    }
                } else {
                    const testData = generateTestData(samples, interval);
                    traces = [testData];
                    maxAmp = Math.max(...testData.map(Math.abs));
                }

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