import React, { useState } from 'react';
import { Button, Form } from 'semantic-ui-react'


const LoginForm = () => {
  /*
    Defining Hooks for input fields
  */
  const [ email, setEmail ] = useState('');
  const [ password, setPassword ] = useState('');

  const styles = LoginFormStyles;

  const handleInputChange = (setFunction, fieldValue) => setFunction(fieldValue);

  const authenticateUser = () => {
      // Send to email and password values to the backend to authenticate
      console.log(email, password);
  }

  return (
    <Form style={styles.FormBox}>
      <Form.Field style={styles.inputField}>
        <input type="text" placeholder='Email ID' style={styles.input}
               onChange={e => handleInputChange(setEmail, e.target.value)} />
      </Form.Field>
      <Form.Field style={styles.inputField}>
        <input type="password" placeholder='Password' style={styles.input} 
               onChange={e => handleInputChange(setPassword, e.target.value)} />
      </Form.Field>
      <Button type='submit' style={styles.button} onClick={authenticateUser}>Next</Button>
      <Form.Field>
        <label style={styles.label}><a href="/register" style={styles.label.a}>Create account</a></label>
      </Form.Field>
    </Form>
  )
}

const LoginFormStyles = {
    FormBox: {
        marginTop: '3em',
        fontFamily: 'Open Sans',
        fontWeight: '400'
    },
    inputField: {
        margin: '1em ',
        fontSize: '16px'
    },
    input: {
        margin: '1px 1px 0px',
        padding: '13px 15px',
        width: '366px',
        height: '54px',
        border: '1px solid rgba(0,0,0,0.2)'
    },
    button: {
        margin: '24px',
        position: 'absolute',
        right: '0',
        width: '88px',
        height: '36px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: '#fff'
    },
    label: {
        margin: '30px 16px',
        fontSize: '15px',
        fontWeight: 'bold',
        position: 'absolute',
        a: {
        textDecoration: 'none',
        color: 'rgba(0,0,0,0.8)'
        }
    }
}

export default LoginForm;