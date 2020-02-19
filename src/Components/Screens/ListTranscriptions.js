import React, { useState, useEffect } from 'react';
import { Menu } from 'semantic-ui-react';

const ListTranscriptions = () => {
    const [ subPage, setSubPage ] = useState('Created');
    const [ transcriptionList, setTranscriptionList ] = useState([]);

    const handleSubTabClick = (e, { name }) => setSubPage(name);

    useEffect(() => {
        const URL = `${process.env.REACT_APP_API_HOST}/api/speech/upload`;
        const token = localStorage.getItem('token');

        fetch(URL, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            const list = data.speeches;
            setTranscriptionList(list);
        });
    });

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

            {
                subPage === 'Created' && console.log(transcriptionList)
            }
            
        </React.Fragment>
    )
}

export default ListTranscriptions;