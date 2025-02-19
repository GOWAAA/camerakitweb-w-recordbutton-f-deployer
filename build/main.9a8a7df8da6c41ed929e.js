"use strict";
(self["webpackChunkcamera_kit_demo"] = self["webpackChunkcamera_kit_demo"] || []).push([[179],{

/***/ 8563:
/***/ ((__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) => {


// EXTERNAL MODULE: ./node_modules/@snap/camera-kit/dist/index.js + 180 modules
var dist = __webpack_require__(6728);
// EXTERNAL MODULE: ./node_modules/@ffmpeg/ffmpeg/dist/esm/index.js + 2 modules
var esm = __webpack_require__(4435);
// EXTERNAL MODULE: ./node_modules/@ffmpeg/util/dist/esm/index.js + 1 modules
var dist_esm = __webpack_require__(9742);
;// CONCATENATED MODULE: ./src/config.js
const CONFIG = {
  LENS_ID: "__LENS_ID__",
  GROUP_ID: "__GROUP_ID__",
  API_TOKEN: "__API_TOKEN__",
}

;// CONCATENATED MODULE: ./src/main.js






if (CONFIG.API_TOKEN === "__API_TOKEN__") {
  throw new Error("Please configure your Camera Kit credentials in config.js")
}

;(async function () {
  let mediaRecorder
  let recordedChunks = []
  let isBackFacing = false
  let recordPressedCount = 0

  const ffmpeg = new esm/* FFmpeg */.C()
  //Replace with your own api token, lens id, and group id
  const apiToken = CONFIG.API_TOKEN
  const lensID = CONFIG.LENS_ID
  const groupID = CONFIG.GROUP_ID

  const cameraKit = await (0,dist/* bootstrapCameraKit */.FY)({
    apiToken: apiToken,
  })

  //Set which camera will be used
  //'user' = front camera
  //'environment' = back camera
  const constraints = {
    video: {
      facingMode: { exact: "user" },
    },
    audio: false, // Optional: Disable microphone
  }

  //Get canvas element for live render target
  const liveRenderTarget = document.getElementById("canvas")

  //Create camera kit session and assign liveRenderTarget canvas to render out live render target from camera kit
  const session = await cameraKit.createSession({ liveRenderTarget })

  // Request media stream with set camera perference
  let mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
  const source = (0,dist/* createMediaStreamSource */.$A)(mediaStream, { cameraType: "user" })

  //Set up source settings so that it renders out correctly on browser
  await session.setSource(source)
  //only for front camera use
  source.setTransform(dist/* Transform2D.MirrorX */.A.MirrorX)
  await source.setRenderSize(window.innerWidth, window.innerHeight)
  await session.setFPSLimit(60)
  await session.play() //plays live target by default

  //Assign Lens ID (left) and Group ID(Right) to camera kit
  const lens = await cameraKit.lensRepository.loadLens(lensID, groupID)

  await session.applyLens(lens)

  //Get all elements require to perform logics
  const recordButton = document.getElementById("record-button")
  const recordOutline = document.getElementById("outline")
  const actionbutton = document.getElementById("action-buttons")
  const switchButton = document.getElementById("switch-button")
  const loadingIcon = document.getElementById("loading")
  const backButtonContainer = document.getElementById("back-button-container")

  recordButton.addEventListener("click", async () => {
    //first check if it should start record or stop record
    // even number = start, odd number = stop
    if (recordPressedCount % 2 == 0) {
      //Manage media recorder and start recording
      manageMediaRecorder(session)

      //Show stop record button
      recordButton.style.backgroundImage = "url('./assets/RecordStop.png')"
    } else {
      //hide stop record button
      RecordButtonToggle(false)
      //switch back to record button when recording stopped
      recordButton.style.backgroundImage = "url('./assets/RecordButton.png')"
      //Stop media recording
      mediaRecorder.stop()
    }
    recordPressedCount += 1
  })

  switchButton.addEventListener("click", () => {
    //update & switch between front and back camera
    updateCamera(session)
  })

  /*
  ========================================
  Functions
  ========================================
  */

  //To convert recorded video to proper mp4 format that can be shared to social media
  async function fixVideoDuration(blob) {
    console.log(blob)
    // Load FFmpeg.js
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd"
    await ffmpeg.load({
      coreURL: await (0,dist_esm/* toBlobURL */.Wn)(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await (0,dist_esm/* toBlobURL */.Wn)(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    })

    // Write the input video blob to FFmpeg's virtual filesystem
    await ffmpeg.writeFile("input.mp4", await (0,dist_esm/* fetchFile */.dc)(blob))

    // Reprocess the video to ensure metadata is added correctly
    await ffmpeg.exec(["-i", "input.mp4", "-movflags", "faststart", "-c", "copy", "output.mp4"])

    // Read the fixed video file from the virtual filesystem
    const fixedData = await ffmpeg.readFile("output.mp4")

    // Create a new Blob for the fixed video
    const fixedBlob = new Blob([fixedData.buffer], { type: "video/mp4" })

    // Return the fixed Blob
    return fixedBlob
  }

  //Function to toggle record button visibility
  function RecordButtonToggle(isVisible) {
    if (isVisible) {
      recordOutline.style.display = "block"
      recordButton.style.display = "block"
    } else {
      recordOutline.style.display = "none"
      recordButton.style.display = "none"
    }
  }

  //Fucntion to switch camera between front & back
  async function updateCamera(session) {
    isBackFacing = !isBackFacing

    if (mediaStream) {
      session.pause()
      mediaStream.getVideoTracks()[0].stop()
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: isBackFacing ? "environment" : "user",
      },
    })

    const source = (0,dist/* createMediaStreamSource */.$A)(mediaStream, {
      // NOTE: This is important for world facing experiences
      cameraType: isBackFacing ? "environment" : "user",
    })

    await session.setSource(source)
    if (!isBackFacing) {
      source.setTransform(dist/* Transform2D.MirrorX */.A.MirrorX)
    }
    await source.setRenderSize(window.innerWidth, window.innerHeight)

    await session.play()
  }

  //Function to setup media recorder and start recording
  function manageMediaRecorder(session) {
    console.log("session output cature")
    const ms = liveRenderTarget.captureStream(60)
    mediaRecorder = new MediaRecorder(ms, { mimeType: "video/mp4" })
    console.log("create media recorder")
    recordedChunks = []
    // Handle recorded data once it is available
    mediaRecorder.ondataavailable = (event) => {
      console.log("start record")

      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data)
      }
    }
    // Handle recording data when recording stopped
    mediaRecorder.onstop = async () => {
      console.log("stop record")
      //display loading icon while video is being processed
      loadingIcon.style.display = "block"
      const blob = new Blob(recordedChunks, { type: "video/mp4" })
      const fixedBlob = await fixVideoDuration(blob)
      // Generate a URL for the fixed video
      const url = URL.createObjectURL(fixedBlob)
      //hide loading icon once video is done processing
      loadingIcon.style.display = "none"
      displayPostRecordButtons(url)
    }
    //Start recording
    mediaRecorder.start()
  }

  function displayPostRecordButtons(url, fixedBlob) {
    actionbutton.style.display = "block"
    backButtonContainer.style.display = "block"
    switchButton.style.display = "none"

    //Logic for when download button is selected
    document.getElementById("download-button").onclick = () => {
      const a = document.createElement("a")
      a.href = url
      a.download = "recording.mp4" //Change downloaded file name here
      a.click()
      a.remove()
    }

    //Logic for when share button is selected
    document.getElementById("share-button").onclick = async () => {
      try {
        const file = new File([fixedBlob], "recording.mp4", { type: "video/mp4" }) // Convert blob to file

        // Check if sharing files is supported
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Recorded Video",
            text: "Check out this recording!",
          })
          console.log("File shared successfully")
        } else {
          console.error("Sharing files is not supported on this device.")
        }
      } catch (error) {
        console.error("Error while sharing:", error)
      }
    }

    document.getElementById("back-button").addEventListener("click", () => {
      //TODO: Add logic to go back to recording
      actionbutton.style.display = "none"
      backButtonContainer.style.display = "none"
      RecordButtonToggle(true)
    })
  }
})()


/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ __webpack_require__.O(0, [216], () => (__webpack_exec__(8563)));
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);