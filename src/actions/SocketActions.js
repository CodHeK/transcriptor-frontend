export const authenticateSocketConnection = () => {
    return {
        type: 'WS_CONNECT',
    };
};

export const socketDataUpdated = data => {
    return {
        type: 'WS_DATA_UPDATED',
        payload: data,
    };
};
