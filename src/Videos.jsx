import React, { useContext } from 'react';
import AppContext from './Appcontext';
import Bitrate from './Bitrate';

const Videos = () => {
  const { handleUnpublishClick, configure_bitrate_audio_video, isPublished } = useContext(AppContext);

  return (
    <div id="videos" className="displayFlex">
      {/* <div id="locals" style={{ display: 'flex', justifyContent: 'space-between', overflowX: 'auto' }}></div> */}
      <span className="fontSize"> -- LOCALS -- </span>
      {/* <div className="borderGapColor"> */}
      {/* 여기가 비디오가 들어올 곳!!!!!!!!!!!! */}
      <div id="local" style={{ padding: '0 5px' }}></div>

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
