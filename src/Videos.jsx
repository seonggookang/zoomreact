import React, { useContext, useEffect, useRef, useState } from 'react';
import AppContext from './Appcontext';

const LocalVideoContainerImage = ({ videoContainerId, nameElem, localVideoStreamElem }) => (
  <div id={videoContainerId} className="video-view" style={{ position: 'relative' }}>
    {nameElem}
    {localVideoStreamElem}
    <img id="audioBtn" className="audioOn" alt="audio" />
    <img id="videoBtn" className="videoOn" alt="video" />
  </div>
);

const Videos = () => {
  const [LVContainer, setLVContainer] = useState(null);
  const { localStream, feed, myName } = useContext(AppContext);
  const videoContainerId = `video_${feed}`;
  const videoRef = useRef(null);

  useEffect(() => {
    const existingVideoContainer = document.getElementById(videoContainerId);

    if (!existingVideoContainer) {
      const nameElem = <div style={{ display: 'table', color: '#fff', fontSize: '0.8rem' }}>{myName}</div>;

      if (localStream) {
        const localVideoStreamElem = (
          <video
            width={160}
            height={120}
            autoPlay
            muted
            className="localVideoTag"
            style={{
              MozTransform: 'scale(-1, 1)',
              WebkitTransform: 'scale(-1, 1)',
              OTransform: 'scale(-1, 1)',
              transform: 'scale(-1, 1)',
              filter: 'FlipH',
            }}
            ref={videoRef}
            // srcObject={localStream} // react가 인식을 못하는 에러.
          />
        );

        // const localVideoContainer = (
        //   <div id={videoContainerId} className="video-view" style={{ position: 'relative' }}>
        //     {nameElem}
        //     {localVideoStreamElem}
        //     <img id="audioBtn" className="audioOn" alt="audio" />
        //     <img id="videoBtn" className="videoOn" alt="video" />
        //   </div>
        // );
        const localVideoContainer = <LocalVideoContainerImage videoContainerId={videoContainerId} nameElem={nameElem} localVideoStreamElem={localVideoStreamElem} />;

        // ReactDOM.render(localVideoContainer, document.getElementById('local'));

        // const div = document.createElement('div');
        // ReactDOM.render(localVideoContainer, div);
        // document.getElementById('local').appendChild(div);

        // const existingDiv = document.getElementById('local');
        // existingDiv.innerHTML = ''; // 기존 내용을 비워줍니다.

        // const root = React.createRoot(existingDiv);
        // root.render(localVideoContainer);

        // return localVideoContainer;
        // const container = document.getElementById('local');
        // ReactDOM.render(localVideoContainer, container);
        // document.getElementById('local').appendChild(localVideoContainer); // 인자가 DOM 노드가 아니라고 한다..
        // 넌 지금 React JSX를 전달하고 있다.
        setLVContainer(localVideoContainer);
      }
    } else {
      const localVideoContainer = document.getElementById(videoContainerId);

      if (myName) {
        const nameElem = localVideoContainer.getElementsByTagName('div')[0];
        nameElem.innerHTML = `${myName} (${feed})`;
      }

      const localVideoStreamElem = localVideoContainer.getElementsByTagName('video')[0];
      localVideoStreamElem.srcObject = localStream;
      // videoRef.current.srcObject = localStream;
      setLVContainer(localVideoContainer);
    }
    // return null;
  }, [localStream, feed, myName, videoContainerId]);
  console.log('LVContainer >>> ', LVContainer);
  return (
    <div id="videos" className="displayFlex">
      <span className="fontSize"> -- LOCALS -- </span>

      {/* 아예 여기다가 신도시를 개척해보는 건 어때? */}
      <div id="local" style={{ padding: '0 5px' }}>
        {LVContainer}
      </div>

      <div id="remotes" className="remotes">
        <div id="remote" style={{ padding: '0 5px' }} className="displayFlex"></div>
      </div>
    </div>
  );
};

export default Videos;
