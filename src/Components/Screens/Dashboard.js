import React, { useState, useEffect } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { Dropdown, Menu, Segment, Container } from 'semantic-ui-react';
import ListTranscriptions from './ListTranscriptions';
import Upload from './Upload';
import Editor from './Editor';
import logo from '../../images/ntu-logo.png';
import PropTypes from 'prop-types';
import '../styles.css';

/* Redux imports */
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

/* import actions */

import { enableEditMode } from '../../actions/TranscriptionActions';
import { requestSocketAuthentication } from '../../actions/SocketActions';

const Dashboard = props => {
    const [page, setPage] = useState('Upload');

    const { editId, editMode } = useSelector(state => ({ ...state.TRANSCRIPTION }));

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
                localStorage.removeItem('token');
                history.push('/login');
            } else {
                setPage(name);
            }
        };

        if (editId !== null && !editMode) {
            dispatch(enableEditMode());
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
                subPage = <Editor _id={editId} />;
                break;
            default:
            // subPage = <ReSpeak />
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
                        </Menu.Item>

                        <Menu.Item name="Editor" active={page === 'Editor'} onClick={handleTabClick}>
                            Editor{' '}
                            {editMode && (
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
