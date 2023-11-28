// ModalComponent.js
import React, { useEffect, useState, useContext } from 'react';
import AppContext from './Appcontext';
import $ from 'jquery';

const ModalComponent = () => {
  const [isModalVisible, setIsModalVisible] = useState(true);
  const { displayName, setDisplayName, handleDisplayNameChange } = useContext(AppContext);

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const enterAction = () => {
    if (!displayName) {
      alert('이름을 입력해야 합니다.');
    } else {
      hideModal(false);
    }
  };

  useEffect(() => {
    const randomNumber2 = Math.floor(Math.random() * 1e5)
      .toString()
      .padStart(5, '0');
    $('#disconnect, #create_room, #list_rooms, #leave_all').prop('disabled', true);
    setDisplayName(randomNumber2);
  }, []);

  return isModalVisible ? (
    <form onSubmit={enterAction}>
      <div className="modal modal-dialog modal-dialog-centered" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">참석할 이름을 입력하십시오.</h5>
            </div>
            <div className="modal-body">
              <div id="myMessage" className="myMessage"></div>
              <input type="text" className="myInput" placeholder="참석할 이름" value={displayName} onChange={handleDisplayNameChange} />
            </div>
            <div className="modal-footer">
              <button type="button" id="enterRoom" className="btn btn-primary" onClick={enterAction}>
                입장
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  ) : null;
};

export default ModalComponent;
