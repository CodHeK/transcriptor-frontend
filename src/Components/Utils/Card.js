import React from 'react';
import { Card } from 'semantic-ui-react'
import '../styles.css';

const moment = require('moment');

const CustomCard = (props) => {
    const styles = CustomCardStyles;
    const time = moment(props.data.meta).format('LT');
    const date = moment(props.data.meta).format('LL');

    return (
        <Card style={styles.Card}>
            <Card.Content>
                <Card.Header className="card-header">
                    {props.data.header}
                    <span><i className="fas fa-times-circle"></i></span>
                </Card.Header>
                <Card.Meta className="card-meta">{time + ', ' + date}</Card.Meta>
            </Card.Content>
        </Card>
    )
}


const CustomCardStyles = {
    Card: {
        marginLeft: '1%',
        width: '31%',
        height: 'auto',
        cursor: 'pointer',
        fontFamily: 'Open Sans',
        fontWeight: '300',
        paddingBottom: '50px'
    }
}

export default CustomCard;