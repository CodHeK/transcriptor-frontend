import React from 'react';

const SortableCard = ({ data: item }) => {
    console.log('running sortable card!');
    return (
        <div className="sortable-list" key={item.id}>
            <div className="sortable-filename">{item.name}</div>
            <div className="sortable-listen-icon">
                <i className="fas fa-volume-up"></i>
            </div>
            <div className="sortable-record-icon">
                <i className="fas fa-microphone"></i>
            </div>
            <div className="sortable-delete-icon">
                <i className="fas fa-times"></i>
            </div>
        </div>
    );
};

export default SortableCard;
