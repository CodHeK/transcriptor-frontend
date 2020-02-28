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
