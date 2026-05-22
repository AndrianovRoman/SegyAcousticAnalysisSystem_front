

export const NODE_TYPES = {
    OBJECT: 'object',
    ELEMENT: 'element',
    POINT: 'point',
    FILE: 'file'
};

export const CHILD_TYPES = {
    [NODE_TYPES.OBJECT]: NODE_TYPES.ELEMENT,
    [NODE_TYPES.ELEMENT]: NODE_TYPES.POINT,
    [NODE_TYPES.POINT]: NODE_TYPES.FILE,
    [NODE_TYPES.FILE]: null
};

export const NAME_FIELDS = {
    [NODE_TYPES.OBJECT]: 'objectName',
    [NODE_TYPES.ELEMENT]: 'elementName',
    [NODE_TYPES.POINT]: 'pointName',
    [NODE_TYPES.FILE]: 'fileName'
};

export const ENDPOINTS = {
    [NODE_TYPES.OBJECT]: (id) => `/api/objects/${id}/elements`,
    [NODE_TYPES.ELEMENT]: (id) => `/api/elements/${id}/points`,
    [NODE_TYPES.POINT]: (id) => `/api/points/${id}/files`,
    [NODE_TYPES.FILE]: null
};

export const DELETE_ENDPOINTS = {
    [NODE_TYPES.OBJECT]: (id) => `/api/objects/${id}`,
    [NODE_TYPES.ELEMENT]: (id, parentId) => `/api/objects/${parentId}/elements/${id}`,
    [NODE_TYPES.POINT]: (id, parentId) => `/api/elements/${parentId}/points/${id}`,
    [NODE_TYPES.FILE]: (id, parentId) => `/api/points/${parentId}/files/${id}`
};