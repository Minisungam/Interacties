import textToSpeech from "@google-cloud/text-to-speech";
import sharedData from "../entities/data.js";

// TTS Function
async function getTTS(message) {
  const ttsClient = new textToSpeech.TextToSpeechClient();

  // Construct the request
  const request = {
    input: { text: message },
    // Select the language and SSML voice gender (optional)
    voice: {
      name: "en-US-Studio-O",
      languageCode: "en-US",
      ssmlGender: "FEMALE",
    },
    // Select the type of audio encoding
    audioConfig: { audioEncoding: "MP3" },
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

async function processTTSQueue(io) {
  while (true) {
    if (!sharedData.ttsQueue.isEmpty() && !sharedData.ttsPlaying && !sharedData.ttsPaused) {
      console.log("TTS queue not empty, sending next message.");
      var chat = sharedData.ttsQueue.dequeue();
      let tts = await getTTS(chat);
      if (tts) {
        io.emit("ttsReady", { chat: chat, mp3: tts }, { binary: true });
        sharedData.ttsPlaying = true;
        
        // Send updated TTS status to all clients
        io.emit("ttsStatus", {
          currentlyPlaying: sharedData.ttsPlaying,
          isPaused: sharedData.ttsPaused,
          queueSize: sharedData.ttsQueue.size(),
          upcomingMessages: sharedData.ttsQueue.items
        });
      } else {
        console.log("TTS failed, skipping.");
      }
    }
    await sleep(1000);
  }
}

// Function to pause TTS playback
function pauseTTS(io) {
  // Allow pausing even when nothing is playing
  if (!sharedData.ttsPaused) {
    console.log("TTS paused.");
    sharedData.ttsPaused = true;
    
    // Only emit pause event if something is playing
    if (sharedData.ttsPlaying) {
      io.emit("ttsPause");
    }
    
    // Send updated TTS status to all clients
    io.emit("ttsStatus", {
      currentlyPlaying: sharedData.ttsPlaying,
      isPaused: sharedData.ttsPaused,
      queueSize: sharedData.ttsQueue.size(),
      upcomingMessages: sharedData.ttsQueue.items
    });
    
    return true;
  }
  return false;
}

// Function to resume TTS playback
function resumeTTS(io) {
  if (sharedData.ttsPaused) {
    console.log("TTS resumed.");
    sharedData.ttsPaused = false;
    io.emit("ttsResume");
    
    // Send updated TTS status to all clients
    io.emit("ttsStatus", {
      currentlyPlaying: sharedData.ttsPlaying,
      isPaused: sharedData.ttsPaused,
      queueSize: sharedData.ttsQueue.size(),
      upcomingMessages: sharedData.ttsQueue.items
    });
    
    return true;
  }
  return false;
}

// Function to skip the current TTS message
function skipTTS(io) {
  if (sharedData.ttsPlaying) {
    console.log("TTS skipped.");
    io.emit("ttsSkip");
    sharedData.ttsPlaying = false;
    
    // Send updated TTS status to all clients
    io.emit("ttsStatus", {
      currentlyPlaying: sharedData.ttsPlaying,
      isPaused: sharedData.ttsPaused,
      queueSize: sharedData.ttsQueue.size(),
      upcomingMessages: sharedData.ttsQueue.items
    });
    
    return true;
  }
  return false;
}

// Function to get upcoming TTS messages
function getUpcomingTTS() {
  return {
    currentlyPlaying: sharedData.ttsPlaying,
    isPaused: sharedData.ttsPaused,
    queueSize: sharedData.ttsQueue.size(),
    upcomingMessages: sharedData.ttsQueue.items
  };
}

// Function to remove a message from the queue
function removeFromQueue(index) {
  if (index >= 0 && index < sharedData.ttsQueue.size()) {
    // Remove the message at the specified index
    sharedData.ttsQueue.items.splice(index, 1);
    return true;
  }
  return false;
}

// Sleep function
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { getTTS, processTTSQueue, pauseTTS, resumeTTS, skipTTS, getUpcomingTTS, removeFromQueue };
