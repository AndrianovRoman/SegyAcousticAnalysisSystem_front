

import { useState, useCallback } from 'react';
import { useBus } from 'react-bus';
import {
    updateNodeInTree,
    addChildToNodeInTree,
    deleteNodeFromTree,
    replaceNodeChildren
} from '../utils/treeHelpers';

export const useTreeData = (initialData = []) => {
    const [treeData, setTreeData] = useState(initialData);
    const bus = useBus();

    const updateNode = useCallback((nodeId, nodeType, updates) => {
        setTreeData(prev => updateNodeInTree(prev, nodeId, nodeType, updates));
    }, []);

    const addChild = useCallback((parentId, parentType, newChild) => {
        setTreeData(prev => addChildToNodeInTree(prev, parentId, parentType, newChild));
    }, []);

    const deleteNode = useCallback((nodeId, nodeType) => {
        setTreeData(prev => deleteNodeFromTree(prev, nodeId, nodeType));
    }, []);

    const replaceChildren = useCallback((parentId, parentType, newChildren) => {
        setTreeData(prev => replaceNodeChildren(prev, parentId, parentType, newChildren));
    }, []);

    const refreshNodeChildren = useCallback(async (parent, loadChildrenFn) => {
        try {
            const newChildren = await loadChildrenFn(parent);
            replaceChildren(parent.id, parent.typeLevel, newChildren);
            return newChildren;
        } catch (error) {
            bus.emit('error', `Не удалось обновить список`);
            return [];
        }
    }, [replaceChildren, bus]);

    return {
        treeData,
        setTreeData,
        updateNode,
        addChild,
        deleteNode,
        replaceChildren,
        refreshNodeChildren
    };
};