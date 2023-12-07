/* global io $ connect disconnect create_room list_rooms get_room_id leave_all unpublish*/

import './App.css';
import Container from './Container';
import ModalComponent from './ModalComponent';
import { useState, useRef, useEffect, ReactDOM } from 'react';
import AppContext from './Appcontext';
import io from 'socket.io-client';
import $ from 'jquery';
import LocalVideoElement from './LocalVideoElement';
import Videos from './Videos';
import { useLocation } from 'react-router-dom';

function App() {
  const [displayName, setDisplayName] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(true);
  // function getURLParameter(name) {
  //   return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(window.location.search) || [, ''])[1].replace(/\+/g, '%20')) || null;
  // }
  const [newRoomName, setNewRoomName] = useState('');
  let myRoom = getURLParameter('room') ? parseInt(getURLParameter('room')) : getURLParameter('room_str') || 1234;
  const location = useLocation();
  const randName = 'John_Doe_' + Math.floor(10000 * Math.random());
  const myName = getURLParameter('name') || randName;
  const [localStream, setLocalStream] = useState(null);
  const localVideoRef = useRef(null);

  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [roomList, setRoomList] = useState([]);
  const [buttonsDisabled, setButtonsDisabled] = useState(true);

  const [stateOfConnect, setStateOfConnect] = useState('connected');
  const pcMap = new Map();
  let pendingOfferMap = new Map(); // 존재 이유는?
  let local_feed;
  let local_display;
  let frameRate;

  // const [socket, _] = useState(io('https://janusc.wizbase.co.kr:4443', { autoConnect: false }));
  const socket = io('https://janusc.wizbase.co.kr:4443', { autoConnect: false });

  const handleCreateRoomClick = () => {
    if (newRoomName === '') {
      alert('생성할 방이름을 입력해야 합니다.');
    } else {
      _create({
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
  const handleConnectValue = () => {
    if (socket.connected) {
      alert('already connected!');
    } else {
      socket.connect();
    }
    setStateOfConnect('connected');
  };

  const handleDisconnectValue = () => {
    console.log('disconnect!!!!!!!!!!!!!!');
    if (!socket.connected) {
      alert('already disconnected!');
    } else {
      socket.disconnect();
    }
    setStateOfConnect('disconnected');
  };

  // leave_all.onclick = () => {
  //   let evtdata = {
  //     data: { feed: $('#local_feed').text() },
  //   };
  //   console.log(evtdata);
  //   if ($('#local_feed').text() == '') return;
  //   // else _leave({feed: parseInt($('#local_feed').text()), display: $('#myInput').val()});
  //   else _leaveAll({ feed: $('#local_feed').text(), display: $('#myInput').val() });
  // };

  // unpublish.onclick = () => {
  //   if ($('#unpublish').text() == 'Unpublish') {
  //     if (local_feed) {
  //       _unpublish({ feed: local_feed }); // 이 local_feed가 어디서 오는지?
  //     }
  //   } else {
  //     publishOwnFeed();
  //   }
  // };

  function getId() {
    return Math.floor(Number.MAX_SAFE_INTEGER * Math.random());
  }
  function generateRandomNumber() {
    const randomNumber = Math.floor(Math.random() * 1e16)
      .toString()
      .padStart(16, '0');
    return parseInt(randomNumber);
  }
  function getURLParameter(name) {
    const regex = new RegExp(`[?|&]${name}=([^&;]+?)(&|#|;|$)`);
    const results = regex.exec(window.location.search) || [];
    return decodeURIComponent((results[1] || '').replace(/\+/g, '%20')) || null;
  }

  function destroy_room(room, desc) {
    if (window.confirm(desc + ' room을 삭제하겠습니까?')) {
      _destroy({ room: room, permanent: false, secret: 'adminpwd' });
    }
  }

  function join22(room, desc) {
    var display_name = $('#myInput').val();
    if (display_name == '') {
      alert('참석할 이름을 입력해야 합니다.');
      return;
    }
    join({ room: room, display: display_name, token: null });
    // if (confirm('Room ['+ desc+'] 에 [' + display_name+ '] 이름으로 조인하겠습니까?')) {
    //   join({room: room, display:display_name, token:null});
    // }
  }

  function join({ room = myRoom, display = myName, token = null }) {
    console.log('================ join =============');
    const joinData = {
      room,
      display,
      token,
    };
    console.log('join sent as below ', getDateTime());
    console.log({
      data: joinData,
      _id: getId(),
    });
    socket.emit('join', {
      // 1번이 join을 서버로 전송 ( data, _id ) => 2번 publisher용 handle 생성 및 attach
      data: joinData,
      _id: getId(),
    });
  }

  function subscribeTo(peers, room = myRoom) {
    // publishers, room
    peers.forEach(({ feed }) => {
      // console.log({ feed, room });
      subscribe({ feed, room });
    });
  }

  function subscribe({ feed, room = myRoom, substream, temporal }) {
    console.log('================ subscribe =============');
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
      data: subscribeData, // 상대의 data
      _id: getId(),
    });
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

  // 서버에 있는 자신의 handle에 offer를 전달하기 위해 configure.
  function configure({ feed, jsep, restart, substream, temporal, just_configure }) {
    console.log('================ configure =============');
    var v_just_configure;
    const configureData = {
      feed,
      audio: true,
      video: true,
      data: true,
    };
    if (typeof substream !== 'undefined') configureData.sc_substream_layer = substream;
    if (typeof temporal !== 'undefined') configureData.sc_temporal_layers = temporal;
    if (jsep) configureData.jsep = jsep;
    if (typeof restart === 'boolean') configureData.restart = false;
    if (typeof just_configure !== 'undefined') v_just_configure = just_configure;
    else v_just_configure = false;

    const configId = getId();

    console.log('configure sent as below ', getDateTime());
    console.log({
      data: configureData,
      _id: configId,
    });
    socket.emit('configure', {
      data: configureData,
      _id: configId,
      just_configure: v_just_configure,
    });

    if (jsep) pendingOfferMap.set(configId, { feed });
  }

  $(document).on('click', '.audioOn, .audioOff', function () {
    configure_bitrate_audio_video('audio');
  });
  $(document).on('click', '.videoOn, .videoOff', function () {
    configure_bitrate_audio_video('video');
  });

  async function configure_bitrate_audio_video(mode, bitrate = 0) {
    console.log('mode >>> ', mode); // video, audio
    console.log('================ configure_bitrate_audio_video =============');
    var feed = parseInt($('#local_feed').text());

    if (mode == 'bitrate') {
      var configureData = {
        feed,
        bitrate: bitrate,
      };
      console.log({
        data: configureData,
        _id: getId(),
      });
      console.log(bitrate / 1000);
      var bitrate_label = bitrate / 1000 > 1000 ? bitrate / 1000 / 1000 + 'M' : bitrate / 1000 + 'K';
      $('#Bandwidth_label').text(bitrate_label);
      socket.emit('configure', {
        // configure 전송. 서버에 있는 자신의 handle에 offer를 전달.
        data: configureData,
        _id: getId(),
      });
    } else if (mode == 'audio') {
      // 오디오를 끄는 것이면,
      if ($('#audioBtn').hasClass('audioOn')) {
        $('#audioBtn').removeClass('audioOn').addClass('audioOff');

        console.log('오디오 끄기');

        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          // 오디오를 끄거나 켤 수 있는 상태인지 확인합니다.
          const isAudioEnabled = audioTrack.enabled;

          if (isAudioEnabled) {
            audioTrack.enabled = false;
            console.log('오디오를 끔');
          } else {
            audioTrack.enabled = true;
            console.log('오디오를 켬');
          }
        } else {
          console.log('오디오 트랙을 찾을 수 없습니다.');
        }

        // local_audio_onoff = false;

        try {
          console.log('try something');
        } catch (e) {
          console.log('error while doing offer for changing', e);
          return;
        }
      } else {
        // 오디오를 켜는 것이면,
        $('#audioBtn').removeClass('audioOff').addClass('audioOn');

        console.log('오디오 켜기');
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          const isAudioEnabled = audioTrack.enabled;

          if (isAudioEnabled) {
            audioTrack.enabled = false;
            console.log('오디오를 끔');
          } else {
            audioTrack.enabled = true;
            console.log('오디오를 켬');
          }
        } else {
          console.log('오디오 트랙을 찾을 수 없습니다.');
        }

        //   }
        // });
        // local_audio_onoff = true;

        // vidTrack.forEach(track => track.enabled = true);

        try {
          console.log('try something');
        } catch (e) {
          console.log('error while doing offer for changing', e);
          return;
        }
      }
    } else {
      if ($('#videoBtn').hasClass('videoOn')) {
        // 비디오를 끄는 것이면
        $('#videoBtn').removeClass('videoOn').addClass('videoOff');

        console.log('비디오 끄기');
        // 미디어 스트림에서 비디오 트랙을 가져옵니다.
        const videoTrack = localStream.getVideoTracks()[0];

        // 비디오 트랙이 있는지 확인합니다.
        if (videoTrack) {
          // 비디오를 끄거나 켤 수 있는 상태인지 확인합니다.
          const isVideoEnabled = videoTrack.enabled;

          if (isVideoEnabled) {
            // 비디오를 끕니다.
            videoTrack.enabled = false;
            console.log('비디오를 끔');
          } else {
            // 비디오를 켭니다.
            videoTrack.enabled = true;
            console.log('비디오를 켬');
          }
        } else {
          console.log('비디오 트랙을 찾을 수 없습니다.');
        }

        try {
          console.log('try something');
        } catch (e) {
          console.log('error while doing offer for changing', e);
          return;
        }
      } else {
        // 비디오를 켜는 것이면,
        $('#videoBtn').removeClass('videoOff').addClass('videoOn');

        console.log('비디오 켜기');
        // 미디어 스트림에서 비디오 트랙을 가져옵니다.
        const videoTrack = localStream.getVideoTracks()[0];

        // 비디오 트랙이 있는지 확인합니다.
        if (videoTrack) {
          // 비디오를 끄거나 켤 수 있는 상태인지 확인합니다.
          const isVideoEnabled = videoTrack.enabled;

          if (isVideoEnabled) {
            // 비디오를 끕니다.
            videoTrack.enabled = false;
            console.log('비디오를 끔');
          } else {
            // 비디오를 켭니다.
            videoTrack.enabled = true;
            console.log('비디오를 켬');
          }
        } else {
          console.log('비디오 트랙을 찾을 수 없습니다.');
        }

        try {
          console.log('try something');
        } catch (e) {
          console.log('error while doing offer for changing', e);
          return;
        }
      }
    }
  }
  const handleDisplayNameChange = (event) => {
    setDisplayName(event.target.value);
  };
  async function publishOwnFeed() {
    try {
      const offer = await doOffer(local_feed, local_display, false);
      configure({ feed: local_feed, jsep: offer, just_configure: false });

      $('#unpublish').text('Unpublish');
    } catch (e) {
      console.log('error while doing offer in publishOwnFeed()', e);
    }
  }

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

  function _leave({ feed, display }) {
    console.log('================ _leave =============');
    const leaveData = {
      feed,
      display,
    };

    console.log('leave sent as below ', getDateTime());
    console.log({
      data: leaveData,
      _id: getId(),
    });

    socket.emit('leave', {
      data: leaveData,
      _id: getId(),
    });
  }
  function _leaveAll({ feed, display }) {
    console.log('================ _leaveAll =============');
    const leaveData = {
      feed,
      display,
    };

    console.log('leaveAll sent as below ', getDateTime());
    console.log({
      data: leaveData,
      _id: getId(),
    });
    socket.emit('leaveAll', {
      data: leaveData,
      _id: getId(),
    });
  }

  function _listParticipants({ room = myRoom } = {}) {
    console.log('================ _listParticipants =============');
    const listData = {
      room,
    };

    console.log('list-participants sent as below ', getDateTime());
    console.log({
      data: listData,
      _id: getId(),
    });
    socket.emit('list-participants', {
      data: listData,
      _id: getId(),
    });
  }

  function _kick({ feed, room = myRoom, secret = 'adminpwd' }) {
    console.log('================ _kick =============');
    const kickData = {
      room,
      feed,
      secret,
    };

    console.log('kick sent as below ', getDateTime());
    console.log({
      data: kickData,
      _id: getId(),
    });
    socket.emit('kick', {
      data: kickData,
      _id: getId(),
    });
  }

  function start({ feed, jsep = null }) {
    console.log('================ start =============');
    const startData = {
      feed,
      jsep,
    };

    console.log('start sent as below ', getDateTime());
    console.log({
      data: startData,
      _id: getId(),
    });
    socket.emit('start', {
      data: startData,
      _id: getId(),
    });
  }

  function _pause({ feed }) {
    console.log('================ _pause =============');
    const pauseData = {
      feed,
    };

    console.log('pause sent as below ', getDateTime());
    console.log({
      data: pauseData,
      _id: getId(),
    });
    socket.emit('pause', {
      data: pauseData,
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
  function _switch({ from_feed, to_feed, audio = true, video = true, data = false }) {
    console.log('================ _switch =============');
    const switchData = {
      from_feed,
      to_feed,
      audio,
      video,
      data,
    };

    console.log('switch sent as below ', getDateTime());
    console.log({
      data: switchData,
      _id: getId(),
    });
    socket.emit('switch', {
      data: switchData,
      _id: getId(),
    });
  }

  function _exists({ room = myRoom } = {}) {
    console.log('================ _exists =============');
    const existsData = {
      room,
    };

    console.log('exists sent as below ', getDateTime());
    console.log({
      data: existsData,
      _id: getId(),
    });
    socket.emit('exists', {
      data: existsData,
      _id: getId(),
    });
  }

  function _listRooms() {
    console.log('================ _listRooms =============');
    console.log('list-rooms sent as below ', getDateTime());
    console.log({
      _id: getId(),
    });
    socket.emit('list-rooms', {
      _id: getId(),
    });
  }

  function _create({
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
  }) {
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
  }

  function _destroy({ room = myRoom, permanent = false, secret = 'adminpwd' }) {
    console.log('================ _destroy =============');
    console.log('destroy sent as below ', getDateTime());
    console.log({
      data: {
        room,
        permanent,
        secret,
      },
      _id: getId(),
    });
    socket.emit('destroy', {
      data: {
        room,
        permanent,
        secret,
      },
      _id: getId(),
    });
  }

  // add remove enable disable token mgmt
  function _allow({ room = myRoom, action, token, secret = 'adminpwd' }) {
    console.log('================ _allow =============');
    const allowData = {
      room,
      action,
      secret,
    };
    if (action !== 'disable' && token) allowData.list = [token];

    console.log('allow sent as below ', getDateTime());
    console.log({
      data: allowData,
      _id: getId(),
    });
    socket.emit('allow', {
      data: allowData,
      _id: getId(),
    });
  }

  function _startForward({ feed, room = myRoom, host = 'localhost', audio_port, video_port, data_port = null, secret = 'adminpwd' }) {
    console.log('================ _startForward =============');
    console.log('rtp-fwd-start sent as below ', getDateTime());
    console.log({
      data: {
        room,
        feed,
        host,
        audio_port,
        video_port,
        data_port,
        secret,
      },
      _id: getId(),
    });
    socket.emit('rtp-fwd-start', {
      data: {
        room,
        feed,
        host,
        audio_port,
        video_port,
        data_port,
        secret,
      },
      _id: getId(),
    });
  }

  function _stopForward({ stream, feed, room = myRoom, secret = 'adminpwd' }) {
    console.log('================ _stopForward =============');
    console.log('rtp-fwd-stop sent as below ', getDateTime());
    console.log({
      data: {
        room,
        stream,
        feed,
        secret,
      },
      _id: getId(),
    });
    socket.emit('rtp-fwd-stop', {
      data: {
        room,
        stream,
        feed,
        secret,
      },
      _id: getId(),
    });
  }

  function _listForward({ room = myRoom, secret = 'adminpwd' }) {
    console.log('================ _listForward =============');
    console.log('rtp-fwd-list sent as below ', getDateTime());
    console.log({
      data: { room, secret },
      _id: getId(),
    });
    socket.emit('rtp-fwd-list', {
      // realtime transport protocol, 실시간 비디오,오디오를 UDP와 IP를 통해 전송하는 프로토콜
      data: { room, secret },
      _id: getId(),
    });
  }

  // 화면 렌더링시 제일 먼저 나오는 콘솔
  socket.on('connect', () => {
    console.log('socket connected');
    $('#connect_status').val('connected');
    _listRooms();
    $('#connect').prop('disabled', true);
    $('#disconnect, #create_room, #list_rooms').prop('disabled', false);

    socket.sendBuffer = [];
    // var display_name = $('#myInput').val();
    // join({room: 1264989511454137, display:display_name, token:null});

    //scheduleConnection(0.1);
    join({ room: 1234, display: $('#myInput').val(), token: null });
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected');
    $('#connect_status').val('disconnected');
    $('#room_list').html('');
    $('#connect').prop('disabled', false);
    $('#disconnect, #create_room, #list_rooms, #leave_all').prop('disabled', true);
    pendingOfferMap.clear();
    removeAllVideoElements();
    closeAllPCs();
  });

  socket.on('leaveAll', ({ data }) => {
    console.log('leaved all rooms', data);
    pendingOfferMap.clear();
    $('#leave_all').prop('disabled', true);
    $('#curr_room_name').val('');

    removeAllVideoElements();
    closeAllPCs();
    $('#local_feed').text('');
    $('#private_id').text('');
    _listRooms();
  });

  socket.on('videoroom-error', ({ error, _id }) => {
    // alert(error);
    console.log('videoroom error', error);
    if (error === 'backend-failure' || error === 'session-not-available') {
      socket.disconnect();
      return;
    }
    if (pendingOfferMap.has(_id)) {
      const { feed } = pendingOfferMap.get(_id);
      removeVideoElementByFeed(feed);
      closePC(feed);
      pendingOfferMap.delete(_id);
      return;
    }
  });

  // 1번, 2번 모두 자신의 feed를 여기서 알게돼고 feed로 서로를 구분함.
  socket.on('joined', async ({ data }) => {
    // room, feed, description, private_id, publishers, display
    // 클라에게 joined 젆송
    console.log('joined to room ', getDateTime());
    console.log('joined data >>> ', data);
    $('#local_feed').text(data.feed);
    $('#private_id').text(data.private_id);
    $('#curr_room_name').val(data.description);
    $('#leave_all').prop('disabled', false);
    _listRooms();

    setLocalVideoElement(null, null, null, data.room);

    try {
      const offer = await doOffer(data.feed, data.display, false); // createOffer

      configure({ feed: data.feed, jsep: offer, just_configure: false }); // feed, jsep, just_configure
      console.log('data >>> ', data); // 1번의값
      console.log('data.publishers >>> ', data.publishers); // 1번의값
      subscribeTo(data.publishers, data.room); // 2번에서 진행. 1번에서 안 생김.
      // var vidTrack = localStream.getVideoTracks();
      // vidTrack.forEach((track) => (track.enabled = true));
      // var audTrack = localStream.getAudioTracks();
      // audTrack.forEach((track) => (track.enabled = true));
    } catch (e) {
      console.log('error while doing offer', e);
    }
  });

  socket.on('subscribed', async ({ data }) => {
    console.log('subscribed to feed as below', getDateTime());
    console.log(data);

    try {
      const answer = await doAnswer(data.feed, data.display, data.jsep);
      start({ feed: data.feed, jsep: answer });
      _listRooms();
    } catch (e) {
      console.log('error while doing answer', e);
    }
  });

  socket.on('participants-list', ({ data }) => {
    console.log('participants list', getDateTime());
    console.log(data);
  });

  socket.on('talking', ({ data }) => {
    console.log('talking notify', getDateTime());
    console.log(data);
  });

  socket.on('kicked', ({ data }) => {
    console.log('participant kicked', getDateTime());
    console.log(data);
    if (data.feed) {
      removeVideoElementByFeed(data.feed);
      closePC(data.feed);
    }
  });

  socket.on('allowed', ({ data }) => {
    console.log('token management', getDateTime());
    console.log(data);
  });

  socket.on('configured', async ({ data, _id }) => {
    console.log('feed configured just_configure >>> ', data.just_configure, getDateTime());
    console.log('configured data >>> ', data); // feed, jsep, just_configure, room
    console.log('_id >>> ', _id);
    pendingOfferMap.delete(_id); // 이건 왜 하는거지?
    const pc = pcMap.get(data.feed);
    console.log('pc >>> ', pc);
    if (pc && data.jsep) {
      try {
        await pc.setRemoteDescription(data.jsep); // 1번, 2번 각각 자신의 answer를 저장.
        console.log('configure remote sdp OK >>> ', data.jsep.type); // answer
        if (data.jsep.type === 'offer' && data.just_configure == false) {
          // --->> 어떤 케이스일 떄 실행?
          // 만일 confugured 수신시 jsep.type 이 offer 라면 추가로 doAnswer() 실시
          // 하지만 지금은 jsep.type 이 answer 이므로 doAnswer() 하지 않음
          console.log('data.jsep.type === offer 이므로 doAnswer()와 start() 실행. just_configure >>> ', data.just_configure);
          const answer = await doAnswer(data.feed, null, data.jsep);
          start(data.feed, answer);
        }
      } catch (e) {
        console.log('error setting remote sdp', e);
      }
    }
  });

  socket.on('display', ({ data }) => {
    console.log('feed changed display name ', getDateTime());
    console.log(data);
    setRemoteVideoElement(null, data.feed, data.display);
  });

  socket.on('started', ({ data }) => {
    console.log('subscribed feed started ', getDateTime());
    console.log(data);
  });

  socket.on('paused', ({ data }) => {
    console.log('feed paused', getDateTime());
    console.log(data);
  });

  socket.on('switched', ({ data }) => {
    console.log(`feed switched from ${data.from_feed} to ${data.to_feed} (${data.display})`);
    /* !!! This will actually break the DOM management since IDs are feed based !!! */
    setRemoteVideoElement(null, data.from_feed, data.display);
  });

  // 2번이 들어오면 제일 먼저 콘솔 찍히는 부분.
  socket.on('feed-list', ({ data }) => {
    console.log('new feeds available! ', getDateTime());
    console.log('pcMap >>> ', pcMap);
    console.log('feed-list >>> ', data); // 상대방의 room, publishers
    let data_room = data.room;
    data.publishers.forEach(({ feed }) => {
      // 2번 및 다른 상대 feed. 콘솔 찍어보니 data.publishers가 하나씩 밖에 안나옴.
      console.log('feed >>> ', feed); // 상대 feed(여기선 1번)
      if (pcMap.has(feed)) {
        console.log('이미 있는 feed 임. No need to subscribe');
      } else {
        subscribe({ feed, room: data_room });
      }
    });
  });

  socket.on('unpublished', ({ data }) => {
    // 상대방도 이 이벤트 발생
    console.log('feed unpublished ', getDateTime());
    console.log(data);
    if (data.feed) {
      removeVideoElementByFeed(data.feed);
      closePC(data.feed);
    }
    if (data.feed == local_feed) {
      $('#unpublish').text('Publish');
    }
  });

  socket.on('leaving', ({ data }) => {
    console.log('feed leaving', data);
    if (data.feed) {
      removeVideoElementByFeed(data.feed);
      closePC(data.feed);
    }
    _listRooms();
  });

  socket.on('leaving111', ({ data }) => {
    console.log('feed leaving', getDateTime());
    console.log(data);
    _listRooms();

    if (data.feed) {
      if (data.who_is_leaving == 'me') {
        removeAllVideoElements();
        $('#local_feed').text('');
        $('#private_id').text('');
        closeAllPCs();
      } else {
        removeVideoElementByFeed(data.feed);
        closePC(data.feed);
      }
    }
  });

  socket.on('exists', ({ data }) => {
    console.log('room exists ', getDateTime());
    console.log(data);
  });

  // socket.on('rooms-list', ({ data }) => {
  //   var parsedData = JSON.parse(data);
  //   console.log('rooms list', parsedData);
  //   console.log(typeof parsedData);
  //   $('#room_list').html('');
  //   parsedData.forEach((rooms) => {
  //     $('#room_list').html(
  //       $('#room_list').html() +
  //         "<br><span class='room' room='" +
  //         rooms.room +
  //         "'>" +
  //         rooms.description +
  //         '</span>(' +
  //         rooms.num_participants +
  //         '/' +
  //         rooms.max_publishers +
  //         ")&nbsp;<button class='btn btn-primary btn-xs' room='" +
  //         rooms.room +
  //         "' onclick='join22(" +
  //         rooms.room +
  //         ', "' +
  //         rooms.description +
  //         '");\'>join</button>&nbsp;' +
  //         "<button class='btn btn-primary btn-xs' onclick='destroy_room(" +
  //         rooms.room +
  //         ', "' +
  //         rooms.description +
  //         '");\'>destroy</button>'
  //     );
  //   });
  // });

  socket.on('created', ({ data }) => {
    if (data.room == -1) {
      console.log('111');
      alert('room 이 중복되었습니다.');
      return;
    } else {
      console.log('222');
      console.log('room created', data);
      $('#new_room_name').val('');
      _listRooms();
    }
  });

  socket.on('destroyed', ({ data }) => {
    console.log('room destroyed', data);
    _listRooms();
    // if (data.room === myRoom) {
    //   socket.disconnect();
    // }
  });

  socket.on('rtp-fwd-started', ({ data }) => {
    console.log('rtp forwarding started', data);
  });

  socket.on('rtp-fwd-stopped', ({ data }) => {
    console.log('rtp forwarding stopped', data);
  });

  socket.on('rtp-fwd-list', ({ data }) => {
    console.log('rtp forwarders list', data);
  });

  ////////////////////////////////////////////////////////
  // custom socket messages to receive from the Server
  ////////////////////////////////////////////////////////
  socket.on('getRoomId', ({ data }) => {
    console.log('getRoomId received ', getDateTime());
    console.log(data);
  });

  ////////////////////////////////////////////////////////
  // end
  ////////////////////////////////////////////////////////

  async function _restartPublisher(feed) {
    const offer = await doOffer(feed, null);
    configure({ feed, jsep: offer, just_configure: false });
  }

  async function _restartSubscriber(feed) {
    configure({ feed, restart: true, just_configure: false });
  }

  async function doOffer(feed, display) {
    console.log('doOffer().. feed >>> ', feed, 'display >>> ', display);
    // 내가 존재하면 더이상 실행하지 않는 함수
    if (!pcMap.has(feed)) {
      console.log('doOffer() ==> ', feed, ' feed용 pc 가 없어서 RTCPeerConnection 생성');
      const pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: 'stun:stun.l.google.com:19302',
          },
        ],
      });

      // local_pc = pc;

      pc.onnegotiationneeded = (event) => console.log('pc.onnegotiationneeded doOffer', event);
      pc.onicecandidate = (event) => trickle({ feed, candidate: event.candidate });
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
          removeVideoElementByFeed(feed);
          closePC(feed);
        }
      };
      /* This one below should not be fired, cause the PC is used just to send */
      pc.ontrack = (event) => console.log('pc.ontrack', event);

      pcMap.set(feed, pc);
      local_feed = feed; /// 이게 관
      local_display = display;
      console.log('pc 추가됨, pcMap >>> ', pcMap);

      try {
        frameRate = parseInt($('#frame_rate').val());
        console.log('========frame_rate=', $('#frame_rate').val());
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        setLocalStream(stream);
        localStream.getTracks().forEach((track) => {
          // DOM 직접 조작을 하니 바로 가져와버리지
          // 그럼 나도 리액트에서 바로가져와버려 useRef로?
          pc.addTrack(track, localStream);
          console.log('adding track >>> ', track, track.kind);
          // if (track.kind == 'audio') {
          //   local_audio_sender = pc.addTrack(track, localStream);
          //   console.log('local_audio_sender >> ', local_audio_sender)
          // } else {
          //   local_video_sender = pc.addTrack(track, localStream);
          //   console.log('local_video_sender >> ', local_video_sender)
          // }
        });

        setLocalVideoElement(localStream, feed, display);
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
      await pc.setLocalDescription(offer);
      console.log('offer >>> ', offer); // sdp : rnvrnv 뭔가 이상한 긴 용어, type : offer
      console.log('set local sdp OK');
      return offer;
    } catch (e) {
      console.log('error while doing offer', e);
      removeVideoElementByFeed(feed);
      closePC(feed);
      return;
    }
  }

  async function doAnswer(feed, display, offer) {
    console.log('doAnswer().. feed >>> ', feed, 'display >>> ', display, 'offer >>> ', offer);
    if (!pcMap.has(feed)) {
      console.log('doAnswer() ==> ', feed, ' feed용 pc 가 없어서 RTCPeerConnection 생성');
      const pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: 'stun:stun.l.google.com:19302',
          },
        ],
      });

      pc.onnegotiationneeded = (event) => console.log('pc.onnegotiationneeded doAnswer >>> ', event);
      pc.onicecandidate = (event) => trickle({ feed, candidate: event.candidate });
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
          removeVideoElementByFeed(feed);
          closePC(feed);
        }
      };
      pc.ontrack = (event) => {
        console.log('pc.ontrack >>> ', event);

        event.track.onunmute = (evt) => {
          console.log('track.onunmute >>> ', evt);
          /* TODO set srcObject in this callback */
        };
        event.track.onmute = (evt) => {
          console.log('track.onmute >>> ', evt);
        };
        event.track.onended = (evt) => {
          console.log('track.onended >>> ', evt);
        };

        const remoteStream = event.streams[0];
        setRemoteVideoElement(remoteStream, feed, display);
      };

      pcMap.set(feed, pc);
      console.log('pc 추가됨, pcMap >>> ', pcMap);
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
      console.log('error creating subscriber answer', e);
      removeVideoElementByFeed(feed);
      closePC(feed);
      throw e;
    }
  }

  function setLocalVideoElement(localStream, feed, display) {
    // if (room) document.getElementById('videos').getElementsByTagName('span')[0].innerHTML = '   --- VIDEOROOM (' + room + ') ---  ';
    if (!feed) return;

    // 최초 렌더링시, video_feed가 없는 상황이라 실행됨
    if (!document.getElementById('video_' + feed)) {
      const nameElem = document.createElement('div');
      nameElem.innerHTML = display;
      nameElem.style.display = 'table'; // <<< 왜 있지?
      nameElem.style.cssText = 'color: #fff; font-size: 0.8rem;';

      if (localStream) {
        const localVideoStreamElem = document.createElement('video');
        //localVideo.id = 'video_'+feed;
        localVideoStreamElem.width = 160;
        localVideoStreamElem.height = 120;
        localVideoStreamElem.autoplay = true;
        localVideoStreamElem.muted = 'muted';
        localVideoStreamElem.classList.add('localVideoTag');
        localVideoStreamElem.style.cssText = '-moz-transform: scale(-1, 1); -webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); transform: scale(-1, 1); filter: FlipH;';
        localVideoStreamElem.srcObject = localStream;

        const localVideoContainer = document.createElement('div');
        localVideoContainer.id = 'video_' + feed; ///
        localVideoContainer.appendChild(nameElem);
        localVideoContainer.appendChild(localVideoStreamElem);
        // localVideoContainer.appendChild(localBlankPersonElem);
        localVideoContainer.classList.add('video-view');
        localVideoContainer.style.cssText = 'position: relative;';

        const localAudioOnOffElem = document.createElement('img');
        localAudioOnOffElem.id = 'audioBtn';
        // localAudioOnOffElem.src = "/img/ui_btn_audioOn.png";
        localAudioOnOffElem.classList.add('audioOn');

        const localVideoOnOffElem = document.createElement('img');
        localVideoOnOffElem.id = 'videoBtn';
        // localVideoOnOffElem.src = "/img/ui_btn_videoOn.png";
        localVideoOnOffElem.classList.add('videoOn');
        localVideoContainer.appendChild(localAudioOnOffElem);
        localVideoContainer.appendChild(localVideoOnOffElem);

        document.getElementById('locals').appendChild(localVideoContainer);
        $('#local_buttons').show();
      }
    } else {
      const localVideoContainer = document.getElementById('video_' + feed);
      console.log('localVideoContainer >>> ');
      if (display) {
        const nameElem = localVideoContainer.getElementsByTagName('div')[0];
        nameElem.innerHTML = display;
      }
      const localVideoStreamElem = localVideoContainer.getElementsByTagName('video')[0];
      if (localStream) console.log('setLocalVideoElement() >>> change local stream...');
      localVideoStreamElem.srcObject = localStream;
    }
  }

  function setRemoteVideoElement(remoteStream, feed, display) {
    if (!feed) return;

    if (!document.getElementById('video_' + feed)) {
      const nameElem = document.createElement('div');
      nameElem.style.display = 'table';
      nameElem.style.cssText = 'color: #fff; font-size: 0.8rem;';

      const remoteVideoStreamElem = document.createElement('video');
      if (display == 'share') {
        console.log(display, display, display);
        nameElem.innerHTML = '';
        // remoteVideoStreamElem.width = 1224;  //320
        // remoteVideoStreamElem.height = 768;  //240
        remoteVideoStreamElem.style.cssText = 'width:95%; height: 80%; margin-top: 20px;';
      } else {
        nameElem.innerHTML = display;
        remoteVideoStreamElem.width = 160;
        remoteVideoStreamElem.height = 120;
      }
      remoteVideoStreamElem.autoplay = true;
      // remoteVideoStreamElem.style.cssText = '-moz-transform: scale(-1, 1); -webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); transform: scale(-1, 1); filter: FlipH;';
      if (remoteStream) {
        console.log('======== remoteStream ============', feed);
        console.log(remoteStream);
        remoteVideoStreamElem.srcObject = remoteStream;
      }

      // 요기에서 외부에서 들어온 2번 user가 보이는거임
      const remoteVideoContainer = document.createElement('div');
      remoteVideoContainer.style.cssText = 'padding: 0 5px 0 5px;';
      remoteVideoContainer.id = 'video_' + feed;
      remoteVideoContainer.appendChild(nameElem);
      remoteVideoContainer.appendChild(remoteVideoStreamElem);

      if (display == 'share') {
        document.getElementById('screen').appendChild(remoteVideoContainer);
      } else {
        document.getElementById('remotes').appendChild(remoteVideoContainer);
      }
    } else {
      const remoteVideoContainer = document.getElementById('video_' + feed);
      if (display) {
        const nameElem = remoteVideoContainer.getElementsByTagName('div')[0];
        if (display == 'share') {
          nameElem.innerHTML = '';
        } else {
          nameElem.innerHTML = display;
        }
      }
      if (remoteStream) {
        console.log('======== remoteStream ============', feed);
        console.log(remoteStream);
        const remoteVideoStreamElem = remoteVideoContainer.getElementsByTagName('video')[0];
        console.log('remoteVideoStreamElem[0] 전 >>> ', remoteVideoStreamElem);
        remoteVideoStreamElem.srcObject = remoteStream;
        console.log('remoteVideoStreamElem[0] 후 >>> ', remoteVideoStreamElem);
      }
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

  function removeAllVideoElements() {
    const locals = document.getElementById('locals');
    const localVideoContainers = locals.getElementsByTagName('div');
    for (let i = 0; localVideoContainers && i < localVideoContainers.length; i++) removeVideoElement(localVideoContainers[i]);
    while (locals.firstChild) locals.removeChild(locals.firstChild);

    var remotes = document.getElementById('remotes');
    const remoteVideoContainers = remotes.getElementsByTagName('div');
    for (let i = 0; remoteVideoContainers && i < remoteVideoContainers.length; i++) removeVideoElement(remoteVideoContainers[i]);
    while (remotes.firstChild) remotes.removeChild(remotes.firstChild);
    document.getElementById('videos').getElementsByTagName('span')[0].innerHTML = '   --- VIDEOROOM () ---  ';
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

  function getDateTime() {
    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds() + ':' + today.getMilliseconds();
    var date_time = date + ' ' + time;
    return date_time;
  }

  ///////////////////////////////////////////////////////////
  // custom emit messages to send to the Server
  ///////////////////////////////////////////////////////////
  function getRoomId(roomName) {
    console.log('================ getRoomId =============');
    _listRooms();
    console.log($('#room_list').find('.room').length);
    var roomList = $('#room_list').find('.room');
    console.log('roomList=', roomList);
    roomList.forEach((room) => {
      console.log('room=', room);
      var roomId = room.attr('room');
      var roomName = room.text();
      console.log('roomId=', roomId, '    roomName=', roomName);
    });
  }

  ////////////////////////////////////////////////////////
  // end
  ////////////////////////////////////////////////////////
  const joinRoom = (room, description) => {
    console.log(`Joining room ${room} - ${description}`);
    if (displayName === '') {
      alert('참석할 이름을 입력해야 합니다.');
      return;
    }
    join({ room: room, display: displayName, token: null }); // room에는 undefined가 들어감.
  };
  const destroyRoom = (room, description) => {
    if (window.confirm(description + ' room을 삭제하겠습니까?')) {
      _destroy({ room: room, permanent: false, secret: 'adminpwd' });
    }
  };

  const handleListRooms = () => {
    _listRooms();
  };

  useEffect(() => {
    _listRooms();
  }, [roomList]);

  useEffect(() => {
    const handleRoomsList = ({ data }) => {
      let parsedData = JSON.parse(data);
      console.log('rooms list >>> ', parsedData);
      setRoomList(parsedData);
    };

    socket.on('rooms-list', handleRoomsList);
  }, [socket]);

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
    isAudioOn,
    isVideoOn,
    configure_bitrate_audio_video,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="App">
        {isModalVisible ? (
          <ModalComponent />
        ) : (
          <div>
            <div className="col-6 myInfo">
              <div className="myInfoStyle">
                <button id="connect" type="button" className="btn btn-primary btn-xs btn_between" onClick={handleConnectValue}>
                  Connect
                </button>
                <button id="disconnect" type="button" className="btn btn-primary btn-xs btn_between" onClick={handleDisconnectValue}>
                  Disconnect
                </button>
                <div className="btn_between">
                  <input type="text" className="form-control input-sm" disabled id="connect_status" value={stateOfConnect} />
                </div>
              </div>
              <div className="myInfoStyle">
                <div className="btn_between">
                  <div>참석할 이름</div>
                </div>
                <div className="btn_between">
                  <input type="text" className="form-control input-sm myInput" placeholder="참석할 이름" value={displayName} />
                </div>
              </div>
              <div className="myInfoStyle">
                <div className=" btn_between">
                  <div>비디오 프레임</div>
                </div>
                <div className="btn_between">
                  <input type="text" className="form-control input-sm" id="frame_rate" defaultValue="15" />
                </div>
              </div>
              <div className="myInfoStyle">
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
              <div className="myInfoStyle">
                <div className="btn_between">
                  <input id="new_room_name" className="form-control input-sm" type="text" placeholder="new room name" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
                </div>
                <button id="create_room" type="button" className="btn btn-primary btn-xs btn_between" onClick={handleCreateRoomClick}>
                  create_room
                </button>
              </div>
            </div>
            <div className="col-6 roomsList">
              <button id="list_rooms" type="button" className="btn btn-primary btn-xs btn_between" onClick={handleListRooms}>
                list_rooms
              </button>
              <button id="get_room_id" type="button" className="btn btn-primary btn-xs btn_between">
                get_room_id
              </button>
              <br />
              <br />
              <div className="roomNameNumber">room이름(현재 참가자수/최대 참가자수)</div>

              <div id="room_list" className="btn_between">
                {roomList.map((rooms) => (
                  <div key={rooms.room}>
                    {rooms.description} ({rooms.num_participants}/{rooms.max_publishers})
                    <button className="btn btn-primary btn-xs" onClick={() => joinRoom(rooms.room, rooms.description)}>
                      join
                    </button>
                    <button className="btn btn-primary btn-xs" onClick={() => destroyRoom(rooms.room, rooms.description)}>
                      destroy
                    </button>
                    <br />
                  </div>
                ))}
              </div>
            </div>
            <div id="videos" className="displayFlex">
              <div id="locals"></div>
              <div id="remotes" className="remotes"></div>
            </div>
            {/* <Videos /> */}
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}

export default App;
