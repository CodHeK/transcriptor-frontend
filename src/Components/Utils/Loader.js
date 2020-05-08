import React from 'react';
import Skeleton from 'react-loading-skeleton'; // (https://github.com/dvtng/react-loading-skeleton#readme)

export const ReSpeakLoader = () => {
    const MenuGhost = () => {
        const menuGhost = [];
        for (let i = 1; i <= 7; i++) {
            menuGhost.push(
                <li className="menu-item-ghost" key={i}>
                    <Skeleton width={182} height={41} />
                </li>
            );
        }
        return menuGhost;
    };

    return (
        <React.Fragment>
            <div className="toolbar-ghost">
                <Skeleton width={200} height={40} />
                <span className="autosave-ghost">
                    <Skeleton width={180} height={40} />
                </span>
            </div>
            <div className="waveform-ghost">
                <Skeleton height={130} />
            </div>
            <div className="recorder-ghost">
                <div className="menu-ghost">
                    <ul>
                        <MenuGhost />
                    </ul>
                </div>
                <div className="side-segment-ghost">
                    <Skeleton height={367} width={880} />
                </div>
            </div>
        </React.Fragment>
    );
};

export const EditorLoader = () => {
    const AnnotationGhost = props => {
        let ghostAnnotation = [];
        for (let i = 0; i < props.count; i++) {
            ghostAnnotation.push(
                <li className="list-ghost" key={i}>
                    <span className="row-ghost">
                        <Skeleton width={15} height={20} />
                    </span>
                    <span className="row-ghost">
                        <Skeleton width={84} height={20} />
                    </span>
                    <span className="row-ghost">
                        <Skeleton width={84} height={20} />
                    </span>
                    <span className="row-ghost">
                        <Skeleton width={800} height={65} />
                    </span>
                </li>
            );
        }
        return ghostAnnotation;
    };

    return (
        <React.Fragment>
            <div className="toolbar-ghost">
                <Skeleton width={400} height={40} />
                <span className="autosave-ghost">
                    <Skeleton width={180} height={40} />
                </span>
            </div>
            <div className="waveform-ghost">
                <Skeleton height={130} />
            </div>
            <ul className="sentence-ghost-container">
                <AnnotationGhost count={10} />
            </ul>
        </React.Fragment>
    );
};
