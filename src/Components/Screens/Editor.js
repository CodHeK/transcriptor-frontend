/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import InfoModal from '../Utils/InfoModal';
import Playlist from './Playlist';
import Skeleton from 'react-loading-skeleton';
import $ from 'jquery';
import '../styles.css';

import Loader from 'react-loader-spinner';
import { ToastProvider } from 'react-toast-notifications';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import { Label } from 'semantic-ui-react';

import { useDispatch, useSelector } from 'react-redux';
import {
    disableEditMode,
    setTranscriptionIdForEdit,
    deleteSentence,
    setSentenceId,
} from '../../actions/TranscriptionActions';

const axios = require('axios');

const Empty = () => (
    <h3 style={{ marginLeft: '4%', color: 'rgba(0,0,0,0.7)' }}>
        No file selected into Editor, go to 'My Transcriptions' to select a file!
    </h3>
);

const Editor = props => {
    const [transcriptionId, setTranscriptionId] = useState(null);
    const [transcript, setTranscript] = useState(null);
    const [fileInfo, setFileInfo] = useState(null);

    const { inSaveMode, sentenceId } = useSelector(state => ({ ...state.TRANSCRIPTION }));

    let dispatch = useDispatch();

    useEffect(() => {
        let _id = null;

        if (localStorage.getItem('editorConfig') !== null) {
            const config = JSON.parse(localStorage.getItem('editorConfig'));

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
                    lines: s.text,
                    sentenceId: s._id,
                });

                counter++;
            }
            return notes;
        };

        if (transcriptionId !== null) {
            const URL = `${process.env.REACT_APP_API_HOST}/api/speech/${transcriptionId}`;
            const token = localStorage.getItem('token');

            fetch(URL, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
                .then(res => res.json())
                .then(data => {
                    const { uploadedFile, sentences } = data.speech;

                    const notes = processSentances(sentences);

                    setFileInfo(uploadedFile);
                    setTranscript(notes);
                });
        }
    }, [transcriptionId]);

    const closeEditor = e => {
        /* 
            Close all editor related modes
            and remove items from localStorage
        */
        localStorage.removeItem('editorConfig');
        localStorage.removeItem('editorState');
        dispatch(disableEditMode());
        dispatch(setTranscriptionIdForEdit(null));

        /* Transition back to 'My Transcriptions' page */
        props.subPageCallback('My Transcriptions');
        localStorage.setItem('subpage', 'My Transcriptions');
        localStorage.setItem('loadSavedState', 'false');

        document.getElementById('waveform-playlist-container').remove();
    };

    const downloadTranscript = () => {
        // call to server
    };

    /*
        Props passed to Playlist component:
    */
    const playlistProps = {
        fileInfo,
        _id: transcriptionId,
        notes: transcript,
        actions: [
            {
                class: 'fa.fa-times',
                title: 'Delete sentence',
                action: () => {} /* delete handled in Playlist.js */,
            },
        ],
    };

    return (
        <ToastProvider placement={'top-right'}>
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
                                <InfoModal />
                            </div>
                        ) : (
                            <Skeleton width={300} height={35} />
                        )}
                        <span className="close-editor" onClick={closeEditor}>
                            {!inSaveMode ? (
                                <i className="fas fa-times back"></i>
                            ) : (
                                <Loader type="TailSpin" color="gray" height={20} width={20} />
                            )}
                        </span>
                        <div id="top-bar" className="playlist-top-bar">
                            <div className="playlist-toolbar">
                                <div className="btn-group">
                                    {/* <span className="btn-pause btn btn-warning">
                                        <i className="fa fa-pause"></i>
                                    </span>
                                    <span className="btn-play btn btn-success">
                                        <i className="fa fa-play"></i>
                                    </span>
                                    <span className="btn-stop btn btn-danger">
                                        <i className="fa fa-stop"></i>
                                    </span> */}
                                    {/* <span className="btn-rewind btn btn-success">
                                        <i className="fa fa-fast-backward"></i>
                                    </span>
                                    <span className="btn-fast-forward btn btn-success">
                                        <i className="fa fa-fast-forward"></i>
                                    </span> */}
                                </div>
                                <div className="btn-group">
                                    <span title="zoom in" className="btn-zoom-in btn btn-default zoom-controls">
                                        <i className="fa fa-search-plus"></i>
                                    </span>
                                    <span title="zoom out" className="btn-zoom-out btn btn-default zoom-controls">
                                        <i className="fa fa-search-minus"></i>
                                    </span>
                                    <span
                                        className="btn-download btn btn-default download-transcript"
                                        onClick={downloadTranscript}
                                    >
                                        Download Transcript
                                    </span>
                                </div>
                            </div>
                            <div id="waveform-playlist-container"></div>
                            {transcript && <Playlist {...playlistProps} />}
                        </div>
                    </React.Fragment>
                )}
            </React.Fragment>
        </ToastProvider>
    );
};

export default Editor;
