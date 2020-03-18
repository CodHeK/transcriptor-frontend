import React, { useState, useMemo } from 'react';
import Skeleton from 'react-loading-skeleton'; // (https://github.com/dvtng/react-loading-skeleton#readme)
import { Card, Dropdown } from 'semantic-ui-react';
import ConfirmationModal from './ConfirmationModal';
import PropTypes from 'prop-types';
import $ from 'jquery';
import '../styles.css';

/* import react-redux hook for dispatching actions */
import { useDispatch, useSelector } from 'react-redux';

/* import actions */
import {
    setTranscriptionIdForEdit,
    setTranscriptionIdForAssign,
    enableEditMode,
    disableEditMode,
    deleteTranscription,
} from '../../actions/TranscriptionActions';

const moment = require('moment');

const CustomCard = props => {
    const [mode, setMode] = useState('choose');
    const { editId, editMode } = useSelector(state => ({ ...state.TRANSCRIPTION }));

    const dispatch = useDispatch();

    const loading = props.data === null;

    const styles = CustomCardStyles;

    const time = moment(props.meta).format('LT');
    const date = moment(props.meta).format('LL');

    const editorNotSaved =
        localStorage.getItem('editorConfig') !== null &&
        JSON.parse(localStorage.getItem('editorConfig'))._id === props._id;

    const isDisabled = () => {
        return (
            (localStorage.getItem('editorConfig') !== null &&
                JSON.parse(localStorage.getItem('editorConfig'))._id === props._id) ||
            editId === props._id
        );
    };

    const options = [
        {
            key: 1,
            text: 'edit',
            value: 1,
            disabled: isDisabled(),
        },
        {
            key: 2,
            text: 'assign',
            value: 2,
        },
    ];

    const ActionDispatchers = {
        EditMode: enable => (enable ? dispatch(enableEditMode()) : dispatch(disableEditMode())),
        transcriptionIdForEdit: _id => dispatch(setTranscriptionIdForEdit(_id)),
        transcriptionIdForAssign: _id => dispatch(setTranscriptionIdForAssign(_id)),
        delete: _id => dispatch(deleteTranscription(_id)),
    };

    const modeHandler = (e, { options, value }) => {
        if (value === 1) {
            let optionText = options.filter(option => option.value === value)[0].text;
            setMode(optionText);

            ActionDispatchers.transcriptionIdForEdit(props._id);
        } else {
            ActionDispatchers.EditMode(false);
            ActionDispatchers.transcriptionIdForAssign(props._id);
        }
    };

    const downloadTranscript = () => {
        // file creation on the server
    };

    const Status = props => {
        const { status, id } = { ...props };
        const styles = CustomCardStyles;
        const increment = parseFloat(100 / 8);
        const $statusLoader = document.getElementsByClassName(`${id}`)[0];

        if (status.toLowerCase() !== 'done') {
            if ($statusLoader) {
                switch (status) {
                    case 'MONOLIZE-RESAMPLE: monolize and resample the input file':
                        $statusLoader.style.width = increment + '%';
                        break;

                    case 'DIARIZATION: partitioning an input audio stream into speech segments.':
                        $statusLoader.style.width = increment * 2 + '%';
                        break;

                    case 'STARTING processing input file':
                        $statusLoader.style.width = increment * 3 + '%';
                        break;

                    case 'KALDI-DATA-PREPARATION: convert to kaldi format':
                        $statusLoader.style.width = increment * 4 + '%';
                        break;

                    case 'FEATURE-EXTRACTION: extract features in the input file':
                        $statusLoader.style.width = increment * 5 + '%';
                        break;

                    case 'DECODING the input file to raw text':
                        $statusLoader.style.width = increment * 6 + '%';
                        break;

                    case 'POST-PROCESSING convert raw text to different formats':
                        $statusLoader.style.width = increment * 7 + '%';
                        break;
                }
            }
            return <span className="status-flag">{status}</span>;
        } else {
            if ($statusLoader) $statusLoader.style.display = 'none';
            return (
                <React.Fragment>
                    <i className="fas fa-download" onClick={downloadTranscript}></i>
                    <Dropdown text={mode} options={options} style={styles.dropdown} onChange={modeHandler} />
                </React.Fragment>
            );
        }
    };

    const modalCallback = action => {
        if (action === 'yes') {
            ActionDispatchers.delete(props._id);
        }
    };

    return (
        <Card style={styles.Card}>
            <Card.Content>
                <Card.Header className="card-header">
                    {!loading ? props.header : <Skeleton width={250} height={18} />}
                    <span>
                        {!loading &&
                            (editMode && editId === props._id ? (
                                <span className="edit-flag">IN EDIT</span>
                            ) : editorNotSaved ? (
                                <span className="edit-flag">IN EDIT</span>
                            ) : (
                                <ConfirmationModal
                                    callback={modalCallback}
                                    content={'Warning'}
                                    icon={'warning'}
                                    body={'Are you sure you want to delete this transcription ?'}
                                />
                            ))}
                    </span>
                </Card.Header>
                <Card.Meta className="card-meta">
                    {!loading ? date + ', ' + time : <Skeleton width={180} height={15} />}
                    {!loading ? (
                        <span style={{ display: 'none' }}>dummy skeleton</span>
                    ) : (
                        <Skeleton width={60} height={15} />
                    )}
                    <div className="tags-container">
                        <div className="tag">{props.language}</div>
                        <div className="tag">{props.mimeType}</div>
                    </div>

                    {!loading && <Status status={props.status} id={props._id} />}
                </Card.Meta>
                <div className={`status-loader ${props._id}`}></div>
            </Card.Content>
        </Card>
    );
};

Card.propTypes = {
    _id: PropTypes.string,
    header: PropTypes.string,
    meta: PropTypes.string,
    language: PropTypes.string,
    mimeType: PropTypes.string,
};

const CustomCardStyles = {
    Card: {
        marginLeft: '1%',
        width: '98%',
        height: 'auto', // (Keep it auto)
        cursor: 'pointer',
        fontFamily: 'Open Sans',
        fontWeight: '300',
        paddingBottom: '50px',
    },
    dropdown: {
        right: '12px',
        bottom: '10px',
        position: 'absolute',
        borderRadius: '0.3rem',
        minWidth: '80px',
        width: 'auto',
        border: '1px solid black',
        backgroundColor: '#f5f5f5',
        fontSize: '13px',
        color: 'black',
        textAlign: 'center',
        paddingLeft: '3px',
        paddingRight: '3px',
    },
    status: {
        right: '12px',
        bottom: '10px',
        position: 'absolute',
        borderRadius: '0.3rem',
        minWidth: '80px',
        width: 'auto',
        border: '1px solid black',
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        fontSize: '13px',
        color: 'black',
        textAlign: 'center',
        paddingLeft: '3px',
        paddingRight: '3px',
    },
};

export default CustomCard;
