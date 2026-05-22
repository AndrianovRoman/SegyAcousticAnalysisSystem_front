

// Преобразование данных в узел дерева
export const createTreeNode = (item, typeLevel, nameField, additionalFields = {}) => {
    return {
        ...item,
        ...additionalFields,
        typeLevel,
        name: item[nameField],
        children: []
    };
};

// Загрузка детей для разных типов узлов
export const loadChildrenByType = async (api, node, typeConfig) => {
    const config = typeConfig[node.typeLevel];
    if (!config) return [];

    try {
        const response = await api.get(config.endpoint(node.id));
        return response.data.map(item => createTreeNode(
            item,
            config.childType,
            config.nameField
        ));
    } catch (error) {
        console.error(`Error loading ${node.typeLevel}:`, error);
        throw error;
    }
};

// Обновление узла в дереве
export const updateNodeInTree = (nodes, nodeId, nodeType, updates) => {
    return nodes.map(node => {
        if (node.id === nodeId && node.typeLevel === nodeType) {
            return { ...node, ...updates };
        }
        if (node.children?.length) {
            return { ...node, children: updateNodeInTree(node.children, nodeId, nodeType, updates) };
        }
        return node;
    });
};

// Добавление дочернего узла
export const addChildToNodeInTree = (nodes, parentId, parentType, newChild) => {
    return nodes.map(node => {
        if (node.id === parentId && node.typeLevel === parentType) {
            return { ...node, children: [...(node.children || []), newChild] };
        }
        if (node.children?.length) {
            return { ...node, children: addChildToNodeInTree(node.children, parentId, parentType, newChild) };
        }
        return node;
    });
};

// Удаление узла из дерева
export const deleteNodeFromTree = (nodes, nodeId, nodeType) => {
    return nodes.filter(node => {
        if (node.id === nodeId && node.typeLevel === nodeType) {
            return false;
        }
        if (node.children?.length) {
            node.children = deleteNodeFromTree(node.children, nodeId, nodeType);
        }
        return true;
    });
};

// Замена детей узла
export const replaceNodeChildren = (nodes, parentId, parentType, newChildren) => {
    return nodes.map(node => {
        if (node.id === parentId && node.typeLevel === parentType) {
            return { ...node, children: newChildren };
        }
        if (node.children?.length) {
            return { ...node, children: replaceNodeChildren(node.children, parentId, parentType, newChildren) };
        }
        return node;
    });
};