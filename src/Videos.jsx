// import React, { useContext, useEffect, useRef, useState } from 'react';
// import AppContext from './Appcontext';

// const LocalVideoContainerImage = ({ videoContainerId, nameElem, localVideoStreamElem }) => (
//   <div id={videoContainerId} className="video-view" style={{ position: 'relative' }}>
//     {nameElem}
//     {localVideoStreamElem}
//     <img id="audioBtn" className="audioOn" alt="audio" />
//     <img id="videoBtn" className="videoOn" alt="video" />
//   </div>
// );

// const Videos = () => {
//   const [LVContainer, setLVContainer] = useState(null);
//   const { localStream, feed, myName } = useContext(AppContext);
//   const videoContainerId = `video_${feed}`;
//   const videoRef = useRef(null);

//   useEffect(() => {
//     const existingVideoContainer = document.getElementById(videoContainerId);

//     if (!existingVideoContainer) {
//       const nameElem = <div style={{ display: 'table', color: '#fff', fontSize: '0.8rem' }}>{myName}</div>;

//       if (localStream) {
//         const localVideoStreamElem = (
//           <video
//             width={160}
//             height={120}
//             autoPlay
//             muted
//             className="localVideoTag"
//             style={{
//               MozTransform: 'scale(-1, 1)',
//               WebkitTransform: 'scale(-1, 1)',
//               OTransform: 'scale(-1, 1)',
//               transform: 'scale(-1, 1)',
//               filter: 'FlipH',
//             }}
//             ref={videoRef}
//             // srcObject={localStream} // react가 인식을 못하는 에러.
//           />
//         );

//         // const localVideoContainer = (
//         //   <div id={videoContainerId} className="video-view" style={{ position: 'relative' }}>
//         //     {nameElem}
//         //     {localVideoStreamElem}
//         //     <img id="audioBtn" className="audioOn" alt="audio" />
//         //     <img id="videoBtn" className="videoOn" alt="video" />
//         //   </div>
//         // );
//         const localVideoContainer = <LocalVideoContainerImage videoContainerId={videoContainerId} nameElem={nameElem} localVideoStreamElem={localVideoStreamElem} />;

//         // ReactDOM.render(localVideoContainer, document.getElementById('local'));

//         // const div = document.createElement('div');
//         // ReactDOM.render(localVideoContainer, div);
//         // document.getElementById('local').appendChild(div);

//         // const existingDiv = document.getElementById('local');
//         // existingDiv.innerHTML = ''; // 기존 내용을 비워줍니다.

//         // const root = React.createRoot(existingDiv);
//         // root.render(localVideoContainer);

//         // return localVideoContainer;
//         // const container = document.getElementById('local');
//         // ReactDOM.render(localVideoContainer, container);
//         // document.getElementById('local').appendChild(localVideoContainer); // 인자가 DOM 노드가 아니라고 한다..
//         // 넌 지금 React JSX를 전달하고 있다.
//         setLVContainer(localVideoContainer);
//       }
//     } else {
//       const localVideoContainer = document.getElementById(videoContainerId);

//       if (myName) {
//         const nameElem = localVideoContainer.getElementsByTagName('div')[0];
//         nameElem.innerHTML = `${myName} (${feed})`;
//       }

//       const localVideoStreamElem = localVideoContainer.getElementsByTagName('video')[0];
//       localVideoStreamElem.srcObject = localStream;
//       // videoRef.current.srcObject = localStream;
//       setLVContainer(localVideoContainer);
//     }
//     // return null;
//   }, [localStream, feed, myName, videoContainerId]);
//   console.log('LVContainer >>> ', LVContainer);
//   return (
//     <div id="videos" className="displayFlex">
//       <span className="fontSize"> -- LOCALS -- </span>

//       {/* 아예 여기다가 신도시를 개척해보는 건 어때? */}
//       <div id="local" style={{ padding: '0 5px' }}>
//         {LVContainer}
//       </div>

//       <div id="remotes" className="remotes">
//         <div id="remote" style={{ padding: '0 5px' }} className="displayFlex"></div>
//       </div>
//     </div>
//   );
// };

// export default Videos;

import React, { useContext, useState } from 'react';
import AppContext from './Appcontext';
import $ from 'jquery';

const Videos = () => {
  const { displayName, localStream, getId, socket } = useContext(AppContext);

  // $(document).on('click', '.audioOn, .audioOff', function () {
  //   configure_bitrate_audio_video('audio'); // 이게 null 인거구나..
  // });
  // $(document).on('click', '.videoOn, .videoOff', function () {
  //   configure_bitrate_audio_video('video');
  // });

  // function setLocalVideoElement(localStream, feed, display, room, description) {
  //   // room 이 아주 잽싸게 먼저 와버리네 그리고 feed랑 display가 천천히 들어오고.

  //   if (room) document.getElementById('videos').getElementsByTagName('span')[0].innerHTML = '   --- VIDEOROOM (' + room + ') ---  ' + 'roomname : ' + description;

  //   if (!feed) return;

  //   const videoContainerId = `video_${feed}`;
  //   const existingVideoContainer = document.getElementById(videoContainerId);
  //   if (!existingVideoContainer) {
  //     const nameElem = document.createElement('div');
  //     nameElem.innerHTML = display;
  //     nameElem.style.display = 'table';
  //     nameElem.style.cssText = 'color: #fff; font-size: 0.8rem;';

  //     if (localStream) {
  //       console.log('localStream!!!!!!!!!!!', localStream); // 잘나오는중

  //       const localVideoStreamElem = document.createElement('video');
  //       localVideoStreamElem.width = 160;
  //       localVideoStreamElem.height = 120;
  //       localVideoStreamElem.autoplay = true;
  //       localVideoStreamElem.muted = 'muted';
  //       localVideoStreamElem.classList.add('localVideoTag');
  //       localVideoStreamElem.style.cssText = '-moz-transform: scale(-1, 1); -webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); transform: scale(-1, 1); filter: FlipH;';
  //       localVideoStreamElem.srcObject = localStream;

  //       const localVideoContainer = document.createElement('div');
  //       localVideoContainer.id = 'video_' + feed;
  //       localVideoContainer.appendChild(nameElem);
  //       localVideoContainer.appendChild(localVideoStreamElem);

  //       localVideoContainer.classList.add('video-view');
  //       localVideoContainer.style.cssText = 'position: relative;';

  //       const localAudioOnOffElem = document.createElement('img');
  //       localAudioOnOffElem.id = 'audioBtn';
  //       localAudioOnOffElem.classList.add('audioOn');

  //       const localVideoOnOffElem = document.createElement('img');
  //       localVideoOnOffElem.id = 'videoBtn';
  //       localVideoOnOffElem.classList.add('videoOn');

  //       localVideoContainer.appendChild(localAudioOnOffElem);
  //       localVideoContainer.appendChild(localVideoOnOffElem);

  //       document.getElementById('local').appendChild(localVideoContainer);
  //     }
  //   } else {
  //     // 일단 이 아래 else에 대한 부분은 안나오고 있음 - steve
  //     const localVideoContainer = document.getElementById('video_' + feed);
  //     if (display) {
  //       const nameElem = localVideoContainer.getElementsByTagName('div')[0];
  //       nameElem.innerHTML = display + ' (' + feed + ')';
  //     }
  //     const localVideoStreamElem = localVideoContainer.getElementsByTagName('video')[0];
  //     localVideoStreamElem.srcObject = localStream;
  //   }
  // }

  // function setRemoteVideoElement(remoteStream, feed, display) {
  //   if (!feed) return;

  //   if (!document.getElementById('video_' + feed)) {
  //     console.log('coming???'); // 나온다. 그러면..
  //     const nameElem = document.createElement('div');
  //     nameElem.innerHTML = display + ' (' + feed + ')';
  //     nameElem.style.display = 'table';

  //     const remoteVideoStreamElem = document.createElement('video');
  //     remoteVideoStreamElem.width = 320;
  //     remoteVideoStreamElem.height = 240;
  //     remoteVideoStreamElem.autoplay = true;
  //     remoteVideoStreamElem.setAttribute('feed', feed);
  //     remoteVideoStreamElem.style.cssText = '-moz-transform: scale(-1, 1); -webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); transform: scale(-1, 1); filter: FlipH;';

  //     if (remoteStream) {
  //       console.log('======== remoteStream ============', feed);
  //       console.log(remoteStream);
  //       remoteVideoStreamElem.srcObject = remoteStream;
  //     }

  //     const remoteVideoContainer = document.createElement('div');
  //     remoteVideoContainer.id = 'video_' + feed;
  //     remoteVideoContainer.appendChild(nameElem);
  //     remoteVideoContainer.appendChild(remoteVideoStreamElem);

  //     document.getElementById('remotes').appendChild(remoteVideoContainer);
  //   } else {
  //     const remoteVideoContainer = document.getElementById('video_' + feed);
  //     if (display) {
  //       const nameElem = remoteVideoContainer.getElementsByTagName('div')[0];
  //       nameElem.innerHTML = display + ' (' + feed + ')';
  //     }
  //     if (remoteStream) {
  //       console.log('======== remoteStream ============', feed);
  //       console.log(remoteStream);
  //       const remoteVideoStreamElem = remoteVideoContainer.getElementsByTagName('video')[0];
  //       remoteVideoStreamElem.srcObject = remoteStream;
  //     }
  //   }
  // }

  return (
    <div id="videos" className="displayFlex">
      {/* <div id="locals" style={{ display: 'flex', justifyContent: 'space-between', overflowX: 'auto' }}></div> */}
      <span className="fontSize"> -- LOCALS -- </span>
      {/* <div className="borderGapColor"> */}
      {/* 여기가 비디오가 들어올 곳!!!!!!!!!!!! */}
      <div id="local" style={{ padding: '0 5px' }}>
        {/* <div id={`video_${feed}`} className="video-view" style={{ position: 'relative' }}> */}
        {/* <div id={`video_123`} className="video-view" style={{ position: 'relative' }}> */}
        {/* <div>John_Doe_1348 (4892969034028528)</div> */}
        {/* <div>{displayName}</div> */}
        {/* <video width="160" height="120" className="localVideoTag" /> */}
        {/* <img onClick={() => configure_bitrate_audio_video('audio')} id="audioBtn" className={`${isAudioOn ? 'audioOn' : 'audioOff'}`} alt="audio" /> */}
        {/* <img onClick={() => configure_bitrate_audio_video('video')} id="videoBtn" className={`${isVideoOn ? 'videoOn' : 'videoOff'}`} alt="video" /> */}
        {/* </div> */}
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
