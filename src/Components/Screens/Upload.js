import React from 'react';
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';
import '../styles.css';

/*
  Refer: https://react-dropzone-uploader.js.org/docs/api#getuploadparams
*/

const Upload = () => {
    const getUploadParams = async ({ file, meta }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', 'english');
        const token = localStorage.getItem('token');
        return {
            url: `${process.env.REACT_APP_API_HOST}/api/speech/upload`,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        };
    };

    return (
        <Dropzone
            getUploadParams={getUploadParams}
            accept=".mp3, .wav, .stm"
            inputContent={(_, extra) =>
                extra.reject ? 'Image, audio and video files only' : 'Upload audio file(s) to continue'
            }
            styles={{
                dropzoneReject: { borderColor: 'red', backgroundColor: '#DAA' },
                inputLabel: (_, extra) => (extra.reject ? { color: 'red' } : {}),
            }}
        />
    );
};

export default Upload;
