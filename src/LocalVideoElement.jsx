import React, { useEffect } from 'react';

const LocalVideoElement = ({ localStream, feed, display, room, description }) => {
  console.log('ihihihihih');
  useEffect(() => {
    if (room) {
      // 'videos'가 있는지 확인하고, 있다면 해당 ID를 가진 div의 첫 번째 span에 내용을 설정합니다.
      const videosElement = document.getElementById('videos');
      if (videosElement) {
        const spanElement = videosElement.getElementsByTagName('span')[0];
        if (spanElement) {
          spanElement.innerHTML = `--- VIDEOROOM (${room}) ---  roomname: ${description}`;
        }
      }
    }

    if (!feed) return;

    const videoContainerId = `video_${feed}`;
    const existingVideoContainer = document.getElementById(videoContainerId);

    if (!existingVideoContainer) {
      // nameElem에 해당하는 JSX 코드를 생성합니다.
      const nameElem = <div style={{ display: 'table', color: '#fff', fontSize: '0.8rem' }}>{display}</div>;

      if (localStream) {
        console.log('localStream!!!!!!!!!!!', localStream);

        // localVideoStreamElem에 해당하는 JSX 코드를 생성합니다.
        const localVideoStreamElem = (
          <video
            width={160}
            height={120}
            autoPlay
            muted
            className="localVideoTag"
            style={{
              '-moz-transform': 'scale(-1, 1)',
              '-webkit-transform': 'scale(-1, 1)',
              '-o-transform': 'scale(-1, 1)',
              transform: 'scale(-1, 1)',
              filter: 'FlipH',
            }}
            srcObject={localStream}
          />
        );

        // localVideoContainer에 해당하는 JSX 코드를 생성합니다.
        const localVideoContainer = (
          <div id={videoContainerId} className="video-view" style={{ position: 'relative' }}>
            {nameElem}
            {localVideoStreamElem}
            <img id="audioBtn" className="audioOn" alt="audio" />
            <img id="videoBtn" className="videoOn" alt="video" />
          </div>
        );

        // 'local'이 있는지 확인하고, 있다면 해당 ID를 가진 div에 localVideoContainer를 추가합니다.
        const localElement = document.getElementById('local');
        if (localElement) {
          localElement.appendChild(localVideoContainer);
          console.log('2번 렌더링????');
        }
      }
    } else {
      // 기존 비디오 컨테이너를 업데이트하는 코드
      const nameElem = existingVideoContainer.querySelector('div');
      if (display) {
        nameElem.innerHTML = `${display} (${feed})`;
      }

      const localVideoStreamElem = existingVideoContainer.querySelector('video');
      if (localVideoStreamElem) {
        localVideoStreamElem.srcObject = localStream;
      }
    }
  }, [feed, display, localStream, room, description]);

  return null; // 혹은 필요한 경우에는 다른 JSX를 반환할 수 있습니다.
};

export default LocalVideoElement;
