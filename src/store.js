import { applyMiddleware, createStore, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { createPromise } from 'redux-promise-middleware';
import transcriptionReducers from './reducers/TranscriptionReducer';
import socketMiddleWare from './middlewares/sockets';

const rootReducer = combineReducers({
    TRANSCRIPTION: transcriptionReducers,
});

const middlewares = [createPromise(), createLogger(), thunk, socketMiddleWare()];

export default createStore(rootReducer, applyMiddleware(...middlewares));
