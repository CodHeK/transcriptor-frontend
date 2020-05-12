import React from 'react';
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';
import dataProvider from '../dataProvider';
import { useToasts } from 'react-toast-notifications';
import { bandwidth } from '../network';
import '../styles.css';

/*
  Refer: https://react-dropzone-uploader.js.org/docs/api#onsubmit
*/

const Upload = () => {
    const { addToast, removeToast } = useToasts();

    const uploadStatus = (message, type) => {
        removeToast(1);

        addToast(message, {
            autoDismiss: true,
            appearance: type,
            autoDismissTimeout: 5000,
        });

        localStorage.removeItem('upload_in_progress');
    };

    const onSubmit = async UploadedFiles => {
        const $e = document.querySelector('.dzu-submitButtonContainer .dzu-submitButton');

        $e.disabled = true;
        $e.style.cursor = 'not-allowed';

        const formData = new FormData();

        for (let info of UploadedFiles) {
            const { file } = info;
            formData.append('file', file);
            formData.append('language', 'english');
        }

        const bw = await bandwidth(); // in kbps

        const totalKbs = formData.getAll('file').reduce((prev, curr) => {
            return prev + curr.size / 1000;
        }, 0);

        const timeTakenEstimated = 0.5 + totalKbs / bw;

        addToast(`Upload in progress...`, {
            autoDismiss: true,
            appearance: 'warning',
            id: 1, // random id
            autoDismissTimeout: timeTakenEstimated * 10000,
        });

        localStorage.setItem('upload_in_progress', 'true');

        dataProvider.speech
            .create('upload', {
                options: {
                    data: formData,
                },
            })
            .then(res => {
                $e.disabled = false;
                $e.style.cursor = 'pointer';

                uploadStatus(`File(s) uploaded successfully! View status in "My Transcriptions"`, 'success');
            })
            .catch(err => {
                $e.disabled = false;
                $e.style.cursor = 'pointer';

                if ('message' in err.response.data) {
                    uploadStatus(err.response.data.message, 'error');
                } else {
                    uploadStatus('Error Uploading file', 'error');
                }
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
