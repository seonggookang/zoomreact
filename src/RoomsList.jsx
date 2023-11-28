import React, { useEffect, useContext, useState } from 'react'
import AppContext from './Appcontext'

const RoomsList = () => {
  const { socket, getId, getDateTime } = useContext(AppContext)
  const [roomList, setRoomList] = useState([])

  useEffect(() => {
    const handleRoomsList = ({ data }) => {
      let parsedData = JSON.parse(data)
      console.log('rooms list >>> ', parsedData)
      setRoomList(parsedData)
    }

    socket.on('rooms-list', handleRoomsList)

    return () => {
      socket.off('rooms-list', handleRoomsList)
    }
  }, [socket])

  const joinRoom = (room, description) => {
    console.log(`Joining room ${room} - ${description}`)
    // room_id는 undefined인데 인자로 넣는다고??
    let display_name = $('#display_name').val() // html에서 랜덤으로 만들어진값(html 284줄)
    if (display_name === '') {
      alert('참석할 이름을 입력해야 합니다.')
      return
    }
    join({ room: room, display: display_name, token: null, desc: desc }) // room에는 undefined가 들어감.
  }

  function join({ room = myRoom, display = myName, token = null, desc }) {
    console.log('================ join =============')
    const joinData = {
      room, // 처음 들어오면 아무것도 없음. NaN으로 나옴
      display, // 첫 렌더링 때 내가 입력한 참석할 이름
      token,
      desc,
    }
    console.log('join sent as below ', getDateTime())
    console.log({
      data: joinData,
      _id: getId(),
    })
    socket.emit('join', {
      // 드디어 socket.io의 첫 시작. 1번이 join을 서버로 전송, 서버에서 description에 대한 처리를 내부적으로 해줘야 하는건가?
      data: joinData,
      _id: getId(),
    })
  }

  const destroyRoom = (room, description) => {
    console.log(`Destroying room ${room} - ${description}`)
    // Destroy room logic
  }

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
  )
}

export default RoomsList
