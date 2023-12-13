// ModalComponent.js
import React, { useEffect, useContext, useRef, useState } from 'react';
import AppContext from './Appcontext';

const ModalComponent = () => {
  const { displayName, handleDisplayNameChange, setIsModalVisible, socket, _listRooms } = useContext(AppContext);
  const inputRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const hideModal = () => {
    setIsModalVisible(false);
  };

  const enterAction = (event) => {
    event.preventDefault();
    inputRef.current.focus();

    if (!displayName) {
      setIsEmpty(true);
    } else {
      hideModal(false);
      if (socket && !socket.connected) {
        socket.connect();
        _listRooms();
      } else {
        alert('already connected!');
      }
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      enterAction(event);
    }
  };

  // useEffect(() => {
  //   const randomNumber2 = Math.floor(Math.random() * 1e5)
  //     .toString()
  //     .padStart(5, '0');
  //   setDisplayName(randomNumber2);
  // }, []);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return (
    <form onSubmit={enterAction}>
      <div className="modal modal-dialog modal-dialog-centered" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">참석할 이름을 입력하십시오.</h5>
            </div>
            <div className="modal-body">
              <div className="myMessage">{isEmpty && '이름을 입력해야 합니다.'}</div>
              <input ref={inputRef} type="text" className="myInput" placeholder="참석할 이름" value={displayName} onChange={handleDisplayNameChange} onKeyPress={handleKeyPress} />
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary">
                입장
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ModalComponent;
