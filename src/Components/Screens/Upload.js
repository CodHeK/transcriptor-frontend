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

    const stringTimeFormat = (h, m, s) => {
        let time = '';

        if (h > 0) time += h.toString() + 'h ';

        if (m > 0) time += m.toString() + 'm ';

        if (s >= 0) time += s.toString() + 's';

        return time;
    };

    const timeFormat = time => {
        /* 
            Inputs time in seconds format to h/m/s
            
            Ex: 337.2s -> 5m 37.2s
                3601.4s -> 1h 1.4s
        */
        time = parseFloat(time);

        let h = 0,
            m = 0,
            s = 0;
        h = parseInt(time / 3600);
        time = time - h * 3600;
        m = parseInt(time / 60);
        time = time - m * 60;
        s = Math.round(time * 10) / 10; // converting to one decimal place

        return stringTimeFormat(h, m, s);
    };

    const uploadStatus = (message, type) => {
        removeToast(1);

        addToast(message, {
            autoDismiss: true,
            appearance: type,
            autoDismissTimeout: 5000,
        });

        localStorage.removeItem('upload_in_progress');
    };

    const onSubmit = async (_, UploadedFiles) => {
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

        addToast(`Please wait until file is uploaded! - Estimated time: ${timeFormat(timeTakenEstimated)}`, {
            autoDismiss: true,
            appearance: 'warning',
            id: 1, // random id
            autoDismissTimeout: timeTakenEstimated * 1000,
        });

        localStorage.setItem('upload_in_progress', 'true');

        dataProvider.speech
            .create('upload', {
                options: {
                    data: formData,
                },
            })
            .then(res => {
                uploadStatus(`File(s) uploaded successfully! View status in "My Transcriptions"`, 'success');
            })
            .catch(err => {
                if ('error' in err.response.data) {
                    uploadStatus(err.response.data.error, 'error');
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
