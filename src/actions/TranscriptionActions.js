export const setTranscriptionIdForEdit = _id => {
    return {
        type: 'SET_TRANSCRIPTION_ID_FOR_EDIT',
        payload: _id,
    };
};

export const setTranscriptionIdForAssign = _id => {
    return {
        type: 'SET_TRANSCRIPTION_ID_FOR_ASSIGN',
        payload: _id,
    };
};

export const setTranscriptionIdForReSpeak = _id => {
    return {
        type: 'SET_TRANSCRIPTION_ID_FOR_RESPEAK',
        payload: _id,
    };
};

export const addSectionForReSpeak = sentenceId => {
    return {
        type: 'ADD_SECTION_FOR_RESPEAK',
        payload: sentenceId,
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

export const enableReSpeakMode = () => {
    return {
        type: 'ENABLE_RESPEAK_MODE',
    };
};

export const disableReSpeakMode = () => {
    return {
        type: 'DISABLE_RESPEAK_MODE',
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

export const deleteSentence = sentenceId => {
    return {
        type: 'DELETE_SENTENCE',
        payload: sentenceId,
    };
};

export const setSentenceId = sentenceId => {
    return {
        type: 'SET_SENTENCE_ID',
        payload: sentenceId,
    };
};

export const releaseToast = toastProps => {
    return {
        type: 'ADD_TOAST',
        payload: toastProps,
    };
};
