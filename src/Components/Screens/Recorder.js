import React, { useState } from 'react';
import { Grid, Menu, Segment, Button } from 'semantic-ui-react';
import { ReactSortable } from 'react-sortablejs';
import SortableCard from '../Utils/SortableCard';
import '../styles.css';

const Recorder = props => {
    const [activeSentence, setActiveSentence] = useState(0);
    const [state, setState] = useState([
        { id: 1, name: 'file_1_sentence1.wav' },
        { id: 2, name: 'file_1_sentence2.wav' },
        { id: 3, name: 'file_1_sentence3.wav' },
        // { id: 4, name: 'file_1_sentence4' },
    ]);
    const { notes } = props.data;

    const handleSentenceClick = (_, { name }) => {
        const sentenceId = parseInt(name.split(' ')[1]) - 1;
        setActiveSentence(sentenceId);
    };

    const SideSentenceMenu = notes.map(sentence => {
        return (
            <Menu.Item
                name={`Sentence ${sentence.id}`}
                active={activeSentence === parseInt(sentence.id) - 1}
                onClick={handleSentenceClick}
            />
        );
    });

    const Sortable = (
        <ReactSortable
            list={state}
            animation={200}
            delayOnTouchStart={true}
            delay={2}
            setList={setState}
            className="sortable-container"
        >
            {state.map(item => (
                <SortableCard data={item} />
            ))}
        </ReactSortable>
    );

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
                                {`(${notes[activeSentence].begin}s - ${notes[activeSentence].end}s)`}
                            </span>
                        </h1>
                        <div className="sentence-respeak">{notes[activeSentence].lines}</div>
                    </div>
                    <div className="recorder-container-respeak">{Sortable}</div>
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
