import React from 'react';
import 'semantic-ui-css/semantic.min.css';
import { Grid } from 'semantic-ui-react'
import LoginForm from './Components/Forms/Login';

const App = () => {
  const styles = AppStyles;

  return (
    <div className="App">
      <Grid columns={3}>
        <Grid.Column></Grid.Column>
          <Grid.Column style={styles.FormContainer}>
            <h3 style={styles.title}>Sign in</h3>
            <LoginForm />
          </Grid.Column>
        <Grid.Column></Grid.Column>
      </Grid>
    </div>
  );
}

const AppStyles = {
  FormContainer: {
    marginTop: '10%',
    border: '1px solid rgba(0, 0, 0, 0.2)',
    padding: '48px 40px 36px',
    minHeight: '400px',
    borderRadius: '10px'
  },
  title: {
    fontSize: '24px',
    textAlign: 'center',
    fontFamily: 'Open Sans',
    fontWeight: '400'
  }
}

export default App;
