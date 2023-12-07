import './App.css';
import Container from './Container';
import ModalComponent from './ModalComponent';
import { useState, useRef, useEffect, ReactDOM } from 'react';
import AppContext from './Appcontext';
import io from 'socket.io-client';
import $ from 'jquery';
import LocalVideoElement from './LocalVideoElement';

function App() {
  const [displayName, setDisplayName] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(true);
  // function getURLParameter(name) {
  //   return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(window.location.search) || [, ''])[1].replace(/\+/g, '%20')) || null;
  // }

  let myRoom = getURLParameter('room') ? parseInt(getURLParameter('room')) : getURLParameter('room_str') || 1234;

  const randName = 'John_Doe_' + Math.floor(10000 * Math.random());
  const myName = getURLParameter('name') || randName;
  const [localStream, setLocalStream] = useState(null);
  const localVideoRef = useRef(null);
  const [socket, _] = useState(io('https://janusc.wizbase.co.kr:4443', { autoConnect: false }));
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  const pcMap = new Map();
  let pendingOfferMap = new Map(); // 존재 이유는?
  let local_feed;
  let local_display;

  function getURLParameter(name) {
    const regex = new RegExp(`[?|&]${name}=([^&;]+?)(&|#|;|$)`);
    const results = regex.exec(window.location.search) || [];
    return decodeURIComponent((results[1] || '').replace(/\+/g, '%20')) || null;
  }
  const RTCPeerConnection = (window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection).bind(window);

  const generateRandomNumber = () => {
    const randomNumber = Math.floor(Math.random() * 1e16)
      .toString()
      .padStart(16, '0'); // 16자리에서 앞쪽부터 빈자리는 0으로 채움.
    return parseInt(randomNumber); // 정수화
  };

  async function doAnswer(feed, display, offer) {
    console.log('doAnswer()중.. feed >>> ', feed, 'display >>> ', display, 'offer >>> ', offer);
    if (!pcMap.has(feed)) {
      console.log('doAnswer() ==> ', feed, ' feed용 pc 가 없어서 RTCPeerConnection 생성');
      const pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: 'stun:stun.l.google.com:19302',
          },
        ],
      });

      pc.onnegotiationneeded = (event) => console.log('pc.onnegotiationneeded doAnswer', event);
      pc.onicecandidate = (event) => trickle({ feed, candidate: event.candidate });
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
          removeVideoElementByFeed(feed);
          closePC(feed);
        }
      };
      pc.ontrack = (event) => {
        console.log('pc.ontrack', event);

        event.track.onunmute = (evt) => {
          console.log('track.onunmute', evt);
        };
        event.track.onmute = (evt) => {
          console.log('track.onmute', evt);
        };
        event.track.onended = (evt) => {
          console.log('track.onended', evt);
        };

        const remoteStream = event.streams[0];
        setRemoteVideoElement(remoteStream, feed, display);
      };

      pcMap.set(feed, pc);
      console.log('pc 추가됨, pcMap===', pcMap);
    }

    const pc = pcMap.get(feed);

    try {
      await pc.setRemoteDescription(offer);
      console.log('set remote sdp OK ', offer.type);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('set local sdp OK as below');
      console.log(pc);
      return answer;
    } catch (e) {
      console.log('error creating subscriber answer >>> ', e);
      removeVideoElementByFeed(feed);
      closePC(feed);
      throw e;
    }
  }

  function setLocalVideoElement(localStream, feed, display, room, description) {
    // room 이 아주 잽싸게 먼저 와버리네 그리고 feed랑 display가 천천히 들어오고.

    if (room) document.getElementById('videos').getElementsByTagName('span')[0].innerHTML = '   --- VIDEOROOM (' + room + ') ---  ' + 'roomname : ' + description;

    if (!feed) return;

    const videoContainerId = `video_${feed}`;
    const existingVideoContainer = document.getElementById(videoContainerId);
    if (!existingVideoContainer) {
      const nameElem = document.createElement('div');
      nameElem.innerHTML = display;
      nameElem.style.display = 'table';
      nameElem.style.cssText = 'color: #fff; font-size: 0.8rem;';

      if (localStream) {
        const localVideoStreamElem = document.createElement('video');
        localVideoStreamElem.width = 160;
        localVideoStreamElem.height = 120;
        localVideoStreamElem.autoplay = true;
        localVideoStreamElem.muted = 'muted';
        localVideoStreamElem.classList.add('localVideoTag');
        localVideoStreamElem.style.cssText = '-moz-transform: scale(-1, 1); -webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); transform: scale(-1, 1); filter: FlipH;';
        localVideoStreamElem.srcObject = localStream;

        const localVideoContainer = document.createElement('div');
        localVideoContainer.id = 'video_' + feed;
        localVideoContainer.appendChild(nameElem);
        localVideoContainer.appendChild(localVideoStreamElem);

        localVideoContainer.classList.add('video-view');
        localVideoContainer.style.cssText = 'position: relative;';

        const localAudioOnOffElem = document.createElement('img');
        localAudioOnOffElem.id = 'audioBtn';
        localAudioOnOffElem.classList.add('audioOn');

        const localVideoOnOffElem = document.createElement('img');
        localVideoOnOffElem.id = 'videoBtn';
        localVideoOnOffElem.classList.add('videoOn');

        localVideoContainer.appendChild(localAudioOnOffElem);
        localVideoContainer.appendChild(localVideoOnOffElem);

        document.getElementById('local').appendChild(localVideoContainer);
      }
    } else {
      // 일단 이 아래 else에 대한 부분은 안나오고 있음 - steve
      const localVideoContainer = document.getElementById('video_' + feed);
      if (display) {
        const nameElem = localVideoContainer.getElementsByTagName('div')[0];
        nameElem.innerHTML = display + ' (' + feed + ')';
      }
      const localVideoStreamElem = localVideoContainer.getElementsByTagName('video')[0];
      localVideoStreamElem.srcObject = localStream;
    }
  }

  function setRemoteVideoElement(remoteStream, feed, display) {
    if (!feed) return;

    if (!document.getElementById('video_' + feed)) {
      console.log('coming???'); // 나온다. 그러면..
      const nameElem = document.createElement('div');
      nameElem.innerHTML = display + ' (' + feed + ')';
      nameElem.style.display = 'table';

      const remoteVideoStreamElem = document.createElement('video');
      remoteVideoStreamElem.width = 160;
      remoteVideoStreamElem.height = 120;
      remoteVideoStreamElem.autoplay = true;
      remoteVideoStreamElem.setAttribute('feed', feed);
      remoteVideoStreamElem.style.cssText = '-moz-transform: scale(-1, 1); -webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); transform: scale(-1, 1); filter: FlipH;';

      if (remoteStream) {
        console.log('======== remoteStream ============', feed);
        console.log(remoteStream);
        remoteVideoStreamElem.srcObject = remoteStream;
      }

      const remoteVideoContainer = document.createElement('div');
      remoteVideoContainer.id = 'video_' + feed;
      remoteVideoContainer.appendChild(nameElem);
      remoteVideoContainer.appendChild(remoteVideoStreamElem);

      document.getElementById('remotes').appendChild(remoteVideoContainer);
    } else {
      const remoteVideoContainer = document.getElementById('video_' + feed);
      if (display) {
        const nameElem = remoteVideoContainer.getElementsByTagName('div')[0];
        nameElem.innerHTML = display + ' (' + feed + ')';
      }
      if (remoteStream) {
        console.log('======== remoteStream ============', feed);
        console.log(remoteStream);
        const remoteVideoStreamElem = remoteVideoContainer.getElementsByTagName('video')[0];
        remoteVideoStreamElem.srcObject = remoteStream;
      }
    }
  }

  function trickle({ feed, candidate }) {
    // const trickleData = candidate ? { candidate } : {};
    // trickleData.feed = feed;
    // const trickleEvent = candidate ? 'trickle' : 'trickle-complete';
    // console.log("================ trickle =============");
    // console.log(trickleEvent + ' sent as below ', getDateTime());
    // console.log({
    //   data: trickleData,
    //   _id: getId(),
    // });
    // socketRef.current.emit(trickleEvent, {
    //   data: trickleData,
    //   _id: getId(),
    // });
  }
  function removeVideoElementByFeed(feed, stopTracks = true) {
    const videoContainer = document.getElementById(`video_${feed}`);
    if (videoContainer) removeVideoElement(videoContainer, stopTracks);
  }

  function removeVideoElement(container, stopTracks = true) {
    let videoStreamElem = container.getElementsByTagName('video').length > 0 ? container.getElementsByTagName('video')[0] : null;
    if (videoStreamElem && videoStreamElem.srcObject && stopTracks) {
      videoStreamElem.srcObject.getTracks().forEach((track) => track.stop());
      videoStreamElem.srcObject = null;
    }
    container.remove();
  }

  function _closePC(pc) {
    if (!pc) return;
    pc.getSenders().forEach((sender) => {
      if (sender.track) sender.track.stop();
    });
    pc.getReceivers().forEach((receiver) => {
      if (receiver.track) receiver.track.stop();
    });
    pc.onnegotiationneeded = null;
    pc.onicecandidate = null;
    pc.oniceconnectionstatechange = null;
    pc.ontrack = null;
    pc.close();
  }
  function closePC(feed) {
    if (!feed) return;
    let pc = pcMap.get(feed);
    console.log('closing pc for feed', feed);
    _closePC(pc);
    pcMap.delete(feed);
  }

  function closeAllPCs() {
    console.log('closing all pcs');

    pcMap.forEach((pc, feed) => {
      console.log('closing pc for feed', feed);
      _closePC(pc);
    });

    pcMap.clear();
  }
  function subscribe({ feed, room = myRoom, substream, temporal }) {
    console.log('================ subscribe ============= room >>', room);
    const subscribeData = {
      room,
      feed,
    };

    if (typeof substream !== 'undefined') subscribeData.sc_substream_layer = substream;
    if (typeof temporal !== 'undefined') subscribeData.sc_temporal_layers = temporal;

    console.log('subscribe sent as below ', getDateTime());
    console.log({
      data: subscribeData,
      _id: getId(),
    });
    socket.emit('subscribe', {
      data: subscribeData,
      _id: getId(),
    });
  }

  function subscribeTo(peers, room = myRoom) {
    peers.forEach(({ feed }) => {
      // console.log({ feed, room });
      subscribe({ feed, room });
    });
  }
  async function publishOwnFeed() {
    try {
      const offer = await doOffer(local_feed, local_display, false);
      configure({ feed: local_feed, jsep: offer, just_configure: false });

      $('#unpublish').text('Unpublish');
    } catch (e) {
      console.log('error while doing offer in publishOwnFeed()', e);
    }
  }
  function configure({ feed, jsep, restart, substream, temporal, just_configure }) {
    console.log('jsep >>> ', jsep);
    // jsep에는 아래 2개개 들어있음.
    // type: offer,
    // sdp: sdp: "v=0\r\no=- 8226341266340469384 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n
    console.log('================ configure =============');
    let v_just_configure;
    const configureData = {
      feed,
      audio: true,
      video: true,
      data: true,
    };
    console.log('configureData >>> ', configureData);
    if (typeof substream !== 'undefined') configureData.sc_substream_layer = substream;
    if (typeof temporal !== 'undefined') configureData.sc_temporal_layers = temporal;
    if (jsep) configureData.jsep = jsep; // type: offer, sdp : ~~~~~~~~~~~~~~~~
    if (typeof restart === 'boolean') configureData.restart = false;
    if (typeof just_configure !== 'undefined') v_just_configure = just_configure;
    else v_just_configure = false;

    console.log('v_just_configure >>> ', v_just_configure); // false가 나오네?
    const configId = getId(); // random값 부여.

    console.log('configure sent as below ', getDateTime());
    console.log('data, _id >>>', {
      data: configureData,
      _id: configId,
    });
    socket.emit('configure', {
      // 1번이 configure 전송.
      // 서버에 있는 자신의 handle에 offer를 전달하기 위해. (handle: 서버에서 다루는 내용), 서버에서 1번 handle에 자신의 offer를 저장.
      data: configureData, // 5개 정보(feed, audio, video, data, jsep --> type, sdp 담고있음)
      _id: configId,
      just_configure: v_just_configure,
    });

    if (jsep) pendingOfferMap.set(configId, { feed });
  }

  function getDateTime() {
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds() + ':' + today.getMilliseconds();
    let date_time = date + ' ' + time;
    return date_time;
  }
  const handleDisplayNameChange = (event) => {
    setDisplayName(event.target.value);
  };

  function getId() {
    return Math.floor(Number.MAX_SAFE_INTEGER * Math.random());
  }

  function _listRooms() {
    console.log('================ _listRooms =============');
    console.log('list-rooms sent as below ', getDateTime());
    console.log({
      _id: getId(),
    });
    // 참석할 이름 치고 첫번쨰로 보내는 emit
    socket.emit('list-rooms', {
      _id: getId(),
    });
  }

  function join({ room = myRoom, display = myName, token = null, desc }) {
    console.log('================ join =============');
    const joinData = {
      room, // 처음 들어오면 아무것도 없음. NaN으로 나옴
      display, // 첫 렌더링 때 내가 입력한 참석할 이름
      token,
      desc,
    };
    console.log('join sent as below ', getDateTime());
    console.log({
      data: joinData,
      _id: getId(),
    });
    socket.emit('join', {
      // 드디어 socketRef.current.io의 첫 시작. 1번이 join을 서버로 전송,
      // 2번 user용 handle 생성.
      data: joinData,
      _id: getId(),
    });
  }

  socket.on('joined', async ({ data }) => {
    _listRooms();

    setLocalVideoElement(null, null, null, data.room, data.description);
    // 이게 함수로서 작용을 해야하는가, 컴포넌트로서 작용해야 하는가..
    // 함수로 작용하지만 태그들이 생성되니까 뭔가 태그가 있는 jsx가 되어야 할 거 같은데.
    // 이 함수 안에다가 컴포넌트를 두는건 이상하지.
    // LocalVideoElement(null, null, null, data.room, data.description);
    console.log('joined의 data >>> ', data);
    try {
      const offer = await doOffer(data.feed, data.display, false); // 3번째 인자 false는 왜 있음?? 필요없으면 지우자, 여기서 return한 offer가 jsep ==> type, sdp 담고 있음.
      console.log('await doOffer(data.feed, data.display, false);의 offer >>>', offer); // type 과 sdp
      configure({ feed: data.feed, jsep: offer, just_configure: false }); // 서버에서 준 data.feed
      subscribeTo(data.publishers, data.room); // 2번이 같은방에 들어오면 실행.
      let vidTrack = localStream.getVideoTracks();
      vidTrack.forEach((track) => (track.enabled = true));
      let audTrack = localStream.getAudioTracks();
      audTrack.forEach((track) => (track.enabled = true));
    } catch (e) {
      console.log('error while doing offer', e);
    }
  });

  const doOffer = async (feed, display) => {
    console.log('doOffer().. feed =', feed, ',', 'display =', display);
    if (!pcMap.has(feed)) {
      // pcMap은 feed가 없으니까 아래 코드가 실행.
      console.log('doOffer() ==> ', feed, ' feed용 pc 가 없어서 RTCPeerConnection 생성');
      const pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: 'stun:stun.l.google.com:19302',
          },
        ],
      });

      // local_pc = pc; // 당장은 안 쓰이고 있음

      pc.onnegotiationneeded = (event) => console.log('pc.onnegotiationneeded doOffer', event);
      pc.onicecandidate = (event) => trickle({ feed, candidate: event.candidate }); // trickle : ice 후보를 상대 피어에게 전송.
      console.log('pc.iceConnectionState >> ', pc.iceConnectionState); // new라고 나오네? - steve
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
          removeVideoElementByFeed(feed);
          closePC(feed);
        }
      };

      /* This one below should not be fired, cause the PC is used just to send */
      pc.ontrack = (event) => console.log('pc.ontrack', event); // ontrack : 누군가 들어오면 작동되는 함수

      pcMap.set(feed, pc);
      local_feed = feed;
      local_display = display;
      console.log('pc 추가됨, pcMap >>> ', pcMap);
      console.log('local_feed in doOffer >> ', local_feed);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        setLocalStream(stream);

        if (localStream) {
          console.log('localStream 나와? >>> ', localStream);
          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
            // if (track.kind === 'audio') {
            //   local_audio_sender = pc.addTrack(track, localStream); // audio track을 localStream에 추가.
            // } else {
            //   local_video_sender = pc.addTrack(track, localStream); // video track을 localStream에 추가.
            // }
          });
          setLocalVideoElement(localStream, feed, display); // 2-3.setLocalVideoElement --> 4번째 인자는 생략했네?
        }
        console.log('localStream 안나와... >>> ', localStream);
        // LocalVideoElement(localStream, feed, display);

        // return <LocalVideoElement localStream={localStream} feed={feed} display={display} />;
      } catch (e) {
        console.log('error while doing offer', e);
        removeVideoElementByFeed(feed);
        closePC(feed);
        return;
      }
    } else {
      console.log('Performing ICE restart');
      pcMap.get(feed).restartIce();
    }

    try {
      const pc = pcMap.get(feed);
      const offer = await pc.createOffer();
      console.log('await pc.createOffer();의 offer >>> ', offer); // type, sdp
      await pc.setLocalDescription(offer); // 2-5. setLocalDescription(), local에는 자신의 offer를 세팅.
      console.log('set local sdp OK');
      return offer;
    } catch (e) {
      console.log('error while doing offer >>> ', e);
      removeVideoElementByFeed(feed);
      closePC(feed);
      return;
    }
  };

  function _unpublish({ feed }) {
    console.log('================ _unpublish =============');
    const unpublishData = {
      feed,
    };

    console.log('unpublish sent as below ', getDateTime());
    console.log({
      data: unpublishData,
      _id: getId(),
    });
    socket.emit('unpublish', {
      data: unpublishData,
      _id: getId(),
    });
  }

  const handleUnpublishClick = () => {
    if (local_feed) {
      _unpublish({ feed: local_feed });
      setIsPublished(false);
    } else {
      publishOwnFeed();
      setIsPublished(true);
    }
  };

  socket.on('unpublished', ({ data }) => {
    console.log('feed unpublished ', getDateTime());
    console.log(data);
    if (data.feed) {
      removeVideoElementByFeed(data.feed);
      closePC(data.feed);
    }
    if (data.feed === local_feed) {
      setIsPublished(false);
    }
  });

  const handleJoined = async ({ data }) => {
    _listRooms();
    setLocalVideoElement(null, null, null, data.room, data.description);
    // LocalVideoElement(null, null, null, data.room, data.description);

    try {
      // 여기서 localStream 이 안들어오고 있는 상황.
      const offer = await doOffer(data.feed, data.display, false);
      console.log('offer >>> ', offer);
      configure({ feed: data.feed, jsep: offer, just_configure: false });
      subscribeTo(data.publishers, data.room);
    } catch (e) {
      console.log('error while doing offer', e);
    }
  };

  async function configure_bitrate_audio_video(mode, bitrate = 0) {
    console.log('================ configure_bitrate_audio_video =============');
    let feed = parseInt($('#local_feed').text());
    if (mode === 'bitrate') {
      let configureData = {
        feed,
        bitrate: bitrate,
      };
      console.log({
        data: configureData,
        _id: getId(),
      });
      console.log(bitrate / 1000);
      let bitrate_label = bitrate / 1000 > 1000 ? bitrate / 1000 / 1000 + 'M' : bitrate / 1000 + 'K';
      $('#Bandwidth_label').text(bitrate_label);
      socket.emit('configure', {
        data: configureData,
        _id: getId(),
      });
    }
    if (mode === 'audio') {
      if (isAudioOn) {
        console.log('오디오 끄기');
        setIsAudioOn(false);
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          // const isAudioEnabled = audioTrack.enabled;
          audioTrack.enabled = false;
        } else {
          console.log('오디오 트랙을 찾을 수 없습니다.');
        }
      } else {
        console.log('오디오 켜기');
        setIsAudioOn(true);
        const audioTrack = localStream.getAudioTracks()[0]; // 이걸 딱 누른순간,  $(document).on('click', '.audioOn, .audioOff', function () { 이게 없는 상황
        if (audioTrack) {
          // const isAudioEnabled = audioTrack.enabled;
          audioTrack.enabled = true;
        } else {
          console.log('오디오 트랙을 찾을 수 없습니다.');
        }
      }
    } else {
      // 비디오를 끄는 것이면
      if (isVideoOn) {
        console.log('비디오 끄기');
        setIsVideoOn(false);
        // 미디어 스트림에서 비디오 트랙을 가져옵니다.
        const videoTrack = localStream.getVideoTracks()[0];
        // 비디오 트랙이 있는지 확인합니다.
        if (videoTrack) {
          // const isAudioEnabled = videoTrack.enabled;
          videoTrack.enabled = false;
        } else {
          console.log('비디오 트랙을 찾을 수 없습니다.');
        }

        // try {
        //   console.log('try something');
        // } catch (e) {
        //   console.log('error while doing offer for changing', e);
        //   return;
        // }
      } else {
        // 비디오를 켜는 것이면,
        console.log('비디오 켜기');
        setIsVideoOn(true);
        // 미디어 스트림에서 비디오 트랙을 가져옵니다.
        const videoTrack = localStream.getVideoTracks()[0];

        if (videoTrack) {
          // const isAudioEnabled = videoTrack.enabled;
          videoTrack.enabled = true;
        } else {
          console.log('비디오 트랙을 찾을 수 없습니다.');
        }

        // try {
        //   console.log('try something');
        // } catch (e) {
        //   console.log('error while doing offer for changing', e);
        //   return;
        // }
      }
    }
  }

  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      setLocalStream(stream);
    } catch (error) {
      console.error('Error accessing local media:', error);
    }
  };
  useEffect(() => {
    if (!localStream) {
      getLocalStream();
    }
    // getLocalStream();
  }, [localStream]);

  const contextValue = {
    displayName,
    isPublished,
    setDisplayName,
    handleDisplayNameChange,
    localStream,
    setLocalStream,
    socket,
    getDateTime,
    getId,
    _listRooms,
    doOffer,
    doAnswer,
    closePC,
    closeAllPCs,
    setRemoteVideoElement,
    pcMap,
    pendingOfferMap,
    subscribe,
    setIsModalVisible,
    myRoom,
    myName,
    generateRandomNumber,
    join,
    publishOwnFeed,
    handleUnpublishClick,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="App">{isModalVisible ? <ModalComponent /> : <Container />}</div>

      {/* 여기에 작성해 놓은 비디오에도 feed가 달려야함.. */}
      <div id={`video_123`} className="video-view" style={{ position: 'relative' }}>
        <div>{displayName}</div>
        <video //
          className="localVideoTag"
          style={{
            width: 160,
            height: 120,
            margin: 5,
            backgroundColor: 'black',
          }}
          muted
          autoPlay
          ref={(localVideoRef) => {
            if (localVideoRef) {
              localVideoRef.srcObject = localStream;
            }
          }}
        />
        <img id="audioBtn" className={`${isAudioOn ? 'audioOn' : 'audioOff'}`} alt="audio" onClick={() => configure_bitrate_audio_video('audio')} />
        <img id="videoBtn" className={`${isVideoOn ? 'videoOn' : 'videoOff'}`} alt="video" onClick={() => configure_bitrate_audio_video('video')} />
      </div>
      {/*  여기에 remotes 관련 애들이 들어올수 있도록 */}
    </AppContext.Provider>
  );
}

export default App;
