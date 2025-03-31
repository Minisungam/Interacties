let config = {
  enableBS: false,
  enableSC: false,
  enableHR: false,
  enableLC: false,
  enableCB: false,
  subscriberGoal: 0,
  youtubeChannelID: "",
  youtubeLiveStreamID: "",
  googleAPIKey: "",
  scoreSaberProfileLink: "",
  pusloidAccessToken: "",
};

// TTS status variables
let ttsPaused = false;
let ttsPlaying = false;
let ttsQueueSize = 0;
let upcomingTTSMessages = [];

// Connect to the same host/port that served the page, automatically using ws:// or wss://
const socket = io({
  query: {
    data: JSON.stringify({ client: "settings" }),
  },
});

socket.on("connect", () => {
  console.log("Socket.IO: Connected.");
  // Request initial recent TTS list after connecting
  socket.emit("getInitialRecentTTS"); 
});

socket.on("initSettingsData", (data) => {
  config.enableBS = data.savedSettings.enableBS;
  config.enableSC = data.savedSettings.enableSC;
  config.enableHR = data.savedSettings.enableHR;
  config.enableLC = data.savedSettings.enableLC;
  config.enableCB = data.savedSettings.enableCB;
  config.subscriberGoal = data.goalData.target_amount;
  config.youtubeChannelID = data.youtubeChannelID;
  config.youtubeLivestreamId = data.youtubeLivestreamID;
  config.googleAPIKey = data.googleAPIKey;
  config.scoreSaberProfileLink = data.scoreSaberProfileLink;
  config.pusloidAccessToken = data.pusloidAccessToken;

  $("#showBeatSaber").prop("checked", config.enableBS);
  $("#showHeartRate").prop("checked", config.enableHR);
  $("#showSubscriberCount").prop("checked", config.enableSC);
  $("#showLiveChat").prop("checked", config.enableLC);
  $("#showCustomBox").prop("checked", config.enableCB);
  $("#subscriberGoal").val(config.subscriberGoal);
  $("#youtubeChannelId").val(config.youtubeChannelID);
  $("#youtubeLivestreamId").val(config.youtubeLivestreamId);
  $("#googleAPIKey").val(config.googleAPIKey);
  $("#scoreSaberApiProfileLink").val(config.scoreSaberProfileLink);
  $("#pusloidAccessToken").val(config.pusloidAccessToken);
  
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

// Socket event for receiving real-time updates for recent TTS messages
socket.on('recentTTSUpdate', (updatedRecentFiles) => {
  console.log("Received recentTTSUpdate");
  updateRecentTTSList(updatedRecentFiles);
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
  config.enableCB = $("#showCustomBox").prop("checked");

  overlayElements = {
    enableBS: config.enableBS,
    enableHR: config.enableHR,
    enableSC: config.enableSC,
    enableLC: config.enableLC,
    enableCB: config.enableCB,
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

  config.googleAPIKey = $("#googleAPIKey").val();
  config.scoreSaberProfileLink = $("#scoreSaberApiProfileLink").val();
  config.pusloidAccessToken = $("#pusloidAccessToken").val();

  generalSettings = {
    googleAPIKey: config.googleAPIKey,
    scoreSaberProfileLink: config.scoreSaberProfileLink,
    pusloidAccessToken: config.pusloidAccessToken,
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

// Function to update the list of recent TTS messages for replay
function updateRecentTTSList(recentMessages) {
  try {
    const recentList = $("#recentTTSList");
    recentList.empty();

    if (!recentMessages || recentMessages.length === 0) { // Added check for null/undefined
      recentList.append("<li class='list-group-item bg-dark text-light'>No recent TTS messages found.</li>");
    } else {
      // Display in reverse order (newest first)
      [...recentMessages].reverse().forEach(messageData => { // Use spread to avoid modifying original array if passed by ref
        // Ensure path uses forward slashes for URL compatibility
        const filePath = messageData.path.replace(/\\/g, '/'); 
        recentList.append(`
          <li class='list-group-item bg-dark text-light d-flex justify-content-between align-items-center'>
            <span>${messageData.message || 'TTS Message'}</span>
            <button class='btn btn-sm btn-info' onclick='requestTTSReplay("${filePath}")'>Replay</button>
          </li>
        `);
      });
    }
  } catch (error) {
    console.error("Error updating recent TTS messages list:", error);
    const recentList = $("#recentTTSList");
    recentList.empty();
    recentList.append("<li class='list-group-item bg-dark text-light text-danger'>Error loading recent TTS messages.</li>");
  }
}

// Function to request the overlay plays a specific TTS file
function requestTTSReplay(filePath) {
  if (socket && socket.connected) {
    console.log(`Requesting replay of: ${filePath}`);
    socket.emit("replayTTS", { filePath: filePath });
  } else {
    console.error("Socket not connected, cannot request TTS replay.");
  }
}
