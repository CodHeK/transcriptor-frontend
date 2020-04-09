import React, { useState, useEffect } from 'react';
import { Segment, Button } from 'semantic-ui-react';
import { ReactSortable } from 'react-sortablejs';
import SortableCard from './SortableCard';
import { useToasts } from 'react-toast-notifications';
import '../styles.css';

const SideSegement = props => {
    const { sentenceInfo, activeSentence, sentenceFiles } = props;
    const [files, setFiles] = useState(sentenceFiles);

    const { addToast } = useToasts();

    useEffect(() => {
        setFiles(sentenceFiles);
    }, [sentenceFiles]);

    useEffect(() => {
        console.log(files);
    }, [files]);

    const addRecordSegment = () => {
        const newFile = {
            id: files.length,
            name: `${sentenceInfo.sentenceId}_${files.length + 1}.wav`,
            displayName: `segment_${files.length + 1}.wav`,
            blob: null,
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

    const saveRecording = (id, blob) => {
        setFiles(files =>
            files.map(file => {
                if (file.id === id) {
                    file.blob = blob;
                }
                return file;
            })
        );
    };

    const playSegment = id => {
        const file = files.filter(file => file.id === id)[0];
        if (file.blob) {
            const audio = new Audio(URL.createObjectURL(file.blob));
            audio.play();
        } else {
            addToast("Segment isin't recorded yet!", {
                autoDismiss: true,
                appearance: 'error',
                autoDismissTimeout: 3000,
            });
        }
    };

    const changeDisplayName = (id, newName) => {
        console.log(id, newName);
        setFiles(files =>
            files.map(file => {
                if (file.id === id) {
                    file.displayName = newName;
                }
                return file;
            })
        );
    };

    const callbacks = {
        deleteSegment,
        saveRecording,
        playSegment,
        changeDisplayName,
    };

    const stringTimeFormat = (h, m, s) => {
        let time = '';

        if (h > 0) time += h.toString() + 'h ';

        if (m > 0) time += m.toString() + 'm ';

        if (s > 0) time += s.toString() + 's';

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

    const handleSubmit = () => {
        if (files.length > 0) {
            // make a post request to server sending the files.
            props.callbacks.sentenceSubmitted(activeSentence);
        } else {
            addToast('No files recorded for this sentence!', {
                autoDismiss: true,
                appearance: 'error',
                autoDismissTimeout: 3000,
            });
        }
    };

    return (
        <Segment className="respeak-container">
            <div className="sentence-container-respeak">
                <h1 className="sentence-title">
                    Sentence :
                    <span className="sentence-times">
                        {`(${timeFormat(sentenceInfo.begin.slice(0, 5))}
                          - ${timeFormat(sentenceInfo.end.slice(0, 5))})`}
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
                <Button onClick={handleSubmit}>Submit</Button>
                <Button onClick={addRecordSegment}>
                    <i className="fas fa-plus"></i>
                </Button>
            </div>
        </Segment>
    );
};

export default SideSegement;
