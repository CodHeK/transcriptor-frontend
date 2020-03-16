import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton'; // (https://github.com/dvtng/react-loading-skeleton#readme)
import { Card, Dropdown } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import '../styles.css';

/* import react-redux hook for dispatching actions */
import { useDispatch, useSelector } from 'react-redux';

/* import actions */
import {
    setTranscriptionIdForEdit,
    setTranscriptionIdForAssign,
    enableEditMode,
    disableEditMode,
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

    const Status = props => {
        const { status } = { ...props };
        const styles = CustomCardStyles;

        if (status.toLowerCase() !== 'done') {
            return <span className="status-flag">{status}</span>;
        } else {
            return <Dropdown text={mode} options={options} style={styles.dropdown} onChange={modeHandler} />;
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
                                <i className="fas fa-times-circle"></i>
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

                    {!loading && <Status status={props.status} />}
                </Card.Meta>
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
