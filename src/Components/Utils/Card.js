import React from 'react';
import Skeleton from 'react-loading-skeleton'; // (https://github.com/dvtng/react-loading-skeleton#readme)
import { Card } from 'semantic-ui-react'
import '../styles.css';

const moment = require('moment');

const CustomCard = (props) => {
    const loading = props.header === null && props.meta === null;

    const styles = CustomCardStyles;

    const time = moment(props.meta).format('LT');
    const date = moment(props.meta).format('LL');

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
                </Card.Meta>
            </Card.Content>
        </Card>
    )
}


const CustomCardStyles = {
    Card: {
        marginLeft: '1%',
        width: '48%',
        height: 'auto',
        cursor: 'pointer',
        fontFamily: 'Open Sans',
        fontWeight: '300',
        paddingBottom: '50px'
    }
}

export default CustomCard;