import React from 'react';
import '../styles.css';

const Empty = () => <h3 style={{ marginLeft: '4%', color: 'rgba(0,0,0,0.7)' }}>
                        No file selected into Editor, go to 'My Transcriptions' to select a file!
                    </h3>

const WaveForm = () => {
    return <></>
}

const Editor = (props) => {
    const transcriptionId = props._id;
    return (
        <React.Fragment>
        {
            transcriptionId === null
            ? <Empty />
            : <WaveForm />
        }
        </React.Fragment>
    )
}

export default Editor;