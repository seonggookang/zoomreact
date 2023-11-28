import React, { useEffect, useState, useContext, useRef } from 'react'
import AppContext from './Appcontext'
import $ from 'jquery'
import Bitrate from './Bitrate'

const Videos = () => {
  const [localFeed, setLocalFeed] = useState(null)
  const { socket, getDateTime, getId } = useContext(AppContext)

  const handleUnpublishClick = () => {
    if (localFeed) {
      _unpublish({ feed: localFeed })
    } else {
      // publishOwnFeed()
    }
  }
  // async function publishOwnFeed() {
  //   try {
  //     const offer = await doOffer(local_feed, local_display, false)
  //     configure({ feed: local_feed, jsep: offer, just_configure: false })

  //     $('#unpublish').text('Unpublish')
  //   } catch (e) {
  //     console.log('error while doing offer in publishOwnFeed()', e)
  //   }
  // }
  const _unpublish = ({ feed }) => {
    console.log('================ _unpublish =============')
    const unpublishData = {
      feed,
    }

    console.log('unpublish sent as below ', getDateTime())
    console.log({
      data: unpublishData,
      _id: getId(),
    })

    socket.emit('unpublish', {
      data: unpublishData,
      _id: getId(),
    })
  }

  return (
    <div id="videos" className="videos">
      <span className="fontSize"> -- LOCALS -- </span>
      <div className="borderGapColor">
        <div id="locals"></div> {/* 여기가 비디오가 들어올 곳!!!!!!!!!!!! */}
        <div>
          <button id="unpublish" className="btn btn-primary btn-xs btn_between" onClick={handleUnpublishClick}>
            Unpublish
          </button>
          <button id="audioset" onClick="configure_bitrate_audio_video('audio');" className="btn btn-primary btn-xs btn_between">
            Audio
          </button>
          <button id="videoset" onClick="configure_bitrate_audio_video('video');" className="btn btn-primary btn-xs btn_between">
            Video
          </button>
          <div className="btn-group btn-group-xs">
            <Bitrate />
          </div>
        </div>
        <div id="local_info" className="displayNone">
          local_feed: <div id="local_feed" className="displayFlex"></div>
          private_id: <div id="private_id" className="displayFlex"></div>
        </div>
      </div>
      <br />
      <span className="fontSize"> -- REMOTES -- </span>
      <div id="remotes" className="remotes">
        <div className="borderGapColor">
          <button id="unpublish" className="btn btn-primary btn-xs btn_between displayNone">
            Unpublish
          </button>
          <button id="audioset" onClick="configure_bitrate_audio_video('audio');" className="btn btn-primary btn-xs btn_between displayNone">
            Audio
          </button>
          <button id="videoset" onClick="configure_bitrate_audio_video('video');" className="btn btn-primary btn-xs btn_between displayNone">
            Video
          </button>
          <div className="btn-group btn-group-xs displayNone">
            <Bitrate />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Videos
