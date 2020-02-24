import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { createPromise } from 'redux-promise-middleware';
import reducer from './reducers/TranscriptionReducer';

const middleware = applyMiddleware(createPromise(), thunk, createLogger());

export default createStore(reducer, middleware);
