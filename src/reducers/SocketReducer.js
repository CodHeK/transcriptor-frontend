const socketReducers = (state = { connected: false, statusData: null }, { type, payload }) => {
    console.log('reddd');
    switch (type) {
        case 'SOCKET_CONNECTED':
            state = { ...state, connected: true };
            break;
        case 'WS_DATA_UPDATED':
            state = { ...state, statusData: payload };
            break;
        default:
            return state;
    }
    return state;
};

export default socketReducers;
