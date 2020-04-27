import React, { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton'; // (https://github.com/dvtng/react-loading-skeleton#readme)
import EventEmitter from 'event-emitter';
import Recorder from '../Utils/Recorder';
import { ReSpeakLoader } from '../Utils/Loader';
import $ from 'jquery';
import '../styles.css';

import { useDispatch } from 'react-redux';
import { saveEventEmitter, addSectionForReSpeak } from '../../actions/TranscriptionActions';

const WaveformPlaylist = require('waveform-playlist');

const ReSpeak = props => {
    const [trackLoaded, setTrackLoaded] = useState(false);

    const dispatch = useDispatch();

    useEffect(() => {
        let playlist = WaveformPlaylist.init(
            {
                container: document.getElementById('waveform-playlist-container-respeak'),
                timescale: true,
                state: 'cursor',
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
                    linkEndpoints: false,
                },
                seekStyle: 'line',
                samplesPerPixel: 1000,
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

        let cursorUpdate = null;

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
                    $('#waveform-playlist-container-respeak').fadeIn(1000);

                    const $annotationContainer = document.getElementsByClassName('annotations')[0];
                    const $annotationsTextContainer = document.getElementsByClassName('annotations-text')[0];

                    $annotationContainer.removeChild($annotationsTextContainer);
                    $annotationContainer.style.height = '40px';
                    $annotationContainer.style.padding = '0px';

                    setTrackLoaded(true);

                    let ee = playlist.getEventEmitter();
                    dispatch(saveEventEmitter(ee));

                    clearInterval(cursorUpdate);

                    const $waveform = $('.playlist-tracks')[0];
                    const $cursor = document.getElementsByClassName('cursor')[0];
                    const $timeTicks = Array.from(document.getElementsByClassName('time'));
                    const $annotationsBoxesDiv = document.getElementsByClassName('annotations-boxes')[0];
                    const $sentenceSectionBoxes = document.getElementsByClassName('annotation-box');
                    const $waveformTrack = document.getElementsByClassName('waveform')[0];
                    const $selectionPoint = document.getElementsByClassName('point')[0];
                    const $stopBtn = document.getElementsByClassName('btn-stop')[0];
                    const $sentenceMenu = document.querySelector('.three.wide.column');

                    let cursorLimit = $annotationsBoxesDiv && $annotationsBoxesDiv.offsetWidth;
                    let nextPlayMode = 'play';
                    let prevScroll = 0;
                    let popUpInDisplay = false;

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

                    const setCursorByLeft = left => {
                        $cursor.style.left = left.toString() + 'px';
                    };

                    const updateEditorState = (args = null) => {
                        let currEditorState = {
                            waveFormScroll: $waveform.scrollLeft,
                            cursorPos: $cursor.style.left,
                            popUpInDisplay,
                        };

                        if (args) currEditorState = { ...currEditorState, ...args };
                        else {
                            const prevState = JSON.parse(localStorage.getItem('reSpeakEditorState'));
                            if (prevState && 'activeSentence' in prevState) {
                                currEditorState = { ...currEditorState, activeSentence: prevState.activeSentence };
                            }
                        }

                        localStorage.setItem('reSpeakEditorState', JSON.stringify(currEditorState));
                    };

                    const loadEditorState = () => {
                        let prevState = JSON.parse(localStorage.getItem('reSpeakEditorState'));

                        if (prevState) {
                            $waveform.scrollTo({ left: prevState.waveFormScroll, top: 0 });

                            dispatch(addSectionForReSpeak(prevState.activeSentence));

                            $cursor.style.left = prevState.cursorPos;

                            popUpInDisplay = prevState.popUpInDisplay;
                        }

                        localStorage.setItem('loadSavedState_ReSpeak', 'false');
                    };

                    const scrollOnCursorLimit = cursorPos => {
                        let relativeFirstTick = parseInt($timeTicks[0].style.left);
                        let relativeFirstTickTime = timeStringToFloat('00:' + $timeTicks[0].innerText);

                        let cursorPosFromStart = relativeFirstTick + (cursorPos - relativeFirstTickTime) * oneSecond;

                        if (cursorPosFromStart >= cursorLimit - 30) {
                            $waveform.scrollTo({ left: prevScroll + cursorLimit, top: 0, behavior: 'smooth' });
                        }
                    };

                    const getTimeAtCursorPosition = () => {
                        let cursorPos = parseInt($cursor.style.left);
                        let stopTime = parseFloat(cursorPos / oneSecond);

                        return stopTime;
                    };

                    const addSectionHighlight = $element => {
                        $element.classList.add('section-highlight');
                    };

                    const removeSectionHighlight = $element => {
                        $element.classList.remove('section-highlight');
                    };

                    const removeAllSectionHighlights = () => {
                        Array.from($sentenceSectionBoxes).map($e => removeSectionHighlight($e));
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
                        const $playlistContainer = document.getElementById('waveform-playlist-container-respeak');

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

                                localStorage.setItem('popUpInDisplay', popUpInDisplay);

                                adjustLeft();

                                updateEditorState();
                            }
                        }
                    };

                    const removeTimePopUp = () => {
                        const $playlistContainer = document.getElementById('waveform-playlist-container-respeak');

                        if ($playlistContainer) {
                            const $popUp = document.getElementsByClassName('pop-up-container')[0];

                            if ($popUp) {
                                $playlistContainer.removeChild($popUp);

                                popUpInDisplay = false;

                                localStorage.setItem('popUpInDisplay', popUpInDisplay);

                                updateEditorState();
                            }
                        }
                    };

                    /* 
                        Event Listeners
                    */

                    window.addEventListener('unload', _ => {
                        popUpInDisplay = localStorage.getItem('popUpInDisplay') === 'true' ? true : false;
                    });

                    let WAVEFORM_SCROLL_TIMER = null;
                    $waveform.addEventListener('scroll', e => {
                        e.preventDefault();

                        prevScroll = $waveform.scrollLeft;

                        popUpInDisplay && removeTimePopUp();

                        clearTimeout(WAVEFORM_SCROLL_TIMER);

                        updateEditorState();

                        WAVEFORM_SCROLL_TIMER = setTimeout(() => {
                            if (popUpInDisplay) {
                                removeTimePopUp();
                                showTimePopUp();
                            }
                        }, 200);
                    });

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

                    cursorUpdate = setInterval(() => {
                        let globalNextPlayMode_respeak = null;
                        const cursorPos = getTimeAtCursorPosition();
                        if (localStorage.getItem('globalNextPlayMode_respeak')) {
                            globalNextPlayMode_respeak = localStorage.getItem('globalNextPlayMode_respeak');
                            nextPlayMode = globalNextPlayMode_respeak;
                        }
                        if (nextPlayMode === 'pause') {
                            // currently playing
                            scrollOnCursorLimit(cursorPos);

                            if (popUpInDisplay) {
                                removeTimePopUp();
                            }
                        } else {
                            // currently paused
                            !popUpInDisplay && cursorPos !== 0 && showTimePopUp();
                        }

                        localStorage.setItem('cursorPos', getTimeAtCursorPosition());
                    }, 500);

                    /* 
                        Set point on track to start
                        playing from clicked point on track
                    */
                    $waveformTrack.addEventListener('click', () => {
                        setTimeout(() => {
                            $cursor.style.left = $selectionPoint.style.left;

                            setTimeout(() => {
                                const inSectionPlayMod = JSON.parse(localStorage.getItem('section-playing-respeak'));

                                if (inSectionPlayMod) {
                                    let startTime = 0;
                                    if (localStorage.getItem('cursorPos')) {
                                        startTime = parseFloat(localStorage.getItem('cursorPos'));
                                    }

                                    const OLD_SECTION_TIMER = parseInt(localStorage.getItem('SECTION_TIMER_ID'));

                                    if (OLD_SECTION_TIMER) {
                                        clearTimeout(OLD_SECTION_TIMER);
                                        localStorage.removeItem('SECTION_TIMER_ID');
                                    }

                                    const NEW_SECTION_TIMER = setTimeout(() => {
                                        localStorage.removeItem('section-playing-respeak');
                                        localStorage.removeItem('SECTION_TIMER_ID');
                                        props.callbacks.changeTrackMode('pause', null, ee);
                                        const sentenceIdx = parseInt(inSectionPlayMod.sentenceIdx);
                                        removeSectionHighlight($sentenceSectionBoxes[sentenceIdx]);
                                        setCursorByLeft(inSectionPlayMod.startPoint);
                                    }, (inSectionPlayMod.endTime - startTime) * 1000 - 500); // as cursorUpdate took 500ms

                                    localStorage.setItem('SECTION_TIMER_ID', NEW_SECTION_TIMER);
                                }
                            }, 500); // as cursorPos update is every 500ms

                            popUpInDisplay && removeTimePopUp();
                            !popUpInDisplay && showTimePopUp();
                        }, 10);
                    });

                    let SECTION_TIMER = null;

                    for (let $sectionBox of $sentenceSectionBoxes) {
                        $sectionBox.addEventListener('click', e => {
                            e.preventDefault();

                            nextPlayMode = 'pause';

                            removeAllSectionHighlights();
                            const sentenceId = parseInt(e.srcElement.innerText);
                            scrollToSection(sentenceId);

                            const { begin: startTime, end: endTime } = props.notes[sentenceId - 1];
                            const startPoint =
                                parseInt($sentenceSectionBoxes[sentenceId - 1].style.left) + $waveform.scrollLeft;
                            const sectionData = {
                                startPoint,
                                sentenceIdx: sentenceId - 1,
                                startTime,
                                endTime,
                            };

                            localStorage.setItem('section-playing-respeak', JSON.stringify(sectionData));

                            dispatch(addSectionForReSpeak(sentenceId - 1)); // scrolls to sentence

                            updateEditorState({ activeSentence: sentenceId - 1 });

                            props.callbacks.changeTrackMode('play', { startTime, endTime }, ee);

                            const OLD_SECTION_TIMER = parseInt(localStorage.getItem('SECTION_TIMER_ID'));

                            if (OLD_SECTION_TIMER) {
                                clearTimeout(OLD_SECTION_TIMER);
                                localStorage.removeItem('SECTION_TIMER_ID');
                            }

                            SECTION_TIMER = setTimeout(() => {
                                localStorage.removeItem('section-playing-respeak');
                                localStorage.removeItem('SECTION_TIMER_ID');
                                props.callbacks.changeTrackMode('pause', null, ee);
                                removeSectionHighlight($sentenceSectionBoxes[sentenceId - 1]);
                                setCursorByLeft(startPoint);
                            }, (endTime - startTime) * 1000);

                            localStorage.setItem('SECTION_TIMER_ID', SECTION_TIMER);
                        });
                    }

                    $stopBtn.addEventListener('click', _ => {
                        removeTimePopUp();
                        removeAllSectionHighlights();

                        $waveform.scrollTo({
                            left: 0,
                            top: 0,
                        });

                        dispatch(addSectionForReSpeak(0));

                        updateEditorState({ activeSentence: 0 });
                    });

                    // load prev state from localStorage
                    localStorage.getItem('loadSavedState_ReSpeak') === 'true' && loadEditorState();
                });
        }, 100);

        return () => {
            clearInterval(cursorUpdate);

            localStorage.removeItem('cursorPos');
        };
    }, []);

    if (!trackLoaded) {
        return <ReSpeakLoader />;
    } else {
        return <Recorder data={props} />;
    }
};

export default ReSpeak;
