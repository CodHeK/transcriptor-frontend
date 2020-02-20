import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton'; // (https://github.com/dvtng/react-loading-skeleton#readme)
import { Card, Dropdown } from 'semantic-ui-react'
import '../styles.css';

const moment = require('moment');

const CustomCard = (props) => {
    const [ mode, setMode ] = useState('choose');
    const loading = (props.data === null);

    const styles = CustomCardStyles;

    const time = moment(props.meta).format('LT');
    const date = moment(props.meta).format('LL');

    const options = [
        { key: 1, text: 'edit', value: 1 },
        { key: 2, text: 'assign', value: 2 },
    ];  

    const modeHandler = (e, { options }) => setMode(options.text);

    return (
        <Card style={styles.Card}>
            <Card.Content>
                <Card.Header className="card-header">
                    {!loading ? props.header : <Skeleton width={250} height={18} />}
                    <span>
                    {
                        !loading && <i className="fas fa-times-circle"></i>
                    }
                    </span>
                </Card.Header>
                <Card.Meta className="card-meta">
                    {!loading ? (date + ', ' + time) : <Skeleton width={180} height={15} />}
                    {
                        !loading ?
                        <span style={{ display: 'none' }}>dummy skeleton</span>
                        : <Skeleton width={60} height={15} />
                    }
                    <div className="tags-container">
                        <div className="tag">{props.language}</div> 
                        <div className="tag">{props.mimeType}</div> 
                    </div>

                    { 
                       !loading 
                       && <Dropdown text={mode} options={options} style={styles.dropdown} 
                                    onClick={modeHandler} />
                    }

                </Card.Meta>
            </Card.Content>
        </Card>
    )
}


const CustomCardStyles = {
    Card: {
        marginLeft: '1%',
        width: '48%',
        height: '250px', // (Keep it auto)
        cursor: 'pointer',
        fontFamily: 'Open Sans',
        fontWeight: '300',
        paddingBottom: '50px'
    },
    dropdown: {
        right: '8px',
        bottom: '10px', 
        position: 'absolute',
        borderRadius: '10px',
        minWidth: '80px',
        width: 'auto',
        border: '1px solid black',
        backgroundColor: '#f5f5f5',
        fontSize: '13px',
        color: 'black',
        textAlign: 'center',
        paddingLeft: '3px'
    }
}

export default CustomCard;