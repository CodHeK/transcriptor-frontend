import React, { useState, useEffect } from 'react';
import MicRecorder from 'mic-recorder-to-mp3';
import { useToasts } from 'react-toast-notifications';
import $ from 'jquery';

// Also check : https://medium.com/@bryanjenningz/how-to-record-and-play-audio-in-javascript-faa1b2b3e49b

const recorder = new MicRecorder({ bitRate: 128 });

const SortableCard = ({ data: item, callbacks }) => {
    const [recording, setRecording] = useState(false);
    const { addToast } = useToasts();

    useEffect(() => {
        $(`#${item.id}`).blur(function() {
            callbacks.changeDisplayName(item.id, this.innerText);
        });

        return () => {
            $(`#${item.id}`).unbind();
        };
    }, []);

    const handleDelete = () => callbacks.deleteSegment(item.id);

    const playAudio = e => callbacks.playSegment(item.id, e.target);

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
                    callbacks.saveSegment(item.id, blob);
                })
                .catch(e => console.log(e));
        } else {
            // start recording
            recorder
                .start()
                .then(() => {
                    setRecording(true);
                })
                .catch(e => console.error(e));
        }
    };

    return (
        <div className="sortable-list" key={item.id}>
            <div className="sortable-filename">
                <span contenteditable="true" id={item.id} className="sortable-display-name">
                    {item.displayName}
                </span>
            </div>
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
