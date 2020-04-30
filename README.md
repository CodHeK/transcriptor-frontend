# Installation

### Prerequisites :

Make sure you have the following installed:

-   node
-   yarn

Project built using version `node v13.6.0`.

### Install

Just run `yarn install` to install all the dependencies.

This will build and display the front-end at `http://localhost:3000`, but in order to run the application completely you need the server setup too! Find instructions to setup your server [here](https://gitlab.com/maitrungduc1410/transcriptor-server-next).

### Configure

Make sure to add the API_HOST in your `.env` file.

`REACT_APP_API_HOST=http://localhost:3005`

**:warning: NOTE :**

All keys in `.env` must start with the prefix `REACT_APP_`. For more info refer [here](https://create-react-app.dev/docs/adding-custom-environment-variables/)

### Note:

-   The project uses React Hooks which is in the newer versions of React, make sure you learn how hooks work, can refer to the link [here](https://reactjs.org/docs/hooks-intro.html).
