var enableBS, enableHR, enableSC, enableLC;
var goalData;
var heartRate;
var playingAudio = false;
var offScreenTime = 90000;

/* Socket setup */
const socket = io(`http://${window.location.hostname}:5500`, {
  query: {
    data: JSON.stringify({ client: "overlay" }),
  },
});
/********* Socket events *********/

// Socket event for initializing the data on connect
socket.on("initData", (data) => {
  setPlayerData(data.playerData);
  goalData = data.goalData;
  setHeartRate(data.heartRate);
  enableBS = data.config.enableBS;
  enableHR = data.config.enableHR;
  enableSC = data.config.enableSC;
  enableLC = data.config.enableLC;

  setOverlayElements();
});

// Socket event for recieving live chat messages
socket.on("liveChat", ({ authorName, message }) => {
  displayChat(authorName, message);
});

// Socket event for recieving the heart rate
socket.on("heartRate", (heartRate) => {
  setHeartRate(heartRate);
});

// Global reference to the current TTS audio element
let currentTTSAudio = null;

// Handle incoming TTS audio
socket.on("ttsReady", ({ chat, mp3 }) => {
  try {
    // Force stop any existing audio before starting new playback
    if (currentTTSAudio) {
      currentTTSAudio.pause();
      currentTTSAudio.src = "";
      currentTTSAudio = null;
    }

    // Create a new audio element
    const mp3Blob = new Blob([mp3], { type: "audio/mp3" });
    const audioURL = URL.createObjectURL(mp3Blob);
    
    currentTTSAudio = new Audio(audioURL);

    currentTTSAudio.onended = () => {
      socket.emit("ttsEnded");
      URL.revokeObjectURL(audioURL);
      currentTTSAudio = null;
    };

    currentTTSAudio.play();
    
    socket.emit("getUpcomingTTS");
  } catch (error) {
    console.log(error);
  }

  console.log("TTS playing: " + chat);
});

// Pause audio
socket.on("ttsPause", () => {
  if (currentTTSAudio) {
    currentTTSAudio.pause();
    console.log("TTS paused");
  }
});

// Resume audio
socket.on("ttsResume", () => {
  if (currentTTSAudio) {
    currentTTSAudio.play();
    console.log("TTS resumed");
  }
});

// Skip audio (Hard stop for OBS Browser Source)
socket.on("ttsSkip", () => {
  if (currentTTSAudio) {
    currentTTSAudio.pause();
    currentTTSAudio.src = "";
    currentTTSAudio.remove(); // Completely remove the element
    currentTTSAudio = null;
    socket.emit("ttsEnded");
    console.log("TTS skipped");
  }
});

// Handle TTS ended event
socket.on("ttsEnded", () => {
  socket.emit("getUpcomingTTS");
});

socket.on("editOverlayElements", (elements) => {
  console.log("Overlay Elements updated.");

  enableBS = elements.enableBS;
  enableHR = elements.enableHR;
  enableSC = elements.enableSC;
  enableLC = elements.enableLC;

  setOverlayElements();
});
/********* End socket events *********/

/********* Settings page socket events *********/
function setHeartRate(heartRate) {
  $("#heartRateNumber").html(heartRate);
}

function setPlayerData(playerData) {
  $("#disUserName").html(playerData.name);
  $("#disRank").html(playerData.rank);
}

function displayChat(authorName, message) {
  liveChatHTML = $("#liveChat").html();
  liveChatHTML +=
    '<div class="chatMessage"><p class="chatUserName">' +
    authorName +
    ': </p><p class="chatText">' +
    message +
    "</p></div>";
  $("#liveChat").html(liveChatHTML);
}

function setOverlayElements() {
  if (enableBS) {
    console.log("Beat Saber enabled.");
    $("#rankBox").css("display", "block");
  } else {
    console.log("Beat Saber disabled.");
    $("#rankBox").css("display", "none");
  }

  if (enableSC) {
    console.log("Subscriber count enabled.");
    $("#subscriberGoal").css("display", "flex");
  } else {
    console.log("Subscriber count disabled.");
    $("#subscriberGoal").css("display", "none");
  }

  if (enableLC) {
    console.log("Live chat enabled.");
    $("#liveChatBox").css("display", "flex");
  } else {
    console.log("Live chat disabled.");
    $("#liveChatBox").css("display", "none");
  }

  if (enableHR) {
    console.log("Heart rate enabled.");
    $("#heartRate").css("display", "block");
  } else {
    console.log("Heart rate disabled.");
    $("#heartRate").css("display", "none");
  }

  if (enableLC && enableHR) {
    $("#heartRate").css("bottom", "1.6em");
  } else if (!enableLC || enableHR) {
    $("#heartRate").css("bottom", "0.5em");
  }
}
/********* End settings page socket events *********/

/********* Animation functions *********/

// Animation for showing the rank box
async function showRankBox() {
  $("#rankBox").addClass("animate__backInRight");
  $("#rankBox").removeClass("animate__backOutRight");
  await sleep(offScreenTime / 3);
  hideRankBox();
}

// Animation for hiding the rank box
function hideRankBox() {
  $("#rankBox").addClass("animate__backOutRight");
  $("#rankBox").removeClass("animate__backInRight");
}

// Animation for showing the subscriber goal
async function showSubscriberGoal() {
  $("#subscriberGoal").addClass("animate__backInUp");
  $("#subscriberGoal").removeClass("animate__backOutDown");
  await sleep(offScreenTime / 3);
  hideSubscriberGoal();
}

// Animation for hiding the subscriber goal
function hideSubscriberGoal() {
  $("#subscriberGoal").addClass("animate__backOutDown");
  $("#subscriberGoal").removeClass("animate__backInUp");
}

// Controller for the subscriber goal animation
async function subscriberGoal() {
  await showSubscriberGoal();
  await sleep(offScreenTime);
  subscriberGoal();
}

// Controller for the rank box animation
async function rankBox() {
  await showRankBox();
  await sleep(offScreenTime);
  rankBox();
}

// Animation for filling the follower bar
async function fillFollowerBar() {
  $("#subscriberGoal").addClass("animate__pulse");
  await sleep(1200);
  for (let i = 0; i <= goalData.current_amount; i++) {
    $("#goalText").html(`Subscriber Goal ${i}/${goalData.target_amount}`);
    $("#goalProgress").css("width", (i / goalData.target_amount) * 100 + "%");
    await sleep(30);
  }
  $("#subscriberGoal").removeClass("animate__pulse");
}
/********* End animation functions *********/

// Sleep function
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Initial setup function
$(document).ready(async function () {
  await sleep(5000);
  fillFollowerBar();
  subscriberGoal();
  rankBox();
});
