const axios = require('axios');
const apiUrl = `${process.env.REACT_APP_API_HOST}/api`;
const defaultOptions = {
    mode: 'cors',
};

const statusOK = status => status === 200 || status === 304;

export default {
    faker: delay => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve('faked!');
            }, delay);
        });
    },
    auth: async (resource, params) => {
        try {
            const res = await axios({
                method: 'POST',
                url: `${apiUrl}/auth/${resource}`,
                headers: {
                    ...params.headers,
                },
                ...defaultOptions,
                ...params.options,
            });

            if (statusOK(res.status)) {
                return res;
            }
        } catch (e) {
            return Promise.reject(e);
        }
    },
    speech: {
        getList: async (resource, params) => {
            /* resource argument only for definition */
            try {
                const res = await axios({
                    method: 'GET',
                    url: `${apiUrl}/speech`,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        ...params.headers,
                    },
                    ...defaultOptions,
                    ...params.options,
                });

                if (statusOK(res.status)) {
                    return res;
                }
            } catch (e) {
                return Promise.reject(e);
            }
        },
        get: async (resource, params) => {
            try {
                const res = await axios({
                    method: 'GET',
                    url: `${apiUrl}/speech/${params.id}/${resource}`,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        ...params.headers,
                    },
                    ...defaultOptions,
                    ...params.options,
                });

                if (statusOK(res.status)) {
                    return res;
                }
            } catch (e) {
                return Promise.reject(e);
            }
        },
        delete: async (resource, params) => {
            // `${process.env.REACT_APP_API_HOST}/api/speech/${transcriptionId}` (ListTranscription.js) [MODIFY TO /delete]
            try {
                const res = await axios({
                    method: 'DELETE',
                    url: `${apiUrl}/speech/${params.id}/${resource}`,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        ...params.headers,
                    },
                    ...defaultOptions,
                    ...params.options,
                });

                if (statusOK(res.status)) {
                    return res;
                }
            } catch (e) {
                return Promise.reject(e);
            }
        },
        create: async (resource, params) => {
            try {
                const res = await axios({
                    method: 'POST',
                    url: 'id' in params ? `${apiUrl}/speech/${params.id}/${resource}` : `${apiUrl}/speech/${resource}`,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        ...params.headers,
                    },
                    ...defaultOptions,
                    ...params.options,
                });

                if (statusOK(res.status)) {
                    return res;
                }
            } catch (e) {
                return Promise.reject(e);
            }
        },
        transcripts: {
            create: async (resource, params) => {
                try {
                    const res = await axios({
                        method: 'POST',
                        url: `${apiUrl}/speech/${params.id}/transcripts/${resource}`,
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                            ...params.headers,
                        },
                        ...defaultOptions,
                        ...params.options,
                    });

                    if (statusOK(res.status)) {
                        return res;
                    }
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            update: async (resource, params) => {
                try {
                    const res = await axios({
                        method: 'PUT',
                        url: `${apiUrl}/speech/${params.id}/transcripts/${resource}`,
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                            ...params.headers,
                        },
                        ...defaultOptions,
                        ...params.options,
                    });

                    if (statusOK(res.status)) {
                        return res;
                    }
                } catch (e) {
                    return Promise.reject(e);
                }
            },
        },
    },
};
