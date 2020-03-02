import React, { useState, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton'; // (https://github.com/dvtng/react-loading-skeleton#readme)
import EventEmitter from 'event-emitter';
import hotkeys from 'hotkeys-js';
import $ from 'jquery';
import '../styles.css';

import { useDispatch, useSelector } from 'react-redux';
import { saveEventEmitter } from '../../actions/TranscriptionActions';

const WaveformPlaylist = require('waveform-playlist');

const Playlist = props => {
    const [playlistLoaded, setPlaylistLoaded] = useState(false);

    let dispatch = useDispatch();

    useEffect(() => {
        let playlist = WaveformPlaylist.init(
            {
                container: document.getElementById('waveform-playlist-container'),
                timescale: true,
                state: 'select',
                samplesPerPixel: 1024,
                colors: {
                    waveOutlineColor: 'white',
                    timeColor: 'grey',
                    fadeColor: 'black',
                },
                annotationList: {
                    annotations: props.notes,
                    controls: [],
                    editable: true,
                    isContinuousPlay: false,
                    linkEndpoints: true,
                },
                seekStyle: 'line',
                options: {
                    isAutomaticScroll: true,
                },
            },
            EventEmitter()
        );

        setTimeout(() => {
            playlist
                .load([
                    {
                        src: `${process.env.REACT_APP_API_HOST}/${props.fileInfo.path}`,
                    },
                ])
                .then(function() {
                    $('.playlist-toolbar').show();
                    $('#waveform-playlist-container').show();

                    setPlaylistLoaded(true);

                    let ee = playlist.getEventEmitter();
                    // dispatch(saveEventEmitter(ee));

                    /* 
                        Elements
                    */
                    const $window = $(window);
                    const $playButton = $('.btn-play');
                    const $pauseButton = $('.btn-pause');
                    const $stopButton = $('.btn-stop');
                    const $waveform = $('.playlist-tracks')[0];
                    const $annotationsTextBox = document.getElementsByClassName('annotations-text')[0];
                    const $sentenceSectionBoxes = document.getElementsByClassName('annotation-box');
                    const $annotationsBoxesDiv = document.getElementsByClassName('annotations-boxes')[0];
                    const $cursor = document.getElementsByClassName('cursor')[0];
                    const $annotations = document.getElementsByClassName('annotation');

                    /* 
                        Utility functions
                    */

                    const unsetHighlight = element => {
                        element.classList.remove('current');
                    };

                    const setHighlight = element => {
                        element.classList.add('current');
                    };

                    const removeAllHighlights = () => {
                        for (let $annotation of $annotations) {
                            if ($annotation.classList.length > 1) {
                                $annotation.classList.remove('current');
                            }
                        }
                    };

                    const getCurrentHighlightedElement = () => {
                        for (let $annotation of $annotations) {
                            if ($annotation.classList.length > 1) {
                                return $annotation;
                            }
                        }
                        return null;
                    };

                    const getNextForHighlight = () => {
                        let len = $annotations.length;
                        for (let idx in $annotations) {
                            let id = parseInt(idx);
                            if (!isNaN(id)) {
                                if ($annotations[id].classList.length > 1) {
                                    let curr = id,
                                        next = (id + 1) % len;
                                    unsetHighlight($annotations[curr]);
                                    setHighlight($annotations[next]);
                                    return true;
                                }
                            }
                        }
                        setHighlight($annotations[0]);
                        return true;
                    };

                    /* 
                        Actions on above Elements
                    */

                    $playButton.on('click', () => {
                        removeAllHighlights();

                        ee.emit('play');

                        let cursorLimit = $annotationsBoxesDiv.offsetWidth;

                        setInterval(() => {
                            if (parseInt($cursor.style.left) >= cursorLimit) {
                                $waveform.scrollTo(cursorLimit, 0);
                            }
                        }, 1000);
                    });

                    $pauseButton.on('click', () => {
                        ee.emit('pause');
                    });

                    $stopButton.on('click', () => {
                        removeAllHighlights();

                        $waveform.scrollTo(0, 0);

                        ee.emit('stop');
                    });

                    const timeStringToFloat = time => {
                        let [hours, minutes, seconds] = time.split(':').map(unit => parseFloat(unit));

                        let totalSeconds = hours * 3600 + minutes * 60 + seconds;

                        return totalSeconds;
                    };

                    let prevScroll = 0;

                    $waveform.addEventListener('scroll', e => {
                        prevScroll = $waveform.scrollLeft;
                    });

                    $annotationsTextBox.addEventListener('click', e => {
                        removeAllHighlights();

                        let $parent = e.path[1];
                        let sentenceId = $parent.getElementsByClassName('annotation-id')[0].innerHTML;

                        let startTime = $parent.getElementsByClassName('annotation-start')[0].innerHTML;
                        let endTime = $parent.getElementsByClassName('annotation-end')[0].innerHTML;

                        startTime = timeStringToFloat(startTime);
                        endTime = timeStringToFloat(endTime);

                        let scrollVal = parseInt($sentenceSectionBoxes[sentenceId - 1].style.left);

                        $waveform.scrollTo(prevScroll + scrollVal, 0);

                        prevScroll += scrollVal;

                        ee.emit('play', startTime, endTime);
                    });

                    /* 
                        Define keyboard shortcuts
                    */
                    let keyboardBoardMode = false;

                    hotkeys('shift+enter', (e, handler) => {
                        keyboardBoardMode = getNextForHighlight();

                        /* 
                            Call function to save edit here
                        */

                        e.preventDefault();
                    });

                    hotkeys('enter', (e, handler) => {
                        if (keyboardBoardMode) {
                            let $currentHighlighted = getCurrentHighlightedElement();

                            let $currentAnnotationText = $currentHighlighted.getElementsByClassName(
                                'annotation-lines'
                            )[0];

                            /* Reason for timeout: https://stackoverflow.com/questions/15859113/focus-not-working */
                            setTimeout(() => $currentAnnotationText.focus(), 0);

                            console.log($currentAnnotationText);
                        }
                    });
                });
        }, 500);
    }, []);

    const PLaylistGhostLoader = () => {
        const ListGhostLoader = props => {
            let ghostSentences = [];
            for (let i = 0; i < props.count; i++) {
                ghostSentences.push(
                    <li className="sentence-ghost" key={i}>
                        <Skeleton width={1000} height={50} />
                    </li>
                );
            }
            return ghostSentences;
        };

        return (
            <React.Fragment>
                <div className="toolbar-ghost">
                    <Skeleton width={400} height={35} />
                </div>
                <div className="waveform-ghost">
                    <Skeleton height={148} />
                </div>
                <ul className="sentence-ghost-container">
                    <ListGhostLoader count={10} />
                </ul>
            </React.Fragment>
        );
    };

    if (playlistLoaded) {
        return <React.Fragment></React.Fragment>;
    } else {
        return (
            <React.Fragment>
                <PLaylistGhostLoader />
            </React.Fragment>
        );
    }
};

export default Playlist;
