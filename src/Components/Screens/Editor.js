/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import InfoModal from '../Utils/InfoModal';
import Playlist from './Playlist';
import Skeleton from 'react-loading-skeleton';
import { Checkbox } from 'semantic-ui-react';
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

const moment = require('moment');
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
    const [trackMode, setTrackMode] = useState('pause');
    const [autoSave, setAutoSave] = useState(
        localStorage.getItem('autoSave') ? localStorage.getItem('autoSave') === 'true' : true
    );
    const [mute, setMute] = useState(false);

    if (localStorage.getItem('autoSave') === null) {
        localStorage.setItem('autoSave', 'true');
    }

    const { inSaveMode, sentenceId, ee } = useSelector(state => ({ ...state.TRANSCRIPTION }));

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
        localStorage.removeItem('autoSave');
        localStorage.removeItem('cursorPos');

        dispatch(disableEditMode());
        dispatch(setTranscriptionIdForEdit(null));

        /* Transition back to 'My Transcriptions' page */
        props.subPageCallback('My Transcriptions');
        localStorage.setItem('subpage', 'My Transcriptions');
        localStorage.setItem('loadSavedState', 'false');

        document.getElementById('waveform-playlist-container').remove();
    };

    const downloadTranscript = fileInfo => {
        const URL = `${process.env.REACT_APP_API_HOST}/api/speech/${transcriptionId}/export`;
        const token = localStorage.getItem('token');

        const time = moment(fileInfo.createdAt).format('LT');
        const date = moment(fileInfo.createdAt).format('LL');

        axios({
            url: URL,
            method: 'GET',
            responseType: 'blob', // important
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }).then(response => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${fileInfo.originalname}_${date}_${time}.zip`); //or any other extension
            document.body.appendChild(link);
            link.click();
        });
    };

    /*
        Props passed to Playlist component:
    */
    const playlistProps = {
        fileInfo,
        _id: transcriptionId,
        notes: transcript,
        autoSave,
        actions: [
            {
                class: 'fa.fa-times',
                title: 'Delete sentence',
                action: () => {} /* delete handled in Playlist.js */,
            },
        ],
    };

    const toggleAutoSave = () => {
        setAutoSave(!autoSave);
        localStorage.setItem('autoSave', !autoSave);
    };

    const toggleTrackModes = (mode, args = null) => {
        let $playListMuteButton = null;
        switch (mode) {
            case 'play':
                let startTime = 0;
                if (localStorage.getItem('cursorPos')) {
                    startTime = parseFloat(localStorage.getItem('cursorPos'));
                }
                setTrackMode(mode);
                ee.emit(mode, startTime);
                break;

            case 'pause':
                setTrackMode(mode);
                ee.emit(mode);
                break;

            case 'stop':
                ee.emit(mode);
                break;

            case 'mute':
                $playListMuteButton = document.getElementsByClassName('btn-mute')[0];
                $playListMuteButton.click();

                setMute(true);
                ee.emit(mode, args.track);
                break;

            case 'un-mute':
                $playListMuteButton = document.getElementsByClassName('btn-mute')[0];
                $playListMuteButton.click();

                setMute(false);
                ee.emit('mute', args.track);
                break;

            default:
                return;
        }
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
                                <div className="btn-group"></div>
                                <div className="btn-group">
                                    <span
                                        title={trackMode === 'pause' ? 'play' : 'pause'}
                                        className="btn-play-pause btn btn-default editor-controls"
                                    >
                                        {trackMode === 'pause' ? (
                                            <i className="fa fa-play" onClick={() => toggleTrackModes('play')}></i>
                                        ) : (
                                            <i className="fa fa-pause" onClick={() => toggleTrackModes('pause')}></i>
                                        )}
                                    </span>
                                    <span title="stop" className="btn-stop btn btn-default editor-controls">
                                        <i className="fa fa-stop" onClick={() => toggleTrackModes('stop')}></i>
                                    </span>
                                    <span
                                        title={mute ? 'un-mute' : 'mute'}
                                        className="btn-toggle-mute btn btn-default editor-controls"
                                    >
                                        {!mute ? (
                                            <i
                                                className="fa fa-volume-up"
                                                onClick={() => toggleTrackModes('mute', { track: 'main-track' })}
                                            ></i>
                                        ) : (
                                            <i
                                                className="fa fa-volume-mute"
                                                onClick={() => toggleTrackModes('un-mute', { track: 'main-track' })}
                                            ></i>
                                        )}
                                    </span>
                                    <span title="zoom in" className="btn-zoom-in btn btn-default editor-controls">
                                        <i className="fa fa-search-plus"></i>
                                    </span>
                                    <span title="zoom out" className="btn-zoom-out btn btn-default editor-controls">
                                        <i className="fa fa-search-minus"></i>
                                    </span>
                                    <span
                                        className="btn-download btn btn-default download-transcript"
                                        onClick={() => downloadTranscript(fileInfo)}
                                    >
                                        Download Transcript
                                    </span>
                                </div>
                                <div className="btn-group right">
                                    <Checkbox
                                        className="auto-save"
                                        checked={autoSave}
                                        toggle
                                        label={`Autosave: ${autoSave ? 'ON' : 'OFF'}`}
                                        onChange={toggleAutoSave}
                                    />
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
