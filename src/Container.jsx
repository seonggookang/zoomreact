import React, { useEffect, useState, useContext } from 'react';
import RoomsList from './RoomsList';
import Myinfo from './Myinfo';
import Videos from './Videos';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import $ from 'jquery';
import io from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import AppContext from './Appcontext';

const Container = () => {
  const location = useLocation();
  const RTCPeerConnection = (window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection).bind(window);
  const { getDateTime, getId } = useContext(AppContext);
  const pcMap = new Map();
  let pendingOfferMap = new Map();
  let myRoom = getURLParameter('room') ? parseInt(getURLParameter('room')) : getURLParameter('room_str') || 1234;
  const randName = 'John_Doe_' + Math.floor(10000 * Math.random());
  const myName = getURLParameter('name') || randName;

  const button = document.getElementById('button');
  let localStream;
  let frameRate;
  let audioSet = true;
  let videoSet = true;
  let local_pc;
  let local_audio_sender;
  let local_video_sender;
  let local_feed;
  let local_display;

  // const disconnect = document.getElementById('disconnect');
  // disconnect.onclick = () => {
  //   if (!socket.connected) {
  //     alert('already disconnected!');
  //   }
  //   else {
  //     socket.disconnect();
  //   }
  // };

  // const listRooms = document.getElementById('list_rooms');
  // listRooms.onclick = () => {
  //   _listRooms();
  // };

  // const leaveAll = document.getElementById('leave_all');
  // leaveAll.onclick = () => {
  //   let evtdata = {
  //     data: {feed: $('#local_feed').text()},
  //   }
  //   console.log(evtdata);
  //   if ($('#local_feed').text() === '') return;
  //   // else _leave({feed: parseInt($('#local_feed').text()), display: $('#display_name').val()});
  //   else _leaveAll({feed: $('#local_feed').text(), display: $('#display_name').val()});
  // };

  // const unPublish = document.getElementById('unpublish');
  // unPublish.onclick = () => {
  //   if ($('#unpublish').text() === 'Unpublish') {
  //     if (local_feed) {
  //       _unpublish({feed : local_feed});
  //     }
  //   } else {
  //     publishOwnFeed();
  //   }
  // };

  function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ''])[1].replace(/\+/g, '%20')) || null;
  }

  const scheduleConnection = (() => {
    let task = null;
    const delay = 5000;

    return (secs) => {
      if (task) return;
      const timeout = secs * 1000 || delay;
      console.log('scheduled joining in ' + timeout + ' ms');
      task = setTimeout(() => {
        join();
        task = null;
      }, timeout);
    };
  })();

  const scheduleConnection2 = ((room) => {
    console.log('room===' + room);
    let task = null;
    const delay = 5000;

    return (secs) => {
      if (task) return;
      myRoom = room;
      const timeout = secs * 1000 || delay;
      console.log('scheduled joining222 in ' + timeout + ' ms');
      task = setTimeout(() => {
        join();
        task = null;
      }, timeout);
    };
  })();

  // const socket = io("http://0.0.0.0:4443/janode");
  // const socket = io({
  //   rejectUnauthorized: false,
  //   autoConnect: false,
  //   reconnection: false,
  // });

  const socket = io('https://janusc.wizbase.co.kr:4443', { autoConnect: false });
  console.log('', socket);

  function subscribe({ feed, room = myRoom, substream, temporal }) {
    console.log('================ subscribe =============', myRoom, room);
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
  async function configure_bitrate_audio_video(mode, bitrate = 0) {
    console.log('================ configure_bitrate_audio_video =============');
    let feed = parseInt($('#local_feed').text());

    if (mode == 'bitrate') {
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
    } else if (mode === 'audio') {
      // 오디오를 끄는 것이면,
      if ($('#audioset').hasClass('btn-primary')) {
        $('#audioset').removeClass('btn-primary').addClass('btn-warning');

        console.log('오디오 끄기');
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          // 오디오를 끄거나 켤 수 있는 상태인지 확인합니다.
          const isAudioEnabled = audioTrack.enabled;

          if (isAudioEnabled) {
            // 오디오를 끕니다.
            audioTrack.enabled = false;
            console.log('오디오를 끔');
          } else {
            // 오디오를 켭니다.
            audioTrack.enabled = true;
            console.log('오디오를 켬');
          }
        } else {
          console.log('오디오 트랙을 찾을 수 없습니다.');
        }
      } else {
        // 오디오를 켜는 것이면,
        $('#audioset').removeClass('btn-warning').addClass('btn-primary');

        console.log('오디오 켜기');
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          // 오디오를 끄거나 켤 수 있는 상태인지 확인합니다.
          const isAudioEnabled = audioTrack.enabled;

          if (isAudioEnabled) {
            // 오디오를 끕니다.
            audioTrack.enabled = false;
            console.log('오디오를 끔');
          } else {
            // 오디오를 켭니다.
            audioTrack.enabled = true;
            console.log('오디오를 켬');
          }
        } else {
          console.log('오디오 트랙을 찾을 수 없습니다.');
        }
      }
    } else {
      //비디오를 끄는 것이면
      if ($('#videoset').hasClass('btn-primary')) {
        $('#videoset').removeClass('btn-primary').addClass('btn-warning');

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
        } catch (e) {
          console.log('error while doing offer for changing', e);
          return;
        }
      } else {
        //비디오를 켜는 것이면,
        $('#videoset').removeClass('btn-warning').addClass('btn-primary');

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
        } catch (e) {
          console.log('error while doing offer for changing', e);
          return;
        }
      }
    }
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
    // 3. listRooms 출력
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

  //////////////////////////////// CREATE //////////////////////////////////////////////////////////////
  // const createRoomButton = document.getElementById('create_room')
  // createRoomButton.onclick = () => {
  //   // html에 id="create_room"라는 속성을 바로 이렇게 조작가능.
  //   if ($('#new_room_name').val() === '') alert('생성할 방이름을 입력해야 합니다.')
  //   else
  //     _create({
  //       room: generateRandomNumber(),
  //       description: $('#new_room_name').val(),
  //       max_publishers: 100,
  //       audiocodec: 'opus',
  //       videocodec: 'vp8',
  //       talking_events: false,
  //       talking_level_threshold: 25,
  //       talking_packets_threshold: 100,
  //       permanent: false,
  //       bitrate: 128000,
  //       secret: 'adminpwd',
  //     })
  // }

  // function _create({
  //   room,
  //   description,
  //   max_publishers = 6,
  //   audiocodec = 'opus',
  //   videocodec = 'vp8',
  //   talking_events = false,
  //   talking_level_threshold = 25,
  //   talking_packets_threshold = 100,
  //   permanent = false,
  //   bitrate = 128000,
  // }) {
  //   console.log('================ _create =============')
  //   console.log('create sent as below ', getDateTime())
  //   console.log({
  //     data: {
  //       room,
  //       description,
  //       max_publishers,
  //       audiocodec,
  //       videocodec,
  //       talking_events,
  //       talking_level_threshold,
  //       talking_packets_threshold,
  //       permanent,
  //       bitrate,
  //       secret: 'adminpwd',
  //     },
  //     _id: getId(),
  //   })
  //   socket.emit('create', {
  //     data: {
  //       room,
  //       description,
  //       max_publishers,
  //       audiocodec,
  //       videocodec,
  //       talking_events,
  //       talking_level_threshold,
  //       talking_packets_threshold,
  //       permanent,
  //       bitrate,
  //       secret: 'adminpwd',
  //     },
  //     _id: getId(),
  //   })
  // }

  // // 클라에서 create emit하고 서버로부터 on으로 받은 created
  // socket.on('created', ({ data }) => {
  //   if (data.room == -1) {
  //     alert('room 이 중복되었습니다.')
  //     return
  //   } else {
  //     console.log('room created', data)
  //     $('#new_room_name').val('')
  //     _listRooms()
  //   }
  // })

  ////////////////// DESTROY //////////////////////////////////////////////////////////////////////////

  // 정말 삭제할거임 묻는 함수. 확인 누르면 _destroy함수 실행.
  function destroy_room(room, desc) {
    // if (confirm(desc + ' room을 삭제하겠습니까?')) {  // confirm은 리액트 컴포넌트 내에서 사용 X.
    //   _destroy({ room : room, permanent : false, secret : 'adminpwd' });
    // }
  }

  // 삭제 기능
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

  socket.on('destroyed', ({ data }) => {
    console.log('room destroyed', data);
    _listRooms();
    // if (data.room === myRoom) {
    //   socket.disconnect();
    // }
  });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // add remove enable disable token mgmt
  function _allow({ room = myRoom, action, token, secret = 'adminpwd' }) {
    console.log('================ _allow =============');
    const allowData = {
      room,
      action,
      secret,
    };
    if (action != 'disable' && token) allowData.list = [token];

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
      data: { room, secret },
      _id: getId(),
    });
  }

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
    join({ room: 1234, display: $('#myInput').val(), token: null });

    socket.sendBuffer = [];
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
    console.log('videoroom error >> ', error);
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

  function join22(room, desc) {
    // room_id는 undefined인데 인자로 넣는다고??
    let display_name = $('#display_name').val(); // html에서 랜덤으로 만들어진값(html 284줄)
    if (display_name == '') {
      alert('참석할 이름을 입력해야 합니다.');
      return;
    }
    join({ room: room, display: display_name, token: null, desc: desc }); // room에는 undefined가 들어감.
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
      // 드디어 socket.io의 첫 시작. 1번이 join을 서버로 전송, 서버에서 description에 대한 처리를 내부적으로 해줘야 하는건가?
      data: joinData,
      _id: getId(),
    });
  }

  // 방에 입장하면 실행됨
  socket.on('joined', async ({ data }) => {
    // 서버에서 준 data
    console.log('joined to room ', getDateTime());
    console.log('클라에서 joined 수신한 data >>> ', data); // 서버에서 준 data 통해 자신의 feed를 알게됨.정보 6개(description, display, feed, private_id, publishers, room)
    $('#local_feed').text(data.feed);
    $('#private_id').text(data.private_id);
    $('#curr_room_name').val(data.description);
    $('#leave_all').prop('disabled', false);
    _listRooms(); // 이게 있어야할 이유가 있나?? >> 이거 안하니까 현재 참가자 인원수가 0으로 고정되버리네!!!!

    setLocalVideoElement(null, null, null, data.room, data.description); // (localSteam, feed, display, room), join버튼 클릭 -> data.room만 인자로 보냄.
    // 이상한 난수가 4번째 인자로 전달되고있음. data.description을 해야 방의 이름이 넘어갈텐데..
    try {
      const offer = await doOffer(data.feed, data.display, false); // 3번째 인자 false는 왜 있음?? 필요없으면 지우자, 여기서 return한 offer가 jsep ==> type, sdp 담고 있음.
      configure({ feed: data.feed, jsep: offer, just_configure: false }); // 서버에서 준 data.feed
      subscribeTo(data.publishers, data.room); // 2번이 같은방에 들어오면 실행.

      //url에 video_flag=off 이면 video를 끔
      const video_flag = $('#curr_room_name').attr('video_flag');
      console.log('video_flag = ', video_flag);
      if (video_flag == 'off') {
        console.log('video_flag=', video_flag, ' so making video off...');
        configure_bitrate_audio_video('video');
      } else {
        let vidTrack = localStream.getVideoTracks();
        vidTrack.forEach((track) => (track.enabled = true));
        let audTrack = localStream.getAudioTracks();
        audTrack.forEach((track) => (track.enabled = true));
      }
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

  // 아마도 socket.emit('list-rooms')에 대한 대답?
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

  // 서버 -> 클라 configured 전송. (jsep, room, feed)
  socket.on('configured', async ({ data, _id }) => {
    console.log('feed configured just_configure >>> ', data.just_configure, getDateTime()); // just_configure이란??
    console.log('클라에서 configured 수신한 data >>> ', data); // 4개 (feed, just_configure, room, jsep) ( type: 'answer', sdp 들어있음 )
    pendingOfferMap.delete(_id);
    const pc = pcMap.get(data.feed);
    if (pc && data.jsep) {
      try {
        await pc.setRemoteDescription(data.jsep);
        console.log('configure remote sdp OK ', data.jsep.type); // answer 출력
        if (data.jsep.type === 'offer' && data.just_configure == false) {
          console.log('data.jsep.type === offer 이므로 doAnswer()와 start() 실행.. just_configure >>> ', data.just_configure);
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

  // 아래 코드는 아예 출력이 안되고 있음.
  socket.on('feed-list', ({ data }) => {
    // 1번은 2번이 joined를 수신할 때 이미 서버로부터 feed-list 수신하게 됨. 이를 통해 2번이 join했음을 알게됨.
    // alert('new feeds available');
    console.log('new feeds available!!! ', getDateTime());
    console.log('pcMap >> ', pcMap);
    console.log(data);
    let data_room = data.room;
    data.publishers.forEach(({ feed }) => {
      // 출력이 안되고있음
      console.log({ feed, data_room }, 'feed >>> ', feed);
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

  // // 이게 connect하고 나서 다음으로 console찍히는 부분.
  // socket.on('rooms-list', ({ data }) => {
  //   let parsedData = JSON.parse(data)
  //   console.log('rooms list >>> ', parsedData) // 모든 방에 대한 정보
  //   $('#room_list').html('') // #room_list에다가 빈값 설정 >> 이걸 안해주면 배열에 대해서 다시 그려주게 돼서 중복 발생함.
  //   parsedData.forEach((rooms) => {
  //     // room_list에 오른쪽것들을 넣음 --> 비어있는 room_list + room이름 + (참가자수/최대참가자수) + join버튼 + destroy버튼
  //     $('#room_list').html(`
  //       ${$('#room_list').html()}
  //       ${rooms.description} (${rooms.num_participants}/${rooms.max_publishers})
  //       &nbsp;<button class='btn btn-primary btn-xs' onClick='join22(${rooms.room}, "${rooms.description}");'>join</button>
  //       &nbsp;<button class='btn btn-primary btn-xs' onClick='destroy_room(${rooms.room}, "${rooms.description}");'>destroy</button>
  //       <br>
  //     `)
  //   })
  // })

  socket.on('rtp-fwd-started', ({ data }) => {
    console.log('rtp forwarding started', data);
  });

  socket.on('rtp-fwd-stopped', ({ data }) => {
    console.log('rtp forwarding stopped', data);
  });

  socket.on('rtp-fwd-list', ({ data }) => {
    console.log('rtp forwarders list', data);
  });

  async function _restartPublisher(feed) {
    const offer = await doOffer(feed, null);
    configure({ feed, jsep: offer, just_configure: false });
  }

  async function _restartSubscriber(feed) {
    configure({ feed, restart: true, just_configure: false });
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
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { frameRate: { ideal: frameRate, max: frameRate } } });
        console.log('localStream.getTracks() >>> ', localStream.getTracks()); // audio, video 총 2개 "배열"로 출력.
        localStream.getTracks().forEach((track) => {
          // audio, video 각각에 대하여 진행.
          console.log('adding track >>> ', track, track.kind); // audio에 대한 track과 문자열 audio, video에 대한 track과 문자열 video 출력
          if (track.kind == 'audio') {
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
      console.log('error creating subscriber answer', e);
      removeVideoElementByFeed(feed);
      closePC(feed);
      throw e;
    }
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

  function setRemoteVideoElement(remoteStream, feed, display) {
    if (!feed) return;

    if (!document.getElementById('video_' + feed)) {
      const nameElem = document.createElement('span');
      nameElem.innerHTML = display + ' (' + feed + ')';
      nameElem.style.display = 'table';

      const remoteVideoStreamElem = document.createElement('video');
      remoteVideoStreamElem.width = 320;
      remoteVideoStreamElem.height = 240;
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

      // blank person 이미지도 함께 추가
      // let blank_person = $('#blank_person').clone();
      // blank_person.attr('id', 'image_' + feed);
      // blank_person.attr('feed', feed);
      // console.log('appendChild... image');
      // blank_person.appendTo( remoteVideoContainer );
    } else {
      const remoteVideoContainer = document.getElementById('video_' + feed);
      if (display) {
        const nameElem = remoteVideoContainer.getElementsByTagName('span')[0];
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

    let remotes = document.getElementById('remotes');
    const remoteVideoContainers = remotes.getElementsByTagName('div');
    for (let i = 0; remoteVideoContainers && i < remoteVideoContainers.length; i++) removeVideoElement(remoteVideoContainers[i]);
    while (remotes.firstChild) remotes.removeChild(remotes.firstChild);
    document.getElementById('videos').getElementsByTagName('span')[0].innerHTML = '   --- VIDEOROOM () ---  ';
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

  return (
    <>
      <div className="wrapper">
        <div className="">
          <section className="content">
            <div className="container-fluid">
              <div className="row">
                <div className="col-12">
                  <div className="card" style={{ backgroundColor: '#bebebe' }}>
                    <div className="col-12">
                      <div className="row" style={{ display: 'flex' }}>
                        <Myinfo /> {/* 여기도 localStream이 쓰이고, */}
                        <RoomsList />
                      </div>
                      <Videos /> {/* 여기도 localStream이 쓰이고, */}
                      <div id="screen" className="screen"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ----- 이 밑에 있는 것들이 적용이 되려면? ----- */}

      {/* <!-- Bootstrap 4 --> */}
      {/* <script src="../AdminLTE/plugins/bootstrap/js/bootstrap.bundle.min.js"></script> */}
      {/* AdminLTE App */}
      {/* <script src="../AdminLTE/dist/js/adminlte.min.js"></script> */}
      {/* <!-- <script src="/socket.io/socket.io.js"></script> --> */}
      <script src="/node_modules/socket.io-client/dist/socket.io.js"></script>
      {/* <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js"></script> --> */}
      <script src="/videoroom-client.js"></script>
    </>
  );
};

export default Container;
