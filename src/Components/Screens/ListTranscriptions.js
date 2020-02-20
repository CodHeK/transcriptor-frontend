import React, { useState, useEffect } from 'react';
import { Menu, Card } from 'semantic-ui-react';
import CustomCard from '../Utils/Card';

const ListTranscriptions = () => {
    const [ subPage, setSubPage ] = useState('Created');
    const [ transcriptionList, setTranscriptionList ] = useState([]);
    const [ cardsLoaded, setCardLoaded ] = useState(false);

    const handleSubTabClick = (e, { name }) => setSubPage(name);

    useEffect(() => {
        const URL = `${process.env.REACT_APP_API_HOST}/api/speech`;
        const token = localStorage.getItem('token');

        setTimeout(() => {
            fetch(URL, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(res => res.json())
            .then(data => {
                const list = data.speeches.sort((a, b) => {
                    const d1 = Date.parse(a.createdAt); // returns milliseconds from 1st Jan 1970
                    const d2 = Date.parse(b.createdAt);
    
                    if(d1 < d2) return 1;
                    else if(d1 > d2) return -1;
                    return 0;
                });
                setTranscriptionList(list);
                setCardLoaded(true);
            });
        }, 3000);

        
    },[]); /* 
               useEffect(() => {...},[]) -> to make sure infinte loop doesn't occur 
               https://stackoverflow.com/questions/53715465/can-i-set-state-inside-a-useeffect-hook
           */

    const Empty = () => <h3 style={{ marginLeft: '4%', color: 'rgba(0,0,0,0.7)' }}>You haven't uploaded any files for transcriptions!</h3>

    const TranscriptionList = () => transcriptionList.map((each, key) => {
        const data = { header: each.uploadedFile.originalname, meta: each.createdAt };

        return <CustomCard key={key} {...data} />;
    });

    const GhostLoader = () => {
        let elems = [];
        for(let i=0;i<4;i++) {
            const data = { header: null, meta: null };
            elems.push(<CustomCard key={i} {...data} />);
        }
        return elems;
    }

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
                !cardsLoaded
                && <Card.Group style={{ marginLeft: '4%' }}>
                       <GhostLoader />
                   </Card.Group>
            }
            {
                cardsLoaded && subPage === 'Created' && transcriptionList.length === 0 && <Empty />
            }
            {
                cardsLoaded && subPage === 'Created' && transcriptionList.length > 0 
                && <Card.Group style={{ marginLeft: '4%' }}>
                        <TranscriptionList />
                   </Card.Group>
            }
            
        </React.Fragment>
    )
}

export default ListTranscriptions;