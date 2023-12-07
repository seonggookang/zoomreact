import React, { useEffect, useState, useContext, useRef } from 'react';
import AppContext from './Appcontext';
import $ from 'jquery';

const Myinfo = () => {
  const { socket } = useContext(AppContext);
  const pcMap = new Map();
  let pendingOfferMap = new Map();
  const [buttonsDisabled, setButtonsDisabled] = useState(true);
  const { displayName, handleDisplayNameChange, _listRooms, join, generateRandomNumber } = useContext(AppContext);
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

  //////////////////////////////// CREATE //////////////////////////////////////////////////////////////

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
  // const performCommonAction = () => {
  //   setButtonsDisabled(false);
  // };

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
    <div className="col-6 myInfo">
      <div className="myInfoStyle">
        <button type="button" className="btn btn-primary btn-xs btn_between" onClick={handleConnectValue}>
          {/* <button type="button" className="btn btn-primary btn-xs btn_between" onClick={handleConnectClick} disabled={isButtonsDisabled}> */}
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
          <input type="text" className="form-control input-sm myInput" placeholder="참석할 이름" value={displayName} onChange={handleDisplayNameChange} />
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
  );
};

export default Myinfo;
