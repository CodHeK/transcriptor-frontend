export const setTranscriptionIdForEdit = _id => {
    return {
        type: 'SET_TRANSCRIPTION_ID_FOR_EDIT',
        payload: _id,
    };
};

export const setTranscriptionIdForAssign = id => {
    return {
        type: 'SET_TRANSCRIPTION_ID_FOR_ASSIGN',
        payload: id,
    };
};

export const saveEventEmitter = ee => {
    return {
        type: 'SAVE_EVENT_EMITTER',
        payload: ee,
    };
};

export const toggleSaveMode = flag => {
    return {
        type: 'TOGGLE_SAVE_MODE',
        payload: flag,
    };
};

export const enableEditMode = () => {
    return {
        type: 'ENABLE_EDIT_MODE',
    };
};

export const disableEditMode = () => {
    return {
        type: 'DISABLE_EDIT_MODE',
    };
};

export const deleteTranscription = transcriptionId => {
    return {
        type: 'DELETE_TRANSCRIPTION',
        payload: transcriptionId,
    };
};

export const setTranscriptionId = transcriptionId => {
    return {
        type: 'SET_TRANSCRIPTION_ID',
        payload: transcriptionId,
    };
};
