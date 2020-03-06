import React from 'react';
import { Button, Header, Image, Modal } from 'semantic-ui-react';

const InfoModal = () => (
    <Modal trigger={<Button>?</Button>}>
        <Modal.Header>Keyboard Shortcuts</Modal.Header>
        <Modal.Content>
            <Modal.Description>
                <Header>SHIFT + UP</Header>
                <p>Move up one sentence</p>
                <Header>SHIFT + DOWN</Header>
                <p>Move down one sentence</p>
                <Header>ENTER</Header>
                <p>Toggle edit mode</p>
                <Header>SHIFT + SPACE</Header>
                <p>Toggle play / pause mode</p>
            </Modal.Description>
        </Modal.Content>
    </Modal>
);

export default InfoModal;
