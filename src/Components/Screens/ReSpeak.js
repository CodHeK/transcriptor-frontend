/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import Skeleton from 'react-loading-skeleton';
import { ToastProvider } from 'react-toast-notifications';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import { Label } from 'semantic-ui-react';
import dataProvider from '../dataProvider';
import $ from 'jquery';
import '../styles.css';

import { useDispatch, useSelector } from 'react-redux';
import { disableReSpeakMode, setTranscriptionIdForReSpeak } from '../../actions/TranscriptionActions';

const Empty = () => (
    <h3 style={{ marginLeft: '4%', color: 'rgba(0,0,0,0.7)' }}>
        No file selected for Re-speaking, go to 'My Transcriptions' to select a file!
    </h3>
);

const ReSpeak = props => {
    const [transcriptionId, setTranscriptionId] = useState(null);
    const [transcript, setTranscript] = useState(null);
    const [fileInfo, setFileInfo] = useState(null);

    let dispatch = useDispatch();

    useEffect(() => {
        let _id = null;

        if (localStorage.getItem('reSpeakConfig') !== null) {
            const config = JSON.parse(localStorage.getItem('reSpeakConfig'));

            _id = config._id;
        } else {
            _id = props._id;
        }

        setTranscriptionId(_id);
    }, [props._id]);

    useEffect(() => {
        $('.playlist-toolbar').hide();
        $('#waveform-playlist-container').hide();

        const processSentances = sentences => {
            let notes = [],
                counter = 1;
            for (let s of sentences) {
                let startime = s.startTime;
                let endTime = s.endTime;

                notes.push({
                    begin: `${startime}`,
                    end: `${endTime}`,
                    id: `${counter}`,
                    language: s.language,
                    lines: s.text /* `lines` key needed for library to display */,
                    sentenceId: s._id,
                    prevText: s.prevText,
                });

                counter++;
            }
            return notes;
        };

        if (transcriptionId !== null) {
            dataProvider.speech
                .get('', {
                    id: transcriptionId,
                })
                .then(res => {
                    const { uploadedFile, sentences } = res.data.speech;

                    const notes = processSentances(sentences);

                    setFileInfo(uploadedFile);
                    setTranscript(notes);
                });
        }
    }, [transcriptionId]);

    const closeReSpeakEditor = e => {
        /* 
            Close all editor related modes
            and remove items from localStorage
        */
        localStorage.removeItem('reSpeakConfig');

        dispatch(disableReSpeakMode());
        dispatch(setTranscriptionIdForReSpeak(null));

        /* Transition back to 'My Transcriptions' page */
        props.subPageCallback('My Transcriptions');
        localStorage.setItem('subpage', 'My Transcriptions');

        $('#waveform-playlist-container-respeak').unbind();
        document.getElementById('waveform-playlist-container-respeak').remove();
    };

    return (
        <ToastProvider placement={'bottom-left'}>
            <React.Fragment>
                {transcriptionId === null ? (
                    <Empty />
                ) : (
                    <React.Fragment>
                        {fileInfo !== null ? (
                            <div id="playlist-info">
                                <Label as="a" color="red" ribbon>
                                    {fileInfo.originalname}
                                </Label>
                            </div>
                        ) : (
                            <Skeleton width={300} height={35} />
                        )}
                        <span className="close-editor" onClick={closeReSpeakEditor}>
                            {!false ? (
                                <i className="fas fa-times back"></i>
                            ) : (
                                <Loader type="TailSpin" color="gray" height={20} width={20} />
                            )}
                        </span>
                        <div id="top-bar" className="playlist-top-bar">
                            <div className="playlist-toolbar">
                                <div className="btn-group"></div>
                                <div className="btn-group">
                                    {/* <span
                                        title={trackMode === 'pause' ? 'play' : 'pause'}
                                        className="btn-play-pause btn btn-default editor-controls"
                                        onClick={() => toggleTrackModes(trackMode === 'pause' ? 'play' : 'pause')}
                                    >
                                        {trackMode === 'pause' ? (
                                            <i className="fa fa-play"></i>
                                        ) : (
                                            <i className="fa fa-pause"></i>
                                        )}
                                    </span>
                                    <span
                                        title="stop"
                                        className="btn-stop btn btn-default editor-controls"
                                        onClick={() => toggleTrackModes('stop')}
                                    >
                                        <i className="fa fa-stop"></i>
                                    </span>
                                    <span
                                        title={mute ? 'un-mute' : 'mute'}
                                        className="btn-toggle-mute btn btn-default editor-controls"
                                        onClick={() => toggleTrackModes(!mute ? 'mute' : 'un-mute')}
                                    >
                                        {!mute ? (
                                            <i className="fa fa-volume-up"></i>
                                        ) : (
                                            <i className="fa fa-volume-mute"></i>
                                        )}
                                    </span>
                                    <span title="zoom in" className="btn-zoom-in btn btn-default editor-controls">
                                        <i className="fa fa-search-plus"></i>
                                    </span>
                                    <span title="zoom out" className="btn-zoom-out btn btn-default editor-controls">
                                        <i className="fa fa-search-minus"></i>
                                    </span>
                                    <span
                                        title="export audio & transcript"
                                        className="btn-download btn btn-default editor-controls"
                                        onClick={() => downloadTranscriptAndAudio(fileInfo)}
                                    >
                                        <i className="far fa-save"></i>
                                    </span> */}
                                </div>
                                {/* <div className="btn-group right">
                                    <Checkbox
                                        className="auto-save"
                                        checked={autoSave}
                                        toggle
                                        label={`Autosave: ${autoSave ? 'ON' : 'OFF'}`}
                                        onChange={toggleAutoSave}
                                    />
                                </div> */}
                            </div>
                            <div id="waveform-playlist-container-respeak"></div>
                        </div>
                    </React.Fragment>
                )}
            </React.Fragment>
        </ToastProvider>
    );
};

export default ReSpeak;
