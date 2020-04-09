import React, { useState, useEffect, useMemo } from 'react';
import { Grid, Menu, Segment, Button } from 'semantic-ui-react';
import SideSegment from './SideSegment';
import $ from 'jquery';
import '../styles.css';

import { useSelector } from 'react-redux';

const Recorder = props => {
    const { notes } = props.data;
    const [activeSentence, setActiveSentence] = useState(0);
    const [prevScroll, setPrevScroll] = useState(0);
    const [allFiles, setAllFiles] = useState(notes.map(_ => []));
    const [sentenceDone, setSentenceDone] = useState(new Set());

    const { sentenceIdForReSpeak } = useSelector(state => ({ ...state.TRANSCRIPTION }));

    useEffect(() => {
        setActiveSentence(sentenceIdForReSpeak);
        if (document.readyState === 'complete') {
            const $e = document.getElementById(`menu-item-${sentenceIdForReSpeak}`);
            $e && $e.scrollIntoView();
        }
    }, [sentenceIdForReSpeak]);

    const $waveform = $('.playlist-tracks')[0];
    const $sentenceSectionBoxes = document.getElementsByClassName('annotation-box');

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

        setPrevScroll($waveform.scrollLeft);
    });

    const scrollToSection = sentenceId => {
        addSectionHighlight($sentenceSectionBoxes[sentenceId - 1]);

        let scrollVal = parseInt($sentenceSectionBoxes[sentenceId - 1].style.left) - 20;

        $waveform.scrollTo({
            left: prevScroll + scrollVal,
            top: 0,
            behavior: 'smooth',
        });

        setPrevScroll(prevScroll => prevScroll + scrollVal);
    };

    const handleSentenceClick = (_, { name }) => {
        removeAllSectionHighlights();

        const sentenceId = parseInt(name.split(' ')[1]) - 1;
        setActiveSentence(sentenceId);

        scrollToSection(sentenceId + 1);
    };

    const SideSentenceMenu = notes.map(sentence => {
        return (
            <Menu.Item
                key={sentence.id}
                name={`Sentence ${sentence.id}`}
                active={activeSentence === parseInt(sentence.id) - 1}
                onClick={handleSentenceClick}
                id={`menu-item-${sentence.id - 1}`}
                className={sentenceDone.has(parseInt(sentence.id) - 1) ? 'done' : ''}
            />
        );
    });

    const sentenceSubmitted = id => {
        setSentenceDone(sentenceDone => sentenceDone.add(id));
        setActiveSentence(activeSentence => (activeSentence + 1) % notes.length);
    };

    const callbacks = {
        sentenceSubmitted,
    };

    return (
        <Grid>
            <Grid.Column width={3}>
                <Menu fluid vertical tabular>
                    {SideSentenceMenu}
                </Menu>
            </Grid.Column>

            <Grid.Column stretched width={13}>
                <SideSegment
                    activeSentence={activeSentence}
                    sentenceInfo={notes[activeSentence]}
                    sentenceFiles={allFiles[activeSentence]}
                    callbacks={callbacks}
                />
            </Grid.Column>
        </Grid>
    );
};

export default Recorder;
