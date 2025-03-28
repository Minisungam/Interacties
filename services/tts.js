import sharedData from "../entities/data.js";
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// TTS Function
async function getTTS(message, io) { // Add io parameter
  const requestBody = {
    input: { text: message },
    voice: {
      name: "en-US-Chirp3-HD-Charon",
      languageCode: "en-US",
      ssmlGender: "FEMALE",
    },
    audioConfig: { audioEncoding: "MP3" },
  };

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${sharedData.config.googleAPIKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    const data = await response.json();
    
    const ttsDir = path.join(process.cwd(), 'public', 'tts');
    if (!fs.existsSync(ttsDir)) {
      fs.mkdirSync(ttsDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tts-${timestamp}.mp3`;
    const filePath = path.join(ttsDir, filename);
    const relativeFilePath = path.join('tts', filename);
    fs.writeFileSync(filePath, Buffer.from(data.audioContent, 'base64'));
    
    // Add the new file path to the recent list
    sharedData.recentTTSFiles.push({ path: relativeFilePath, message: message });

    // Limit the number of saved files to 3
    const maxFiles = 3;
    if (sharedData.recentTTSFiles.length > maxFiles) {
      const oldestFile = sharedData.recentTTSFiles.shift();
      const oldestFilePath = path.join(ttsDir, path.basename(oldestFile.path));
      try {
        fs.unlinkSync(oldestFilePath);
        console.log(`Deleted oldest TTS file: ${oldestFilePath}`);
      } catch (unlinkError) {
        console.error(`Error deleting old TTS file ${oldestFilePath}:`, unlinkError);
      }
    }

    // Emit update to settings clients
    if (io) {
      io.emit('recentTTSUpdate', sharedData.recentTTSFiles);
    }

    console.log(`Saved TTS MP3 to: ${filePath}`);
    return data.audioContent;
  } catch (error) {
    console.error("Error in getTTS:", error);
    return false;
  }
}

async function processTTSQueue(io) {
  while (true) {
    if (!sharedData.ttsQueue.isEmpty() && !sharedData.ttsPlaying && !sharedData.ttsPaused) {
      console.log("TTS queue not empty, sending next message.");
      var chat = sharedData.ttsQueue.dequeue();
      let tts = await getTTS(chat, io); // Pass io here
      if (tts) {
        // Include recent files in the ttsReady event
        io.emit("ttsReady", {
          chat: chat,
          mp3: tts,
          recentFiles: sharedData.recentTTSFiles // Add recent files here
        }, { binary: true });
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
