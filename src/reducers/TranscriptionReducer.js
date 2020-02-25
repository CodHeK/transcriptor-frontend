const transcriptionReducers = (state = { editId: null, assignId: null, editMode: false }, { type, payload }) => {
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
        default:
            return state;
    }
    return state;
};

export default transcriptionReducers;
