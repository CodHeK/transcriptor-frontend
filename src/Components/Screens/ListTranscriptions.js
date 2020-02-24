import React, { useState, useEffect } from 'react';
import { Menu, Card, Input } from 'semantic-ui-react';
import Skeleton from 'react-loading-skeleton'; // (https://github.com/dvtng/react-loading-skeleton#readme)
import CustomCard from '../Utils/Card';

const ListTranscriptions = (props) => {
    const [ subPage, setSubPage ] = useState('Created');
    const [ transcriptionList, setTranscriptionList ] = useState([]);
    const [ cardsLoaded, setCardLoaded ] = useState(false);
    const [ filteredList, setFilteredList ] = useState([]);

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
                const list = data.speeches;

                setTranscriptionList(list);
                setCardLoaded(true);
            });
        }, 1000);

        
    },[]); /* 
               useEffect(() => {...},[]) -> to make sure infinte loop doesn't occur 
               https://stackoverflow.com/questions/53715465/can-i-set-state-inside-a-useeffect-hook
           */

    const Empty = () => <h3 style={{ marginLeft: '4%', color: 'rgba(0,0,0,0.7)' }}>
                            You haven't uploaded any files for transcriptions!
                        </h3>

    const TranscriptionList = (props) => props.list.map((each, key) => {
        const data = { 
                       _id: each._id, 
                       header: each.uploadedFile.originalname, 
                       meta: each.createdAt,
                       language: each.language,
                       mimeType: each.uploadedFile.mimetype
                     };

        return <CustomCard key={key} {...data} />;
    });

    const GhostLoader = () => {
        let elems = [];
        for(let i=0;i<6;i++) {
            const data = null;
            elems.push(<CustomCard key={i} data={data} />);
        }
        return elems;
    }

    const searchBarHandler = (e) => {
        let searchVal = e.target.value.toLowerCase();
        let searchResults = [];

        if(searchVal !== '') {
            for(let file of transcriptionList) {
                // Search by filename
                let filename = file.uploadedFile.originalname.toLowerCase();

                if(String(filename).match(String(searchVal))) {
                    searchResults.push(file);
                }
            }
        }

        setFilteredList(searchResults);
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
                <Menu.Menu position='right' style={{ width: '500px' }}>
                    <Menu.Item style={{ width: '40%' }}>
                        {
                            cardsLoaded && <span className="search-results">
                                            {
                                                filteredList.length > 0 
                                                ? (
                                                    filteredList.length > 1 
                                                    ? `(${filteredList.length} records found)` 
                                                    : `(${filteredList.length} record found)`
                                                ) 
                                                : `(${transcriptionList.length} records found)`
                                            }
                                           </span>
                        }
                    </Menu.Item>
                    <Menu.Item style={{ width: '60%' }}>
                        {
                            cardsLoaded ? <Input
                                            transparent
                                            icon={{ name: 'search', link: true }}
                                            placeholder='Search records...'
                                            onChange={searchBarHandler}
                                          />
                                        : <Skeleton width={250} height={30} />
                        }
                    </Menu.Item>
                </Menu.Menu>
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
                cardsLoaded && subPage === 'Created'
                && <Card.Group style={{ marginLeft: '4%' }}>
                        <TranscriptionList 
                            list={filteredList.length > 0 ? filteredList : transcriptionList} 
                        />
                   </Card.Group>
            }
            
        </React.Fragment>
    )
}

export default ListTranscriptions;