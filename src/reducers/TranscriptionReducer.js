const initialState = {
    transcriptionId: null,
    editId: null,
    assignId: null,
    editMode: false,
    ee: null,
    inSaveMode: false,
    sentenceId: null,
    toast: null,
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
        case 'TOGGLE_SAVE_MODE':
            state = { ...state, inSaveMode: payload };
            break;
        case 'DELETE_TRANSCRIPTION':
            state = { ...state, transcriptionId: payload };
            break;
        case 'SET_TRANSCRIPTION_ID':
            state = { ...state, transcriptionId: payload };
            break;
        case 'DELETE_SENTENCE':
            state = { ...state, sentenceId: payload };
            break;
        case 'SET_SENTENCE_ID':
            state = { ...state, sentenceId: payload };
            break;
        case 'ADD_TOAST':
            state = { ...state, toast: payload };
            break;
        default:
            return state;
    }
    return state;
};

export default transcriptionReducers;
