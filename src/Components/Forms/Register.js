import React, { useState } from 'react';
import { Button, Form } from 'semantic-ui-react';
import InputError from '../Error/FormField';
import  { Redirect } from 'react-router-dom';
import '../styles.css';

const RegisterForm = () => {
  /*
    Defining Hooks for input fields
  */
  const [ firstName, setFirstName] = useState('');
  const [ lastName, setLastName ] = useState('');
  const [ email, setEmail ] = useState('');
  const [ password, setPassword ] = useState('');
  const [ loading, setLoading ] = useState(false);
  const [ errorState, setErrorState ] = useState({ 'email': null, 'password': null }); // { 'elementID': state } 

  const styles = LoginFormStyles;

  const handleInputChange = (setFunction, fieldValue) => setFunction(fieldValue);

  const authenticateUser = () => {
      // Init authentication
      setErrorState({ 'email': null, 'password': null });
      setLoading(true);

      // Send email and password values to the backend to authenticate
      setTimeout(() => {

        // Empty field validation
        if(email === '') {
          setErrorState({ ...errorState, 'email': 'empty' });
        }
        else if(email !== '' && password === '') {
          setErrorState({ ...errorState, 'password': 'empty' });
        }
        else if(email !== '' && password !== '') {
          // Now no field is empty check correctness of value
          if(email !== 'gaganganapathyas@gmail.com') {
            setErrorState({ ...errorState, 'email': 'wrong' });
          }
          else if(password !== 'abcd') {
            setErrorState({ ...errorState, 'password': 'wrong' });
          }
          else {
            // correct email and password redirect to dashboard
            if(firstName !== '' && lastName !== '') {
                console.log(firstName, lastName, email, password);
                setErrorState({ 'email': 'correct', 'password': 'correct' });
            }
          }
        }

        setLoading(false);
      }, 500); 
  }
  
  return (
    <React.Fragment>
      {
        errorState.email === 'correct' && errorState.password === 'correct' 
        && <Redirect 
              to={{ 
                    pathname: '/login'
                }} 
            />
      }
      <Form style={styles.FormBox}>
        <Form.Field style={styles.inputField}>
          <input id="firstName" type="text" placeholder='First Name' 
                style={styles.input}
                onChange={e => handleInputChange(setFirstName, e.target.value)} />
          
        </Form.Field>
        <Form.Field style={styles.inputField}>
          <input id="lastName" type="text" placeholder='Last Name' 
                style={styles.input}
                onChange={e => handleInputChange(setLastName, e.target.value)} />
          
        </Form.Field>
        <Form.Field style={styles.inputField}>
          <input id="email" type="text" placeholder='Email ID' 
                style={ errorState.email !== null ? { ...styles.input, ...styles.error } : styles.input }
                onChange={e => handleInputChange(setEmail, e.target.value)} />
          
          {
            errorState.email === 'empty' && <InputError message={`Enter an email ID`} />
          }

          {
            errorState.email === 'wrong' && <InputError message={`Couldn't find your account`} />
          }
        </Form.Field>
        <Form.Field style={styles.inputField}>
          <input id="password" type="password" placeholder='Password'
                style={ errorState.password !== null ? { ...styles.input, ...styles.error } : styles.input } 
                onChange={e => handleInputChange(setPassword, e.target.value)} />
          {
            errorState.password === 'empty' && <InputError message={`Enter a password`} />
          }

          {
            errorState.password === 'wrong' && <InputError message={`Wrong password. Try again`} />
          }
        </Form.Field>
        <Button type='submit' className="next-btn" style={styles.button} loading={loading} onClick={authenticateUser}>Next</Button>
        <Form.Field>
          <label id="login" style={styles.label}><a href="/login" style={styles.label.a}>Login</a></label>
        </Form.Field>
      </Form>
    </React.Fragment>
  )
}

/*
  Define Styles for the Register Component
*/
const LoginFormStyles = {
    FormBox: {
        marginTop: '3em',
        fontFamily: 'Open Sans',
        fontWeight: '400'
    },
    inputField: {
        margin: '1em ',
        fontSize: '16px',
        width: '92%'
    },
    input: {
        margin: '1px 1px 0px',
        padding: '13px 15px',
        width: '97.514%',
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
    },
    error: {
      border: '1.5px solid #d93025'
    }
}

export default RegisterForm;