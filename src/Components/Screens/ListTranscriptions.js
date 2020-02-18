import React, { useState } from 'react';
import { Menu } from 'semantic-ui-react';

const ListTranscriptions = () => {
    const [ subPage, setSubPage ] = useState('Created');

    const handleSubTabClick = (e, { name }) => setSubPage(name);

    return (
        <React.Fragment>
            <Menu tabular style={{ marginLeft: '4%' }}>
                <Menu.Item
                    name='Created'
                    active={subPage === 'Created'}
                    onClick={handleSubTabClick}
                />
                <Menu.Item
                    name='Assigned'
                    active={subPage === 'Assigned'}
                    onClick={handleSubTabClick}
                />
            </Menu>
        </React.Fragment>
    )
}

export default ListTranscriptions;