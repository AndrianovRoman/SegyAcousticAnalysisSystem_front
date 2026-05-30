import { useState } from 'react';
import {List, ListItemButton, ListItemText, Collapse, CircularProgress, Button} from '@mui/material';
import {
    ExpandLess,
    ExpandMore,
    Home,
    Description,
    Add,
    Edit,
    Delete,
    AlignVerticalBottom,
    Rectangle,
    Circle,
    QuestionMark,
    Share,
    FileDownload
} from '@mui/icons-material';
import { useBus } from 'react-bus';
import {useNavigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext";
import api from "../api/axios";
import SlabPointMap from "./SlabPointMap";

export default function TreeViewItem({item, level = 0, onEdit, onDelete, onAddChild, onChildrenLoaded, onUpdateNode}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const bus = useBus();
    const { user } = useAuth();

    // ✅ Дети берутся напрямую из item (из родительского объекта)
    const children = item.children || [];
    const isSlabElement = item.typeLevel === 'element' && item.type === 'slab';
    const filesCount = Number(item.filesCount ?? item.fileCount ?? 0);
    const pointHasFiles = item.typeLevel === 'point' && (
        children.some(child => child.typeLevel === 'file') ||
        (Array.isArray(item.files) && item.files.length > 0) ||
        filesCount > 0 ||
        item.hasFiles === true
    );
    const hasChildren = children.length > 0;
    const canExpand = hasChildren || isSlabElement;

    // Загрузка дочерних элементов
    const loadNodeChildren = async () => {
        // Если уже есть дети или уже загружаем - выходим
        if (hasChildren || loading) return;

        setLoading(true);
        try {
            const newChildren = await onChildrenLoaded(item);

            // ✅ Обновляем родительский объект, добавляя детей
            if (onUpdateNode && newChildren && newChildren.length > 0) {
                onUpdateNode(item, newChildren);
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            bus.emit('error', `Не удалось загрузить элементы`);
        } finally {
            setLoading(false);
        }
    };

    const handleClick = async () => {
        if (item.typeLevel === 'file') {
            // Переход на страницу с графиком
            navigate(`/file/${item.id}`, {
                state: {
                    pointId: item.pointId,
                    elementId: item.elementId,
                    elementType: item.elementType,
                    elementGeometryData: item.elementGeometryData
                }
            })
            return;
        }
        if (!open) {
            await loadNodeChildren();
        }
        setOpen(!open);
    };

    const getIcon = () => {
        switch (item.typeLevel) {
            case 'object':
                return <Home fontSize="small" />;
            case 'element':
                if (item.type === 'pile') {
                    return <AlignVerticalBottom fontSize="small" />;
                } else if (item.type === 'slab') {
                    return <Rectangle fontSize="small" />;
                }
            case 'point':
                return <Circle fontSize="small" color={pointHasFiles ? 'primary' : 'inherit'} />;
            case 'file':
                return <Description fontSize="small" />;
            default:
                return <QuestionMark fontSize="small" />;
        }
    };

    const getSecondaryText = () => {
        if (item.typeLevel === 'point') {
            return `Файлов загружено: ${filesCount}`;
        }

        if (item.typeLevel !== 'element') return null;

        try {
            const geometry = typeof item.geometryData === 'string'
                ? JSON.parse(item.geometryData)
                : item.geometryData;

            if (!geometry) return null;

            const parts = [];

            if (geometry.length) parts.push(`${geometry.length}м`);
            if (geometry.width) parts.push(`${geometry.width}м`);
            if (geometry.height) parts.push(`${geometry.height}м`);
            if (geometry.diameter) parts.push(`Ø${geometry.diameter}мм`);

            if (parts.length === 0) return null;

            // Специальный формат для сваи (длина + диаметр)
            if (geometry.length && geometry.diameter && !geometry.width && !geometry.height) {
                return `${geometry.length}м, Ø${geometry.diameter}мм`;
            }

            // Специальный формат для плиты (длина × ширина × высота)
            if (geometry.length && geometry.width && geometry.height && !geometry.diameter) {
                return `${geometry.length}×${geometry.width}×${geometry.height}м`;
            }

            return parts.join(', ');

        } catch (e) {
            console.error('Ошибка парсинга geometryData:', e);
            return null;
        }
    };

    const paddingLeft = level * 25 + 5;
    const isObject = item.typeLevel === 'object';

    const isOwner = item.ownerId === user.id;
    const isNotFile = item.typeLevel !== 'file';
    const isPileCanAddChild = !(item.typeLevel === 'element' && item.type === 'pile' && item.children.length >= 1);

    const getChildType = () => {
        switch (item.typeLevel) {
            case 'object': return 'element';
            case 'element': return 'point';
            case 'point': return 'file';
            default: return null;
        }
    };

    const handleSharedObject = (e) => {
        e.stopPropagation();
        bus.emit('openShareObjectModal', item);
    };

    const handleAddChildClick = (e) => {
        e.stopPropagation();
        onAddChild(item, getChildType());
    };

    const handleAddPointFromSlab = ({ x, y }) => {
        bus.emit('openAddPointModal', {
            parentId: item.id,
            parentName: item.name || item.elementName,
            parentType: item.typeLevel,
            pointName: `Точка ${children.length + 1}`,
            x,
            y
        });
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        onEdit(item);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete(item);
    };

    const downloadFile = async (e) => {
        e.stopPropagation();
        try {
            const response = await api.get(`/api/points/${item.pointId}/files/${item.id}/download`, {
                responseType: 'blob' // Важно: указываем, что ожидаем бинарные данные
            });

            // Создаем URL для скачивания
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', item.name || item.fileName || 'file.sgy');
            document.body.appendChild(link);
            link.click();

            // Очищаем
            link.remove();
            window.URL.revokeObjectURL(url);

            bus.emit('success', `Файл "${item.name}" успешно скачан`);
        } catch (err) {
            console.error('Ошибка скачивания файла:', err);
            const errorMessage = err.response?.data?.message || 'Не удалось скачать файл';
            bus.emit('error', errorMessage);
        }
    };

    return (
        <div>
            <ListItemButton
                style={{
                    justifyContent: "space-between",
                    paddingLeft: `${paddingLeft}px`,
                    cursor: canExpand || loading ? 'pointer' : 'default'
                }}
                onClick={handleClick}
            >
                <div style={{ display: "flex", alignItems: "center", width: isObject ? "calc(100% - 210px)" : "calc(100% - 150px)" }}>
                    {getIcon()}
                    <ListItemText
                        primary={item.name || item.elementName || item.objectName}
                        secondary={getSecondaryText()}
                        style={{ marginLeft: "8px" }}
                        secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                    />
                    {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                    {!loading && canExpand && (open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
                </div>

                <div>
                    {isObject && isOwner && (
                        <Button
                            size="small"
                            color="warning"
                            variant="outlined"
                            style={{ marginRight: "5px", minWidth: "unset"  }}
                            onClick={handleSharedObject}
                            title='Поделиться объектом'
                        >
                            <Share fontSize="small" />
                        </Button>
                    )}

                    {isNotFile && isPileCanAddChild && (
                        <Button
                            size="small"
                            color="primary"
                            variant="outlined"
                            style={{ marginRight: "5px", minWidth: "unset"  }}
                            onClick={handleAddChildClick}
                            title={`Добавить ${getChildType()}`}
                        >
                            <Add fontSize="small" />
                        </Button>
                    )}

                    {isNotFile && (
                        <Button
                            size="small"
                            color="success"
                            variant="outlined"
                            style={{ marginRight: "5px", minWidth: "unset"  }}
                            onClick={handleEditClick}
                            title="Редактировать"
                        >
                            <Edit fontSize="small" />
                        </Button>
                    )}

                    {!isNotFile && (
                        <Button
                            size="small"
                            color="info"
                            variant="outlined"
                            style={{ marginRight: "5px", minWidth: "unset"  }}
                            onClick={downloadFile}
                            title="Скачать файл"
                        >
                            <FileDownload fontSize="small" />
                        </Button>
                    )}

                    <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        style={{ marginRight: "5px", minWidth: "unset"  }}
                        onClick={handleDeleteClick}
                        title="Удалить"
                    >
                        <Delete fontSize="small" />
                    </Button>
                </div>
            </ListItemButton>

            <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {isSlabElement && (
                        <SlabPointMap
                            slab={item}
                            points={children}
                            onAddPoint={handleAddPointFromSlab}
                        />
                    )}

                    {children.map((child) => (
                        <TreeViewItem
                            key={`${child.typeLevel}_${child.id}`}
                            item={child}
                            level={level + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                            onChildrenLoaded={onChildrenLoaded}
                            onUpdateNode={onUpdateNode}
                        />
                    ))}
                </List>
            </Collapse>
        </div>
    );
}
