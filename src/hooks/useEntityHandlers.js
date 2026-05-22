import { useCallback } from 'react';
import { useBus } from 'react-bus';
import api from '../api/axios';
import { createTreeNode, loadChildrenByType } from '../utils/treeHelpers';
import { ENDPOINTS, NAME_FIELDS } from '../config/nodeTypes';

export const useEntityHandlers = (treeHandlers, loadChildrenFn) => {
    const bus = useBus();

    // Универсальная обработка добавления
    const handleAdd = useCallback(async (newItem, parentId, parentType, childType, nameField) => {
        try {
            const response = await loadChildrenFn({
                id: parentId,
                typeLevel: parentType
            });

            const updatedChildren = response.map(item => createTreeNode(
                item, childType, nameField
            ));

            treeHandlers.replaceChildren(parentId, parentType, updatedChildren);
            bus.emit('success', `Элемент успешно добавлен`);
        } catch (error) {
            console.error('Error refreshing children:', error);
            bus.emit('error', 'Элемент добавлен, но не удалось обновить список');
        }
    }, [treeHandlers, loadChildrenFn, bus]);

    // Универсальная обработка обновления
    const handleUpdate = useCallback((updatedItem, nodeType) => {
        treeHandlers.updateNode(updatedItem.id, nodeType, {
            ...updatedItem,
            name: updatedItem[NAME_FIELDS[nodeType]]
        });
    }, [treeHandlers]);

    // Универсальная обработка удаления
    const handleDelete = useCallback((id, parentId, nodeType) => {
        treeHandlers.deleteNode(id, nodeType);
    }, [treeHandlers]);

    return { handleAdd, handleUpdate, handleDelete };
};