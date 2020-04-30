const initialState = {
    connected: false,
    statusData: null,
    reSpeakData: null,
};

const socketReducers = (state = initialState, { type, payload }) => {
    switch (type) {
        case 'SOCKET_CONNECTED':
            state = { ...state, connected: true };
            break;
        case 'SOCKET_STATUS_UPDATED':
            state = { ...state, statusData: payload };
            break;
        case 'UPDATE_RESPEAK_DATA':
            state = { ...state, reSpeakData: payload };
            break;
        default:
            return state;
    }
    return state;
};

export default socketReducers;
