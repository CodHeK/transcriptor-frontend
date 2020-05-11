import React, { useState } from 'react';
import { Button, Form } from 'semantic-ui-react';
import InputError from '../Error/FormField';
import '../styles.css';
import tick from '../../images/tick.svg';

import dataProvider from '../dataProvider';
import { useToasts } from 'react-toast-notifications';

const RegisterForm = () => {
    const [registered, setRegistered] = useState(false);
    const styles = LoginFormStyles;

    const FormComponent = () => {
        const [firstname, setfirstname] = useState('');
        const [lastname, setlastname] = useState('');
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [loading, setLoading] = useState(false);
        const [errorState, setErrorState] = useState({
            firstname: null,
            lastname: null,
            email: null,
            password: null,
        });

        const { addToast } = useToasts();

        const handleInputChange = (setFunction, fieldValue) => setFunction(fieldValue);

        const authenticateUser = () => {
            setErrorState({
                firstname: null,
                lastname: null,
                email: null,
                password: null,
            });
            setLoading(true);

            /* 
                Validate Form Data
            */
            if (firstname === '') {
                setErrorState({ ...errorState, firstname: 'error' });
            } else if (lastname === '') {
                setErrorState({ ...errorState, lastname: 'error' });
            } else if (email === '') {
                setErrorState({ ...errorState, email: 'error' });
            } else if (password === '') {
                setErrorState({ ...errorState, password: 'error' });
            } else {
                const formData = { firstname, lastname, email, password };

                /* 
                    Send formData to the backend to authenticate
                */
                dataProvider
                    .auth('register', {
                        options: {
                            data: formData,
                        },
                    })
                    .then(res => {
                        if (res) {
                            if (res.data.success) {
                                setRegistered(true);
                            }
                        } else {
                            alert("Couldn't register user, please try again!");
                        }
                    })
                    .catch(err => {
                        addToast(err.response.data.message, {
                            autoDismiss: true,
                            appearance: 'error',
                            autoDismissTimeout: 3000,
                        });
                    });
            }

            setLoading(false);
        };

        return (
            <React.Fragment>
                <h3 style={styles.title}>Register</h3>
                <Form style={styles.FormBox}>
                    <Form.Field style={styles.inputField}>
                        <input
                            id="firstname"
                            type="text"
                            placeholder="First Name"
                            style={errorState.firstname !== null ? { ...styles.input, ...styles.error } : styles.input}
                            onChange={e => handleInputChange(setfirstname, e.target.value)}
                        />
                        {errorState.firstname === 'error' && <InputError message={`Please check your First Name`} />}
                    </Form.Field>
                    <Form.Field style={styles.inputField}>
                        <input
                            id="lastname"
                            type="text"
                            placeholder="Last Name"
                            style={errorState.lastname !== null ? { ...styles.input, ...styles.error } : styles.input}
                            onChange={e => handleInputChange(setlastname, e.target.value)}
                        />
                        {errorState.lastname === 'error' && <InputError message={`Please check your Last Name`} />}
                    </Form.Field>
                    <Form.Field style={styles.inputField}>
                        <input
                            id="email"
                            type="text"
                            placeholder="Email ID"
                            style={errorState.email !== null ? { ...styles.input, ...styles.error } : styles.input}
                            onChange={e => handleInputChange(setEmail, e.target.value)}
                        />

                        {errorState.email === 'error' && <InputError message={`Please check your Email ID`} />}
                    </Form.Field>
                    <Form.Field style={styles.inputField}>
                        <input
                            id="password"
                            type="password"
                            placeholder="Password (atleast 6 chars long)"
                            style={errorState.password !== null ? { ...styles.input, ...styles.error } : styles.input}
                            onChange={e => handleInputChange(setPassword, e.target.value)}
                        />
                        {errorState.password === 'error' && <InputError message={`Please check your password`} />}
                    </Form.Field>
                    <Button
                        type="submit"
                        className="next-btn"
                        style={styles.button}
                        loading={loading}
                        onClick={authenticateUser}
                    >
                        Next
                    </Button>
                    <Form.Field>
                        <label id="login" style={styles.label}>
                            <a href="/login" style={styles.label.a}>
                                Login
                            </a>
                        </label>
                    </Form.Field>
                </Form>
            </React.Fragment>
        );
    };

    const Verified = () => {
        return (
            <React.Fragment style={{ width: '100%' }}>
                <h3 style={styles.title}>User Registered</h3>
                <img src={tick} alt="tick" className="tick" style={{ width: '128px', height: '128px' }} />
                <br />
                <label className="verf-login">
                    <a href="/login" style={styles.label.a}>
                        Login
                    </a>
                </label>
            </React.Fragment>
        );
    };

    return (
        <React.Fragment>
            {!registered && <FormComponent />}
            {registered && <Verified />}
        </React.Fragment>
    );
};

/*
  Define Styles for the Register Component
*/
const LoginFormStyles = {
    FormBox: {
        marginTop: '3em',
        fontFamily: 'Open Sans',
        fontWeight: '400',
    },
    inputField: {
        margin: '1em ',
        fontSize: '16px',
        width: '92%',
    },
    input: {
        margin: '1px 1px 0px',
        padding: '13px 15px',
        width: '97.514%',
        height: '54px',
        border: '1px solid rgba(0,0,0,0.2)',
    },
    button: {
        margin: '24px',
        position: 'absolute',
        right: '0',
        width: '88px',
        height: '36px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: '#fff',
    },
    label: {
        margin: '30px 16px',
        fontSize: '15px',
        fontWeight: 'bold',
        position: 'absolute',
        a: {
            textDecoration: 'none',
            color: 'rgba(0,0,0,0.8)',
        },
    },
    error: {
        border: '1.5px solid #d93025',
    },
    title: {
        fontSize: '24px',
        textAlign: 'center',
        fontFamily: 'Open Sans',
        fontWeight: '400',
    },
};

export default RegisterForm;
