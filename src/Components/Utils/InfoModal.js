import React from 'react';
import { Button, Header, Modal } from 'semantic-ui-react';

const InfoModal = () => (
    <Modal trigger={<Button>?</Button>}>
        <Modal.Header>KEYBOARD SHORTCUTS</Modal.Header>
        <Modal.Content>
            <Modal.Description>
                <Header>UP arrow</Header>
                <p>Move up one sentence</p>
                <Header>DOWN arrow</Header>
                <p>Move down one sentence</p>
                <Header>ENTER</Header>
                <p>Toggle edit mode</p>

                <Header>CTRL + P</Header>
                <p>Toggle play / pause mode</p>
            </Modal.Description>
        </Modal.Content>
        <Modal.Header>IN EDIT MODE</Modal.Header>
        <Modal.Content>
            <Modal.Description>
                <Header>CTRL + B</Header>
                <p>Start playing from beginning of sentence</p>

                <Header>CTRL + plus</Header>
                <p>Increment cursor point 0.1s</p>
                <Header>CTRL + minus</Header>
                <p>Decrement cursor point 0.1s</p>
            </Modal.Description>
        </Modal.Content>
    </Modal>
);

export default InfoModal;
