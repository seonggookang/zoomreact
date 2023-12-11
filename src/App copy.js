function setLocalVideoElement(localStream, feed, display) {
  if (!feed) return;

  if (!document.getElementById('video_' + feed) && localStream) {
    const localVideoStreamElem = document.getElementsByTagName('video');

    localVideoStreamElem.srcObject = localStream; // 이게 관건이구만
    console.log('localVideoStreamElem >>>', localVideoStreamElem);

    const localsContainer = document.getElementById('locals');

    const myVideo = (
      <div id={`video_${feed}`} className="video-view" style={{ position: 'relative' }}>
        <div
          style={{
            color: 'rgb(255, 255, 255)',
            fontSize: '0.8rem',
          }}
        >
          {display}
        </div>
        <video ref={videoRef} width="160" height="120" autoPlay className="localVideoTag" />
        <img id="audioBtn" className={isAudioOn ? 'audioOn' : 'audioOff'} alt="audio" onClick={() => configure_bitrate_audio_video('audio')} />
        <img id="videoBtn" className={isVideoOn ? 'videoOn' : 'videoOff'} alt="video" onClick={() => configure_bitrate_audio_video('video')} />
      </div>
    );

    ReactDOM.render(myVideo, localsContainer);
  } else {
    const localVideoContainer = document.getElementById('video_' + feed);
    if (display) {
      const nameElem = localVideoContainer.getElementsByTagName('div')[0];
      nameElem.innerHTML = display;
    }
    const localVideoStreamElem = localVideoContainer.getElementsByTagName('video')[0];

    if (localStream) console.log('setLocalVideoElement() >>> change local stream...');
    localVideoStreamElem.srcObject = localStream;
  }
}
