import React, { useState, useEffect } from 'react';
import { Grid, Menu, Segment, Button } from 'semantic-ui-react';
import { ReactSortable } from 'react-sortablejs';
import SortableCard from '../Utils/SortableCard';
import $ from 'jquery';
import '../styles.css';

import { useDispatch, useSelector } from 'react-redux';

const Recorder = props => {
    const [activeSentence, setActiveSentence] = useState(0);
    const [prevScroll, setPrevScroll] = useState(0);

    const { sentenceIdForReSpeak } = useSelector(state => ({ ...state.TRANSCRIPTION }));

    useEffect(() => {
        setActiveSentence(sentenceIdForReSpeak);
        if (document.readyState === 'complete') {
            const $e = document.getElementById(`menu-item-${sentenceIdForReSpeak}`);
            console.log($e.classList);
            $e.scrollIntoView();
        }
    }, [sentenceIdForReSpeak]);

    const [state, setState] = useState([
        { id: 1, name: 'file_1_sentence1.wav' },
        { id: 2, name: 'file_1_sentence2.wav' },
        { id: 3, name: 'file_1_sentence3.wav' },
    ]);
    const { notes } = props.data;

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

        setPrevScroll(prevScroll + scrollVal);
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
            />
        );
    });

    const Sortable = notes.map((_, key) => {
        return (
            <ReactSortable
                list={state}
                animation={200}
                delayOnTouchStart={true}
                delay={2}
                setList={setState}
                className="sortable-container"
                key={key}
            >
                {state.map(item => (
                    <SortableCard data={item} />
                ))}
            </ReactSortable>
        );
    });

    return (
        <Grid>
            <Grid.Column width={3}>
                <Menu fluid vertical tabular>
                    {SideSentenceMenu}
                </Menu>
            </Grid.Column>

            <Grid.Column stretched width={13}>
                <Segment className="respeak-container">
                    <div className="sentence-container-respeak">
                        <h1 className="sentence-title">
                            Sentence :
                            <span className="sentence-times">
                                {`(${notes[activeSentence].begin.slice(0, 5)}s - ${notes[activeSentence].end.slice(
                                    0,
                                    5
                                )}s)`}
                            </span>
                        </h1>
                        <div className="sentence-respeak">{notes[activeSentence].lines}</div>
                    </div>
                    <div className="recorder-container-respeak">{Sortable[activeSentence]}</div>
                    <div className="footer-respeak">
                        <Button>Submit</Button>
                        <Button>
                            <i class="fas fa-plus"></i>
                        </Button>
                    </div>
                </Segment>
            </Grid.Column>
        </Grid>
    );
};

export default Recorder;
