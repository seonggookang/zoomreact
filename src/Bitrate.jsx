import React, { useEffect, useState, useContext, useRef } from 'react'
import AppContext from './Appcontext'
import $ from 'jquery'

const Bitrate = () => {
  const { localStream, socket } = useContext(AppContext)

  async function configure_bitrate_audio_video(mode, bitrate = 0) {
    console.log('================ configure_bitrate_audio_video =============')
    let feed = parseInt($('#local_feed').text())

    function getId() {
      return Math.floor(Number.MAX_SAFE_INTEGER * Math.random())
    }

    if (mode === 'bitrate') {
      let configureData = {
        feed,
        bitrate: bitrate,
      }
      console.log({
        data: configureData,
        _id: getId(),
      })
      console.log(bitrate / 1000)
      let bitrate_label = bitrate / 1000 > 1000 ? bitrate / 1000 / 1000 + 'M' : bitrate / 1000 + 'K'
      $('#Bandwidth_label').text(bitrate_label)
      socket.emit('configure', {
        data: configureData,
        _id: getId(),
      })
    } else if (mode === 'audio') {
      // 오디오를 끄는 것이면,
      if ($('#audioset').hasClass('btn-primary')) {
        $('#audioset').removeClass('btn-primary').addClass('btn-warning')

        console.log('오디오 끄기')
        const audioTrack = localStream.getAudioTracks()[0]
        if (audioTrack) {
          // 오디오를 끄거나 켤 수 있는 상태인지 확인합니다.
          const isAudioEnabled = audioTrack.enabled

          if (isAudioEnabled) {
            // 오디오를 끕니다.
            audioTrack.enabled = false
            console.log('오디오를 끔')
          } else {
            // 오디오를 켭니다.
            audioTrack.enabled = true
            console.log('오디오를 켬')
          }
        } else {
          console.log('오디오 트랙을 찾을 수 없습니다.')
        }
      } else {
        // 오디오를 켜는 것이면,
        $('#audioset').removeClass('btn-warning').addClass('btn-primary')

        console.log('오디오 켜기')
        const audioTrack = localStream.getAudioTracks()[0]
        if (audioTrack) {
          // 오디오를 끄거나 켤 수 있는 상태인지 확인합니다.
          const isAudioEnabled = audioTrack.enabled

          if (isAudioEnabled) {
            // 오디오를 끕니다.
            audioTrack.enabled = false
            console.log('오디오를 끔')
          } else {
            // 오디오를 켭니다.
            audioTrack.enabled = true
            console.log('오디오를 켬')
          }
        } else {
          console.log('오디오 트랙을 찾을 수 없습니다.')
        }
      }
    } else {
      //비디오를 끄는 것이면
      if ($('#videoset').hasClass('btn-primary')) {
        $('#videoset').removeClass('btn-primary').addClass('btn-warning')

        console.log('비디오 끄기')
        // 미디어 스트림에서 비디오 트랙을 가져옵니다.
        const videoTrack = localStream.getVideoTracks()[0]

        // 비디오 트랙이 있는지 확인합니다.
        if (videoTrack) {
          // 비디오를 끄거나 켤 수 있는 상태인지 확인합니다.
          const isVideoEnabled = videoTrack.enabled

          if (isVideoEnabled) {
            // 비디오를 끕니다.
            videoTrack.enabled = false
            console.log('비디오를 끔')
          } else {
            // 비디오를 켭니다.
            videoTrack.enabled = true
            console.log('비디오를 켬')
          }
        } else {
          console.log('비디오 트랙을 찾을 수 없습니다.')
        }

        try {
        } catch (e) {
          console.log('error while doing offer for changing', e)
          return
        }
      } else {
        //비디오를 켜는 것이면,
        $('#videoset').removeClass('btn-warning').addClass('btn-primary')

        console.log('비디오 켜기')
        // 미디어 스트림에서 비디오 트랙을 가져옵니다.
        const videoTrack = localStream.getVideoTracks()[0]

        // 비디오 트랙이 있는지 확인합니다.
        if (videoTrack) {
          // 비디오를 끄거나 켤 수 있는 상태인지 확인합니다.
          const isVideoEnabled = videoTrack.enabled

          if (isVideoEnabled) {
            // 비디오를 끕니다.
            videoTrack.enabled = false
            console.log('비디오를 끔')
          } else {
            // 비디오를 켭니다.
            videoTrack.enabled = true
            console.log('비디오를 켬')
          }
        } else {
          console.log('비디오 트랙을 찾을 수 없습니다.')
        }

        try {
        } catch (e) {
          console.log('error while doing offer for changing', e)
          return
        }
      }
    }
  }

  const handleBitrateClick = (bitrate) => {
    configure_bitrate_audio_video('bitrate', bitrate)
    console.log('configure_bitrate_audio_video')
  }

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
  )
}

export default Bitrate
