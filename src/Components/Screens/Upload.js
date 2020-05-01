import React from 'react';
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';
import dataProvider from '../dataProvider';
import { useToasts } from 'react-toast-notifications';
import '../styles.css';

/*
  Refer: https://react-dropzone-uploader.js.org/docs/api#onsubmit
*/

const Upload = () => {
    const { addToast, removeToast } = useToasts();

    const onSubmit = (_, UploadedFiles) => {
        const formData = new FormData();

        for (let info of UploadedFiles) {
            const { file } = info;
            formData.append('file', file);
            formData.append('language', 'english');
        }

        addToast('Please wait until file is uploaded!', {
            autoDismiss: false,
            appearance: 'warning',
            id: 1, // random id
        });

        localStorage.setItem('upload_in_progress', 'true');

        dataProvider.speech
            .create('upload', {
                options: {
                    data: formData,
                },
            })
            .then(res => {
                removeToast(1);

                addToast(`File(s) uploaded successfully! View status in "My Transcriptions"`, {
                    autoDismiss: true,
                    appearance: 'success',
                    autoDismissTimeout: 5000,
                });

                localStorage.removeItem('upload_in_progress');
            });
    };

    return (
        <Dropzone
            onSubmit={onSubmit}
            accept=".mp3, .wav, .stm"
            inputContent={(_, extra) =>
                extra.reject
                    ? 'Only .mp3, .wav, .stm file formats valid!'
                    : `Upload audio file(s) and/or transcripts to continue`
            }
            styles={{
                dropzoneReject: { borderColor: 'red', backgroundColor: '#DAA' },
                inputLabel: (_, extra) => (extra.reject ? { color: 'red' } : {}),
            }}
        />
    );
};

export default Upload;
