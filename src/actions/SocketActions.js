export const socketConnectionAuthenticated = () => {
    return {
        type: 'SOCKET_CONNECTED',
    };
};

/* 
    used only in the socket middleware
*/
export const requestSocketAuthentication = () => {
    return {
        type: 'REQUEST_SOCKET_AUTHENTICATION',
    };
};

export const socketDataUpdated = data => {
    return {
        type: 'SOCKET_STATUS_UPDATED',
        payload: data,
    };
};
