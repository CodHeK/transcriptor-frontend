import { applyMiddleware, createStore, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { createPromise } from 'redux-promise-middleware';
import transcriptionReducers from './reducers/TranscriptionReducer';
import socketReducers from './reducers/SocketReducer';

/* 
    Custom middleware for handling sockets
*/
import socketMiddleWare from './middleware/sockets';

const rootReducer = combineReducers({
    TRANSCRIPTION: transcriptionReducers,
    SOCKET: socketReducers,
});

let middlewares = [createPromise(), thunk, socketMiddleWare(), createLogger()];

middlewares = `${process.env.NODE_ENV}` === 'development' ? [...middlewares] : middlewares;

export default createStore(rootReducer, applyMiddleware(...middlewares));
