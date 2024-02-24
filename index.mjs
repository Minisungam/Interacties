// Christopher Magnus 2023
// CC BY-NC-ND 4.0

// Imports
import sharedData from './data.js';
import { initHeartRate, initLiveChat, refreshGoalData, refreshPlayerData } from "./services.js";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";
import textToSpeech from '@google-cloud/text-to-speech';

const appVersion = '1.0.0';
const asciiArt = `
  _____       _                      _   _           
 |_   _|     | |                    | | (_)          
   | |  _ __ | |_ ___ _ __ __ _  ___| |_ _  ___  ___ 
   | | | '_ \\| __/ _ \\ '__/ _' |/ __| __| |/ _ \\/ __|
  _| |_| | | | ||  __/ | | (_| | (__| |_| |  __/\\__ \\
 |_____|_| |_|\\__\\___|_|  \\__,_|\\___|\\__|_|\\___||___/
                                                     
Version: ${appVersion}
`;

process.env.GOOGLE_APPLICATION_CREDENTIALS = "google_auth.json";

// Server Setup
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 5500;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

// Read config file
sharedData.config = JSON.parse(fs.readFileSync("./config.json", "UTF-8"));
sharedData.goalData.target_amount = sharedData.config.subscriberGoal;

// TTS Function
async function getTTS(message) {
    const ttsClient = new textToSpeech.TextToSpeechClient();

    // Construct the request
    const request = {
        input: { text: message },
        // Select the language and SSML voice gender (optional)
        voice: { name: 'en-US-Studio-O', languageCode: 'en-US', ssmlGender: 'FEMALE' },
        // Select the type of audio encoding
        audioConfig: { audioEncoding: 'MP3' },
    };

    try {
        // Performs the text-to-speech request
        const [response] = await ttsClient.synthesizeSpeech(request);
        return response.audioContent;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function processTTSQueue() {
    while (true) {
        if (!sharedData.ttsQueue.isEmpty() && !sharedData.ttsPlaying) {
            console.log("TTS queue not empty, sending next message.");
            var chat = sharedData.ttsQueue.dequeue();
            let tts = await getTTS(chat);
            if (tts) {
                io.emit("ttsReady", { chat: chat, mp3: tts }, { binary: true });
                sharedData.ttsPlaying = true;
            } else {
                console.log("TTS failed, skipping.");
            }
        }
        await sleep(1000);
    }
}

// Express GET requests
app.get("/", (req, res) => {
    res.render("index");
});

// Express GET request sending the user to a settings page
app.get("/settings", (req, res) => {
    res.render("settings");
});

io.on('connection', (socket) => {
    const clientData = JSON.parse(socket.handshake.query.data);

    console.log(`Socket.IO: ${clientData.client} user has connected.`);
    if (clientData.client == "settings") {
        socket.emit('initSettingsData', {
            "savedSettings": sharedData.config.savedSettings,
            "goalData": sharedData.goalData,
            "youtubeChannelID": sharedData.config.youtubeChannelID,
            "youtubeLivestreamID": sharedData.config.youtubeLivestreamID,
            "youtubeAPIKey": sharedData.config.youtubeAPIKey,
            "scoreSaberProfileLink": sharedData.config.scoreSaberProfileLink,
            "pusloidWidgetLink": sharedData.config.pusloidWidgetLink
        });
    }
    else if (clientData.client == "overlay") {
        socket.emit('initData', {
            "playerData": sharedData.playerData,
            "goalData": sharedData.goalData,
            "heartRate": sharedData.heartRate,
            "config": sharedData.config.savedSettings,
        });
        sharedData.liveChatHistory.forEach(element => {
            socket.emit("liveChat", element);
        });
    }

    socket.on('updateOverlayElements', (updatedData) => {
        console.log("Overlay Elements updated.");

        sharedData.config.savedSettings.enableBS = Boolean(updatedData.enableBS);
        sharedData.config.savedSettings.enableHR = Boolean(updatedData.enableHR);
        sharedData.config.savedSettings.enableSC = Boolean(updatedData.enableSC);
        sharedData.config.savedSettings.enableLC = Boolean(updatedData.enableLC);

        io.emit('editOverlayElements', updatedData);

        saveSettings();
    });

    socket.on('updateLivestreamSettings', (updatedData) => {
        console.log("Livestream Settings updated.");

        if (sharedData.subscriberGoal != Number(updatedData.subscriberGoal)) {
            io.emit("goalDataUpdate", { "current_amount": sharedData.goalData.current_amount, "target_amount": Number(updatedData.subscriberGoal) });
        }
        sharedData.subscriberGoal = Number(updatedData.subscriberGoal);
        sharedData.youtubeChannelID = updatedData.youtubeChannelID;
        sharedData.youtubeLivestreamID = updatedData.youtubeLivestreamID;

        saveSettings();
    });

    socket.on('updateGeneralSettings', (updatedData) => {
        console.log("General Settings updated.");

        sharedData.youtubeAPIKey = updatedData.youtubeAPIKey;
        sharedData.scoreSaberProfileLink = updatedData.scoreSaberProfileLink;
        sharedData.pusloidWidgetLink = updatedData.pusloidWidgetLink;

        saveSettings();
    });

    socket.on('ttsEnded', () => {
        console.log("TTS ended.")
        sharedData.ttsPlaying = false;
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

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initial setup function
function setup() {
    console.log(asciiArt);
    initHeartRate(io);
    refreshGoalData();
    refreshPlayerData();
    initLiveChat(io);
    processTTSQueue();
};

function saveSettings() {
    var config = {
        "enableHeartRate": sharedData.config.enableHeartRate,
        "enableBeatSaber": sharedData.config.enableBeatSaber,
        "enableLiveChat": sharedData.config.enableLiveChat,
        "enableSubscriberCount": sharedData.config.enableSubscriberCount,
        "subscriberGoal": sharedData.config.subscriberGoal,
        "youtubeChannelID": sharedData.config.youtubeChannelID,
        "youtubeLivestreamID": sharedData.config.youtubeLivestreamID,
        "youtubeAPIKey": sharedData.config.youtubeAPIKey,
        "scoreSaberProfileLink": sharedData.config.scoreSaberProfileLink,
        "pusloidWidgetLink": sharedData.config.pusloidWidgetLink,
        "savedSettings": {
            "enableBS": sharedData.config.savedSettings.enableBS,
            "enableHR": sharedData.config.savedSettings.enableHR,
            "enableSC": sharedData.config.savedSettings.enableSC,
            "enableLC": sharedData.config.savedSettings.enableLC
        }
    };

    try {
        fs.writeFileSync("./config.json", JSON.stringify(config));
        console.log("Settings saved to disk.");
    } catch (err) {
        console.log(err);
    }
}

// Start the Express server
setup();
server.listen(PORT, '0.0.0.0', () => console.log(`Server started.\n Overlay: http://localhost:${PORT}\n Settings: http://localhost:${PORT}/settings\n`));