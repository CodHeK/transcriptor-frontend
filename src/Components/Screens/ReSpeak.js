import React, { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton'; // (https://github.com/dvtng/react-loading-skeleton#readme)
import EventEmitter from 'event-emitter';
import $ from 'jquery';
import '../styles.css';

import { useDispatch } from 'react-redux';
import { saveEventEmitter } from '../../actions/TranscriptionActions';

const WaveformPlaylist = require('waveform-playlist');

const PLaylistGhostLoader = () => {
    return (
        <React.Fragment>
            <div className="toolbar-ghost">
                <Skeleton width={400} height={40} />
                <span className="autosave-ghost">
                    <Skeleton width={180} height={40} />
                </span>
            </div>
            <div className="waveform-ghost">
                <Skeleton height={130} />
            </div>
        </React.Fragment>
    );
};

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
                    $('#waveform-playlist-container-respeak').show();

                    const $annotationsContainer = document.getElementsByClassName('annotations-text')[0];
                    $annotationsContainer.style.visibility = 'hidden';

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

                    let cursorLimit = $annotationsBoxesDiv && $annotationsBoxesDiv.offsetWidth;
                    let nextPlayMode = 'play';
                    let prevScroll = 0;

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

                    $waveform.addEventListener('scroll', e => {
                        e.preventDefault();

                        prevScroll = $waveform.scrollLeft;
                    });

                    cursorUpdate = setInterval(() => {
                        let globalNextPlayMode_respeak = null;
                        if (localStorage.getItem('globalNextPlayMode_respeak')) {
                            globalNextPlayMode_respeak = localStorage.getItem('globalNextPlayMode_respeak');
                            nextPlayMode = globalNextPlayMode_respeak;
                        }
                        if (nextPlayMode === 'pause') {
                            let cursorPos = getTimeAtCursorPosition();

                            scrollOnCursorLimit(cursorPos);
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
                        }, 10);
                    });

                    for (let $sectionBox of $sentenceSectionBoxes) {
                        $sectionBox.addEventListener('click', e => {
                            e.preventDefault();

                            removeAllSectionHighlights();
                            const sentenceId = parseInt(e.srcElement.innerText);
                            addSectionHighlight($sectionBox);

                            nextPlayMode = 'pause';
                            props.callbacks.changeTrackMode('play', null, ee);
                        });
                    }
                });

            return () => {
                clearInterval(cursorUpdate);
            };
        }, 100);
    }, []);

    if (!trackLoaded) {
        return <PLaylistGhostLoader />;
    }

    return <></>;
};

export default ReSpeak;
