import React, { useState, useEffect } from 'react';
import MicRecorder from 'mic-recorder-to-mp3';
import { useToasts } from 'react-toast-notifications';

const recorder = new MicRecorder({ bitRate: 128 });

const SortableCard = ({ data: item, callbacks }) => {
    const [recording, setRecording] = useState(false);
    const [blobURL, setBlobURL] = useState(null);
    const [blocked, setBlocked] = useState(false); // to check if browser is enabled to record audio

    const { addToast } = useToasts();

    const checkPermission = () => {
        return new Promise((resolve, reject) => {
            navigator.getUserMedia(
                { audio: true },
                () => {
                    console.log('Permission Granted');
                    setBlocked(false, () => resolve());
                },
                () => {
                    console.log('Permission Denied');
                    setBlocked(true, () => resolve());
                }
            );
        });
    };

    const handleDelete = () => callbacks.deleteSegment(item.id);

    const handleRecording = () => {
        /*
            Recording === true meaning currently segment 
            is being recorded
        */
        if (recording) {
            // stop recording
            recorder
                .stop()
                .getMp3()
                .then(([buffer, blob]) => {
                    setRecording(false);
                    callbacks.saveRecording(item.id, blob);
                    setBlobURL(URL.createObjectURL(blob));
                })
                .catch(e => console.log(e));
        } else {
            // start recording
            // await checkPermission(); [ currently not working ]

            if (!blocked) {
                recorder
                    .start()
                    .then(() => {
                        setRecording(true);
                    })
                    .catch(e => console.error(e));
            } else {
                addToast('Please allow the browser to record audio.', {
                    autoDismiss: true,
                    appearance: 'error',
                    autoDismissTimeout: 3000,
                });
            }
        }
    };

    const playAudio = () => {
        const audio = new Audio(blobURL);
        audio.play();
    };

    return (
        <div className="sortable-list" key={item.id}>
            <div className="sortable-filename">{item.name}</div>
            <div className="sortable-listen-icon" onClick={playAudio}>
                <i className="fas fa-volume-up"></i>
            </div>
            <div className="sortable-record-icon" onClick={handleRecording}>
                <i className={`fas fa-microphone ${recording ? `recording` : ``}`}></i>
            </div>
            <div className="sortable-delete-icon" onClick={handleDelete}>
                <i className="fas fa-times"></i>
            </div>
        </div>
    );
};

export default SortableCard;
