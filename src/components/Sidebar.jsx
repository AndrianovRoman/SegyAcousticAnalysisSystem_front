import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {Button, Divider, Drawer, List, ListItem, ListItemText, CircularProgress} from "@mui/material";
import { useAuth } from '../context/AuthContext';
import { useBus, useListener } from 'react-bus';
import api from "../api/axios";

// Icons
import AddHomeIcon from '@mui/icons-material/AddHome';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import TreeViewItem from './TreeViewItem';
import {useNavigate} from "react-router-dom";

export default function Sidebar(props) {
    const drawerWidth = props.width;
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(false);

    const bus = useBus();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const hasFetched = useRef(false);

    // Загрузка только объектов (корневой уровень)
    const fetchObjects = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/objects/my');

            const objectsWithChildren = response.data.map(item => ({
                ...item,
                typeLevel: 'object',
                name: item.objectName,
                children: []
            }));

            setTreeData(objectsWithChildren);
        } catch (err) {
            console.error('Ошибка загрузки объектов:', err);
            bus.emit('error', 'Не удалось загрузить список объектов');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchObjects();
        }
    }, []);

    // Универсальная функция загрузки детей в зависимости от типа узла
    const loadChildrenForNode = async (node) => {
        try {
            let response;

            switch (node.typeLevel) {
                case 'object':
                    response = await api.get(`/api/objects/${node.id}/elements`);
                    return response.data.map(el => ({
                        ...el,
                        typeLevel: 'element',
                        name: el.elementName,
                        children: []
                    }));

                case 'element':
                    response = await api.get(`/api/elements/${node.id}/points`);
                    return response.data.map(point => ({
                        ...point,
                        typeLevel: 'point',
                        name: point.pointName,
                        children: [],
                        elementId: node.id,
                        elementType: node.type,
                        elementGeometryData: node.geometryData
                    }));

                case 'point':
                    response = await api.get(`/api/points/${node.id}/files`);
                    return response.data.map(file => ({
                        ...file,
                        typeLevel: 'file',
                        name: file.fileName,
                        children: [],
                        elementId: node.elementId,
                        elementType: node.elementType,
                        elementGeometryData: node.elementGeometryData
                    }));

                default:
                    return [];
            }
        } catch (error) {
            console.error(`Error loading children for ${node.typeLevel}:`, error);
            bus.emit('error', `Не удалось загрузить данные`);
            return [];
        }
    };

    // Функция обновления узла (добавление детей)
    const handleUpdateNode = (parent, newChildren) => {
        setTreeData(prevTree => {
            const updateNodeRecursive = (nodes) => {
                return nodes.map(node => {
                    if (node.id === parent.id && node.typeLevel === parent.typeLevel) {
                        return {
                            ...node,
                            children: newChildren
                        };
                    }
                    if (node.children && node.children.length > 0) {
                        return {
                            ...node,
                            children: updateNodeRecursive(node.children)
                        };
                    }
                    return node;
                });
            };

            return updateNodeRecursive(prevTree);
        });
    };

    // Универсальное добавление дочернего узла
    const addChildToNode = (parentId, parentType, newChild) => {
        const addChild = (nodes) => {
            return nodes.map(node => {
                if (node.id === parentId && node.typeLevel === parentType) {
                    return {
                        ...node,
                        children: [...(node.children || []), newChild]
                    };
                }
                if (node.children && node.children.length > 0) {
                    return { ...node, children: addChild(node.children) };
                }
                return node;
            });
        };
        setTreeData(prev => addChild(prev));
    };

    // Универсальное обновление узла
    const updateNode = (updatedNode) => {
        const updateNodeInTree = (nodes) => {
            return nodes.map(node => {
                if (node.id === updatedNode.id && node.typeLevel === updatedNode.typeLevel) {
                    return { ...node, ...updatedNode, name: updatedNode.name };
                }
                if (node.children && node.children.length > 0) {
                    return { ...node, children: updateNodeInTree(node.children) };
                }
                return node;
            });
        };
        setTreeData(prev => updateNodeInTree(prev));
    };

    // Универсальное удаление узла из родителя
    const deleteChildFromParent = (parentId, parentType, childId) => {
        const deleteFromParent = (nodes) => {
            return nodes.map(node => {
                if (node.id === parentId && node.typeLevel === parentType) {
                    return {
                        ...node,
                        children: (node.children || []).filter(child => child.id !== childId)
                    };
                }
                if (node.children && node.children.length > 0) {
                    return { ...node, children: deleteFromParent(node.children) };
                }
                return node;
            });
        };
        setTreeData(prev => deleteFromParent(prev));
    };

    // ============= Объединенные обработчики через фабрику =============

    // Фабрика для создания обработчиков CRUD операций
    const createEntityHandlers = (config) => {
        return {
            onAdded: (newItem) => {

                // Добавляем нового ребенка в дерево без перезагрузки
                const newChild = {
                    ...newItem,
                    typeLevel: config.childType,
                    name: newItem[config.nameField],
                    children: []
                };

                // Добавляем ребенка к родителю
                addChildToNode(newItem[config.parentIdField], config.parentType, newChild);
                bus.emit('success', `${config.successMessage} "${newItem[config.nameField]}" успешно добавлен`);
            },

            onUpdated: (updatedItem) => {
                updateNode({
                    ...updatedItem,
                    typeLevel: config.type,
                    name: updatedItem[config.nameField]
                });
            },

            onDeleted: ({ id, ...rest }) => {
                const parentId = rest[config.parentIdField];
                deleteChildFromParent(parentId, config.parentType, id);
            }
        };
    };

    // Конфигурация для разных типов сущностей
    const entityConfigs = {
        element: {
            type: 'element',
            parentType: 'object',
            childType: 'element',
            parentIdField: 'objectId',
            nameField: 'elementName',
            refreshEndpoint: (item) => `/api/objects/${item.objectId}/elements`,
            successMessage: 'Элемент'
        },
        point: {
            type: 'point',
            parentType: 'element',
            childType: 'point',
            parentIdField: 'elementId',
            nameField: 'pointName',
            refreshEndpoint: (item) => `/api/elements/${item.elementId}/points`,
            successMessage: 'Точка'
        },
        file: {
            type: 'file',
            parentType: 'point',
            childType: 'file',
            parentIdField: 'pointId',
            nameField: 'fileName',
            refreshEndpoint: (item) => `/api/points/${item.pointId}/files`,
            successMessage: 'Файл'
        }
    };

    // Создаем обработчики для каждого типа
    const elementHandlers = createEntityHandlers(entityConfigs.element);
    const pointHandlers = createEntityHandlers(entityConfigs.point);
    const fileHandlers = createEntityHandlers(entityConfigs.file);

    // ============= Регистрация слушателей =============

    // Объекты (простые, без фабрики)
    useListener('objectAdded', (newObject) => {
        const objectNode = {
            ...newObject,
            typeLevel: 'object',
            name: newObject.objectName,
            children: []
        };
        setTreeData(prev => [...prev, objectNode]);
    });

    useListener('objectUpdated', (updatedObject) => {
        updateNode({
            ...updatedObject,
            typeLevel: 'object',
            name: updatedObject.objectName
        });
    });

    useListener('objectDeleted', (deletedObjectId) => {
        setTreeData(prev => prev.filter(obj => obj.id !== deletedObjectId.id));
    });

    // Элементы
    useListener('elementAdded', elementHandlers.onAdded);
    useListener('elementUpdated', elementHandlers.onUpdated);
    useListener('elementDeleted', elementHandlers.onDeleted);

    // Точки
    useListener('pointAdded', pointHandlers.onAdded);
    useListener('pointUpdated', pointHandlers.onUpdated);
    useListener('pointDeleted', pointHandlers.onDeleted);

    // Файлы
    useListener('fileAdded', fileHandlers.onAdded);
    useListener('fileDeleted', fileHandlers.onDeleted);

    // ============= Общие обработчики =============
    const addClick = () => {
        bus.emit('openAddObjectModal');
    };

    const handleEdit = (item) => {
        if (item.typeLevel === 'object') {
            bus.emit('openEditObjectModal', item);
        } else if (item.typeLevel === 'element') {
            bus.emit('openEditElementModal', item);
        } else if (item.typeLevel === 'point') {
            bus.emit('openEditPointModal', item);
        }
    };

    const handleDelete = (item) => {
        const config = {
            title: `Удаление ${item.typeLevel}`,
            message: `Вы действительно хотите удалить ${item.typeLevel} "${item.name}"?`,
            onConfirm: async () => {
                let endpoint = '';
                switch (item.typeLevel) {
                    case 'object':
                        endpoint = `/api/objects/${item.id}`;
                        break;
                    case 'element':
                        endpoint = `/api/objects/${item.objectId}/elements/${item.id}`;
                        break;
                    case 'point':
                        endpoint = `/api/elements/${item.elementId}/points/${item.id}`;
                        break;
                    case 'file':
                        endpoint = `/api/points/${item.pointId}/files/${item.id}`;
                        break;
                }

                await api.delete(endpoint);

                const eventName = `${item.typeLevel}Deleted`;
                const eventData = { id: item.id };

                if (item.typeLevel === 'element') {
                    eventData.objectId = item.objectId;
                } else if (item.typeLevel === 'point') {
                    eventData.elementId = item.elementId;
                } else if (item.typeLevel === 'file') {
                    eventData.pointId = item.pointId;
                }

                bus.emit(eventName, eventData);
                bus.emit('success', `${item.typeLevel} "${item.name}" удален`);
            }
        };
        bus.emit('confirmDelete', config);
    };

    const handleAddChild = (parent, childType) => {
        const modals = {
            element: 'openAddElementModal',
            point: 'openAddPointModal',
            file: 'openAddFileModal'
        };
        const modalEvent = modals[childType];
        if (modalEvent) {
            bus.emit(modalEvent, {
                parentId: parent.id,
                parentName: parent.name,
                parentType: parent.typeLevel
            });
        }
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                style: { paddingRight: '10px' },
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                    width: drawerWidth,
                    boxSizing: "border-box",
                },
            }}
        >
            <h2 style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>Segy Acoustic Analysis System</h2>

            <Divider />

            <List>
                {loading ? (
                    <ListItem>
                        <CircularProgress size={24} style={{ margin: '10px auto' }} />
                    </ListItem>
                ) : (
                    treeData.map((node) => (
                        <TreeViewItem
                            key={`${node.typeLevel}_${node.id}`}
                            item={node}
                            level={0}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onAddChild={handleAddChild}
                            onChildrenLoaded={loadChildrenForNode}
                            onUpdateNode={handleUpdateNode}
                        />
                    ))
                )}
            </List>

            <Button
                variant="outlined"
                startIcon={<AddHomeIcon />}
                style={{ margin: "10px auto", display: "flex", width: "90%" }}
                onClick={addClick}
            >
                Добавить объект
            </Button>

            <Divider />

            <List style={{ marginTop: 'auto' }}>
                <ListItem>
                    <ListItemText
                        primary={user?.userName || user?.name || 'Пользователь'}
                        secondary={user?.email}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<PersonIcon />}
                        onClick={() => {bus.emit('openProfileModal')}}
                    >
                        Профиль
                    </Button>
                </ListItem>
                <ListItem>
                    <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<LogoutIcon />}
                        onClick={logout}
                    >
                        Выход
                    </Button>
                </ListItem>
            </List>
        </Drawer>
    );
}
