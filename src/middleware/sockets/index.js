import io from 'socket.io-client';
import { socketDataUpdated, socketConnectionAuthenticated } from '../../actions/SocketActions';

const socketMiddleware = () => {
    return store => {
        const socket = io(`${process.env.REACT_APP_API_HOST}`, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
        });

        socket.on('connect', data => {
            console.log('Socket connected!');
        });

        socket.on('unauthenticated', data => {
            console.log('Socket authentication failed!');
        });

        socket.on('authenticated', data => {
            console.log('Socket authenticated successfully!');

            socket.emit('join room');
        });

        socket.on('status updated', data => {
            /* 
                Only send the important info from data
            */
            const { _id, content } = { ...data.speech, ...data.status };
            store.dispatch(socketDataUpdated({ _id, content }));
        });

        const authenticateSocket = () => {
            socket.emit('authenticate', {
                token: localStorage.getItem('token'),
            });
            store.dispatch(socketConnectionAuthenticated());
        };

        return next => action => {
            switch (action.type) {
                case 'REQUEST_SOCKET_AUTHENTICATION':
                    authenticateSocket();
                    break;
                default:
                    next(action);
            }
        };
    };
};

export default socketMiddleware;
