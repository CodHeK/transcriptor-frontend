import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Dashboard from './Components/Screens/Dashboard';
import * as serviceWorker from './serviceWorker';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

/* Redux imports */
import { Provider } from 'react-redux';
import store from './store';

ReactDOM.render(
    <Provider store={store}>
        <Router>
            <Switch>
                <Route path="/login" exact={true} component={App} />
                <Route path="/register" exact={true} component={App} />
                <Route path="/dashboard" exact={true} component={Dashboard} />
            </Switch>
        </Router>
    </Provider>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
