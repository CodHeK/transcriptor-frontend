/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton'; // (https://github.com/dvtng/react-loading-skeleton#readme)
import EventEmitter from 'event-emitter';
import hotkeys from 'hotkeys-js';
import $ from 'jquery';
import '../styles.css';
import dataProvider from '../dataProvider';

import { useDispatch, useSelector } from 'react-redux';
import { saveEventEmitter, toggleSaveMode, releaseToast } from '../../actions/TranscriptionActions';
import { useToasts } from 'react-toast-notifications';

const WaveformPlaylist = require('waveform-playlist');
const hasListeners = require('event-emitter/has-listeners');
const axios = require('axios');

const Playlist = props => {
    const [playlistLoaded, setPlaylistLoaded] = useState(false);

    const { inSaveMode, toast } = useSelector(state => ({ ...state.TRANSCRIPTION }));

    const dispatch = useDispatch();
    const { addToast, removeToast } = useToasts();

    useEffect(() => {
        if (toast != null) {
            const { content, ...toastProps } = toast;
            addToast(content, { autoDismiss: true, ...toastProps });

            dispatch(releaseToast(null));
        }
    }, [toast]);

    let cachedSamplesPerPixel =
        2000 -
        (JSON.parse(localStorage.getItem('editorState'))
            ? JSON.parse(localStorage.getItem('editorState')).zoomLevel
            : 1000);

    useEffect(() => {
        let playlist = WaveformPlaylist.init(
            {
                container: document.getElementById('waveform-playlist-container'),
                timescale: true,
                state: 'cursor',
                colors: {
                    waveOutlineColor: 'white',
                    timeColor: 'grey',
                    fadeColor: 'black',
                },
                annotationList: {
                    annotations: props.notes,
                    controls: props.actions,
                    editable: true,
                    isContinuousPlay: false,
                    linkEndpoints: false,
                },
                seekStyle: 'line',
                samplesPerPixel: cachedSamplesPerPixel,
                waveHeight: 100,
                zoomLevels: [200, 300, 400, 500, 1000, 1500, 1600, 1700, 1800],
                options: {
                    isAutomaticScroll: true,
                },
                controls: {
                    /* 
                        Controls display is set to none,
                        only used to click() the mute button using JS
                    */
                    show: true,
                    width: 0,
                },
            },
            EventEmitter()
        );

        setTimeout(() => {
            playlist
                .load([
                    {
                        src: `${process.env.REACT_APP_API_HOST}/${props.fileInfo.path}`,
                        muted: false,
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
                    const $zoomOut = $('.btn-zoom-out');
                    const $zoomIn = $('.btn-zoom-in');
                    const $waveform = $('.playlist-tracks')[0];
                    const $annotationsTextBoxContainer = document.getElementsByClassName('annotations-text')[0];
                    const $sentenceSectionBoxes = document.getElementsByClassName('annotation-box');
                    const $annotationsBoxesDiv = document.getElementsByClassName('annotations-boxes')[0];
                    const $annotationsTextBoxes = document.getElementsByClassName('annotation-lines');
                    const $cursor = document.getElementsByClassName('cursor')[0];
                    const $waveformTrack = document.getElementsByClassName('waveform')[0];
                    const $selectionPoint = document.getElementsByClassName('point')[0];
                    let $annotations = document.getElementsByClassName('annotation'); // will change on delete
                    const $timeTicks = Array.from(document.getElementsByClassName('time'));
                    const $sentenceDeleteCrosses = $annotationsTextBoxContainer.getElementsByClassName('fa-times');
                    const $setenceRevertIcons = $annotationsTextBoxContainer.getElementsByClassName('fa-history');

                    let notesCache = props.notes;
                    let prevScroll = 0;
                    let zoomLevels = [200, 300, 400, 500, 1000, 1500, 1600, 1700, 1800];
                    let cachedZoomLevel = JSON.parse(localStorage.getItem('editorState'))
                        ? JSON.parse(localStorage.getItem('editorState')).zoomLevel
                        : 1000;
                    let currZoomLevel = zoomLevels.indexOf(cachedZoomLevel);

                    let annotationsContainerHeight =
                        $annotationsTextBoxContainer && $annotationsTextBoxContainer.offsetHeight > 320 ? 550 : 300;
                    let annotationBoxHeights = Array.from($annotations).map($annotation => $annotation.offsetHeight);
                    let scrollPoints = new Set();
                    let sentenceIdOnCursor = 0;
                    let cursorLimit = $annotationsBoxesDiv && $annotationsBoxesDiv.offsetWidth;
                    let playMode = 'play';
                    let sentenceFocus = false;

                    for (let i = 1; i < annotationBoxHeights.length; i++) {
                        annotationBoxHeights[i] += annotationBoxHeights[i - 1];
                    }

                    /*
                        Time related vars and methods
                    */

                    const timeStringToFloat = time => {
                        let [hours, minutes, seconds] = time.split(':').map(unit => parseFloat(unit));

                        let totalSeconds = hours * 3600 + minutes * 60 + seconds;

                        return totalSeconds;
                    };

                    const unitTimeOfMeasure = () => {
                        return (
                            $timeTicks &&
                            timeStringToFloat('00:' + $timeTicks[1].innerText) -
                                timeStringToFloat('00:' + $timeTicks[0].innerText)
                        );
                    };

                    let unitTime = null;

                    const oneSecondinPx = () => {
                        unitTime = unitTimeOfMeasure();
                        console.log(unitTime);
                        return (
                            $timeTicks &&
                            (parseInt($timeTicks[1].style.left) - parseInt($timeTicks[0].style.left) + 1.0) / unitTime
                        );
                    };

                    let oneSecond = oneSecondinPx();
                    console.log(oneSecond);

                    /* 
                        Unsubscribe to all event listeners
                    */
                    $waveform.removeEventListener('scroll', () => console.log('rmd'));
                    $annotationsTextBoxContainer.removeEventListener('click', () => console.log('rmd'));
                    Array.from($annotationsTextBoxes).map($annotationsTextBox => {
                        $annotationsTextBox.removeEventListener('keydown', () => console.log('rmd'));
                        $annotationsTextBox.removeEventListener('click', () => console.log('rmd'));
                    });
                    Array.from($sentenceSectionBoxes).map($sentenceBox => {
                        $sentenceBox.removeEventListener('click', () => console.log('rmd'));
                    });
                    hotkeys.unbind('down');
                    hotkeys.unbind('up');
                    hotkeys.unbind('enter');
                    hotkeys.unbind('ctrl+p');
                    clearInterval(autoSave);
                    clearInterval(cursorUpdate);

                    /* 
                        Utility functions
                    */
                    const updateAnnotationBoxHeights = () => {
                        annotationBoxHeights = Array.from($annotations).map($annotation => $annotation.offsetHeight);

                        for (let i = 1; i < annotationBoxHeights.length; i++) {
                            annotationBoxHeights[i] += annotationBoxHeights[i - 1];
                        }
                    };

                    const updateAnnotations = () => {
                        $annotations = document.getElementsByClassName('annotation');

                        updateAnnotationBoxHeights();
                    };

                    const removeSentenceHighlight = $element => {
                        $element.classList.remove('current');
                    };

                    const addSentenceHighlight = $element => {
                        console.log($element);
                        $element.classList.add('current');
                    };

                    const removeAllSentenceHighlights = () => {
                        Array.from($annotations).map($e => $e.classList.remove('current'));
                    };

                    const addSectionHighlight = $element => {
                        $element.classList.add('section-highlight');
                    };

                    const removeSectionHighlight = $element => {
                        $element.classList.remove('section-highlight');
                    };

                    const removeAllSectionHighlights = () => {
                        Array.from($sentenceSectionBoxes).map($e => $e.classList.remove('section-highlight'));
                    };

                    const removeAllHighlights = () => {
                        Array.from($annotations).map($e => $e.classList.remove('current'));
                        Array.from($sentenceSectionBoxes).map($e => $e.classList.remove('section-highlight'));
                    };

                    const getCurrentHighlightedElement = () => {
                        for (let $annotation of $annotations) {
                            if (Array.from($annotation.classList).includes('current')) {
                                return $annotation;
                            }
                        }
                        return null;
                    };

                    const lower_bound = (target, list) => {
                        let l = 0,
                            r = list.length;

                        while (l < r) {
                            const mid = parseInt((l + r) / 2);

                            if (list[mid] >= target) {
                                r = mid;
                            } else {
                                l = mid + 1;
                            }
                        }

                        return l;
                    };

                    const calcSentenceScrollEndPoints = () => {
                        const annotationsContainerScrollTop = $annotationsTextBoxContainer.scrollTop;

                        let topSentenceId = lower_bound(annotationsContainerScrollTop, annotationBoxHeights);

                        if (annotationBoxHeights[topSentenceId] === annotationsContainerHeight) {
                            topSentenceId += 1;
                        }

                        let bottomSentenceId = lower_bound(
                            annotationBoxHeights[topSentenceId] + annotationsContainerHeight,
                            annotationBoxHeights
                        );

                        scrollPoints.clear();
                        scrollPoints.add(topSentenceId);
                        scrollPoints.add(bottomSentenceId);
                    };

                    const constructAnnotationsContainer = () => {
                        /*
                            Convert the contenteditable in .annotations to textareas
                        */
                        let idx = 0;
                        for (let $annotation of $annotations) {
                            const $contentEditAbleSpan = $annotation.getElementsByClassName('annotation-lines')[0];
                            const $annotationsActionsDiv = $annotation.getElementsByClassName('annotation-actions')[0];
                            const sentenceText = $contentEditAbleSpan.innerText.trim();

                            const $textarea = document.createElement('textarea');

                            $textarea.value = sentenceText;
                            $textarea.classList.add('annotation-lines');

                            $annotation.removeChild($contentEditAbleSpan);
                            $annotation.insertBefore($textarea, $annotationsActionsDiv);

                            const $revertIcon = $annotation.getElementsByClassName('fa-history')[0];

                            if (!props.notes[idx].prevText) {
                                $revertIcon.classList.add('disable');
                            } else if (props.notes[idx].prevText === props.notes[idx].lines) {
                                $revertIcon.classList.add('disable');
                            }
                            idx++;
                        }
                    };

                    const buildAnnotationHeights = () => {
                        for (let $annotation of $annotations) {
                            let $textarea = $annotation.getElementsByClassName('annotation-lines')[0];

                            $textarea.style.height = $textarea.scrollHeight + 15 + 'px';
                        }
                    };

                    const getNextForHighlight = (scrollPoints, mode) => {
                        let len = $annotations.length;
                        for (let idx in $annotations) {
                            let id = parseInt(idx);
                            if (!isNaN(id)) {
                                if (Array.from($annotations[id].classList).includes('current')) {
                                    /* 
                                        Auto scroll annotations container
                                    */
                                    let curr, next;
                                    if (mode === 'down') {
                                        curr = id;
                                        next = (id + 1) % len;

                                        if (next === 0) {
                                            $annotationsTextBoxContainer.scrollTo({ left: 0, top: 0 });
                                        } else {
                                            if (scrollPoints.has(next)) {
                                                let scrollByVal = annotationBoxHeights[curr];

                                                $annotationsTextBoxContainer.scrollTo({ left: 0, top: scrollByVal });
                                            }
                                        }
                                    } else {
                                        curr = id;
                                        next = (id - 1) % len;

                                        if (curr === 0) {
                                            let scrollByVal = annotationBoxHeights[len - 1];
                                            next = len - 1;
                                            $annotationsTextBoxContainer.scrollTo({ left: 0, top: scrollByVal });
                                        } else {
                                            if (scrollPoints.has(next)) {
                                                let scrollByVal = annotationBoxHeights[next - 1];

                                                $annotationsTextBoxContainer.scrollTo({ left: 0, top: scrollByVal });
                                            }
                                        }
                                    }

                                    removeSentenceHighlight($annotations[curr]);
                                    addSentenceHighlight($annotations[next]);
                                    return {
                                        $prevSentenceNode: $annotations[curr],
                                    };
                                }
                            }
                        }
                        addSentenceHighlight($annotations[0]);
                        return {
                            $prevSentenceNode: null,
                        };
                    };

                    const getSentenceInfo = $element => {
                        if ($element) {
                            let sentenceId = $element.getElementsByClassName('annotation-id')[0].innerText;
                            let startTime = $element.getElementsByClassName('annotation-start')[0].innerText;
                            let endTime = $element.getElementsByClassName('annotation-end')[0].innerText;
                            let text = $element.getElementsByClassName('annotation-lines')[0].value.trim();

                            startTime = timeStringToFloat(startTime);
                            endTime = timeStringToFloat(endTime);

                            return { sentenceId, startTime, endTime, text };
                        }
                        return null;
                    };

                    const getCursorPosition = () => {
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

                    const setCursor = time => {
                        console.log('time: ', time, ' oneSecond: ', oneSecond);
                        let offset = parseFloat(time) * oneSecond;

                        console.log('offset ', offset);

                        $cursor.style.left = offset.toString() + 'px';
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

                                if (sentenceId === 0 && $annotations[sentenceId + 1] && props.notes[sentenceId + 1]) {
                                    let { text, startTime, endTime } = getSentenceInfo($annotations[sentenceId + 1]);
                                    sentences.push({
                                        sentenceId: props.notes[sentenceId + 1]['sentenceId'],
                                        text,
                                        startTime,
                                        endTime,
                                    });
                                } else if (
                                    sentenceId === $annotations.length - 1 &&
                                    $annotations[sentenceId - 1] &&
                                    props.notes[sentenceId - 1]
                                ) {
                                    let { text, startTime, endTime } = getSentenceInfo($annotations[sentenceId - 1]);
                                    sentences.push({
                                        sentenceId: props.notes[sentenceId - 1]['sentenceId'],
                                        text,
                                        startTime,
                                        endTime,
                                    });
                                } else {
                                    if ($annotations[sentenceId + 1] && $annotations[sentenceId - 1]) {
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
                                }

                                if (textChanged) {
                                    /* 
                                        Some edit has happened which means
                                        revert back is allowed now
                                    */
                                    const $revertIcon = $sentenceNode.getElementsByClassName('fa-history')[0];
                                    $revertIcon.classList.remove('disable');
                                }

                                sentences.push({
                                    sentenceId: props.notes[sentenceId]['sentenceId'],
                                    text,
                                    startTime,
                                    endTime,
                                });

                                const res = await dataProvider.speech.transcripts.update('', {
                                    id: props._id,
                                    options: {
                                        data: {
                                            sentences,
                                        },
                                    },
                                });

                                return res;
                            }
                        }
                        return null;
                    };

                    const scrollToSection = sentenceId => {
                        addSectionHighlight($sentenceSectionBoxes[sentenceId - 1]);

                        let scrollVal = parseInt($sentenceSectionBoxes[sentenceId - 1].style.left) - 20;

                        $waveform.scrollTo({
                            left: prevScroll + scrollVal,
                            top: 0,
                            behavior: 'smooth',
                        });

                        prevScroll += scrollVal;
                    };

                    const scrollToSentence = sentenceId => {
                        $annotationsTextBoxContainer.scrollTo({
                            left: 0,
                            top: annotationBoxHeights[sentenceId - 1],
                            behavior: 'smooth',
                        });
                    };

                    let setHighlighter = null;

                    const cue = (mode = 'normal') => {
                        let $currentHighlighted = getCurrentHighlightedElement();

                        const initialCursorPoint = getCursorPosition();

                        if ($currentHighlighted !== null && sentenceFocus) {
                            let { startTime, endTime } = getSentenceInfo($currentHighlighted);

                            if (initialCursorPoint > startTime && mode === 'normal') {
                                startTime = initialCursorPoint;
                            }

                            if (playMode === 'pause') {
                                ee.emit('pause');
                                playMode = 'play';
                                clearTimeout(setHighlighter);
                            } else {
                                clearTimeout(setHighlighter);

                                setHighlighter = setTimeout(() => {
                                    addSentenceHighlight($currentHighlighted);

                                    let { startTime: actualStartTime } = getSentenceInfo($currentHighlighted);
                                    setCursor(actualStartTime + 0.2);

                                    props.callbacks.changeTrackMode('pause', null, ee);
                                    playMode = 'play';
                                }, (endTime - startTime + 0.05) * 1000);

                                ee.emit('play', startTime, endTime);
                                playMode = 'pause';
                            }
                            /* make sure highlight is added just after pause / resume */
                            setTimeout(() => {
                                addSentenceHighlight($currentHighlighted);
                            }, 50);
                        } else {
                            if (playMode === 'play') {
                                removeAllSectionHighlights();

                                ee.emit('play', initialCursorPoint);
                                playMode = 'pause';
                            } else if (playMode === 'pause') {
                                ee.emit('pause');
                                playMode = 'play';
                            }
                        }

                        /* 
                            Opposite as playMode denotes the next possible 
                            state of the player. If playMode is 'pause' 
                            it is currently playing the track.
                        */
                        props.callbacks.changeTrackMode(playMode === 'play' ? 'pause' : 'play', null, ee);
                    };

                    const findSentence = time => {
                        for (let $annotation of $annotations) {
                            let { sentenceId, startTime, endTime } = getSentenceInfo($annotation);

                            if (time >= startTime && time < endTime) {
                                return {
                                    $currSentence: $annotation,
                                    sentenceId,
                                };
                            }
                        }
                        return {};
                    };

                    autoSave = setInterval(() => {
                        let $currentHighlighted = getCurrentHighlightedElement();
                        const autoSaveMode = localStorage.getItem('autoSave');

                        if (!inSaveMode && autoSaveMode === 'true') {
                            save($currentHighlighted).then(resp => {
                                if (resp !== null) {
                                    console.log('Auto saved!');
                                    setTimeout(() => dispatch(toggleSaveMode(false)), 1000);
                                }
                            });
                        }
                    }, 500);

                    cursorUpdate = setInterval(() => {
                        if (!sentenceFocus) {
                            let cursorPos = getCursorPosition();

                            /* 
                                playMode denotes the next possible 
                                state of the player. If playMode is 'pause' 
                                it is currently playing the track.
                            */
                            if (playMode === 'pause') {
                                let relativeFirstTick = parseInt($timeTicks[0].style.left);
                                let relativeFirstTickTime = timeStringToFloat('00:' + $timeTicks[0].innerText);

                                let cursorPosFromStart =
                                    relativeFirstTick + (cursorPos - relativeFirstTickTime) * oneSecond;

                                if (cursorPosFromStart >= cursorLimit) {
                                    $waveform.scrollTo({ left: prevScroll + cursorLimit, top: 0, behavior: 'smooth' });
                                }
                            }

                            let { $currSentence, sentenceId } = cursorPos && findSentence(cursorPos);

                            sentenceIdOnCursor = sentenceId;

                            removeAllSentenceHighlights();

                            $currSentence && addSentenceHighlight($currSentence);
                        }

                        localStorage.setItem('cursorPos', getCursorPosition());
                    }, 1000);

                    const updateEditorState = () => {
                        let $currentHighlighted = getCurrentHighlightedElement();
                        let sentenceId = null;

                        if ($currentHighlighted) {
                            sentenceId = getSentenceInfo($currentHighlighted).sentenceId;
                        }

                        let currEditorState = {
                            waveFormScroll: $waveform.scrollLeft,
                            annotationsContainerScroll: $annotationsTextBoxContainer.scrollTop,
                            cursorPos: $cursor.style.left,
                            currentHighlightedSentenceId: sentenceId,
                            sentenceInFocus: sentenceFocus,
                            zoomLevel: zoomLevels[currZoomLevel],
                        };
                        localStorage.setItem('editorState', JSON.stringify(currEditorState));
                    };

                    const loadEditorState = () => {
                        let prevState = JSON.parse(localStorage.getItem('editorState'));

                        if (prevState) {
                            $waveform.scrollTo({ left: prevState.waveFormScroll, top: 0 });
                            $annotationsTextBoxContainer.scrollTo({
                                left: 0,
                                top: prevState.annotationsContainerScroll,
                                behavior: 'smooth',
                            });
                            $cursor.style.left = prevState.cursorPos;

                            let sentenceId = prevState.currentHighlightedSentenceId;

                            sentenceId && addSentenceHighlight($annotations[sentenceId - 1]);
                            sentenceFocus = prevState.sentenceInFocus;
                            const prevZoomLevel = prevState.zoomLevel;
                            currZoomLevel = zoomLevels.indexOf(prevZoomLevel);

                            if (sentenceFocus) {
                                let $currentAnnotationText = $annotations[sentenceId - 1].getElementsByClassName(
                                    'annotation-lines'
                                )[0];

                                setTimeout(() => $currentAnnotationText.focus(), 0);
                                addSectionHighlight($sentenceSectionBoxes[sentenceId - 1]);
                            }

                            localStorage.setItem('loadSavedState', 'false');
                        }
                    };

                    const getEnclosingAnnotationElement = e => {
                        let $element = e.target;

                        if ($element.classList[0] !== 'annotation') {
                            if ($element.classList[0] === 'fa' || $element.classList[0] === 'fas') {
                                $element = e.path[2];
                            } else {
                                $element = e.path[1]; // parent which is .annotation
                            }
                        }
                        return $element;
                    };

                    const updateSentence = args => {
                        const { $sentence, text } = args;

                        const $textarea = $sentence.getElementsByClassName('annotation-lines')[0];

                        $textarea.value = text;
                    };

                    /* 
                        Playlist initialization method calls
                        and calculations done here
                    */
                    constructAnnotationsContainer();
                    buildAnnotationHeights();
                    calcSentenceScrollEndPoints(); // init scroll points
                    localStorage.getItem('loadSavedState') === 'true' && loadEditorState(); // load prev state from localStorage

                    /* 
                        Events
                    */
                    $zoomIn.on('click', e => {
                        ee.emit('zoomin');
                        currZoomLevel = Math.min(zoomLevels.length - 1, currZoomLevel + 1);

                        setTimeout(() => {
                            oneSecond = oneSecondinPx();
                            updateEditorState();
                            console.log(oneSecond);
                        }, 50);
                    });

                    $zoomOut.on('click', e => {
                        ee.emit('zoomout');
                        currZoomLevel = Math.max(0, currZoomLevel - 1);

                        setTimeout(() => {
                            oneSecond = oneSecondinPx();
                            updateEditorState();
                            console.log(oneSecond);
                        }, 50);
                    });

                    for (let $annotationTextBox of $annotationsTextBoxes) {
                        /* 
                            Play audio when focused into edit mode
                            on a sentence

                            CTRL + p
                        */
                        $annotationTextBox.addEventListener('keydown', e => {
                            if (e.ctrlKey && e.keyCode === 80) {
                                e.preventDefault();

                                cue();

                                updateEditorState();
                            }
                        });

                        /* 
                            Restart audio play when focused into edit mode
                            on a sentence

                            CTRL + b
                        */
                        $annotationTextBox.addEventListener('keydown', e => {
                            if (e.ctrlKey && e.keyCode === 66) {
                                e.preventDefault();

                                playMode = 'play';

                                cue('restart');

                                updateEditorState();
                            }
                        });

                        /* 
                            Plus 0.1s to track

                            CTRL + plus
                        */
                        $annotationTextBox.addEventListener('keydown', e => {
                            if (e.ctrlKey && e.keyCode === 187) {
                                e.preventDefault();

                                moveCursor(0.1);

                                updateEditorState();
                            }
                        });

                        /* 
                            Minus 0.1s to track

                            CTRL + minus
                        */
                        $annotationTextBox.addEventListener('keydown', e => {
                            if (e.ctrlKey && e.keyCode === 189) {
                                e.preventDefault();

                                moveCursor(-0.1);

                                updateEditorState();
                            }
                        });

                        /* 
                            Prevent page refresh on ctrl+r and command+r
                        */
                        $annotationTextBox.addEventListener('keydown', e => {
                            if (e.ctrlKey && e.keyCode === 82) {
                                // ctrl + r
                                e.preventDefault();
                            }
                        });

                        $annotationTextBox.addEventListener('keydown', e => {
                            if (e.metaKey && e.keyCode === 82) {
                                // command + r
                                e.preventDefault();
                            }
                        });

                        /* 
                            Press ENTER to move out of focus 
                            after editing sentence
                        */
                        $annotationTextBox.addEventListener('keydown', e => {
                            if (e.keyCode === 13) {
                                e.preventDefault();

                                let $currentHighlighted = getCurrentHighlightedElement();
                                let $currentAnnotationText = $currentHighlighted.getElementsByClassName(
                                    'annotation-lines'
                                )[0];

                                let { startTime, endTime } = getSentenceInfo($currentHighlighted);
                                let cursorPosTime = getCursorPosition();

                                sentenceFocus = false;
                                removeAllSectionHighlights();

                                if (cursorPosTime > startTime && cursorPosTime < endTime) {
                                    startTime = cursorPosTime;
                                } else {
                                    startTime += 0.3;
                                }

                                $currentAnnotationText.blur();
                                addSentenceHighlight($currentHighlighted);

                                /* sentence height must have changed due to new text after edit */
                                calcSentenceScrollEndPoints();

                                setTimeout(() => {
                                    setCursor(startTime);
                                    updateEditorState();
                                }, 20);
                            }
                            if (e.keyCode === 9) {
                                // disable tab press
                                e.preventDefault();
                            }
                        });

                        /* 
                           Click to select sentence and scroll to 
                           corresponding section on the waveform
                        */
                        $annotationTextBox.addEventListener('click', e => {
                            clearTimeout(setHighlighter);
                            ee.emit('stop');

                            props.callbacks.changeTrackMode('pause', null, ee);

                            playMode = 'play';
                            sentenceFocus = true;

                            removeAllHighlights();

                            let $currentClickedSentence = e.path[1];
                            let { sentenceId, startTime, endTime } = getSentenceInfo($currentClickedSentence);
                            let cursorPosTime = getCursorPosition();

                            if (cursorPosTime > startTime && cursorPosTime < endTime) {
                                startTime = cursorPosTime;
                            } else {
                                startTime += 0.3;
                            }

                            scrollToSection(sentenceId);

                            setTimeout(() => {
                                console.log('st ', startTime);
                                setCursor(startTime);
                                updateEditorState();
                                addSentenceHighlight($currentClickedSentence);
                            }, 20);
                        });

                        $annotationTextBox.addEventListener('blur', e => {
                            removeAllSectionHighlights();
                        });
                    }

                    for (let $annotation of $annotations) {
                        $annotation.addEventListener('mouseover', e => {
                            let $element = getEnclosingAnnotationElement(e);

                            if (!Array.from($element.classList).includes('current')) {
                                $element.classList.add('current-hover');
                            }

                            const $deleteIcon = $element.getElementsByClassName('fa-times')[0];
                            $deleteIcon.style.display = 'block';

                            const $revertIcon = $element.getElementsByClassName('fa-history')[0];
                            $revertIcon.style.display = 'block';
                        });

                        $annotation.addEventListener('mouseout', e => {
                            let $element = getEnclosingAnnotationElement(e);

                            $element.classList.remove('current-hover');

                            const $deleteIcon = $element.getElementsByClassName('fa-times')[0];
                            $deleteIcon.style.display = 'none';

                            const $revertIcon = $element.getElementsByClassName('fa-history')[0];
                            $revertIcon.style.display = 'none';
                        });
                    }

                    /* 
                        Events handling interactions with 
                        the section box 
                    */
                    for (let $sectionBox of $sentenceSectionBoxes) {
                        $sectionBox.addEventListener('click', e => {
                            e.preventDefault();

                            removeAllHighlights();
                            const sentenceId = parseInt(e.srcElement.innerText);
                            let $currentElement = $annotations[sentenceId - 1];

                            playMode = 'pause';
                            sentenceFocus = false;

                            props.callbacks.changeTrackMode('play', null, ee);

                            if ($currentElement) {
                                let { startTime, endTime } = getSentenceInfo($currentElement);

                                scrollToSentence(sentenceId);
                                scrollToSection(sentenceId);

                                setTimeout(() => {
                                    setCursor(startTime + 0.0);
                                    addSentenceHighlight($currentElement);
                                }, (endTime - startTime + 0.1) * 1000);
                            }

                            updateEditorState();
                        });

                        /* 
                            When user only changes section times without ever
                            going to any sentence
                        */
                        $sectionBox.addEventListener('dragend', e => {
                            let $currentHighlighted = getCurrentHighlightedElement();

                            if ($currentHighlighted === null) {
                                let sentenceId = parseInt(e.path[1].getAttribute('data-id'));
                                $currentHighlighted = $annotations[sentenceId - 1];

                                save($currentHighlighted).then(res => {
                                    console.log('saved section times!');
                                    setTimeout(() => dispatch(toggleSaveMode(false)), 1000);
                                });
                            }
                        });
                    }

                    /* 
                        Handling sentence Revert backs to 
                        previous version
                    */
                    for (let $eachRevertIcon of $setenceRevertIcons) {
                        $eachRevertIcon.addEventListener('click', e => {
                            const $sentence = e.path[2];
                            const { sentenceId } = getSentenceInfo($sentence);

                            if (!Array.from($eachRevertIcon.classList).includes('disable')) {
                                const sentence_id = props.notes.filter(each => each.id === sentenceId)[0].sentenceId;

                                dataProvider.speech.transcripts
                                    .create('revert', {
                                        id: props._id,
                                        options: {
                                            data: {
                                                sentenceId: sentence_id,
                                            },
                                        },
                                    })
                                    .then(res => {
                                        /* 
                                            1. Update sentence text on UI
                                            2. add class that disables click on revert icon
                                            3. add .flash class for highlight on successful revert
                                        */

                                        updateSentence({
                                            $sentence,
                                            text: res.data.sentence.text,
                                        });

                                        $eachRevertIcon.classList.add('disable');
                                        $sentence.classList.add('flash');

                                        setTimeout(() => {
                                            $sentence.classList.remove('flash');
                                        }, 1500);
                                    });
                            } else {
                                dispatch(
                                    releaseToast({
                                        id: sentenceId,
                                        content: 'No previously found edits to revert back to!',
                                        appearance: 'warning',
                                        autoDismissTimeout: 3000,
                                    })
                                );
                            }
                        });
                    }

                    /* 
                        Handling delete sentence
                    */
                    let undoQueue = [];
                    let undoSet = new Set();

                    for (let $sentenceDeleteCross of $sentenceDeleteCrosses) {
                        $sentenceDeleteCross.addEventListener('click', e => {
                            const $sentence = e.path[2];
                            const UNDO_TIME = 5000;
                            const { sentenceId } = getSentenceInfo($sentence);
                            const sentence_id = props.notes.filter(each => each.id === sentenceId)[0].sentenceId;

                            /* delete() and add toast saying ctrl + z to undo */

                            const $sentencesContainer = e.path[3];

                            const $sentenceSectionBox = $annotationsBoxesDiv.querySelector(
                                `div[data-id='${sentenceId}']`
                            );

                            $sentencesContainer.removeChild($sentence);
                            $sentenceSectionBox.style.display = 'none';

                            updateAnnotations();

                            dispatch(
                                releaseToast({
                                    id: sentenceId,
                                    content: 'Press CTRL + Z to undo delete',
                                    appearance: 'info',
                                    autoDismissTimeout: UNDO_TIME,
                                })
                            );

                            let undoTimeout = setTimeout(() => {
                                dataProvider.speech.transcripts
                                    .create('delete', {
                                        id: props._id,
                                        options: {
                                            data: {
                                                sentences: [sentence_id],
                                            },
                                        },
                                    })
                                    .then(res => {
                                        if (res.data.success) {
                                            console.log('Sentence deleted on server!');

                                            if (undoQueue.length > 0) {
                                                undoQueue.shift();
                                                undoSet.delete(sentenceId);
                                            }
                                        }
                                    });
                            }, UNDO_TIME);

                            undoQueue.push({
                                sentenceId, // just for a quick lookup
                                $sentence,
                                $parent: $sentencesContainer,
                                timer: undoTimeout,
                                $sentenceSectionBox,
                            });

                            undoSet.add(sentenceId);
                        });
                    }

                    const updateSetenceBoxes = () => {
                        // NOT BEING USED ANYWHERE
                        if (undoQueue.length > 0) {
                            /*
                                There is some item that can be un-done
                                do not update $waveform on scroll as waveform library re-paints
                                the annotation-boxes and removes display:none on deleted boxes
                            */
                            const $updatedSentenceSectionBoxes = document.getElementsByClassName('annotation-box');

                            for (let $box of $updatedSentenceSectionBoxes) {
                                const sentenceId = $box.getAttribute('data-id');
                                if (undoSet.has(sentenceId)) {
                                    /* 
                                        Means this sentenceId is in undoQueue for now
                                        it's display needs to be none
                                    */
                                    console.log(sentenceId);
                                    $box.style.display = 'none';
                                }
                            }
                        }
                    };

                    $waveform.addEventListener('scroll', e => {
                        e.preventDefault();

                        prevScroll = $waveform.scrollLeft;

                        updateEditorState();
                    });

                    /* 
                        Set point on track to start
                        playing from clicked point on track
                    */
                    $waveformTrack.addEventListener('click', () => {
                        $cursor.style.left = $selectionPoint.style.left;

                        updateEditorState();
                    });

                    $annotationsTextBoxContainer.addEventListener('scroll', () => {
                        calcSentenceScrollEndPoints();

                        updateEditorState();
                    });

                    /* 
                        Define keyboard shortcuts
                    */
                    hotkeys('ctrl+z', (e, handler) => {
                        e.preventDefault();

                        if (undoQueue.length > 0) {
                            const { sentenceId, $sentence, $parent, timer, $sentenceSectionBox } = undoQueue.shift();
                            undoSet.delete(sentenceId);

                            if (timer !== null) {
                                clearTimeout(timer);

                                const { startTime, endTime } = getSentenceInfo($sentence);

                                let flag = true;

                                $sentence.classList.add('flash'); // add flash higlight on undo

                                for (let idx in $annotations) {
                                    let id = parseInt(idx);
                                    if (!isNaN(id)) {
                                        const info = getSentenceInfo($annotations[id]);

                                        if (info.startTime >= endTime) {
                                            // can be optimized using lower_bound()
                                            $parent.insertBefore($sentence, $parent.children[id]);
                                            flag = false;
                                            break;
                                        }
                                    }
                                }
                                if (flag) $parent.appendChild($sentence); // last element was deleted

                                $sentenceSectionBox.style.display = 'block';
                                $sentenceSectionBox.classList.add('flash');

                                setTimeout(() => {
                                    $sentence.classList.remove('flash');
                                    $sentenceSectionBox.classList.remove('flash');
                                }, 1500);

                                removeToast(sentenceId);
                                updateAnnotations();
                            }
                        }
                    });

                    hotkeys('down', (e, handler) => {
                        e.preventDefault();
                        sentenceFocus = true;

                        const { $prevSentenceNode } = getNextForHighlight(scrollPoints, 'down');

                        /* 
                            Call function to save edit here
                        */
                        save($prevSentenceNode).then(resp => {
                            console.log('saved!');
                            setTimeout(() => dispatch(toggleSaveMode(false)), 1000);
                        });

                        playMode = 'play';

                        updateEditorState();
                    });

                    hotkeys('up', (e, handler) => {
                        e.preventDefault();
                        sentenceFocus = true;

                        const { $prevSentenceNode } = getNextForHighlight(scrollPoints, 'up');

                        /* 
                            Call function to save edit here
                        */
                        save($prevSentenceNode).then(resp => {
                            console.log('saved!');
                            setTimeout(() => dispatch(toggleSaveMode(false)), 1000);
                        });

                        playMode = 'play';

                        updateEditorState();
                    });

                    hotkeys('enter', (e, handler) => {
                        e.preventDefault();
                        let $currentHighlighted = getCurrentHighlightedElement();

                        if (!$currentHighlighted) $currentHighlighted = $annotations[sentenceIdOnCursor];

                        if ($currentHighlighted) {
                            let { sentenceId, startTime, endTime } = getSentenceInfo($currentHighlighted);
                            let cursorPosTime = getCursorPosition();

                            let $currentAnnotationText = $currentHighlighted.getElementsByClassName(
                                'annotation-lines'
                            )[0];

                            if (!(playMode === 'pause' && cursorPosTime - startTime > 0.0)) {
                                ee.emit('stop');

                                props.callbacks.changeTrackMode('pause', null, ee);

                                playMode = 'play';

                                let cursorPosTime = getCursorPosition();
                                if (cursorPosTime > startTime && cursorPosTime < endTime) {
                                    startTime = cursorPosTime;
                                } else {
                                    startTime += 0.3;
                                }

                                setTimeout(() => {
                                    setCursor(startTime);
                                    addSentenceHighlight($currentHighlighted);
                                }, 20);
                            }

                            scrollToSection(sentenceId);
                            sentenceFocus = true;

                            /* Reason for timeout: https://stackoverflow.com/questions/15859113/focus-not-working */
                            setTimeout(() => $currentAnnotationText.focus(), 0);
                        }

                        updateEditorState();
                    });

                    hotkeys('ctrl+p', (e, handler) => {
                        e.preventDefault();

                        cue();

                        updateEditorState();
                    });

                    hotkeys('tab', (e, handler) => {
                        e.preventDefault();
                        console.log('pressed tab!');
                    });

                    /* 
                        Block refresh commands of the browser 
                    */
                    hotkeys('command+r', (e, handler) => {
                        e.preventDefault();
                        console.log('refreshed');
                    });

                    hotkeys('ctrl+r', (e, handler) => {
                        e.preventDefault();
                        console.log('refreshed');
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
