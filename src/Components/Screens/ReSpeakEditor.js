/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import ReSpeak from './ReSpeak';
import Skeleton from 'react-loading-skeleton';
import { useToasts } from 'react-toast-notifications';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import { Label, Button } from 'semantic-ui-react';
import dataProvider from '../dataProvider';
import localforage from 'localforage';
import $ from 'jquery';
import '../styles.css';

import { useDispatch, useSelector } from 'react-redux';
import { disableReSpeakMode, setTranscriptionIdForReSpeak } from '../../actions/TranscriptionActions';

const moment = require('moment');

const Empty = () => (
    <h3 style={{ marginLeft: '4%', color: 'rgba(0,0,0,0.7)' }}>
        No file selected for Re-speaking, go to 'My Transcriptions' to select a file!
    </h3>
);

const ReSpeakEditor = props => {
    const [transcriptionId, setTranscriptionId] = useState(null);
    const [transcript, setTranscript] = useState(null);
    const [fileInfo, setFileInfo] = useState(null);
    const [trackMode, setTrackMode] = useState('pause');
    const [mute, setMute] = useState(false);

    const dispatch = useDispatch();
    const { addToast } = useToasts();

    const $sentenceSectionBoxes = document.getElementsByClassName('annotation-box');
    const $cursor = document.getElementsByClassName('cursor')[0];

    const { ee } = useSelector(state => ({ ...state.TRANSCRIPTION }));

    const notify = (message, type) => {
        /* 
            type: error | warning | success
        */
        addToast(message, {
            autoDismiss: true,
            appearance: type,
            autoDismissTimeout: 3000,
        });
    };

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
        $('#waveform-playlist-container-respeak').hide();

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
                })
                .catch(err => {
                    notify(err.response.data.message, 'error');
                });
        }
    }, [transcriptionId]);

    const closeReSpeakEditor = e => {
        /* 
            Close all editor related modes
            and remove items from localStorage
        */
        localStorage.removeItem('reSpeakConfig');
        localStorage.removeItem('cursorPos');
        localStorage.removeItem('once-loaded');
        localStorage.removeItem('reSpeakEditorState');
        localStorage.removeItem('globalNextPlayMode_respeak');
        localStorage.removeItem('popUpInDisplay');
        localStorage.removeItem('global_recording_flag');
        localStorage.removeItem('global_play_audio_flag');
        localStorage.removeItem('currently_playing');
        localStorage.removeItem('SECTION_TIMER_ID');
        localStorage.removeItem('section-playing-respeak');
        localStorage.removeItem('loadSavedState_ReSpeak');

        localforage.clear();

        dispatch(disableReSpeakMode());
        dispatch(setTranscriptionIdForReSpeak(null));

        /* Transition back to 'My Transcriptions' page */
        props.subPageCallback('My Transcriptions');
        localStorage.setItem('subpage', 'My Transcriptions');

        $('#waveform-playlist-container-respeak').unbind();
        document.getElementById('waveform-playlist-container-respeak').remove();
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
            })
            .catch(err => {
                notify(err.response.data.message, 'error');
            });
    };

    const removeSectionHighlight = $element => {
        $element.classList.remove('section-highlight');
    };

    const setCursorByLeft = left => {
        setTimeout(() => ($cursor.style.left = left.toString() + 'px'), 10);
    };

    const toggleTrackModes = (mode, args = null, e = null) => {
        let $playListMuteButton = null,
            fromReSpeakEditor = true;
        const inSectionPlayMod = JSON.parse(localStorage.getItem('section-playing-respeak'));

        if (!e) {
            // if no event emitter passed
            e = ee;
            fromReSpeakEditor = false;
        }

        switch (mode) {
            case 'play':
                let startTime = 0,
                    NEW_SECTION_TIMER = null;
                if (localStorage.getItem('cursorPos')) {
                    startTime = parseFloat(localStorage.getItem('cursorPos'));
                }
                setTrackMode(mode);

                if (fromReSpeakEditor) {
                    e.emit('play', parseFloat(args.startTime), parseFloat(args.endTime));
                } else {
                    if (inSectionPlayMod) {
                        // section was paused in between and now played
                        e.emit('play', startTime, inSectionPlayMod.endTime);

                        NEW_SECTION_TIMER = setTimeout(() => {
                            localStorage.removeItem('section-playing-respeak');
                            localStorage.removeItem('SECTION_TIMER_ID');
                            setTrackMode('pause');
                            const sentenceIdx = parseInt(inSectionPlayMod.sentenceIdx);
                            removeSectionHighlight($sentenceSectionBoxes[sentenceIdx]);
                            setCursorByLeft(inSectionPlayMod.startPoint);
                        }, (inSectionPlayMod.endTime - startTime + 0.1) * 1000);

                        localStorage.setItem('SECTION_TIMER_ID', NEW_SECTION_TIMER);
                    } else {
                        e.emit('play', startTime);
                    }
                }
                localStorage.setItem('globalNextPlayMode_respeak', 'pause');
                break;

            case 'pause':
                setTrackMode(mode);

                if (inSectionPlayMod) {
                    // clear the SECTION_TIMER Timeout
                    const SECTION_TIMER = parseInt(localStorage.getItem('SECTION_TIMER_ID'));

                    clearTimeout(SECTION_TIMER);
                    localStorage.removeItem('SECTION_TIMER_ID');
                }

                e.emit(mode);
                localStorage.setItem('globalNextPlayMode_respeak', 'play');
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

    const isEmpty = allFiles => {
        let isEmpty = true;
        for (let each of allFiles) {
            const { files } = each;
            if (files.length > 0) {
                isEmpty = false;
                break;
            }
        }

        return isEmpty;
    };

    const isComplete = allFiles => {
        let isComplete = true;
        for (let each of allFiles) {
            if (each.status === 'in-edit') {
                isComplete = false;
                break;
            }
        }
        return isComplete;
    };

    const handleSubmit = () => {
        /*
            allFiles in localforage indexedDB
        */
        localforage.getItem('allFiles', (err, res) => {
            if (res) {
                const allFiles = res;
                const empty = isEmpty(allFiles),
                    complete = isComplete(allFiles);
                if (!empty && complete) {
                    /* 
                        POST request to the server here!
                    */
                    const formData = new FormData();
                    for (let each of allFiles) {
                        const { files } = each;

                        for (let idx in files) {
                            // name -> sentenceId_<increment>
                            const name = `${files[idx].name.split('_')[0]}_${idx + 1}.mp3`;
                            formData.append('files', files[idx].blob, name);
                        }
                    }

                    dataProvider.speech
                        .create('respeak', {
                            id: transcriptionId,
                            options: {
                                data: formData,
                            },
                        })
                        .then(res => {
                            notify('All files submitted successfully!', 'success');
                        })
                        .catch(err => {
                            notify(err.response.data.message, 'error');
                        });
                } else {
                    if (empty) {
                        notify('No files recorded to submit!', 'error');
                    } else if (!complete) {
                        notify('You have files still in EDIT, Make sure to save them before submitting.', 'warning');
                    }
                }
            } else {
                notify('No files recorded to submit!', 'error');
            }
        });
    };

    /*
        Props passed to ReSpeak component:
    */
    const reSpeakProps = {
        fileInfo,
        _id: transcriptionId,
        notes: transcript,
        callbacks: {
            changeTrackMode: (mode, args, e) => toggleTrackModes(mode, args, e),
        },
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
                        </div>
                    ) : (
                        <Skeleton width={300} height={35} />
                    )}
                    <span className="close-editor" onClick={closeReSpeakEditor}>
                        <i className="fas fa-times back"></i>
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
                                {/*<span title="zoom in" className="btn-zoom-in btn btn-default editor-controls">
                                    <i className="fa fa-search-plus"></i>
                                </span>
                                <span title="zoom out" className="btn-zoom-out btn btn-default editor-controls">
                                    <i className="fa fa-search-minus"></i>
                                </span>*/}
                                <span
                                    title="export audio & transcript"
                                    className="btn-download btn btn-default editor-controls"
                                    onClick={() => downloadTranscriptAndAudio(fileInfo)}
                                >
                                    <i className="far fa-save"></i>
                                </span>
                            </div>
                            <div className="btn-group right">
                                <Button className="submit-btn-respeak" onClick={handleSubmit}>
                                    Submit
                                </Button>
                            </div>
                        </div>
                        <div id="waveform-playlist-container-respeak"></div>
                        {transcript && <ReSpeak {...reSpeakProps} />}
                    </div>
                </React.Fragment>
            )}
        </React.Fragment>
    );
};

export default ReSpeakEditor;
