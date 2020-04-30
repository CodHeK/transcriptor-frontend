import React from 'react';
import 'semantic-ui-css/semantic.min.css';
import { Grid } from 'semantic-ui-react';
import LoginForm from './Components/Forms/Login';
import RegisterForm from './Components/Forms/Register';
import { ToastProvider } from 'react-toast-notifications';

const App = () => {
    const styles = AppStyles;

    const page = window.location.href.split('/')[3];

    let Form = null;

    if (page === 'register') {
        /* 
            Handle '/register' 
        */
        Form = <RegisterForm />;
    } else if (page === '' || page === 'login') {
        /* 
            Handle '/' and '/login' 
        */
        Form = <LoginForm />;
    }

    return (
        <ToastProvider placement={'top-right'}>
            <div className="App">
                <Grid columns={3}>
                    <Grid.Column></Grid.Column>
                    <Grid.Column style={styles.FormContainer}>{Form}</Grid.Column>
                    <Grid.Column></Grid.Column>
                </Grid>
            </div>
        </ToastProvider>
    );
};

/*
  Define Styles for the App Component
*/
const AppStyles = {
    FormContainer: {
        marginTop: '10%',
        border: '1px solid rgba(0, 0, 0, 0.2)',
        padding: '48px 40px 36px',
        borderRadius: '10px',
        maxWidth: '482px',
        paddingBottom: '100px',
        height: 'auto',
    },
};

export default App;
