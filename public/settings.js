let config = {
  enableBS: false,
  enableSC: false,
  enableHR: false,
  enableLC: false,
  subscriberGoal: 0,
  youtubeChannelID: "",
  youtubeLiveStreamID: "",
  youtubeAPIKey: "",
  scoreSaberProfileLink: "",
  pusloidWidgetLink: "",
};

// TTS status variables
let ttsPaused = false;
let ttsPlaying = false;
let ttsQueueSize = 0;
let upcomingTTSMessages = [];

const socket = io(`http://${window.location.hostname}:5500`, {
  query: {
    data: JSON.stringify({ client: "settings" }),
  },
});

socket.on("connect", () => {
  console.log("Socket.IO: Connected.");
});

socket.on("initSettingsData", (data) => {
  config.enableBS = data.savedSettings.enableBS;
  config.enableSC = data.savedSettings.enableSC;
  config.enableHR = data.savedSettings.enableHR;
  config.enableLC = data.savedSettings.enableLC;
  config.subscriberGoal = data.goalData.target_amount;
  config.youtubeChannelID = data.youtubeChannelID;
  config.youtubeLivestreamId = data.youtubeLivestreamID;
  config.youtubeAPIKey = data.youtubeAPIKey;
  config.scoreSaberProfileLink = data.scoreSaberProfileLink;
  config.pusloidWidgetLink = data.pusloidWidgetLink;

  $("#showBeatSaber").prop("checked", config.enableBS);
  $("#showHeartRate").prop("checked", config.enableHR);
  $("#showSubscriberCount").prop("checked", config.enableSC);
  $("#showLiveChat").prop("checked", config.enableLC);
  $("#subscriberGoal").val(config.subscriberGoal);
  $("#youtubeChannelId").val(config.youtubeChannelID);
  $("#youtubeLivestreamId").val(config.youtubeLivestreamId);
  $("#youtubeApiKey").val(config.youtubeAPIKey);
  $("#scoreSaberApiProfileLink").val(config.scoreSaberProfileLink);
  $("#pusloidWidgetLink").val(config.pusloidWidgetLink);
  
  // Initialize the sensitive data toggle
  initSensitiveDataToggle();
  
  // Get initial TTS status
  refreshTTSStatus();
});

// Socket event for receiving TTS status
socket.on("ttsStatus", (status) => {
  ttsPlaying = status.currentlyPlaying;
  ttsPaused = status.isPaused;
  ttsQueueSize = status.queueSize;
  upcomingTTSMessages = status.upcomingMessages;
  
  updateTTSStatusDisplay();
});

// Function to initialize the sensitive data toggle
function initSensitiveDataToggle() {
  // Add event listener to the checkbox
  $("#showSensitiveData").on("change", function() {
    const isChecked = $(this).prop("checked");
    const inputType = isChecked ? "text" : "password";
    
    // Toggle all sensitive fields between password and text type
    $(".sensitive-field").attr("type", inputType);
  });
}

function setOverlayElements() {
  console.log(
    "Socket state:",
    socket
      ? socket.connected
        ? "Connected"
        : "Connecting"
      : "Not initialized",
  );

  config.enableBS = $("#showBeatSaber").prop("checked");
  config.enableHR = $("#showHeartRate").prop("checked");
  config.enableSC = $("#showSubscriberCount").prop("checked");
  config.enableLC = $("#showLiveChat").prop("checked");

  overlayElements = {
    enableBS: config.enableBS,
    enableHR: config.enableHR,
    enableSC: config.enableSC,
    enableLC: config.enableLC,
  };

  if (socket && socket.connected) {
    console.log("Overlay Elements updating.");
    socket.emit("updateOverlayElements", overlayElements);
  } else {
    console.log("Socket.IO: Not connected.");
  }
}

function setLivestreamSettings() {
  console.log(
    "Socket state:",
    socket
      ? socket.connected
        ? "Connected"
        : "Connecting"
      : "Not initialized",
  );

  config.subscriberGoal = $("#subscriberGoal").val();
  config.youtubeChannelID = $("#youtubeChannelId").val();
  config.youtubeLivestreamId = $("#youtubeLivestreamId").val();

  livestreamSettings = {
    subscriberGoal: config.subscriberGoal,
    youtubeChannelID: config.youtubeChannelID,
    youtubeLivestreamId: config.youtubeLivestreamId,
  };

  if (socket && socket.connected) {
    console.log("Livestream Settings updating.");
    socket.emit("updateLivestreamSettings", livestreamSettings);
  } else {
    console.log("Socket.IO: Not connected.");
  }
}

function setGeneralSettings() {
  console.log(
    "Socket state:",
    socket
      ? socket.connected
        ? "Connected"
        : "Connecting"
      : "Not initialized",
  );

  config.youtubeAPIKey = $("#youtubeApiKey").val();
  config.scoreSaberProfileLink = $("#scoreSaberApiProfileLink").val();
  config.pusloidWidgetLink = $("#pusloidWidgetLink").val();

  generalSettings = {
    youtubeApiKey: config.youtubeAPIKey,
    scoreSaberProfileLink: config.scoreSaberProfileLink,
    pusloidWidgetLink: config.pusloidWidgetLink,
  };

  if (socket && socket.connected) {
    console.log("General Settings updating.");
    socket.emit("updateGeneralSettings", generalSettings);
  } else {
    console.log("Socket.IO: Not connected.");
  }
}

// TTS Control Functions
function pauseTTS() {
  if (socket && socket.connected) {
    socket.emit("ttsPause");
    ttsPaused = true;
    updateTTSStatusDisplay();
  }
}

function resumeTTS() {
  if (socket && socket.connected) {
    socket.emit("ttsResume");
    ttsPaused = false;
    updateTTSStatusDisplay();
  }
}

function skipTTS() {
  if (socket && socket.connected) {
    socket.emit("ttsSkip");
    refreshTTSStatus();
  }
}

function refreshTTSStatus() {
  if (socket && socket.connected) {
    socket.emit("getUpcomingTTS");
  }
}

function removeFromQueue(index) {
  if (socket && socket.connected) {
    socket.emit("removeFromQueue", index);
  }
}

function updateTTSStatusDisplay() {
  // Update status text
  let statusText = ttsPlaying ? "Playing" : "Idle";
  if (ttsPaused) statusText = "Paused";
  $("#ttsStatus").text(statusText);
  
  // Update button states
  $("#pauseResumeBtn").text(ttsPaused ? "Resume" : "Pause");
  // Always enable the pause/resume button
  $("#pauseResumeBtn").prop("disabled", false);
  $("#skipBtn").prop("disabled", !ttsPlaying);
  
  // Update queue display
  const queueList = $("#ttsQueueList");
  queueList.empty();
  
  if (ttsQueueSize === 0) {
    queueList.append("<li class='list-group-item bg-dark text-light'>No messages in queue</li>");
  } else {
    upcomingTTSMessages.forEach((message, index) => {
      queueList.append(`
        <li class='list-group-item bg-dark text-light d-flex justify-content-between align-items-center'>
          <span>${index + 1}. ${message}</span>
          <button class='btn btn-sm btn-danger' onclick='removeFromQueue(${index})'>Remove</button>
        </li>
      `);
    });
  }
}
