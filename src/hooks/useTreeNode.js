

import { useState, useCallback } from 'react';
import api from '../api/axios';

// Маппинг типов для API эндпоинтов
const getChildrenEndpoint = (type) => {
    switch (type) {
        case 'object':
            return (id) => api.get(`/api/objects/${id}/elements`);
        case 'element':
            return (id) => api.get(`/api/elements/${id}/points`);
        case 'point':
            return (id) => api.get(`/api/points/${id}/files`);
        default:
            return null;
    }
};

// Преобразование данных в зависимости от типа
const transformChildren = (type, children) => {
    switch (type) {
        case 'object':
            return children.map(child => ({
                ...child,
                typeLevel: 'element',
                name: child.elementName,
                children: []
            }));
        case 'element':
            return children.map(child => ({
                ...child,
                typeLevel: 'point',
                name: child.pointName,
                children: []
            }));
        case 'point':
            return children.map(child => ({
                ...child,
                typeLevel: 'file',
                name: child.fileName,
                children: []
            }));
        default:
            return children;
    }
};

export const useTreeNode = () => {
    const [loading, setLoading] = useState(false);

    const loadChildren = useCallback(async (node) => {
        const fetchFn = getChildrenEndpoint(node.typeLevel);
        if (!fetchFn) return [];

        setLoading(true);
        try {
            const response = await fetchFn(node.id);
            const transformedChildren = transformChildren(node.typeLevel, response.data);
            return transformedChildren;
        } catch (error) {
            console.error(`Ошибка загрузки ${node.typeLevel}:`, error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return { loadChildren, loading };
};