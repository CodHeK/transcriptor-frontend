import React from 'react';
import  { Redirect } from 'react-router-dom'

const Dashboard = (props) => {
    if(props.location.state !== undefined) {
        const { token, ...userData } = props.location.state;
        return (
            <React.Fragment>
                {
                    token !== 'lolol' 
                    && <Redirect 
                            to={{ 
                                pathname: '/login', 
                                state: 'token-not-matching'
                            }} 
                        />
                }
                <h1>Welcome {userData.userID}</h1>
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