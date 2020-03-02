/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import Playlist from './Playlist';
import Skeleton from 'react-loading-skeleton';
import $ from 'jquery';
import '../styles.css';

import { useDispatch } from 'react-redux';
import { disableEditMode, setTranscriptionIdForEdit } from '../../actions/TranscriptionActions';

const Empty = () => <h3 style={{ marginLeft: '4%', color: 'rgba(0,0,0,0.7)' }}>No file selected into Editor, go to 'My Transcriptions' to select a file!</h3>;

const Editor = props => {
    const [transcriptionId, setTranscriptionId] = useState(null);
    const [transcript, setTranscript] = useState(null);
    const [fileInfo, setFileInfo] = useState(null);

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
            /* 
                Remove the sort function after git pull
            */
            sentences.sort((s1, s2) => {
                if (s1.startTime < s2.startTime) return -1;
                if (s1.startTime > s2.startTime) return 1;
                return 0;
            });

            let notes = [],
                counter = 1;
            for (let s of sentences) {
                let startime = s.startTime;
                let endTime = s.startTime + s.duration;

                let lines = s.words.reduce((sentence, word) => {
                    return sentence + ' ' + word.text;
                }, '');

                notes.push({
                    begin: `${startime}`,
                    end: `${endTime}`,
                    id: `${counter}`,
                    language: s.language,
                    lines,
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
        dispatch(disableEditMode());
        dispatch(setTranscriptionIdForEdit(null));

        /* Transition back to 'My Transcriptions' page */
        props.subPageCallback('My Transcriptions');
        localStorage.setItem('subpage', 'My Transcriptions');
    };

    /*
        Props passed to Playlist component:
    */
    const playlistProps = {
        fileInfo,
        _id: transcriptionId,
        notes: transcript,
    };

    return (
        <React.Fragment>
            {transcriptionId === null ? (
                <Empty />
            ) : (
                <React.Fragment>
                    {fileInfo !== null ? <h3 className="editor-title">{fileInfo.originalname}</h3> : <Skeleton width={300} height={35} />}
                    <span className="close-editor" onClick={closeEditor}>
                        <i className="fas fa-times"></i>
                    </span>
                    <div id="top-bar" className="playlist-top-bar">
                        <div className="playlist-toolbar">
                            <div className="btn-group">
                                <span className="btn-pause btn btn-warning">
                                    <i className="fa fa-pause"></i>
                                </span>
                                <span className="btn-play btn btn-success">
                                    <i className="fa fa-play"></i>
                                </span>
                                <span className="btn-stop btn btn-danger">
                                    <i className="fa fa-stop"></i>
                                </span>
                                {/* <span className="btn-rewind btn btn-success">
                                    <i className="fa fa-fast-backward"></i>
                                </span>
                                <span className="btn-fast-forward btn btn-success">
                                    <i className="fa fa-fast-forward"></i>
                                </span> */}
                            </div>
                            <div className="btn-group">
                                <span title="zoom in" className="btn-zoom-in btn btn-default">
                                    <i className="fa fa-search-plus"></i>
                                </span>
                                <span title="zoom out" className="btn-zoom-out btn btn-default">
                                    <i className="fa fa-search-minus"></i>
                                </span>
                                <span title="Download the annotations as json" className="btn-annotations-download btn btn-default">
                                    Download JSON
                                </span>
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

var actions = [
    {
        class: 'fa.fa-minus',
        title: 'Reduce annotation end by 0.010s',
        action: (annotation, i, annotations, opts) => {
            var next;
            var delta = 0.01;
            annotation.end -= delta;

            if (opts.linkEndpoints) {
                next = annotations[i + 1];
                next && (next.start -= delta);
            }
        },
    },
    {
        class: 'fa.fa-plus',
        title: 'Increase annotation end by 0.010s',
        action: (annotation, i, annotations, opts) => {
            var next;
            var delta = 0.01;
            annotation.end += delta;

            if (opts.linkEndpoints) {
                next = annotations[i + 1];
                next && (next.start += delta);
            }
        },
    },
    {
        class: 'fa.fa-scissors',
        title: 'Split annotation in half',
        action: (annotation, i, annotations) => {
            const halfDuration = (annotation.end - annotation.start) / 2;

            annotations.splice(i + 1, 0, {
                id: 'test',
                start: annotation.end - halfDuration,
                end: annotation.end,
                lines: ['----'],
                lang: 'en',
            });

            annotation.end = annotation.start + halfDuration;
        },
    },
    {
        class: 'fa.fa-trash',
        title: 'Delete annotation',
        action: (annotation, i, annotations) => {
            annotations.splice(i, 1);
        },
    },
];

export default Editor;
