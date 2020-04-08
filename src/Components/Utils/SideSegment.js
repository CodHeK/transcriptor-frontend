import React, { useState, useEffect } from 'react';
import { Segment, Button } from 'semantic-ui-react';
import { ReactSortable } from 'react-sortablejs';
import SortableCard from './SortableCard';
import '../styles.css';

const SideSegement = props => {
    console.log(props);
    const { sentenceInfo, activeSentence, sentenceFiles } = props;
    const [files, setFiles] = useState(sentenceFiles);

    useEffect(() => {
        setFiles(sentenceFiles);
    }, [sentenceFiles]);

    const addRecordSegment = () => {
        const newFile = {
            id: files.length + 1,
            name: `${sentenceInfo.sentenceId}_${files.length + 1}.wav`,
        };

        setFiles(files => [...files, newFile]);
    };

    // const cards = files.map((item, key) => <SortableCard key={key} data={item} />);

    return (
        <Segment className="respeak-container">
            <div className="sentence-container-respeak">
                <h1 className="sentence-title">
                    Sentence :
                    <span className="sentence-times">
                        {`(${sentenceInfo.begin.slice(0, 5)}s - ${sentenceInfo.end.slice(0, 5)}s)`}
                    </span>
                </h1>
                <div className="sentence-respeak">{sentenceInfo.lines}</div>
            </div>
            <div className="recorder-container-respeak">
                {files && (
                    <ReactSortable
                        list={files}
                        setList={setFiles}
                        animation={200}
                        delayOnTouchStart={true}
                        delay={2}
                        className="sortable-container"
                    >
                        {files.map((item, key) => (
                            <SortableCard key={key} data={item} />
                        ))}
                    </ReactSortable>
                )}
            </div>
            <div className="footer-respeak">
                <Button>Submit</Button>
                <Button onClick={addRecordSegment}>
                    <i className="fas fa-plus"></i>
                </Button>
            </div>
        </Segment>
    );
};

export default SideSegement;
