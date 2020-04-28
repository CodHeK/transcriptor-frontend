/* eslint-disable react-hooks/exhaustive-deps */
/* eslint no-loop-func: "off" */
import React, { useState, useEffect } from 'react';
import EventEmitter from 'event-emitter';
import hotkeys from 'hotkeys-js';
import $ from 'jquery';
import '../styles.css';
import { EditorLoader } from '../Utils/Loader';
import dataProvider from '../dataProvider';

import { useDispatch, useSelector } from 'react-redux';
import { saveEventEmitter, toggleSaveMode, releaseToast } from '../../actions/TranscriptionActions';
import { useToasts } from 'react-toast-notifications';

const WaveformPlaylist = require('waveform-playlist');

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

    /* 
        setInterval objects
    */
    let cursorUpdate = null;
    let autoSave = null;

    const cleanUp = () => {
        hotkeys.unbind('ctrl+p');
        hotkeys.unbind('ctrl+z');
        hotkeys.unbind('up');
        hotkeys.unbind('down');
        hotkeys.unbind('enter');
        hotkeys.unbind('ctrl+r');
        hotkeys.unbind('command+r');
        hotkeys.unbind('tab');
        clearInterval(cursorUpdate);
        clearInterval(autoSave);
    };

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
                    isAutomaticScroll: false,
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
                    setPlaylistLoaded(true);

                    $('.playlist-toolbar').fadeIn(500);
                    $('#waveform-playlist-container').fadeIn(1000);

                    let ee = playlist.getEventEmitter();
                    dispatch(saveEventEmitter(ee));

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
                    let nextPlayMode = 'play';
                    let editMode = false,
                        sentenceSectionMode = false;

                    let timeMap = new Map();
                    let timeList = [];
                    let popUpInDisplay = false;

                    let currentHighlightedSentence = -1;

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
                        return (
                            $timeTicks &&
                            (parseInt($timeTicks[1].style.left) - parseInt($timeTicks[0].style.left) + 1.0) / unitTime
                        );
                    };

                    let oneSecond = oneSecondinPx();

                    for (let $tick of $timeTicks) {
                        timeMap.set(timeStringToFloat('00:' + $tick.innerText), parseInt($tick.style.left));
                        timeList.push(timeStringToFloat('00:' + $tick.innerText));
                    }

                    /* 
                        Unsubscribe to all event listeners
                        for case when page is refreshed
                    */
                    cleanUp();

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
                        $element && $element.classList.remove('current-selected');
                    };

                    const addSentenceHighlight = $element => {
                        $element && $element.classList.add('current-selected');
                    };

                    // eslint-disable-next-line
                    const removeAllSentenceHighlights = () => {
                        Array.from($annotations).map($e => $e.classList.remove('current-selected'));
                    };

                    const addSectionHighlight = $element => {
                        $element && $element.classList.add('section-highlight');
                    };

                    const removeSectionHighlight = $element => {
                        $element && $element.classList.remove('section-highlight');
                    };

                    const removeAllSectionHighlights = () => {
                        Array.from($sentenceSectionBoxes).map($e => $e.classList.remove('section-highlight'));
                    };

                    const removeAllHighlights = () => {
                        Array.from($annotations).map($e => $e.classList.remove('current-selected'));
                        Array.from($sentenceSectionBoxes).map($e => $e.classList.remove('section-highlight'));
                    };

                    const getCurrentHighlightedElement = () => {
                        if (currentHighlightedSentence !== -1) {
                            return $annotations[currentHighlightedSentence];
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
                            annotationsContainerScrollTop + annotationsContainerHeight,
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

                            $textarea.style.height = '1px';
                            $textarea.style.height = $textarea.scrollHeight + 15 + 'px';
                            $textarea.style.overflow = 'hidden';
                        }
                        updateAnnotations();
                    };

                    const resizeAnnotation = $annotationTextBox => {
                        $annotationTextBox.style.height = '1px'; /* to get content height using scroll Height */
                        $annotationTextBox.style.height = $annotationTextBox.scrollHeight + 15 + 'px';
                    };

                    const moveUp = () => {
                        let len = $annotations.length;

                        let prev = currentHighlightedSentence;
                        let next = (currentHighlightedSentence - 1) % len;

                        if (prev === 0) {
                            /* press up arrow on first sentence */
                            next = len - 1;
                            currentHighlightedSentence = next;

                            removeSentenceHighlight($annotations[prev]);
                            addSentenceHighlight($annotations[next]);

                            let scrollToVal = annotationBoxHeights[len - 1];
                            $annotationsTextBoxContainer.scrollTo({ left: 0, top: scrollToVal });

                            return {
                                $prevSentenceNode: $annotations[prev],
                            };
                        } else if (prev > 0) {
                            /* press up arrow on some sentence except first */
                            currentHighlightedSentence = next;

                            removeSentenceHighlight($annotations[prev]);
                            addSentenceHighlight($annotations[next]);

                            if (scrollPoints.has(next)) {
                                if (next === 0) {
                                    $annotationsTextBoxContainer.scrollTo({ left: 0, top: 0 });
                                } else {
                                    let scrollToVal = annotationBoxHeights[next - 1];
                                    $annotationsTextBoxContainer.scrollTo({ left: 0, top: scrollToVal });
                                }
                            }
                            return {
                                $prevSentenceNode: $annotations[prev],
                            };
                        }
                        return {
                            $prevSentenceNode: null,
                        };
                    };

                    const moveDown = () => {
                        let len = $annotations.length;

                        let prev = currentHighlightedSentence;
                        let next = (currentHighlightedSentence + 1) % len;

                        currentHighlightedSentence = next;

                        if (prev >= 0) {
                            /* Press down arrow on any sentence */
                            if (next === 0) {
                                $annotationsTextBoxContainer.scrollTo({ left: 0, top: 0 });
                            } else {
                                if (scrollPoints.has(next)) {
                                    let scrollToVal = annotationBoxHeights[prev];
                                    $annotationsTextBoxContainer.scrollTo({ left: 0, top: scrollToVal });
                                }
                            }

                            removeSentenceHighlight($annotations[prev]);
                            addSentenceHighlight($annotations[next]);

                            return {
                                $prevSentenceNode: $annotations[prev],
                            };
                        }

                        /* Press down arrow on init */
                        addSentenceHighlight($annotations[next]);
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

                            // if(text) text = text.value.trim();

                            startTime = timeStringToFloat(startTime);
                            endTime = timeStringToFloat(endTime);

                            return { sentenceId, startTime, endTime, text };
                        }
                        return null;
                    };

                    const getTimeAtCursorPosition = () => {
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

                    const setCursorByTime = time => {
                        let offset = parseFloat(time) * oneSecond;

                        $cursor.style.left = offset.toString() + 'px';
                    };

                    const setCursorByLeft = left => {
                        $cursor.style.left = left.toString() + 'px';
                    };

                    const diffTimes = (oldTime, newTime) => oldTime !== newTime;

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
                            const info = getSentenceInfo($sentenceNode);
                            if (info) {
                                let { sentenceId, text, startTime, endTime } = info;

                                sentenceId -= 1; // convert to zero based indexing

                                const { currStartTimeChanged, currEndTimeChanged, textChanged } = diffExists(
                                    sentenceId,
                                    text,
                                    startTime,
                                    endTime
                                );

                                if (currStartTimeChanged || currEndTimeChanged || textChanged) {
                                    dispatch(toggleSaveMode(true));

                                    if (
                                        sentenceId === 0 &&
                                        $annotations[sentenceId + 1] &&
                                        props.notes[sentenceId + 1]
                                    ) {
                                        let { text, startTime, endTime } = getSentenceInfo(
                                            $annotations[sentenceId + 1]
                                        );
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
                                        let { text, startTime, endTime } = getSentenceInfo(
                                            $annotations[sentenceId - 1]
                                        );
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
                        }
                        return null;
                    };

                    const scrollToSection = sentenceId => {
                        addSectionHighlight($sentenceSectionBoxes[sentenceId - 1]);

                        let scrollVal = parseInt($sentenceSectionBoxes[sentenceId - 1].style.left) - 20;
                        const LIMIT = 8000; // 8000px

                        $waveform.scrollTo({
                            left: prevScroll + scrollVal,
                            top: 0,
                            behavior: Math.abs(scrollVal) > LIMIT ? 'auto' : 'smooth',
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

                    const findSentence = time => {
                        for (let $annotation of $annotations) {
                            // can use lower_bound()
                            let { sentenceId, startTime, endTime } = getSentenceInfo($annotation);

                            if (time >= startTime && time < endTime) {
                                return {
                                    $currSentence: $annotation,
                                    sentenceId,
                                };
                            }
                        }
                        return {
                            $currSentence: null,
                            sentenceId: null,
                        };
                    };

                    const restart = () => {
                        let $currentHighlighted = getCurrentHighlightedElement();

                        if ($currentHighlighted) {
                            const { startTime, endTime } = getSentenceInfo($currentHighlighted);
                            ee.emit('play', startTime, endTime);

                            nextPlayMode = 'pause';
                        }
                    };

                    let SECTION_TIMER = null;

                    const cueTrack = () => {
                        localStorage.removeItem('globalNextPlayMode');

                        sentenceSectionMode = localStorage.getItem('section-playing-editor') ? true : false;

                        if (editMode || sentenceSectionMode) {
                            /* 
                                play / pause (using ctrl + p) inside sentence or sentence section click
                            */

                            let $currentHighlighted = getCurrentHighlightedElement();

                            if ($currentHighlighted) {
                                if (nextPlayMode === 'play') {
                                    /* 
                                        track was paused, now playing
                                    */
                                    const cursorPos = getTimeAtCursorPosition();
                                    let { sentenceId, startTime, endTime } = getSentenceInfo($currentHighlighted);
                                    const startPoint =
                                        parseInt($sentenceSectionBoxes[sentenceId - 1].style.left) +
                                        $waveform.scrollLeft;

                                    startTime = Math.max(startTime, cursorPos);

                                    SECTION_TIMER = setTimeout(() => {
                                        sentenceSectionMode = false;
                                        localStorage.removeItem('section-playing-editor');
                                        localStorage.removeItem('SECTION_TIMER_ID');
                                        setCursorByLeft(startPoint);
                                        props.callbacks.changeTrackMode('pause', null, ee);
                                        nextPlayMode = 'play';
                                    }, (endTime - startTime + 0.1) * 1000);

                                    // update the current section timer id to localStorage
                                    localStorage.setItem('SECTION_TIMER_ID', SECTION_TIMER);

                                    ee.emit('play', startTime, endTime);
                                    nextPlayMode = 'pause';
                                } else {
                                    /* 
                                        track was playing, now paused
                                    */
                                    ee.emit('pause');
                                    nextPlayMode = 'play';

                                    clearTimeout(SECTION_TIMER);
                                    localStorage.removeItem('SECTION_TIMER_ID');
                                }
                            }
                        } else {
                            /* 
                                play / pause in complete track
                            */
                            if (nextPlayMode === 'play') {
                                /* 
                                    currently track paused
                                */
                                const cursorPos = getTimeAtCursorPosition(); // returns time at which the cursor is.

                                ee.emit('play', cursorPos);
                                nextPlayMode = 'pause';
                            } else {
                                /* 
                                    currently track is playing
                                */
                                ee.emit('pause');
                                nextPlayMode = 'play';
                            }
                        }
                        props.callbacks.changeTrackMode(nextPlayMode === 'play' ? 'pause' : 'play', null, ee);
                    };

                    const buildElement = (type, className, id, styles = '', textContent = '') => {
                        const $e = document.createElement(type);
                        const $style = document.createElement('style');

                        if (id) $e.id = id;
                        if (className) $e.className = className;
                        if (textContent) $e.innerHTML = textContent;

                        $style.innerHTML = styles;

                        document.body.appendChild($style);

                        return $e;
                    };

                    const stringTimeFormat = (h, m, s) => {
                        let time = '';

                        if (h > 0) time += h.toString() + 'h ';

                        if (m > 0) time += m.toString() + 'm ';

                        if (s >= 0) time += s.toString() + 's';

                        return time;
                    };

                    const timeFormat = time => {
                        /* 
                            Inputs time in seconds format to h/m/s
                            
                            Ex: 337.2s -> 5m 37.2s
                                3601.4s -> 1h 1.4s
                        */
                        time = parseFloat(time);

                        let h = 0,
                            m = 0,
                            s = 0;
                        h = parseInt(time / 3600);
                        time = time - h * 3600;
                        m = parseInt(time / 60);
                        time = time - m * 60;
                        s = Math.round(time * 10) / 10; // converting to one decimal place

                        return stringTimeFormat(h, m, s);
                    };

                    const adjustLeft = () => {
                        /* 
                            Adjust the left of the pop-up based on dynamic width
                        */
                        const $popUp = document.getElementsByClassName('pop-up-container')[0];
                        const styles = getComputedStyle($popUp);

                        if ($popUp) {
                            $popUp.style.left =
                                parseFloat(styles.left) - parseFloat($popUp.clientWidth / 2) + 29 + 'px';
                        }
                    };

                    const showTimePopUp = () => {
                        const cursorPos = getTimeAtCursorPosition();
                        const { left, top } = $cursor.getBoundingClientRect();
                        const $playlistContainer = document.getElementById('waveform-playlist-container');

                        if ($playlistContainer) {
                            const $playlist = document.getElementsByClassName('playlist')[0];

                            const time = timeFormat(cursorPos);

                            const popUpStyles = `
                                .pop-up-container {
                                    top: ${window.scrollY > 250 ? 0 : top - 60}px;
                                    left: ${left - 28}px;
                                }
                            `;

                            const $popUp = buildElement('div', 'pop-up-container', null, popUpStyles);
                            const $timeDisplay = buildElement('div', 'pop-up-time-display animate', null, null, time);
                            const $pointer = buildElement('div', 'pop-up-pointer animate');

                            if ($popUp) {
                                $popUp.appendChild($timeDisplay);

                                window.scrollY <= 250 && $popUp.appendChild($pointer);

                                $playlistContainer.insertBefore($popUp, $playlist);

                                popUpInDisplay = true;

                                updateEditorState();

                                adjustLeft();
                            }
                        }
                    };

                    const removeTimePopUp = () => {
                        const $playlistContainer = document.getElementById('waveform-playlist-container');

                        if ($playlistContainer) {
                            const $popUp = document.getElementsByClassName('pop-up-container')[0];

                            if ($popUp) {
                                $playlistContainer.removeChild($popUp);

                                popUpInDisplay = false;

                                updateEditorState();
                            }
                        }
                    };

                    let WINDOW_SCROLL_TIMER = null;
                    window.addEventListener('scroll', e => {
                        e.preventDefault();

                        clearTimeout(WINDOW_SCROLL_TIMER);

                        WINDOW_SCROLL_TIMER = setTimeout(() => {
                            if (popUpInDisplay) {
                                removeTimePopUp();
                                showTimePopUp();
                            }
                        }, 200);
                    });

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
                    }, 1000);

                    const scrollOnCursorLimit = cursorPos => {
                        let relativeFirstTick = parseInt($timeTicks[0].style.left);
                        let relativeFirstTickTime = timeStringToFloat('00:' + $timeTicks[0].innerText);

                        let cursorPosFromStart = relativeFirstTick + (cursorPos - relativeFirstTickTime) * oneSecond;

                        if (cursorPosFromStart >= cursorLimit - 30) {
                            $waveform.scrollTo({ left: prevScroll + cursorLimit, top: 0, behavior: 'smooth' });
                        }
                    };

                    cursorUpdate = setInterval(() => {
                        let globalNextPlayMode = null;
                        let cursorPos = getTimeAtCursorPosition();

                        if (localStorage.getItem('globalNextPlayMode')) {
                            globalNextPlayMode = localStorage.getItem('globalNextPlayMode');
                            nextPlayMode = globalNextPlayMode;
                        }
                        if (nextPlayMode === 'pause') {
                            // currently playing
                            scrollOnCursorLimit(cursorPos);

                            let { sentenceId } = cursorPos && findSentence(cursorPos);

                            if (sentenceId) currentHighlightedSentence = sentenceId - 1;

                            if (popUpInDisplay) {
                                removeTimePopUp();
                            }
                        } else {
                            // currently paused
                            !popUpInDisplay && cursorPos !== 0 && showTimePopUp();
                        }

                        localStorage.setItem('cursorPos', getTimeAtCursorPosition());
                    }, 500);

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
                            inEditMode: editMode,
                            zoomLevel: zoomLevels[currZoomLevel],
                            popUpInDisplay,
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
                            editMode = prevState.inEditMode;
                            const prevZoomLevel = prevState.zoomLevel;
                            currZoomLevel = zoomLevels.indexOf(prevZoomLevel);

                            popUpInDisplay = prevState.popUpInDisplay;

                            if (editMode && $annotations[sentenceId - 1]) {
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

                    const updateCursorOnZoom = prevTime => {
                        setTimeout(() => {
                            oneSecond = oneSecondinPx();
                            updateEditorState();
                            setCursorByTime(prevTime);
                        }, 50);
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
                        const prevTime = getTimeAtCursorPosition();

                        updateCursorOnZoom(prevTime);
                    });

                    $zoomOut.on('click', e => {
                        ee.emit('zoomout');
                        currZoomLevel = Math.max(0, currZoomLevel - 1);
                        const prevTime = getTimeAtCursorPosition();

                        updateCursorOnZoom(prevTime);
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

                                cueTrack();

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

                                restart();

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

                                $currentHighlighted.classList.remove('current-editing');

                                let { sentenceId, startTime, endTime } = getSentenceInfo($currentHighlighted);
                                let cursorPosTime = getTimeAtCursorPosition();

                                editMode = false;

                                removeAllSectionHighlights();

                                if (cursorPosTime > startTime && cursorPosTime < endTime) {
                                    startTime = cursorPosTime;
                                } else {
                                    startTime += 0.1;
                                }

                                $currentAnnotationText.blur();
                                addSentenceHighlight($currentHighlighted);

                                setTimeout(() => {
                                    const startPoint =
                                        parseInt($sentenceSectionBoxes[sentenceId - 1].style.left) +
                                        $waveform.scrollLeft;
                                    setCursorByLeft(startPoint);
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
                            ee.emit('stop');

                            props.callbacks.changeTrackMode('pause', null, ee);

                            nextPlayMode = 'play';
                            editMode = true;

                            removeAllHighlights();

                            let $currentClickedSentence = e.path[1];
                            let { sentenceId, startTime, endTime } = getSentenceInfo($currentClickedSentence);
                            let cursorPosTime = getTimeAtCursorPosition();

                            $currentClickedSentence.classList.add('current-editing');
                            $currentClickedSentence.classList.remove('current-hover');

                            currentHighlightedSentence = sentenceId - 1;

                            if (cursorPosTime > startTime && cursorPosTime < endTime) {
                                startTime = cursorPosTime;
                            } else {
                                startTime += 0.1;
                            }

                            scrollToSection(sentenceId);

                            setTimeout(() => {
                                const startPoint =
                                    parseInt($sentenceSectionBoxes[sentenceId - 1].style.left) + $waveform.scrollLeft;
                                setCursorByLeft(startPoint);
                                updateEditorState();
                            }, 20);
                        });

                        $annotationTextBox.addEventListener('blur', e => {
                            editMode = false;

                            removeAllSectionHighlights();
                            updateAnnotations();
                            calcSentenceScrollEndPoints();
                        });

                        $annotationTextBox.addEventListener('keyup', e => {
                            resizeAnnotation($annotationTextBox);
                        });
                    }

                    for (let $annotation of $annotations) {
                        $annotation.addEventListener('mouseover', e => {
                            let $element = getEnclosingAnnotationElement(e);

                            if (!Array.from($element.classList).includes('current-selected')) {
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

                            currentHighlightedSentence = sentenceId - 1;

                            nextPlayMode = 'pause';
                            sentenceSectionMode = true;

                            props.callbacks.changeTrackMode('play', null, ee);

                            if ($currentElement) {
                                let { startTime, endTime } = getSentenceInfo($currentElement);
                                const startPoint =
                                    parseInt($sentenceSectionBoxes[sentenceId - 1].style.left) + $waveform.scrollLeft;

                                const sectionData = {
                                    startPoint,
                                    sentenceIdx: sentenceId - 1,
                                    startTime,
                                    endTime,
                                };

                                localStorage.setItem('section-playing-editor', JSON.stringify(sectionData));

                                scrollToSentence(sentenceId);
                                scrollToSection(sentenceId);

                                SECTION_TIMER = setTimeout(() => {
                                    localStorage.removeItem('section-playing-editor');
                                    localStorage.removeItem('SECTION_TIMER_ID');
                                    setCursorByLeft(startPoint);
                                    addSentenceHighlight($currentElement);
                                    removeSectionHighlight($sentenceSectionBoxes[sentenceId - 1]);
                                    props.callbacks.changeTrackMode('pause', null, ee);
                                    nextPlayMode = 'play';
                                }, (endTime - startTime + 0.1) * 1000);

                                localStorage.setItem('SECTION_TIMER_ID', SECTION_TIMER);
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

                            /* 
                                delete() and add toast saying ctrl + z to undo 
                            */

                            const $sentencesContainer = e.path[3];

                            const $sentenceSectionBox = $annotationsBoxesDiv.querySelector(
                                `div[data-id='${sentenceId}']`
                            );

                            removeSentenceHighlight($sentence);

                            if (currentHighlightedSentence >= sentenceId - 1) {
                                currentHighlightedSentence -= 1;
                            }

                            $sentencesContainer.removeChild($sentence);
                            $sentenceSectionBox.style.display = 'none';

                            updateAnnotations();
                            calcSentenceScrollEndPoints();

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

                    let WAVEFORM_SCROLL_TIMER = null;
                    $waveform.addEventListener('scroll', e => {
                        e.preventDefault();

                        prevScroll = $waveform.scrollLeft;

                        popUpInDisplay && removeTimePopUp();

                        clearTimeout(WAVEFORM_SCROLL_TIMER);

                        WAVEFORM_SCROLL_TIMER = setTimeout(() => {
                            if (popUpInDisplay) {
                                removeTimePopUp();
                                showTimePopUp();
                            }
                        }, 200);
                    });

                    /* 
                        Set point on track to start
                        playing from clicked point on track
                    */
                    $waveformTrack.addEventListener('click', () => {
                        setTimeout(() => {
                            $cursor.style.left = $selectionPoint.style.left;

                            popUpInDisplay && removeTimePopUp();
                            !popUpInDisplay && showTimePopUp();
                        }, 10);

                        updateEditorState();
                    });

                    $annotationsTextBoxContainer.addEventListener('scroll', () => {
                        calcSentenceScrollEndPoints();

                        updateEditorState();
                    });

                    const $stopBtn = document.getElementsByClassName('btn-stop')[0];
                    $stopBtn.addEventListener('click', _ => {
                        removeTimePopUp();

                        $waveform.scrollTo({
                            left: 0,
                            top: 0,
                        });

                        $annotationsTextBoxContainer.scrollTo({
                            left: 0,
                            top: 0,
                            behavior: 'smooth',
                        });
                    });

                    /* 
                        Define keyboard shortcuts
                    */
                    hotkeys('ctrl+z', (e, _) => {
                        e.preventDefault();

                        if (undoQueue.length > 0) {
                            const { sentenceId, $sentence, $parent, timer, $sentenceSectionBox } = undoQueue.shift();
                            undoSet.delete(sentenceId);

                            if (timer !== null) {
                                clearTimeout(timer);

                                const { endTime, sentenceId } = getSentenceInfo($sentence);

                                let flag = true;

                                $sentence.classList.add('flash'); // add flash higlight on undo

                                if (currentHighlightedSentence >= sentenceId - 1) {
                                    currentHighlightedSentence += 1;
                                }

                                // can be optimized using lower_bound()
                                for (let idx in $annotations) {
                                    let id = parseInt(idx);
                                    if (!isNaN(id)) {
                                        const info = getSentenceInfo($annotations[id]);

                                        if (info.startTime >= endTime) {
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
                                calcSentenceScrollEndPoints();
                            }
                        }
                    });

                    hotkeys('down', (e, _) => {
                        e.preventDefault();
                        editMode = false;

                        const { $prevSentenceNode } = moveDown();

                        /* 
                            Call function to save edit here
                        */
                        save($prevSentenceNode).then(resp => {
                            console.log('saved!');
                            setTimeout(() => dispatch(toggleSaveMode(false)), 1000);
                        });

                        nextPlayMode = 'play';

                        updateEditorState();
                    });

                    hotkeys('up', (e, _) => {
                        e.preventDefault();
                        editMode = false;

                        const { $prevSentenceNode } = moveUp();

                        /* 
                            Call function to save edit here
                        */
                        save($prevSentenceNode).then(resp => {
                            console.log('saved!');
                            setTimeout(() => dispatch(toggleSaveMode(false)), 1000);
                        });

                        nextPlayMode = 'play';

                        updateEditorState();
                    });

                    hotkeys('enter', (e, _) => {
                        e.preventDefault();
                        let $currentHighlighted = getCurrentHighlightedElement();

                        if (!$currentHighlighted) $currentHighlighted = $annotations[sentenceIdOnCursor];

                        if ($currentHighlighted) {
                            editMode = true;

                            let { sentenceId, startTime, endTime } = getSentenceInfo($currentHighlighted);
                            let cursorPosTime = getTimeAtCursorPosition();

                            currentHighlightedSentence = sentenceId - 1;

                            let $currentAnnotationText = $currentHighlighted.getElementsByClassName(
                                'annotation-lines'
                            )[0];

                            $currentHighlighted.classList.remove('current-selected');
                            $currentHighlighted.classList.add('current-editing');

                            if (!(nextPlayMode === 'pause' && cursorPosTime - startTime > 0.1)) {
                                ee.emit('stop');

                                props.callbacks.changeTrackMode('pause', null, ee);

                                nextPlayMode = 'play';

                                let cursorPosTime = getTimeAtCursorPosition();
                                if (cursorPosTime > startTime && cursorPosTime < endTime) {
                                    startTime = cursorPosTime;
                                } else {
                                    startTime += 0.1;
                                }

                                setTimeout(() => {
                                    const startPoint =
                                        parseInt($sentenceSectionBoxes[sentenceId - 1].style.left) +
                                        $waveform.scrollLeft;
                                    setCursorByLeft(startPoint);
                                }, 20);
                            }

                            scrollToSection(sentenceId);

                            /* Reason for timeout: https://stackoverflow.com/questions/15859113/focus-not-working */
                            setTimeout(() => $currentAnnotationText.focus(), 0);
                        }

                        updateEditorState();
                    });

                    hotkeys('ctrl+p', (e, _) => {
                        e.preventDefault();

                        cueTrack();

                        updateEditorState();
                    });

                    hotkeys('tab', (e, _) => {
                        e.preventDefault();
                        console.log('pressed tab!');
                    });

                    /* 
                        Block refresh commands of the browser 
                    */
                    hotkeys('command+r', (e, _) => {
                        e.preventDefault();
                        console.log('refreshed');
                    });

                    hotkeys('ctrl+r', (e, _) => {
                        e.preventDefault();
                        console.log('refreshed');
                    });
                });
        }, 100);

        return () => {
            console.log('CLEAN UP ON UN-MOUNT');

            cleanUp();
        };
    }, []);

    if (!playlistLoaded) {
        return <EditorLoader />;
    }

    return <></>;
};

export default Playlist;
