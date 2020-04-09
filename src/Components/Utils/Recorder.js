import React, { useState, useEffect, useMemo } from 'react';
import { Grid, Menu, Segment, Button } from 'semantic-ui-react';
import SideSegment from './SideSegment';
import localforage from 'localforage';
import $ from 'jquery';
import '../styles.css';

import { useSelector } from 'react-redux';

// for storing audio segments before submit in re-speak editor
localforage.config({
    driver: localforage.INDEXEDDB,
    name: 'respeak-audio-segments',
});

const Recorder = props => {
    const { notes } = props.data;
    const [activeSentence, setActiveSentence] = useState(0);
    const [prevScroll, setPrevScroll] = useState(0);
    const [sentenceDone, setSentenceDone] = useState(new Set());
    const [allFiles, setAllFiles] = useState(null);

    const { sentenceIdForReSpeak } = useSelector(state => ({ ...state.TRANSCRIPTION }));

    console.log('printing allfiles ', allFiles);

    useEffect(() => {
        localforage.getItem('allFiles', (err, res) => {
            console.log(res);
            if (!res) {
                const init = notes.map(_ => []);
                console.log('init, ', init);
                setAllFiles(init);
                localforage.setItem('allFiles', init);
            } else {
                localforage.getItem('allFiles', (err, res) => {
                    setAllFiles(res);
                });
            }
        });
    }, []);

    useEffect(() => {
        setActiveSentence(sentenceIdForReSpeak);
        if (document.readyState === 'complete') {
            const $e = document.getElementById(`menu-item-${sentenceIdForReSpeak}`);
            $e && $e.scrollIntoView();
        }
    }, [sentenceIdForReSpeak]);

    useEffect(() => {
        /* 
            Sync storage when switching between sentences.
        */
        localforage.getItem('allFiles', (err, res) => {
            if (res) {
                setAllFiles(res);
            }
        });
    }, [activeSentence]);

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

        if (sentenceDone.has(sentenceId)) {
            // revisiting a submitted sentence
            const copySet = new Set(sentenceDone);
            copySet.delete(sentenceId);

            setSentenceDone(copySet);
        }

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

    const sentenceSaved = id => {
        setSentenceDone(sentenceDone => new Set(sentenceDone).add(id));
        setActiveSentence(activeSentence => (activeSentence + 1) % notes.length);
    };

    const callbacks = {
        sentenceSaved,
    };

    return (
        <Grid>
            <Grid.Column width={3}>
                <Menu fluid vertical tabular>
                    {SideSentenceMenu}
                </Menu>
            </Grid.Column>

            <Grid.Column stretched width={13}>
                {allFiles && (
                    <SideSegment
                        activeSentence={activeSentence}
                        sentenceInfo={notes[activeSentence]}
                        sentenceFiles={allFiles[activeSentence]}
                        callbacks={callbacks}
                    />
                )}
            </Grid.Column>
        </Grid>
    );
};

export default Recorder;
