const socketReducers = (state = { connected: false, statusData: null }, { type, payload }) => {
    switch (type) {
        case 'SOCKET_CONNECTED':
            state = { ...state, connected: true };
            break;
        case 'SOCKET_STATUS_UPDATED':
            state = { ...state, statusData: payload };
            break;
        default:
            return state;
    }
    return state;
};

export default socketReducers;
