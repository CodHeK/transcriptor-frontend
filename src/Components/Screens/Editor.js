/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import InfoModal from '../Utils/InfoModal';
import Playlist from './Playlist';
import Skeleton from 'react-loading-skeleton';
import { Checkbox } from 'semantic-ui-react';
import $ from 'jquery';
import '../styles.css';

import dataProvider from '../dataProvider';

import Loader from 'react-loader-spinner';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import { Label } from 'semantic-ui-react';

import { useDispatch, useSelector } from 'react-redux';
import { disableEditMode, setTranscriptionIdForEdit } from '../../actions/TranscriptionActions';

const moment = require('moment');

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

    const $sentenceSectionBoxes = document.getElementsByClassName('annotation-box');
    const $cursor = document.getElementsByClassName('cursor')[0];

    if (localStorage.getItem('autoSave') === null) {
        localStorage.setItem('autoSave', 'true');
    }

    const { inSaveMode, ee } = useSelector(state => ({ ...state.TRANSCRIPTION }));

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
                    lines: s.text /* `lines` key needed for library to display */,
                    sentenceId: s._id,
                    prevText: s.prevText,
                    reSpeak: s.respeak,
                    speaker: s.speaker,
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

    const closeEditor = e => {
        /* 
            Close all editor related modes
            and remove items from localStorage
        */
        document.getElementById('waveform-playlist-container').remove();

        localStorage.removeItem('editorConfig');
        localStorage.removeItem('editorState');
        localStorage.removeItem('autoSave');
        localStorage.removeItem('cursorPos');
        localStorage.removeItem('globalNextPlayMode');
        localStorage.removeItem('loadSavedState');
        localStorage.removeItem('section-playing-editor');
        localStorage.removeItem('SECTION_TIMER_ID');

        dispatch(disableEditMode());
        dispatch(setTranscriptionIdForEdit(null));

        /* Transition back to 'My Transcriptions' page */
        props.subPageCallback('My Transcriptions');
        localStorage.setItem('subpage', 'My Transcriptions');
    };

    const createLinkForDownload = (url, type) => {
        const time = moment(fileInfo.createdAt).format('LT');
        const date = moment(fileInfo.createdAt).format('LL');

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileInfo.originalname}_${date}_${time}.${type}`); // or any other extension
        document.body.appendChild(link);
        link.click();
    };

    const downloadTranscriptAndAudio = fileInfo => {
        /* 
            Downloading transcripts and audio
        */
        dataProvider.speech
            .get('export', {
                id: transcriptionId,
                options: {
                    responseType: 'blob',
                },
            })
            .then(res => {
                createLinkForDownload(window.URL.createObjectURL(new Blob([res.data])), 'zip');
            });
    };

    const toggleAutoSave = () => {
        setAutoSave(!autoSave);
        localStorage.setItem('autoSave', !autoSave);
    };

    const removeSectionHighlight = $element => {
        $element.classList.remove('section-highlight');
    };

    const setCursorByLeft = left => {
        setTimeout(() => ($cursor.style.left = left.toString() + 'px'), 10);
    };

    const toggleTrackModes = (mode, args = null, e = null) => {
        let $playListMuteButton = null,
            keyBoardMode = true;
        const inSectionPlayMod = JSON.parse(localStorage.getItem('section-playing-editor'));

        if (!e) {
            // if no event emitter passed
            e = ee;
            keyBoardMode = false;
        }

        switch (mode) {
            case 'play':
                let startTime = 0,
                    NEW_SECTION_TIMER = null;

                if (localStorage.getItem('cursorPos')) {
                    startTime = parseFloat(localStorage.getItem('cursorPos'));
                }
                setTrackMode(mode);
                if (!keyBoardMode) {
                    if (inSectionPlayMod) {
                        // section was paused in between and now played
                        e.emit(mode, startTime, inSectionPlayMod.endTime);

                        NEW_SECTION_TIMER = setTimeout(() => {
                            localStorage.removeItem('section-playing-editor');
                            localStorage.removeItem('SECTION_TIMER_ID');
                            setTrackMode('pause');
                            const sentenceIdx = parseInt(inSectionPlayMod.sentenceIdx);
                            removeSectionHighlight($sentenceSectionBoxes[sentenceIdx]);
                            setCursorByLeft(inSectionPlayMod.startPoint);
                        }, (inSectionPlayMod.endTime - startTime + 0.1) * 1000);

                        localStorage.setItem('SECTION_TIMER_ID', NEW_SECTION_TIMER);
                    } else {
                        e.emit(mode, startTime);
                    }

                    localStorage.setItem('globalNextPlayMode', 'pause');
                }
                break;

            case 'pause':
                setTrackMode(mode);
                if (!keyBoardMode) {
                    if (inSectionPlayMod) {
                        // clear the SECTION_TIMER Timeout
                        const SECTION_TIMER = parseInt(localStorage.getItem('SECTION_TIMER_ID'));

                        clearTimeout(SECTION_TIMER);
                        localStorage.removeItem('SECTION_TIMER_ID');
                    }

                    e.emit(mode);
                    localStorage.setItem('globalNextPlayMode', 'play');
                }
                break;

            case 'stop':
                e.emit(mode);
                setTrackMode('pause');
                break;

            case 'mute':
                /* 
                    Mute / un-mute by virtually clicking `mute` button
                    from library's control panel mute button
                    check styles.css line 765
                */
                $playListMuteButton = document.getElementsByClassName('btn-mute')[0];
                $playListMuteButton.click();

                setMute(true);
                break;

            case 'un-mute':
                $playListMuteButton = document.getElementsByClassName('btn-mute')[0];
                $playListMuteButton.click();

                setMute(false);
                break;

            default:
                return;
        }
    };

    /*
        Props passed to Playlist component:
    */
    const playlistProps = {
        fileInfo,
        _id: transcriptionId,
        notes: transcript,
        autoSave,
        callbacks: {
            changeTrackMode: (mode, args, e) => toggleTrackModes(mode, args, e),
        },
        actions: [
            {
                class: 'fas.fa-unlock',
                title: 'unlock to edit',
                action: () => {} /* Unlock sentence voluntarily for editing */,
            },
            {
                class: 'fa.fa-times',
                title: 'Delete sentence',
                action: () => {} /* delete handled in Playlist.js */,
            },
            {
                class: 'fas.fa-history',
                title: 'Revert back',
                action: () => {} /* Revert back to previous version of sentence */,
            },
            {
                class: 'fas.fa-lock',
                title: 'respeak in progress',
                action: () => {} /* Notify respeak in progress and unlock in necessary */,
            },
        ],
    };

    return (
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
                                    {/* Download Transcript */}
                                    <i className="far fa-save"></i>
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
    );
};

export default Editor;
