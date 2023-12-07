import React, { useEffect, useContext, useState } from 'react';
import AppContext from './Appcontext';

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
            <button className="btn btn-primary btn-xs" onClick={() => destroyRoom(rooms.room, rooms.description)}>
              destroy
            </button>
            <br />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomsList;
