const initialState = {
    editId: null,
    assignId: null,
    editMode: false,
    ee: null,
    inSaveMode: false,
};

const transcriptionReducers = (state = initialState, { type, payload }) => {
    switch (type) {
        case 'ENABLE_EDIT_MODE':
            state = { ...state, editMode: true };
            break;
        case 'DISABLE_EDIT_MODE':
            state = { ...state, editMode: false };
            break;
        case 'SET_TRANSCRIPTION_ID_FOR_EDIT':
            state = { ...state, editId: payload };
            break;
        case 'SET_TRANSCRIPTION_ID_FOR_ASSIGN':
            state = { ...state, assignId: payload };
            break;
        case 'SAVE_EVENT_EMITTER':
            state = { ...state, ee: payload };
            break;
        case 'IN_SAVE_MODE':
            state = { ...state, inSaveMode: payload };
            break;
        default:
            return state;
    }
    return state;
};

export default transcriptionReducers;
