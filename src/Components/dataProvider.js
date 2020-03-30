const axios = require('axios');
const apiUrl = `${process.env.REACT_APP_API_HOST}/api`;
const token = localStorage.getItem('token');
const defaultOptions = {
    mode: 'cors',
};
const defaultHeaders = {
    Authorization: `Bearer ${token}`,
};

export default {
    auth: (resource, params) => {
        return new Promise((resolve, reject) => {
            axios({
                method: 'POST',
                url: `${apiUrl}/auth/${resource}`,
                headers: {
                    ...params.headers,
                },
                ...defaultOptions,
                ...params.options,
            })
                .then(response => {
                    return {
                        status: response.status,
                        statusText: response.statusText,
                        data: response.data,
                    };
                })
                .then(({ status, statusText, data }) => {
                    return resolve({ status, data });
                })
                .catch(_ => {
                    return resolve({ status: 'error' });
                });
        });
    },
    speech: {
        getList: params => {
            // `${process.env.REACT_APP_API_HOST}/api/speech` (ListTranscription.js)
        },
        getOne: params => {
            // `${process.env.REACT_APP_API_HOST}/api/speech/${transcriptionId}` (Editor.js)
        },
        export: params => {
            // `${process.env.REACT_APP_API_HOST}/api/speech/${props._id}/export` (Card.js)
            // `${process.env.REACT_APP_API_HOST}/api/speech/${transcriptionId}/export` (Editor.js)
        },
        delete: (resource, params) => {
            // `${process.env.REACT_APP_API_HOST}/api/speech/${transcriptionId}` (ListTranscription.js)
        },
        transcripts: {
            create: (resource, params) => {
                // `${process.env.REACT_APP_API_HOST}/api/speech/${props._id}/transcripts/revert` (Playlist.js)
                // `${process.env.REACT_APP_API_HOST}/api/speech/${props._id}/transcripts/delete` (Playlist.js)
            },
            update: params => {
                // `${process.env.REACT_APP_API_HOST}/api/speech/${props._id}/transcripts` (Playlist.js)
            },
        },
    },
};
