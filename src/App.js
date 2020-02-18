import React from 'react';
import 'semantic-ui-css/semantic.min.css';
import { Grid } from 'semantic-ui-react'
import LoginForm from './Components/Forms/Login';
import RegisterForm from './Components/Forms/Register';

const App = () => {
  const styles = AppStyles;

  const page = window.location.href.split('/')[3];

  let Form = null;

  if(page === 'register') {
    Form = (
      <React.Fragment>
        <h3 style={styles.title}>Register</h3>
        <RegisterForm />
      </React.Fragment>
    );
  }
  else if(page === 'login') {
    Form = (
      <React.Fragment>
        <h3 style={styles.title}>Sign in</h3>
        <LoginForm />
      </React.Fragment>
    );
  }

  return (
    <div className="App">
      <Grid columns={3}>
        <Grid.Column></Grid.Column>
          <Grid.Column 
            style={{ ...styles.FormContainer.general, ...styles.FormContainer[page]}}
          >
            {Form}
          </Grid.Column>
        <Grid.Column></Grid.Column>
      </Grid>
    </div>
  );
}

/*
  Define Styles for the App Component
*/
const AppStyles = {
  FormContainer: {
    register: {
      height: '510px'
    },
    login: {
      height: '400px'
    },
    general: {
      marginTop: '10%',
      border: '1px solid rgba(0, 0, 0, 0.2)',
      padding: '48px 40px 36px',
      borderRadius: '10px',
      maxWidth: '482px',
    }
  },
  title: {
    fontSize: '24px',
    textAlign: 'center',
    fontFamily: 'Open Sans',
    fontWeight: '400'
  }
}

export default App;
