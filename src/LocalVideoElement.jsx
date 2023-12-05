import React, { useRef, useEffect } from 'react';

function LocalVideoElement(props) {
  console.log('props >>> ', props);
  useEffect(() => {
    if (!props || !props.localStream || !props.feed || !props.display || !props.room || !props.description) {
      return null;
    }

    const { localStream, feed, display, room, description } = props;
    if (room) {
      const roomElement = document.getElementById('videos').getElementsByTagName('span')[0];
      roomElement.innerHTML = `   --- VIDEOROOM (${room}) ---  roomname : ${description}`;
    }

    if (!feed) return;

    const videoContainerId = `video_${feed}`;
    const existingVideoContainer = document.getElementById(videoContainerId);

    if (!existingVideoContainer) {
      const nameElem = <div style={{ display: 'table', color: '#fff', fontSize: '0.8rem' }}>{display}</div>;

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
            srcObject={localStream}
          />
        );

        const localVideoContainer = (
          <div id={videoContainerId} className="video-view" style={{ position: 'relative' }}>
            {nameElem}
            {localVideoStreamElem}
            <img id="audioBtn" className="audioOn" alt="audio" />
            <img id="videoBtn" className="videoOn" alt="video" />
          </div>
        );

        document.getElementById('local').appendChild(localVideoContainer);
      }
    } else {
      const localVideoContainer = document.getElementById(videoContainerId);
      if (display) {
        const nameElem = localVideoContainer.getElementsByTagName('div')[0];
        nameElem.innerHTML = `${display} (${feed})`;
      }
      const localVideoStreamElem = localVideoContainer.getElementsByTagName('video')[0];
      localVideoStreamElem.srcObject = localStream;
    }
  }, [props.localStream, props.feed, props.display, props.room, props.description]);

  return null; // 또는 다른 JSX를 반환하거나 아무것도 반환하지 않도록 조정
}

export default LocalVideoElement;
