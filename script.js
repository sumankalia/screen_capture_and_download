let preview = document.getElementById("preview");
let recording = document.getElementById("recording");
let startButton = document.getElementById("startButton");
let stopButton = document.getElementById("stopButton");
let downloadButton = document.getElementById("downloadButton");
let logElement = document.getElementById("log");
let recorder;

function log(msg) {
  //log messages on screen
  logElement.innerHTML = msg + "\n";
}

function startRecording(stream) {
  //start recording
  recorder = new MediaRecorder(stream); //api to record media in javascript provides different functionalities
  // as media pause, resume, start, stop, requestData - request blob of recorded media
  let data = [];

  //ondataavailable - fires periodically each time timeslice milliseconds of media have been recorded or
  //when the entire media is recorded if no timeslice is specified
  recorder.ondataavailable = (event) => data.push(event.data);
  recorder.start(); //strt the recording

  log('"Recording..."');

  //when stopped it will resolve the promise
  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = (event) => reject(event.name);
  });

  //when stopped it will return the data when it is recorded and stopped completely
  return Promise.all([stopped, recorder]).then(() => data);
}

function stop(stream) {
  if (recorder.state == "recording") {
    recorder.stop();
  }

  //getTracks = returns a sequence that represents all the MediaStreamTrack objects and stops
  //all them
  stream.getTracks().forEach((track) => track.stop());
}

startButton.addEventListener(
  "click",
  function () {
    navigator.mediaDevices
      .getDisplayMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        //stream - MediaStreamTrack
        preview.srcObject = stream;
        // downloadButton.href = stream;
        preview.captureStream =
          preview.captureStream || preview.mozCaptureStream;
        return new Promise((resolve) => (preview.onplaying = resolve));
      })
      .then(() => startRecording(preview.captureStream()))
      //captureStream() will return a MediaStream object
      //which is streaming a real-time capture of the
      // content being rendered in the media element.
      .then((recordedChunks) => {
        let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
        recording.src = URL.createObjectURL(recordedBlob);
        downloadButton.href = recording.src;
        downloadButton.download = "RecordedVideo.webm";

        log(
          "Successfully recorded " +
            recordedBlob.size +
            " bytes of " +
            recordedBlob.type +
            " media."
        );
      })
      .catch(log);
  },
  false
);

stopButton.addEventListener(
  "click",
  function () {
    //passing the recorded chunks as argument
    stop(preview.srcObject);
  },
  false
);
