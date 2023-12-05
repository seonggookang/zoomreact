import React, { useContext, useEffect } from 'react';
import AppContext from './Appcontext';
import Bitrate from './Bitrate';

const Videos = () => {
  const { handleUnpublishClick, localStream, feed, myName, displayName, configure_bitrate_audio_video, isPublished } = useContext(AppContext);
  const videoContainerId = `video_${feed}`;

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
        // return localVideoContainer;
        document.getElementById('local').appendChild(localVideoContainer); // 이게 계속 잘못됐다고 나오네.
      }
    } else {
      const localVideoContainer = document.getElementById(videoContainerId);
      if (myName) {
        const nameElem = localVideoContainer.getElementsByTagName('div')[0];
        nameElem.innerHTML = `${myName} (${feed})`;
      }
      const localVideoStreamElem = localVideoContainer.getElementsByTagName('video')[0];
      localVideoStreamElem.srcObject = localStream;
    }
    // return null;
  }, [localStream, feed, myName, videoContainerId]);

  return (
    <div id="videos" className="displayFlex">
      {/* <div id="locals" style={{ display: 'flex', justifyContent: 'space-between', overflowX: 'auto' }}></div> */}
      <span className="fontSize"> -- LOCALS -- </span>

      {/* 아예 여기다가 신도시를 개척해보는 건 어때? */}
      <div id="local" style={{ padding: '0 5px' }}>
        {/* {localStream && (
          <div id={videoContainerId} className="video-view" style={{ position: 'relative' }}>
            <div style={{ display: 'table', color: '#fff', fontSize: '0.8rem' }}>{myName}</div>
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
            <img id="audioBtn" className="audioOn" alt="audio" />
            <img id="videoBtn" className="videoOn" alt="video" />
          </div>
        )} */}
      </div>

      {/* <button id="unpublish" className="btn btn-primary btn-xs btn_between" onClick={handleUnpublishClick}>
            {isPublished ? 'Unpublish' : 'Publish'}
          </button> */}
      {/* <button id="audioset" className="btn btn-primary btn-xs btn_between" onClick="configure_bitrate_audio_video('audio');"> */}
      {/* <button id="audioset" className="btn btn-primary btn-xs btn_between" onClick={() => configure_bitrate_audio_video('audio')}>
            Audio
          </button>
          <button id="videoset" className="btn btn-primary btn-xs btn_between" onClick={() => configure_bitrate_audio_video('video')}>
            Video
          </button>
          <div className="btn-group btn-group-xs">
            <Bitrate configure_bitrate_audio_video={configure_bitrate_audio_video} />
          </div> */}
      {/* </div>
        <div id="local_info" className="displayNone">
          local_feed: <div id="local_feed" className="displayFlex"></div>
          private_id: <div id="private_id" className="displayFlex"></div>
        </div> */}
      {/* </div> */}

      <div id="remotes" className="remotes">
        {/* <div className="borderGapColor"> */}
        <div id="remote" style={{ padding: '0 5px' }} className="displayFlex"></div>
        {/* <div id="local2_buttons" style={{ textAlign: 'center', display: 'none' }}>
              <button id="unpublish" className="btn btn-primary btn-xs btn_between displayNone" onClick={handleUnpublishClick}>
                Unpublish
              </button>
              <button id="audioset" className="btn btn-primary btn-xs btn_between displayNone" onClick={() => configure_bitrate_audio_video('audio')}>
                Audio
              </button>
              <button id="videoset" className="btn btn-primary btn-xs btn_between displayNone" onClick={() => configure_bitrate_audio_video('video')}>
                Video
              </button>
              <div className="btn-group btn-group-xs displayNone">
                <Bitrate configure_bitrate_audio_video={configure_bitrate_audio_video} />
              </div>
            </div> */}
        {/* </div> */}
      </div>
    </div>
  );
};

export default Videos;
