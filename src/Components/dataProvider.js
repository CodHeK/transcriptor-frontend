const axios = require('axios');
const apiUrl = `${process.env.REACT_APP_API_HOST}/api`;
const defaultOptions = {
    mode: 'cors',
};

const statusOK = status => status === 200 || status === 304;

export default {
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
            return { success: false, status: 'error' };
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
                    console.log(res);
                    return res;
                }
            } catch (e) {
                alert("Couldn't GET resource!");
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
                alert("Couldn't GET resource!");
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
                alert("Couldn't DELETE resource!");
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
                    alert("Couldn't CREATE resource!");
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
                    alert("Couldn't PUT resource!");
                }
            },
        },
    },
};
