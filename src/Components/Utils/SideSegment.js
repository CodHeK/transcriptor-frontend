import React, { useState, useEffect } from 'react';
import { Segment, Button } from 'semantic-ui-react';
import { ReactSortable } from 'react-sortablejs';
import SortableCard from './SortableCard';
import '../styles.css';

const SideSegement = props => {
    const { sentenceInfo, activeSentence, sentenceFiles } = props;
    const [files, setFiles] = useState(sentenceFiles);

    useEffect(() => {
        setFiles(sentenceFiles);
    }, [sentenceFiles]);

    const addRecordSegment = () => {
        const newFile = {
            id: files.length,
            name: `${sentenceInfo.sentenceId}_${files.length + 1}.wav`,
        };

        setFiles(files => [...files, newFile]);
    };

    const deleteSegment = id => {
        setFiles(files => files.filter(file => file.id !== id));

        /* Rename the ids */

        setFiles(files =>
            files.map(file => {
                if (file.id > id - 1) {
                    /* id is 0 indexed */
                    file.id -= 1;
                    const s_id = file.name.split('_')[0];
                    file.name = s_id + '_' + (file.id + 1) + '.wav';
                }
                return file;
            })
        );
    };

    const callbacks = {
        deleteSegment,
    };

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
                            <SortableCard key={key} data={item} callbacks={callbacks} />
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
