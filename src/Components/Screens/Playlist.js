import React, { useState, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton'; // (https://github.com/dvtng/react-loading-skeleton#readme)
import EventEmitter from 'event-emitter';
import hotkeys from 'hotkeys-js';
import $ from 'jquery';
import '../styles.css';

import { useDispatch, useSelector } from 'react-redux';
import { saveEventEmitter, toggleSaveMode } from '../../actions/TranscriptionActions';

const WaveformPlaylist = require('waveform-playlist');
const axios = require('axios');

const Playlist = props => {
    const [playlistLoaded, setPlaylistLoaded] = useState(false);

    const { inSaveMode } = useSelector(state => ({ ...state.TRANSCRIPTION }));

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
                    dispatch(saveEventEmitter(ee));

                    /* 
                        setInterval objects
                    */
                    let cursorUpdate = null;
                    let autoSave = null;

                    /* 
                        Elements & Variables
                    */
                    const $window = $(window);
                    const $playButton = $('.btn-play');
                    const $pauseButton = $('.btn-pause');
                    const $stopButton = $('.btn-stop');
                    const $waveform = $('.playlist-tracks')[0];
                    const $annotationsTextBoxContainer = document.getElementsByClassName('annotations-text')[0];
                    const $sentenceSectionBoxes = document.getElementsByClassName('annotation-box');
                    const $annotationsBoxesDiv = document.getElementsByClassName('annotations-boxes')[0];
                    const $annotationsTextBoxes = document.getElementsByClassName('annotation-lines');
                    const $cursor = document.getElementsByClassName('cursor')[0];
                    const $annotations = document.getElementsByClassName('annotation');
                    const $timeTicks = $('.time');

                    let notesCache = props.notes;
                    let prevScroll = 0;

                    let annotationsContainerHeight = $annotationsTextBoxContainer.offsetHeight > 320 ? 550 : 300;
                    let annotationBoxHeights = Array.from($annotations).map($annotation => $annotation.offsetHeight);
                    let scrollPoints = new Map();
                    let page = 1;
                    let playMode = 'play';

                    for (let i = 1; i < annotationBoxHeights.length; i++) {
                        annotationBoxHeights[i] += annotationBoxHeights[i - 1];
                        if (annotationBoxHeights[i] >= annotationsContainerHeight * page) {
                            scrollPoints.set(i, annotationBoxHeights[i - 1]);
                            page++;
                        }
                    }

                    /* 
                        Time constants
                    */
                    const oneSecond = $timeTicks && parseInt($timeTicks[1].style.left) / 2;

                    /* 
                        Unsubscribe to all event listeners
                    */
                    $waveform.removeEventListener('scroll', () => console.log('rmd'));
                    $annotationsTextBoxContainer.removeEventListener('click', () => console.log('rmd'));
                    Array.from($annotationsTextBoxes).map($annotationsTextBox => {
                        $annotationsTextBox.removeEventListener('keydown', () => console.log('rmd'));
                        $annotationsTextBox.removeEventListener('click', () => console.log('rmd'));
                    });
                    hotkeys.unbind('shift+down');
                    hotkeys.unbind('shift+up');
                    hotkeys.unbind('enter');
                    clearInterval(autoSave);
                    clearInterval(cursorUpdate);

                    /* 
                        Utility functions
                    */

                    const removeHighlight = $element => {
                        $element.classList.remove('current');
                    };

                    const addHighlight = $element => {
                        $element.classList.add('current');
                    };

                    const addSectionHighlight = $element => {
                        $element.classList.add('section-highlight');
                    };

                    const removeAllHighlights = () => {
                        Array.from($annotations).map($e => $e.classList.remove('current'));
                        Array.from($sentenceSectionBoxes).map($e => $e.classList.remove('section-highlight'));
                    };

                    const getCurrentHighlightedElement = () => {
                        for (let $annotation of $annotations) {
                            if ($annotation.classList.length > 1) {
                                return $annotation;
                            }
                        }
                        return null;
                    };

                    const timeStringToFloat = time => {
                        let [hours, minutes, seconds] = time.split(':').map(unit => parseFloat(unit));

                        let totalSeconds = hours * 3600 + minutes * 60 + seconds;

                        return totalSeconds;
                    };

                    const getNextForHighlight = (scrollPoints, mode) => {
                        let len = $annotations.length;
                        for (let idx in $annotations) {
                            let id = parseInt(idx);
                            if (!isNaN(id)) {
                                if ($annotations[id].classList.length > 1) {
                                    /* 
                                        Auto scroll annotations container
                                    */
                                    let curr, next;
                                    if (mode === 'down') {
                                        curr = id;
                                        next = (id + 1) % len;

                                        if (next === 0) {
                                            $annotationsTextBoxContainer.scrollTo(0, 0);
                                        }
                                    } else {
                                        curr = id;
                                        next = (id - 1) % len;

                                        if (curr === 0) {
                                            let points = Array.from(scrollPoints.values());
                                            next = len - 1;
                                            $annotationsTextBoxContainer.scrollTo(0, points[points.length - 1]);
                                        }
                                    }

                                    if (scrollPoints.has(next)) {
                                        let scrollByVal = scrollPoints.get(next);

                                        $annotationsTextBoxContainer.scrollTo(0, scrollByVal);
                                    }
                                    removeHighlight($annotations[curr]);
                                    addHighlight($annotations[next]);
                                    return {
                                        $prevSentenceNode: $annotations[curr],
                                    };
                                }
                            }
                        }
                        addHighlight($annotations[0]);
                        return {
                            $prevSentenceNode: null,
                        };
                    };

                    const getSentenceInfo = $element => {
                        if ($element !== null) {
                            let sentenceId = $element.getElementsByClassName('annotation-id')[0].innerText;
                            let startTime = $element.getElementsByClassName('annotation-start')[0].innerText;
                            let endTime = $element.getElementsByClassName('annotation-end')[0].innerText;
                            let text = $element.getElementsByClassName('annotation-lines')[0].innerText.trim();

                            startTime = timeStringToFloat(startTime);
                            endTime = timeStringToFloat(endTime);

                            return { sentenceId, startTime, endTime, text };
                        }
                        return null;
                    };

                    const getCursorStopPoint = () => {
                        let cursorPos = parseInt($cursor.style.left);
                        let stopTime = parseFloat(cursorPos / oneSecond);

                        return stopTime;
                    };

                    const moveCursor = offsetSeconds => {
                        let cursorPos = parseInt($cursor.style.left);
                        let offset = offsetSeconds * oneSecond;

                        cursorPos += offset;

                        $cursor.style.left = cursorPos.toString() + 'px';
                    };

                    const diffTimes = (oldTime, newTime) => oldTime !== newTime;

                    const getSentenceTimeInfo = ($sentence, sentenceId) => {
                        const { startTime: newStartTime, endTime: newEndTime } = getSentenceInfo($sentence);

                        const oldStartTime = parseFloat(notesCache[sentenceId]['begin']);
                        const oldEndTime = parseFloat(notesCache[sentenceId]['end']);

                        return { newStartTime, newEndTime, oldStartTime, oldEndTime };
                    };

                    const diffExists = (sentenceId, newText, currNewStartTime, currNewEndTime) => {
                        const oldText = notesCache[sentenceId]['lines'].trim();

                        const currOldStartTime = parseFloat(notesCache[sentenceId]['begin']);
                        const currOldEndTime = parseFloat(notesCache[sentenceId]['end']);

                        const currStartTimeChanged = diffTimes(currOldStartTime, currNewStartTime);
                        const currEndTimeChanged = diffTimes(currOldEndTime, currNewEndTime);

                        let textChanged = false;

                        if (currStartTimeChanged) {
                            notesCache[sentenceId]['begin'] = currNewStartTime.toString();
                        }
                        if (currEndTimeChanged) {
                            notesCache[sentenceId]['end'] = currNewEndTime.toString();
                        }
                        if (newText.length !== oldText.length || newText !== oldText) {
                            notesCache[sentenceId]['lines'] = newText.trim();

                            textChanged = true;
                        }

                        return {
                            currStartTimeChanged,
                            currEndTimeChanged,
                            textChanged,
                        };
                    };

                    const save = async $sentenceNode => {
                        const sentences = [];

                        if ($sentenceNode !== null) {
                            let { sentenceId, text, startTime, endTime } = getSentenceInfo($sentenceNode);

                            sentenceId -= 1; // convert to zero based indexing

                            const { currStartTimeChanged, currEndTimeChanged, textChanged } = diffExists(
                                sentenceId,
                                text,
                                startTime,
                                endTime
                            );

                            if (currStartTimeChanged || currEndTimeChanged || textChanged) {
                                dispatch(toggleSaveMode(true));

                                if (sentenceId == 0) {
                                    let { text, startTime, endTime } = getSentenceInfo($annotations[sentenceId + 1]);
                                    sentences.push({
                                        sentenceId: props.notes[sentenceId + 1]['sentenceId'],
                                        text,
                                        startTime,
                                        endTime,
                                    });
                                } else if (sentenceId === $annotations.length - 1) {
                                    let { text, startTime, endTime } = getSentenceInfo($annotations[sentenceId - 1]);
                                    sentences.push({
                                        sentenceId: props.notes[sentenceId - 1]['sentenceId'],
                                        text,
                                        startTime,
                                        endTime,
                                    });
                                } else {
                                    let { sentenceId: prevId, ...prevSentenceData } = getSentenceInfo(
                                        $annotations[sentenceId + 1]
                                    );
                                    sentences.push({
                                        sentenceId: props.notes[sentenceId + 1]['sentenceId'],
                                        ...prevSentenceData,
                                    });

                                    let { sentenceId: nextId, ...nextSentenceData } = getSentenceInfo(
                                        $annotations[sentenceId - 1]
                                    );
                                    sentences.push({
                                        sentenceId: props.notes[sentenceId - 1]['sentenceId'],
                                        ...nextSentenceData,
                                    });
                                }

                                sentences.push({
                                    sentenceId: props.notes[sentenceId]['sentenceId'],
                                    text,
                                    startTime,
                                    endTime,
                                });

                                const URL = `${process.env.REACT_APP_API_HOST}/api/speech/${props._id}/transcripts`;
                                const token = localStorage.getItem('token');

                                const res = await axios({
                                    method: 'PUT',
                                    url: URL,
                                    mode: 'cors',
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                    data: {
                                        sentences,
                                    },
                                });

                                return res;
                            }
                        }
                        return null;
                    };

                    const scrollToSection = sentenceId => {
                        addSectionHighlight($sentenceSectionBoxes[sentenceId - 1]);

                        let scrollVal = parseInt($sentenceSectionBoxes[sentenceId - 1].style.left);

                        $waveform.scrollTo(prevScroll + scrollVal, 0);

                        prevScroll += scrollVal;
                    };

                    const scrollToSentence = sentenceId => {
                        $annotationsTextBoxContainer.scrollTo(0, annotationBoxHeights[sentenceId - 1]);
                    };

                    const cue = (mode = 'normal') => {
                        let $currentHighlighted = getCurrentHighlightedElement();

                        const initialCursorPoint = getCursorStopPoint();

                        if ($currentHighlighted !== null) {
                            let { sentenceId, startTime, endTime } = getSentenceInfo($currentHighlighted);

                            let setHighlighter = null;

                            scrollToSection(sentenceId);

                            if (initialCursorPoint > startTime && mode === 'normal') {
                                startTime = initialCursorPoint;
                            }

                            if (playMode === 'pause') {
                                ee.emit('pause');
                                playMode = 'resume';
                                if (setHighlighter !== null) {
                                    clearTimeout(setHighlighter);
                                }
                            } else {
                                if (playMode === 'resume') {
                                    startTime = getCursorStopPoint();
                                    setHighlighter = setTimeout(
                                        () => addHighlight($currentHighlighted),
                                        (endTime - startTime + 0.01) * 1000
                                    );
                                }
                                ee.emit('play', startTime, endTime);
                                playMode = 'pause';
                            }
                            /* make sure highlight is added just after pause / resume */
                            setTimeout(() => addHighlight($currentHighlighted), 10);
                        } else {
                            ee.emit('play', initialCursorPoint);
                        }
                    };

                    autoSave = setInterval(() => {
                        let $currentHighlighted = getCurrentHighlightedElement();
                        if (!inSaveMode) {
                            save($currentHighlighted).then(resp => {
                                if (resp !== null) {
                                    console.log('Auto saved!');
                                    setTimeout(() => dispatch(toggleSaveMode(false)), 1000);
                                }
                            });
                        }
                    }, 500);

                    // $playButton.on('click', () => {
                    //     const initialCursorPoint = getCursorStopPoint();

                    //     ee.emit('play', initialCursorPoint);

                    //     let cursorLimit = $annotationsBoxesDiv.offsetWidth;

                    //     cursorUpdate = setInterval(() => {
                    //         if (parseInt($cursor.style.left) >= cursorLimit) {
                    //             $waveform.scrollTo(cursorLimit, 0);
                    //         }
                    //     }, 1000);
                    // });

                    // $pauseButton.on('click', () => {
                    //     ee.emit('pause');
                    // });

                    // $stopButton.on('click', () => {
                    //     removeAllHighlights();

                    //     $waveform.scrollTo(0, 0);

                    //     ee.emit('stop');
                    // });

                    $waveform.addEventListener('scroll', e => {
                        prevScroll = $waveform.scrollLeft;
                    });

                    for (let $annotationTextBox of $annotationsTextBoxes) {
                        /* 
                            Play audio when focused into edit mode
                            on a sentence

                            CTRL + p
                        */
                        $annotationTextBox.addEventListener('keydown', e => {
                            if (e.ctrlKey && e.keyCode === 80) {
                                cue('normal');
                            }
                        });

                        /* 
                            Restart audio play when focused into edit mode
                            on a sentence

                            CTRL + b
                        */
                        $annotationTextBox.addEventListener('keydown', e => {
                            if (e.ctrlKey && e.keyCode === 66) {
                                playMode = 'play';
                                cue('restart');
                            }
                        });

                        /* 
                            Plus 0.1s to track

                            CTRL + rightArrow
                        */
                        $annotationTextBox.addEventListener('keydown', e => {
                            if (e.ctrlKey && e.keyCode === 187) {
                                e.preventDefault();
                                moveCursor(0.1);
                            }
                        });

                        /* 
                            Minus 0.1s to track

                            CTRL + leftArrow
                        */
                        $annotationTextBox.addEventListener('keydown', e => {
                            if (e.ctrlKey && e.keyCode === 189) {
                                e.preventDefault();
                                moveCursor(-0.1);
                            }
                        });

                        /* 
                           Click to select sentence and scroll to 
                           corresponding section on the waveform
                        */
                        $annotationTextBox.addEventListener('click', e => {
                            removeAllHighlights();

                            let $currentClickedSentence = e.path[1];
                            let { sentenceId } = getSentenceInfo($currentClickedSentence);

                            scrollToSection(sentenceId);
                            addHighlight($currentClickedSentence);
                        });
                    }

                    for (let $sectionBox of $sentenceSectionBoxes) {
                        $sectionBox.addEventListener('click', e => {
                            e.preventDefault();

                            removeAllHighlights();
                            const sentenceId = parseInt(e.srcElement.innerText) - 1;

                            console.log($annotations[sentenceId]);

                            scrollToSentence(sentenceId);
                        });
                    }

                    /* 
                        Define keyboard shortcuts
                    */
                    hotkeys('down', (e, handler) => {
                        e.preventDefault();
                        const { $prevSentenceNode } = getNextForHighlight(scrollPoints, 'down');

                        /* 
                            Call function to save edit here
                        */
                        save($prevSentenceNode).then(resp => {
                            console.log('saved!');
                            setTimeout(() => dispatch(toggleSaveMode(false)), 1000);
                        });

                        playMode = 'play';
                    });

                    hotkeys('up', (e, handler) => {
                        e.preventDefault();
                        const { $prevSentenceNode } = getNextForHighlight(scrollPoints, 'up');

                        /* 
                            Call function to save edit here
                        */
                        save($prevSentenceNode).then(resp => {
                            console.log('saved!');
                            setTimeout(() => dispatch(toggleSaveMode(false)), 1000);
                        });

                        playMode = 'play';
                    });

                    hotkeys('enter', (e, handler) => {
                        e.preventDefault();
                        let $currentHighlighted = getCurrentHighlightedElement();

                        console.log('enter');

                        if ($currentHighlighted !== null) {
                            let $currentAnnotationText = $currentHighlighted.getElementsByClassName(
                                'annotation-lines'
                            )[0];
                            let { sentenceId } = getSentenceInfo($currentHighlighted);

                            /* Reason for timeout: https://stackoverflow.com/questions/15859113/focus-not-working */
                            setTimeout(() => $currentAnnotationText.focus(), 0);

                            scrollToSection(sentenceId);
                        }
                    });

                    hotkeys('ctrl+p', (e, handler) => {
                        e.preventDefault();

                        cue();
                    });
                });
        }, 100);
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
