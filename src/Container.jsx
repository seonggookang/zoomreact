import React, { useEffect, useState, useContext } from 'react';
import RoomsList from './RoomsList';
import Myinfo from './Myinfo';
import Videos from './Videos';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import $ from 'jquery';
import { useLocation } from 'react-router-dom';
import AppContext from './Appcontext';

const Container = () => {
  const location = useLocation();
  const { getDateTime, myRoom, getId, _listRooms, doAnswer, subscribe, socket, pendingOfferMap, closePC, closeAllPCs, setRemoteVideoElement, pcMap } = useContext(AppContext);

  let local_feed;

  function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ''])[1].replace(/\+/g, '%20')) || null;
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

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
      data: { room, secret },
      _id: getId(),
    });
  }

  socket.on('disconnect', () => {
    console.log('socket disconnected');
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
    // console.log('videoroom error >> ', error);
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

  // 방에 입장하면 실행됨

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
  // 왜이렇게 많이 실행하지??

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
    console.log(data);
    let data_room = data.room;
    data.publishers.forEach(({ feed }) => {
      // 출력이 안되고있음
      console.log({ feed, data_room }, 'feed >>> ', feed);
      if (pcMap.has(feed)) {
        console.log('이미 있는 feed 임. No need to subscribe');
      } else {
        console.log('feed가 없으니까 subscribe!');
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
    if (data.feed === local_feed) {
      $('#unpublish').text('Publish');
    }
  });

  // 리액트에서도 상대가 나가면 동작함!!!
  socket.on('leaving', ({ data }) => {
    console.log('feed leaving', data);
    if (data.feed) {
      removeVideoElementByFeed(data.feed);
      closePC(data.feed);
    }
    _listRooms();
  });

  // socket.on('leaving111', ({ data }) => {
  //   console.log('feed leaving', getDateTime());
  //   console.log(data);
  //   _listRooms();

  //   if (data.feed) {
  //     if (data.who_is_leaving === 'me') {
  //       removeAllVideoElements();
  //       $('#local_feed').text('');
  //       $('#private_id').text('');
  //       closeAllPCs();
  //     } else {
  //       removeVideoElementByFeed(data.feed);
  //       closePC(data.feed);
  //     }
  //   }
  // });

  socket.on('exists', ({ data }) => {
    console.log('room exists ', getDateTime());
    console.log(data);
  });

  // 이게 connect하고 나서 다음으로 console찍히는 부분.
  // socket.on('rooms-list', ({ data }) => {
  //   let parsedData = JSON.parse(data);
  //   console.log('rooms list >>> ', parsedData); // 모든 방에 대한 정보
  //   $('#room_list').html('');
  //   parsedData.forEach((rooms) => {
  //     $('#room_list').html(`
  //       ${$('#room_list').html()}
  //       ${rooms.description} (${rooms.num_participants}/${rooms.max_publishers})
  //       &nbsp;<button class='btn btn-primary btn-xs' onClick='join22(${rooms.room}, "${rooms.description}");'>join</button>
  //       &nbsp;<button class='btn btn-primary btn-xs' onClick='destroy_room(${rooms.room}, "${rooms.description}");'>destroy</button>
  //       <br>
  //     `);
  //   });
  // });

  socket.on('configured', async ({ data, _id }) => {
    console.log('feed configured just_configure >>> ', data.just_configure, getDateTime()); // just_configure이란??
    console.log('클라에서 configured 수신한 data >>> ', data); // 4개 (feed, room, jsep, just_configure) (jsep -->>  type: 'answer', sdp 들어있음 )
    pendingOfferMap.delete(_id); // 이건 왜하나?
    const pc = pcMap.get(data.feed);
    if (pc && data.jsep) {
      try {
        await pc.setRemoteDescription(data.jsep); // 1번 자신의 answer를 저장 // 이게 왜 에러?
        console.log('configure remote sdp OK ', data.jsep.type); // answer 출력
        if (data.jsep.type === 'offer' && data.just_configure === false) {
          console.log('data.jsep.type === offer 이므로 doAnswer()와 start() 실행.. just_configure >>> ', data.just_configure);
          const answer = await doAnswer(data.feed, null, data.jsep);
          start(data.feed, answer);
        }
      } catch (e) {
        console.log('error setting remote sdp >>> ', e); // 이게 에러가 나오고 있다는 뜻은 try안에서 에러가 난다는뜻
      }
    }
  });
  useEffect(() => {}, []);

  socket.on('rtp-fwd-started', ({ data }) => {
    console.log('rtp forwarding started', data);
  });

  socket.on('rtp-fwd-stopped', ({ data }) => {
    console.log('rtp forwarding stopped', data);
  });

  socket.on('rtp-fwd-list', ({ data }) => {
    console.log('rtp forwarders list', data);
  });

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
    for (let i = 0; localVideoContainers && i < localVideoContainers.length; i++) {
      removeVideoElement(localVideoContainers[i]);
    }
    while (locals.firstChild) locals.removeChild(locals.firstChild);

    let remotes = document.getElementById('remotes');
    const remoteVideoContainers = remotes.getElementsByTagName('div');
    for (let i = 0; remoteVideoContainers && i < remoteVideoContainers.length; i++) {
      removeVideoElement(remoteVideoContainers[i]);
    }
    while (remotes.firstChild) remotes.removeChild(remotes.firstChild);
    document.getElementById('videos').getElementsByTagName('span')[0].innerHTML = '   --- VIDEOROOM () ---  ';
  }

  return (
    <>
      <div className="wrapper">
        <section className="content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="card" style={{ backgroundColor: '#bebebe' }}>
                  <div className="col-12">
                    <div className="row">
                      <Myinfo /> {/*여기도 localStream이 쓰이고, */}
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

      {/* ----- 이 밑에 있는 것들이 적용이 되려면? ----- */}

      {/* <!-- Bootstrap 4 --> */}
      <script src="../AdminLTE/plugins/bootstrap/js/bootstrap.bundle.min.js"></script>
      {/* AdminLTE App */}
      <script src="../AdminLTE/dist/js/adminlte.min.js"></script>

      <script src="/node_modules/socket.io-client/dist/socket.io.js"></script>
    </>
  );
};

export default Container;
