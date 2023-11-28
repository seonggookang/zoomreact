import React, { useEffect, useState, useContext, useRef } from 'react';
import AppContext from './Appcontext';
import io from 'socket.io-client';
import $ from 'jquery';

const Myinfo = () => {
  const { localStream, setLocalStream } = useContext(AppContext);
  const pcMap = new Map();
  let pendingOfferMap = new Map();
  let local_display;
  let local_pc;
  let frameRate;
  let local_audio_sender;
  let local_video_sender;
  let local_feed;

  const { displayName, handleDisplayNameChange, _listRooms } = useContext(AppContext);
  const socket = io('https://janusc.wizbase.co.kr:4443', { autoConnect: false });

  // function generateRandomNumber() {
  //   const randomNumber = Math.floor(Math.random() * 1e16)
  //     .toString()
  //     .padStart(16, '0') // 16자리에서 앞쪽부터 빈자리는 0으로 채움.
  //   return parseInt(randomNumber) // 정수화
  // }

  const generateRandomNumber = () => {
    const randomNumber = Math.floor(Math.random() * 1e16)
      .toString()
      .padStart(16, '0'); // 16자리에서 앞쪽부터 빈자리는 0으로 채움.
    return parseInt(randomNumber); // 정수화
  };

  const handleCreateRoomClick = () => {
    if (newRoomName === '') {
      alert('생성할 방이름을 입력해야 합니다.');
    } else {
      createRoom({
        room: generateRandomNumber(),
        description: $('#new_room_name').val(),
        max_publishers: 100,
        audiocodec: 'opus',
        videocodec: 'vp8',
        talking_events: false,
        talking_level_threshold: 25,
        talking_packets_threshold: 100,
        permanent: false,
        bitrate: 128000,
        secret: 'adminpwd',
      });
    }
  };

  const createRoom = ({
    room,
    description,
    max_publishers = 6,
    audiocodec = 'opus',
    videocodec = 'vp8',
    talking_events = false,
    talking_level_threshold = 25,
    talking_packets_threshold = 100,
    permanent = false,
    bitrate = 128000,
  }) => {
    console.log('================ _create =============');
    console.log('create sent as below ', getDateTime());
    console.log({
      data: {
        room,
        description,
        max_publishers,
        audiocodec,
        videocodec,
        talking_events,
        talking_level_threshold,
        talking_packets_threshold,
        permanent,
        bitrate,
        secret: 'adminpwd',
      },
      _id: getId(),
    });

    socket.emit('create', {
      data: {
        room,
        description,
        max_publishers,
        audiocodec,
        videocodec,
        talking_events,
        talking_level_threshold,
        talking_packets_threshold,
        permanent,
        bitrate,
        secret: 'adminpwd',
      },
      _id: getId(),
    });
  };

  const handleCreatedEvent = ({ data }) => {
    if (data.room === -1) {
      alert('room 이 중복되었습니다.');
    } else {
      console.log('room created', data);
      setNewRoomName('');
      _listRooms();
    }
  };

  const handleConnectClick = () => {
    if (socket.connected) {
      alert('already connected!');
    } else {
      socket.connect();
    }
  };

  const [newRoomName, setNewRoomName] = useState('');

  function configure({ feed, jsep, restart, substream, temporal, just_configure }) {
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
    console.log({
      data: configureData,
      _id: configId,
    });
    socket.emit('configure', {
      // 1번이 configure 전송. 서버에 있는 자신의 handle에 offer를 전달하기 위해. (handle이란??), 서버에서 1번 handle에 자신의 offer를 저장.
      data: configureData, // 5개 정보(feed, audio, video, data, jsep --> type, sdp 담고있음)
      _id: configId,
      just_configure: v_just_configure,
    });

    if (jsep) pendingOfferMap.set(configId, { feed });
  }

  async function publishOwnFeed() {
    try {
      const offer = await doOffer(local_feed, local_display, false);
      configure({ feed: local_feed, jsep: offer, just_configure: false });
      // subscribeTo(data.publishers, data.room);
      // let vidTrack = localStream.getVideoTracks();
      // vidTrack.forEach(track => track.enabled = true);
      // let vidTrack = localStream.getAudioTracks();
      // vidTrack.forEach(track => track.enabled = true);

      $('#unpublish').text('Unpublish');
    } catch (e) {
      console.log('error while doing offer in publishOwnFeed()', e);
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
    // socket.emit(trickleEvent, {
    //   data: trickleData,
    //   _id: getId(),
    // });
  }

  function setLocalVideoElement(localStream, feed, display, room, description) {
    // room 이 아주 잽싸게 먼저 와버리네 그리고 feed랑 display가 천천히 들어오고.
    if (room) document.getElementById('videos').getElementsByTagName('span')[0].innerHTML = '   --- VIDEOROOM (' + room + ') ---  ' + 'roomname : ' + description; // 방 입장 순간, -- LOCALS -- 부분은 VIDEOROOM으로 치환
    if (!feed) return;

    console.log('setLocalVideoElement()의 feed >>>', feed);

    if (!document.getElementById('video_' + feed)) {
      // feed는 있지만, video_feed는 null. -->> 아예 이런 id값이 없으니 항상 참!
      const nameElem = document.createElement('span'); // span 태그를 만들고,
      nameElem.innerHTML = display + ' (' + feed + ')'; // display: 참석할 이름, feed: 이건 뭐지? room.description까지 나오면 좋겠다.
      nameElem.style.display = 'table';
      if (localStream) {
        const localVideoStreamElem = document.createElement('video'); // video 태그 만들고,
        //localVideo.id = 'video_'+feed;
        localVideoStreamElem.width = 320;
        localVideoStreamElem.height = 240;
        localVideoStreamElem.autoplay = true;
        localVideoStreamElem.muted = 'muted';
        localVideoStreamElem.style.cssText = '-moz-transform: scale(-1, 1); -webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); transform: scale(-1, 1); filter: FlipH;';
        localVideoStreamElem.srcObject = localStream;

        const localVideoContainer = document.createElement('div');
        localVideoContainer.id = 'video_' + feed;
        localVideoContainer.appendChild(nameElem);
        localVideoContainer.appendChild(localVideoStreamElem);

        console.log('localVideoContainer >>> ', localVideoContainer); // <div id='video_blablabla'><span></span><video></video></div>
        document.getElementById('locals').appendChild(localVideoContainer);
      }
    } else {
      // 일단 이 아래 else에 대한 부분은 안나오고 있음 - steve
      const localVideoContainer = document.getElementById('video_' + feed); // 1403줄에 의해 #video_feed이 생긴 상태, feed도 당연히 있음.
      console.log('나오나?? 안나오네11111111111111111');
      if (display) {
        const nameElem = localVideoContainer.getElementsByTagName('span')[0];
        nameElem.innerHTML = display + ' (' + feed + ')';
        console.log('나오나?? 안나오네22222222222222222222');
      }
      const localVideoStreamElem = localVideoContainer.getElementsByTagName('video')[0];
      if (localStream) console.log('setLocalVideoElement() >>> change local stream...');
      console.log('나오나?? 안나오네333333333333333333333');
      localVideoStreamElem.srcObject = localStream;
    }
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

  async function doOffer(feed, display) {
    // offer 리턴함
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

      local_pc = pc; // 당장은 안 쓰이고 있음

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

      try {
        frameRate = parseInt($('#frame_rate').val());
        console.log('========frame_rate=', $('#frame_rate').val()); // 15로 고정돼있음
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { frameRate: { ideal: frameRate, max: frameRate } },
        });
        console.log('localStream.getTracks() >>> ', localStream.getTracks()); // audio, video 총 2개 "배열"로 출력.
        localStream.getTracks().forEach((track) => {
          // audio, video 각각에 대하여 진행.
          console.log('adding track >>> ', track, track.kind); // audio에 대한 track과 문자열 audio, video에 대한 track과 문자열 video 출력
          if (track.kind === 'audio') {
            local_audio_sender = pc.addTrack(track, localStream); // audio track을 localStream에 추가.
          } else {
            local_video_sender = pc.addTrack(track, localStream); // video track을 localStream에 추가.
          }
        });
        setLocalVideoElement(localStream, feed, display); // 2-3.setLocalVideoElement --> 4번째 인자는 생략했네?
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
      const offer = await pc.createOffer(); // 2-4. createOffer() 생성
      console.log('offer >>> ', offer); // type, sdp
      await pc.setLocalDescription(offer); // 2-5. setLocalDescription(), local에는 자신의 offer를 세팅.
      console.log('set local sdp OK');
      return offer;
    } catch (e) {
      console.log('error while doing offer', e);
      removeVideoElementByFeed(feed);
      closePC(feed);
      return;
    }
  }

  function getDateTime() {
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds() + ':' + today.getMilliseconds();
    let date_time = date + ' ' + time;
    return date_time;
  }
  function getId() {
    return Math.floor(Number.MAX_SAFE_INTEGER * Math.random());
  }

  // useEffect 를 사용하여 이벤트 리스너 등록
  useEffect(() => {
    socket.on('created', handleCreatedEvent);

    // 컴포넌트가 언마운트될 때 이벤트 리스너 정리
    return () => {
      socket.off('created', handleCreatedEvent);
    };
  }, []); // 빈 배열을 넣어 한 번만 등록되도록 설정

  socket.on('connect', () => {
    // 1. Socket connection () --> 참석할 이름을 치고, 방 입장 전에 1번쨰로 나오는 콘솔
    console.log('socket connected');
    $('#connect_status').val('connected');
    _listRooms(); // console.log("================ _listRooms =============");
    $('#connect').prop('disabled', true); // connect 됐으니까 connect 버튼 비활성화.
    $('#disconnect, #create_room, #list_rooms').prop('disabled', false); // connection 뒤, 필요 요소 활성화

    // url에 room_id 가 있으면 바로
    // const room_id = $('#curr_room_name').attr('room_id');
    // console.log('room_id = ', room_id); // undefined ( room_id라는 속성이 없는뎨?? )
    // if (room_id != '') { // 빈칸이 아닌 undefined니까 join22라는 함수 실행!
    //   join22(parseInt(room_id)); // 무슨 값이 들어가는지 모르겠음. undefined를 parseInt??
    // }
    // join({ room: 1234, display: $('#myInput').val(), token: null });

    socket.sendBuffer = [];
  });

  return (
    <div className="col-6 myInfo">
      <div className="flexPaddingTop5">
        <button type="button" className="btn btn-primary btn-xs btn_between" onClick={handleConnectClick}>
          {/* <button type="button" className="btn btn-primary btn-xs btn_between" onClick={handleConnectClick} disabled={isButtonsDisabled}> */}
          Connect
        </button>
        <button id="disconnect" type="button" className="btn btn-primary btn-xs btn_between">
          Disconnect
        </button>
        <div className="btn_between">
          <input type="text" className="form-control input-sm" disabled id="connect_status" value="disconnected" />
        </div>
      </div>
      <div className="flexPaddingTop5">
        <div className="btn_between">
          <div>참석할 이름</div>
        </div>
        <div className="btn_between">
          <input type="text" className="form-control input-sm myInput" placeholder="참석할 이름" value={displayName} onChange={handleDisplayNameChange} />
        </div>
      </div>
      <div className="flexPaddingTop5">
        <div className=" btn_between">
          <div>비디오 프레임</div>
        </div>
        <div className="btn_between">
          <input type="text" className="form-control input-sm" id="frame_rate" value="15" />
        </div>
      </div>
      <div className="flexPaddingTop5">
        <div className="btn_between">
          <div>현재 방이름</div>
        </div>
        <div className="btn_between">
          <input type="text" className="form-control input-sm" id="curr_room_name" />
        </div>
        <button id="leave_all" type="button" className="btn btn-primary btn-xs btn_between left_status">
          leaveAll
        </button>
      </div>
      <div className="flexPaddingTop5">
        <div className="btn_between">
          <input id="new_room_name" className="form-control input-sm" type="text" placeholder="new room name" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
        </div>
        <button id="create_room" type="button" className="btn btn-primary btn-xs btn_between" onClick={handleCreateRoomClick}>
          create_room
        </button>
      </div>
    </div>
  );
};

export default Myinfo;
