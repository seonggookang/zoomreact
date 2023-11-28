import './App.css';
import Container from './Container';
import ModalComponent from './ModalComponent';
import { useState } from 'react';
import AppContext from './Appcontext';
import io from 'socket.io-client';

function App() {
  const [displayName, setDisplayName] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [socket, setSocket] = useState(io('https://janusc.wizbase.co.kr:4443', { autoConnect: false }));
  const [connect, setConnect] = useState('');
  const [connectStatus, setConnectStatus] = useState('');
  const [disConnect, setDisconnect] = useState('');
  const [leaveAll, setLeaveAll] = useState('');
  const [listRooms, setListRooms] = useState('');

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

  const contextValue = {
    displayName,
    setDisplayName,
    handleDisplayNameChange,
    localStream,
    setLocalStream,
    socket,
    setSocket,
    getDateTime,
    getId,
    _listRooms,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="App">
        <Container />
        <ModalComponent />
      </div>
    </AppContext.Provider>
  );
}

export default App;
