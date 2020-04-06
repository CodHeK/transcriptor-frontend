import React, { useState, useEffect } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { Dropdown, Menu, Segment, Container } from 'semantic-ui-react';
import ListTranscriptions from './ListTranscriptions';
import Upload from './Upload';
import Editor from './Editor';
import ReSpeakEditor from './ReSpeakEditor';
import logo from '../../images/ntu-logo.png';
import PropTypes from 'prop-types';
import '../styles.css';

/* Redux imports */
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

/* import actions */
import { enableEditMode, enableReSpeakMode } from '../../actions/TranscriptionActions';
import { requestSocketAuthentication } from '../../actions/SocketActions';

const Dashboard = props => {
    const [page, setPage] = useState(
        localStorage.getItem('subpage') === null ? 'Upload' : localStorage.getItem('subpage')
    );

    const { editId, editMode, respeakId, reSpeakMode } = useSelector(state => ({ ...state.TRANSCRIPTION }));

    let history = useHistory();
    let dispatch = useDispatch();

    useEffect(() => {
        /* 
            Authenticate socket connection with token
            using the socket middleware
        */
        dispatch(requestSocketAuthentication());
    }, [dispatch]);

    if (props.location.state !== undefined) {
        let { firstname } = props.location.state;

        firstname = firstname.charAt(0).toUpperCase() + firstname.slice(1);

        const handleTabClick = (_, { name }) => {
            if (name === 'logout') {
                localStorage.clear();

                history.push('/login');
            } else {
                if (name === 'Editor') {
                    if (localStorage.getItem('editorConfig')) {
                        const inEditMode = JSON.parse(localStorage.getItem('editorConfig'));
                        if (inEditMode.active) {
                            localStorage.setItem('loadSavedState', 'true');
                        }
                    }
                }
                localStorage.setItem('subpage', name);
                setPage(name);
            }
        };

        if (respeakId !== null && !reSpeakMode && !editId) {
            dispatch(enableReSpeakMode());

            localStorage.setItem('subpage', 'Re-speak');
            localStorage.setItem('reSpeakConfig', JSON.stringify({ _id: respeakId, active: true }));
            setPage('Re-speak');
        }

        if (editId !== null && !editMode && !respeakId) {
            dispatch(enableEditMode());

            /* 
                LocalStorage use here is not redundant and serves to
                save the state of the application when refreshed
            */
            localStorage.setItem('subpage', 'Editor');
            localStorage.setItem('loadSavedState', 'false');
            localStorage.setItem('editorConfig', JSON.stringify({ _id: editId, active: true }));

            setPage('Editor');
        }

        let subPage = null;

        switch (page) {
            case 'Upload':
                subPage = <Upload />;
                break;
            case 'My Transcriptions':
                subPage = <ListTranscriptions />;
                break;
            case 'Editor':
                subPage = <Editor _id={editId} subPageCallback={page => setPage(page)} />;
                break;
            case 'Re-speak':
                subPage = <ReSpeakEditor _id={respeakId} subPageCallback={page => setPage(page)} />;
                break;
            default:
                return;
        }

        return (
            <React.Fragment>
                {localStorage.getItem('token') === null && (
                    <Redirect
                        to={{
                            pathname: '/login',
                            state: 'token-not-matching',
                        }}
                    />
                )}

                <Segment style={{ boxShadow: 'none', border: '0' }}>
                    <Menu stackable secondary>
                        <Menu.Item>
                            <img src={logo} alt="ntu-logo" style={{ width: '123px' }} />
                        </Menu.Item>
                        <Menu.Item
                            name="Upload"
                            active={page === 'Upload'}
                            onClick={handleTabClick}
                            style={{ marginLeft: '2em' }}
                        >
                            Upload
                        </Menu.Item>

                        <Menu.Item
                            name="My Transcriptions"
                            active={page === 'My Transcriptions'}
                            onClick={handleTabClick}
                        >
                            My Transcriptions
                        </Menu.Item>

                        <Menu.Item name="Re-speak" active={page === 'Re-speak'} onClick={handleTabClick}>
                            Re-speak
                            {localStorage.getItem('reSpeakConfig') !== null &&
                                JSON.parse(localStorage.getItem('reSpeakConfig')).active && (
                                    <sup>
                                        <span className="dot"></span>
                                    </sup>
                                )}
                        </Menu.Item>

                        <Menu.Item name="Editor" active={page === 'Editor'} onClick={handleTabClick}>
                            Editor
                            {localStorage.getItem('editorConfig') !== null &&
                                JSON.parse(localStorage.getItem('editorConfig')).active && (
                                    <sup>
                                        <span className="dot"></span>
                                    </sup>
                                )}
                        </Menu.Item>

                        <Menu.Menu position="right">
                            <Dropdown text={firstname} className="active link item" style={{ marginRight: '2.5vw' }}>
                                <Dropdown.Menu>
                                    <Dropdown.Item name="logout" onClick={handleTabClick}>
                                        LOG OUT
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Menu.Menu>
                    </Menu>
                </Segment>

                <Container id="main-container">{subPage}</Container>
            </React.Fragment>
        );
    } else {
        return (
            <Redirect
                to={{
                    pathname: '/login',
                    state: 'bad-login',
                }}
            />
        );
    }
};

/* 
  Define Dashboard PropTypes
*/
Dashboard.propTypes = {
    location: PropTypes.object,
};

export default Dashboard;
