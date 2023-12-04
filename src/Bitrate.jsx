import React from 'react';

const Bitrate = (configure_bitrate_audio_video) => {
  const handleBitrateClick = (bitrate) => {
    configure_bitrate_audio_video('bitrate', bitrate);
    console.log('configure_bitrate_audio_video');
  };

  return (
    <>
      <button id="bitrateset" autoComplete="off" className="btn btn-primary btn-xs btn_between dropdown-toggle" data-toggle="dropdown">
        <span id="Bandwidth_label">128K</span>
        <span className="caret"></span>
      </button>
      <ul id="bitrate" className="dropdown-menu" role="menu">
        <li>
          <button type="button" onClick={() => handleBitrateClick(0)}>
            No limit
          </button>
        </li>
        <li>
          <button type="button" onClick={() => handleBitrateClick(32000)}>
            Cap to 32kbit
          </button>
        </li>
        <li>
          <button type="button" onClick={() => handleBitrateClick(64000)}>
            Cap to 64kbit
          </button>
        </li>
        <li>
          <button type="button" onClick={() => handleBitrateClick(128000)}>
            Cap to 128kbit
          </button>
        </li>
        <li>
          <button type="button" onClick={() => handleBitrateClick(256000)}>
            Cap to 256kbit
          </button>
        </li>
        <li>
          <button type="button" onClick={() => handleBitrateClick(512000)}>
            Cap to 512kbit
          </button>
        </li>
        <li>
          <button type="button" onClick={() => handleBitrateClick(1024000)}>
            Cap to 1mbit
          </button>
        </li>
        <li>
          <button type="button" onClick={() => handleBitrateClick(1500000)}>
            Cap to 1.5mbit
          </button>
        </li>
        <li>
          <button type="button" onClick={() => handleBitrateClick(2000000)}>
            Cap to 2mbit
          </button>
        </li>
      </ul>
    </>
  );
};

export default Bitrate;
