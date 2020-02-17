import React, { useState } from 'react';
import  { Redirect, useHistory } from 'react-router-dom';
import { Menu, Segment, Container } from 'semantic-ui-react';
import ListTranscriptions from './ListTranscriptions';
import logo from '../../images/ntu-logo.png';

const Dashboard = (props) => {
    const [ page, setPage ] = useState('Home');
    let history = useHistory();

    if(props.location.state !== undefined) {
        
        const handleTabClick = (_, { name }) => {
            if(name === 'logout') {
                localStorage.removeItem('token');
                history.push("/login");
            }   
            else {
                setPage(name);
            }
        }

        let subPage = null;

        switch(page) {
            case 'Home':
                // subPage = <Home />
                break;
            case 'My Transcriptions':
                subPage = <ListTranscriptions />
                break;
            default:
                // subPage = <ReSpeak />
        }

        return (
            <React.Fragment>
                {
                    localStorage.getItem('token') === null
                    && <Redirect 
                            to={{ 
                                pathname: '/login', 
                                state: 'token-not-matching'
                            }} 
                        />
                }

                <Segment style={{ boxShadow: 'none', border: '0' }}>
                    <Menu stackable secondary>
                        <Menu.Item>
                            <img src={logo} alt="ntu-logo" style={{ width: '123px' }} />
                        </Menu.Item>
                        <Menu.Item
                            name='Home'
                            active={page === 'Home'}
                            onClick={handleTabClick}
                            style={{ marginLeft: '2em' }}
                        >
                            Home
                        </Menu.Item>

                        <Menu.Item
                            name='My Transcriptions'
                            active={page === 'My Transcriptions'}
                            onClick={handleTabClick}
                        >
                            My Transcriptions
                        </Menu.Item>

                        <Menu.Item
                            name='Re-speak'
                            active={page === 'Re-speak'}
                            onClick={handleTabClick}
                        >
                            Re-speak
                        </Menu.Item>

                        <Menu.Menu position='right'>
                            <Menu.Item
                                name='logout'
                                active={page === 'signup'}
                                onClick={handleTabClick}
                            >
                                Log out
                            </Menu.Item>
                        </Menu.Menu>
                    </Menu>
                </Segment>

                <Container>
                    {subPage}
                </Container>
                
            </React.Fragment>
        )
    }
    else {
        return (
            <Redirect 
                to={{ 
                    pathname: '/login', 
                    state: 'bad-login'
                }} 
            />
        )
    }
}

export default Dashboard;