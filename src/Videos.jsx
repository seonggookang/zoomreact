import React, { useContext, useState, useEffect } from 'react';
import AppContext from './Appcontext';
import $ from 'jquery';
import { useLocation } from 'react-router-dom';

const RoomsList = () => {
  const { socket, join, display_name, getDateTime, getId, _listRooms, myRoom } = useContext(AppContext);
  const [roomList, setRoomList] = useState([]);

  useEffect(() => {
    const handleRoomsList = ({ data }) => {
      let parsedData = JSON.parse(data);
      console.log('rooms list >>> ', parsedData);
      setRoomList(parsedData);
    };

    socket.on('rooms-list', handleRoomsList);

    return () => {
      socket.off('rooms-list', handleRoomsList);
    };
  }, [socket]);

  const joinRoom = (room, description) => {
    console.log(`Joining room ${room} - ${description}`);
    if (display_name === '') {
      alert('참석할 이름을 입력해야 합니다.');
      return;
    }
    join({ room: room, display: display_name, token: null }); // room에는 undefined가 들어감.
  };

  const destroyRoom = (room, description) => {
    if (window.confirm(description + ' room을 삭제하겠습니까?')) {
      _destroy({ room: room, permanent: false, secret: 'adminpwd' });
    }
  };

  function _destroy({ room, permanent = false, secret = 'adminpwd' }) {
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
  });
  return (
    <div className="col-6 roomsList">
      <button id="list_rooms" type="button" className="btn btn-primary btn-xs btn_between">
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
            {/* <button className="btn btn-primary btn-xs" onClick={() => destroyRoom(rooms.room, rooms.description)}>
              destroy
            </button> */}
            <br />
          </div>
        ))}
      </div>
    </div>
  );
};

const Container = () => {
  return (
    <>
      <div className="wrapper">
        <section className="content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="card" style={{ backgroundColor: '#bebebe' }}>
                  <div className="col-12">
                    <div className="row"></div>

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

const Videos = () => {
  const {
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
  } = useContext(AppContext);
  const location = useLocation();

  let local_feed;

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

  socket.on('exists', ({ data }) => {
    console.log('room exists ', getDateTime());
    console.log(data);
  });

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
  const [buttonsDisabled, setButtonsDisabled] = useState(true);

  const [stateOfConnect, setStateOfConnect] = useState('connected');

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

  const _create = ({
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

  // 클라에서 create emit하고 서버로부터 on으로 받은 created
  socket.on('created', ({ data }) => {
    console.log('hihihihihihcreated');
    if (data.room === -1) {
      alert('room 이 중복되었습니다.');
      return;
    } else {
      console.log('room created', data);
      $('#new_room_name').val('');
      _listRooms();
    }
  });

  const handleCreatedEvent = ({ data }) => {
    if (data.room === -1) {
      alert('room 이 중복되었습니다.');
    } else {
      console.log('room created', data);
      setNewRoomName('');
      _listRooms();
    }
  };

  const [newRoomName, setNewRoomName] = useState('');

  socket.on('connect', () => {
    // 1. Socket connection () --> 참석할 이름을 치고, 방 입장 전에 1번쨰로 나오는 콘솔
    console.log('socket connected');
    _listRooms(); // console.log("================ _listRooms =============");

    $('#connect').prop('disabled', true);
    $('#disconnect, #create_room, #list_rooms').prop('disabled', false);
    // disconnect 버튼 비활성화 시키는 코드
    // create_room 버튼 비활성화 시키는 코드
    // list_rooms 버튼 비활성화 시키는 코드
    socket.sendBuffer = [];

    join({ room: 1234, display: $('#myInput').val(), token: null });
  });

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

  return (
    <div id="videos" className="displayFlex">
      <span className="fontSize"> -- LOCALS -- </span>

      <div id="local" style={{ padding: '0 5px' }}>
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
      </div>
      <div id="remotes" className="remotes"></div>
    </div>
  );
};

export default Videos;
