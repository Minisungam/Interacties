// Christopher Magnus 2024
// CC BY-NC-ND 4.0

// Imports
import sharedData from "./entities/data.js";
import { initLiveChat } from "./services/liveChat.js";
import { refreshGoalData, refreshPlayerData } from "./services/fetchAPI.js";
import { initHeartRate } from "./services/heartRate.js";
import { processTTSQueue, pauseTTS, resumeTTS, skipTTS, getUpcomingTTS, removeFromQueue } from "./services/tts.js";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";
import path from "path"; // Import path module

const appVersion = "1.2.0";
const asciiArt = `
  _____       _                      _   _           
 |_   _|     | |                    | | (_)          
   | |  _ __ | |_ ___ _ __ __ _  ___| |_ _  ___  ___ 
   | | | '_ \\| __/ _ \\ '__/ _' |/ __| __| |/ _ \\/ __|
  _| |_| | | | ||  __/ | | (_| | (__| |_| |  __/\\__ \\
 |_____|_| |_|\\__\\___|_|  \\__,_|\\___|\\__|_|\\___||___/
                                                     
Version: ${appVersion}
`;

// Server Setup
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 5500;

// Express Setup
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', './views');

// Read config file
sharedData.config = JSON.parse(fs.readFileSync("./config.json", "UTF-8"));
sharedData.goalData.target_amount = sharedData.config.subscriberGoal;

// Express GET requests
app.get("/", (req, res) => {
  res.render("overlay");
}); 

// Express GET request sending the user to a settings page
app.get("/settings", (req, res) => {
  res.render("settings");
});

io.on("connection", (socket) => {
  const clientData = JSON.parse(socket.handshake.query.data);

  console.log(`Socket.IO: ${clientData.client} user has connected.`);
  if (clientData.client == "settings") {
    socket.emit("initSettingsData", {
      savedSettings: sharedData.config.savedSettings,
      goalData: sharedData.goalData,
      youtubeChannelID: sharedData.config.youtubeChannelID,
      youtubeLivestreamID: sharedData.config.youtubeLivestreamID,
      googleAPIKey: sharedData.config.googleAPIKey,
      scoreSaberProfileLink: sharedData.config.scoreSaberProfileLink,
      pusloidAccessToken: sharedData.config.pusloidAccessToken,
    });
  } else if (clientData.client == "overlay") {
    socket.emit("initData", {
      playerData: sharedData.playerData,
      goalData: sharedData.goalData,
      heartRate: sharedData.heartRate,
      config: sharedData.config.savedSettings,
    });
    sharedData.liveChatHistory.forEach((element) => {
      socket.emit("liveChat", element);
    });
  }

  socket.on("updateOverlayElements", (updatedData) => {
    console.log("Overlay Elements updated.");

    sharedData.config.savedSettings.enableBS = Boolean(updatedData.enableBS);
    sharedData.config.savedSettings.enableHR = Boolean(updatedData.enableHR);
    sharedData.config.savedSettings.enableSC = Boolean(updatedData.enableSC);
    sharedData.config.savedSettings.enableLC = Boolean(updatedData.enableLC);
    sharedData.config.savedSettings.enableCB = Boolean(updatedData.enableCB);

    io.emit("editOverlayElements", updatedData);

    saveSettings();
  });

  socket.on("updateLivestreamSettings", (updatedData) => {
    console.log("Received Livestream Settings update:", updatedData);

    const oldLivestreamID = sharedData.config.youtubeLivestreamID;
    const newLivestreamID = updatedData.youtubeLivestreamId; // Corrected key from settings.js

    if (sharedData.config.subscriberGoal != Number(updatedData.subscriberGoal)) { // Check config directly
      console.log("Subscriber goal updated.");
      io.emit("goalDataUpdate", {
        current_amount: sharedData.goalData.current_amount, // Assuming goalData is still relevant or updated elsewhere
        target_amount: Number(updatedData.subscriberGoal),
      });
    }
    sharedData.config.subscriberGoal = Number(updatedData.subscriberGoal); // Update config directly
    sharedData.config.youtubeChannelID = updatedData.youtubeChannelID;
    sharedData.config.youtubeLivestreamID = newLivestreamID; // Update config directly

    // Re-initialize live chat only if the ID changed
    if (oldLivestreamID !== newLivestreamID) {
      console.log(`Livestream ID changed from ${oldLivestreamID} to ${newLivestreamID}. Re-initializing live chat.`);
      initLiveChat(io, newLivestreamID); // Call with the new ID
      // No need to emit liveChatCleared here, initLiveChat handles it if ID is empty
      // Instead, emit a specific event for the overlay to clear chat *before* new messages arrive
      io.emit("liveStreamChanged");
    }

    saveSettings();
  });

  socket.on("updateGeneralSettings", (updatedData) => {
    console.log("General Settings updated.");

    sharedData.googleAPIKey = updatedData.googleAPIKey;
    sharedData.scoreSaberProfileLink = updatedData.scoreSaberProfileLink;
    sharedData.pusloidAccessToken = updatedData.pusloidAccessToken;

    saveSettings();
  });

  socket.on("ttsEnded", () => {
    console.log("TTS ended.");
    sharedData.ttsPlaying = false;
    
    // Send updated TTS status to all clients
    const ttsStatus = getUpcomingTTS();
    io.emit("ttsStatus", ttsStatus);
  });

  // TTS Control Events
  socket.on("ttsPause", () => {
    pauseTTS(io);
  });

  socket.on("ttsResume", () => {
    resumeTTS(io);
  });

  socket.on("ttsSkip", () => {
    skipTTS(io);
  });

  socket.on("getUpcomingTTS", () => {
    const ttsStatus = getUpcomingTTS();
    socket.emit("ttsStatus", ttsStatus);
  });
  
  socket.on("removeFromQueue", (index) => {
    if (removeFromQueue(index)) {
      console.log(`Removed message at index ${index} from TTS queue.`);
      // Send updated queue status
      const ttsStatus = getUpcomingTTS();
      io.emit("ttsStatus", ttsStatus);
    }
  });
  
  // Handle request from settings page to replay a TTS file on the overlay
  socket.on("replayTTS", ({ filePath }) => {
    console.log(`Received request to replay TTS: ${filePath}`);
    // Emit an event specifically for overlay clients
    io.emit("playReplayTTS", { filePath: filePath });
  });
  
  // Handle request from settings page for the initial recent TTS list
  socket.on("getInitialRecentTTS", () => {
    // Send current list back only to the requesting client
    socket.emit('recentTTSUpdate', sharedData.recentTTSFiles);
  });
});

// Express GET requests to send data from the server
app.get("/getTTS", (req, res) => {
  res.download("output.mp3");
});

// Refresh ScoreSaber rank data
const updatePlayerData = setInterval(function () {
  refreshPlayerData();
}, 60000);

// Refresh goal data from YouTube
const updateGoalData = setInterval(function () {
  refreshGoalData();
}, 30000);

// Function to clear the TTS output folder on startup
function clearTTSFolder() {
  const ttsDir = path.join(process.cwd(), 'public', 'tts');
  if (fs.existsSync(ttsDir)) {
    fs.readdir(ttsDir, (err, files) => {
      if (err) {
        console.error("Error reading TTS directory:", err);
        return;
      }

      for (const file of files) {
        const filePath = path.join(ttsDir, file);
        fs.unlink(filePath, err => {
          if (err) {
            console.error(`Error deleting TTS file ${filePath}:`, err);
          } else {
            console.log(`Deleted old TTS file: ${filePath}`);
          }
        });
      }
    });
  } else {
    // If the directory doesn't exist, create it
    fs.mkdirSync(ttsDir, { recursive: true });
    console.log(`Created TTS directory: ${ttsDir}`);
  }
}

// Initial setup function
function setup() {
  console.log(asciiArt);
  clearTTSFolder();
  initHeartRate(io);
  refreshGoalData();
  refreshPlayerData();
  initLiveChat(io, sharedData.config.youtubeLivestreamID);
  processTTSQueue(io);
}

function saveSettings() {
  var config = {
    subscriberGoal: sharedData.config.subscriberGoal,
    youtubeChannelID: sharedData.config.youtubeChannelID,
    youtubeLivestreamID: sharedData.config.youtubeLivestreamID,
    googleAPIKey: sharedData.config.googleAPIKey,
    scoreSaberProfileLink: sharedData.config.scoreSaberProfileLink,
    pusloidAccessToken: sharedData.config.pusloidAccessToken,
    savedSettings: {
      enableBS: sharedData.config.savedSettings.enableBS,
      enableHR: sharedData.config.savedSettings.enableHR,
      enableSC: sharedData.config.savedSettings.enableSC,
      enableLC: sharedData.config.savedSettings.enableLC,
      enableCB: sharedData.config.savedSettings.enableCB,
    },
  };

  try {
    fs.writeFileSync("./config.json", JSON.stringify(config));
  } catch (err) {
    console.log(err);
  }
}

// Start the Express server
setup();
server.listen(PORT, "0.0.0.0", () =>
  console.log(
    `Server started.\n Overlay: http://localhost:${PORT}\n Settings: http://localhost:${PORT}/settings\n`,
  ),
);