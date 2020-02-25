const socketReducers = (state = { connected: false, statusData: null }, { type, payload }) => {
    switch (type) {
        case 'WS_CONNECT':
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
