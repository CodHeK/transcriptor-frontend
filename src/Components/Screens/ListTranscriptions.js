/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Menu, Card, Input } from 'semantic-ui-react';
import Skeleton from 'react-loading-skeleton'; // (https://github.com/dvtng/react-loading-skeleton#readme)
import CustomCard from '../Utils/CustomCard';
import dataProvider from '../dataProvider';
import { useToasts } from 'react-toast-notifications';

/* import react-redux hook for getting state */
import { useDispatch, useSelector } from 'react-redux';

import { setTranscriptionId } from '../../actions/TranscriptionActions';

const ListTranscriptions = () => {
    const [subPage, setSubPage] = useState('Created');
    const [transcriptionList, setTranscriptionList] = useState([]);
    const [cardsLoaded, setCardLoaded] = useState(false);
    const [filteredList, setFilteredList] = useState([]);
    const { addToast } = useToasts();

    /* 
        Transcription related operations
    */
    const { _id, content: status } = useSelector(state => ({ ...state.SOCKET.statusData }));
    const { transcriptionId } = useSelector(state => ({ ...state.TRANSCRIPTION }));
    const [statusCache, setStatusCache] = useState(null);

    let dispatch = useDispatch();

    const handleSubTabClick = (e, { name }) => setSubPage(name);

    useEffect(() => {
        if (transcriptionId != null) {
            dataProvider.speech
                .delete('', {
                    id: transcriptionId,
                })
                .then(res => {
                    addToast('Transcription deleted sucessfully!', {
                        autoDismiss: true,
                        appearance: 'success',
                        autoDismissTimeout: 3000,
                    });
                })
                .catch(err => {
                    addToast(err.response.data.error, {
                        autoDismiss: true,
                        appearance: 'error',
                        autoDismissTimeout: 3000,
                    });
                });

            dispatch(setTranscriptionId(null));
        }

        setTimeout(() => {
            dataProvider.speech
                .getList('transcriptions', {})
                .then(res => {
                    const list = res.data.speeches;

                    setTranscriptionList(list);
                    setCardLoaded(true);
                })
                .catch(err => {
                    addToast(err.response.data.error + ' Try, refreshing your page!', {
                        autoDismiss: true,
                        appearance: 'error',
                        autoDismissTimeout: 3000,
                    });
                });
        }, 500);
    }, [transcriptionId]);

    useEffect(() => {
        let cache = [];
        for (let each of transcriptionList) {
            if (each.status === 'processing') {
                if (each._id === _id) {
                    cache[each._id] = status;
                } else {
                    if (each._id in statusCache) {
                        cache[each._id] = statusCache[each._id];
                    } else {
                        // check last element in logs array
                        let lenLogs = each.logs.length;
                        if (lenLogs === 0) {
                            cache[each._id] = 'processing..';
                        } else {
                            let lastLog = each.logs[lenLogs - 1];
                            cache[each._id] = lastLog.content;
                        }
                    }
                }
            } else {
                cache[each._id] = each.status;
            }
        }

        setStatusCache(cache);
    }, [_id, status, transcriptionList]);

    const Empty = () => (
        <h3 style={{ marginLeft: '4%', color: 'rgba(0,0,0,0.7)' }}>
            You haven't uploaded any files for transcriptions!
        </h3>
    );

    const TranscriptionList = props =>
        props.list.map((each, key) => {
            const data = {
                _id: each._id,
                path: each.uploadedFile.path,
                uploadedFileId: each.uploadedFile._id,
                filename: each.uploadedFile.originalname,
                createdAt: each.createdAt,
                language: each.language,
                mimeType: each.uploadedFile.mimetype,
                status: statusCache[each._id],
            };

            return <CustomCard key={key} {...data} />;
        });

    const GhostLoader = () => {
        let elems = [];
        for (let i = 0; i < 6; i++) {
            const data = null; // denoting it is a loader
            elems.push(<CustomCard key={i} data={data} />);
        }
        return elems;
    };

    const searchBarHandler = e => {
        let searchVal = e.target.value.toLowerCase();
        let searchResults = [];

        if (searchVal !== '') {
            for (let file of transcriptionList) {
                // Search by filename
                let filename = file.uploadedFile.originalname.toLowerCase();

                if (String(filename).match(String(searchVal))) {
                    searchResults.push(file);
                }
            }
        }

        setFilteredList(searchResults);
    };

    return (
        <React.Fragment>
            <Menu tabular style={{ marginLeft: '4%' }}>
                <Menu.Item name="Created" active={subPage === 'Created'} onClick={handleSubTabClick} />
                <Menu.Item name="Assigned" active={subPage === 'Assigned'} onClick={handleSubTabClick} />
                <Menu.Menu position="right" style={{ width: '500px' }}>
                    <Menu.Item style={{ width: '40%' }}>
                        {cardsLoaded && (
                            <span className="search-results">
                                {filteredList.length > 0
                                    ? filteredList.length > 1
                                        ? `(${filteredList.length} records found)`
                                        : `(${filteredList.length} record found)`
                                    : transcriptionList.length > 1
                                    ? `(${transcriptionList.length} records found)`
                                    : `(${transcriptionList.length} record found)`}
                            </span>
                        )}
                    </Menu.Item>
                    <Menu.Item style={{ width: '60%' }}>
                        {cardsLoaded ? (
                            <Input
                                transparent
                                icon={{ name: 'search', link: true }}
                                placeholder="Search records..."
                                onChange={searchBarHandler}
                            />
                        ) : (
                            <Skeleton width={250} height={30} />
                        )}
                    </Menu.Item>
                </Menu.Menu>
            </Menu>

            {!cardsLoaded && (
                <Card.Group style={{ marginLeft: '4%' }}>
                    <GhostLoader />
                </Card.Group>
            )}
            {cardsLoaded && subPage === 'Created' && transcriptionList.length === 0 && <Empty />}
            {cardsLoaded && subPage === 'Created' && (
                <Card.Group style={{ marginLeft: '4%' }}>
                    <TranscriptionList list={filteredList.length > 0 ? filteredList : transcriptionList} />
                </Card.Group>
            )}
        </React.Fragment>
    );
};

export default ListTranscriptions;
