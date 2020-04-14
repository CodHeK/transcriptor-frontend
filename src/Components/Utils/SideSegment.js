import React, { useState, useEffect } from 'react';
import { Segment, Button } from 'semantic-ui-react';
import { ReactSortable } from 'react-sortablejs';
import SortableCard from './SortableCard';
import { useToasts } from 'react-toast-notifications';
import localforage from 'localforage';
import '../styles.css';

const SideSegement = props => {
    const { sentenceInfo, activeSentence, sentenceFiles, sentenceStatus } = props;
    const [files, setFiles] = useState(sentenceFiles);
    const [status, setStatus] = useState(sentenceStatus);

    const { addToast } = useToasts();

    useEffect(() => {
        setFiles(sentenceFiles);
        setStatus(sentenceStatus);
    }, [sentenceFiles, sentenceStatus]);

    useEffect(() => {
        // update in the indexedDB storage
        localforage.getItem('allFiles', (err, res) => {
            if (res) {
                const allFiles = res;

                allFiles[activeSentence] = { status, files };

                localforage.setItem('allFiles', allFiles);
            }
        });

        if (files.length === 0) {
            props.callbacks.nullifySentence(activeSentence);
        }
    }, [files, status]);

    const addRecordSegment = () => {
        const newFile = {
            id: files.length,
            name: `${sentenceInfo.sentenceId}_${files.length + 1}.mp3`,
            displayName: `segment_${files.length + 1}.mp3`,
            blob: null,
        };

        setFiles(files => [...files, newFile]);
        setStatus('in-edit');
        props.callbacks.addSentenceToEdit(activeSentence);
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
                    file.name = s_id + '_' + (file.id + 1) + '.mp3';
                }
                return file;
            })
        );

        if (files.length > 1) {
            setStatus('in-edit');
            props.callbacks.addSentenceToEdit(activeSentence);
        }
    };

    const saveSegment = (id, blob) => {
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
        saveSegment,
        playSegment,
        changeDisplayName,
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

    const handleSave = () => {
        if (files.length > 0) {
            setStatus('saved');
            props.callbacks.sentenceSaved(activeSentence);
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
                <Button onClick={handleSave}>Save</Button>
                <Button onClick={addRecordSegment}>
                    <i className="fas fa-plus"></i>
                </Button>
            </div>
        </Segment>
    );
};

export default SideSegement;
