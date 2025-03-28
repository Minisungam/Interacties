import { Masterchat, stringify } from "@stu43005/masterchat";
import sharedData from "../entities/data.js";

let currentChatInstance = null;

// Initialize or update the YouTube live chat module
async function initLiveChat(io, livestreamID) {
  // Stop existing instance if it's running
  if (currentChatInstance) {
    try {
      await currentChatInstance.stop();
      console.log("Stopped previous live chat instance.");
    } catch (error) {
      console.error("Error stopping previous live chat instance:", error);
      currentChatInstance = null;
    }
    currentChatInstance = null;
  }

  // If no livestreamID is provided, don't proceed
  if (!livestreamID) {
      console.log("No livestream ID provided. Live chat will not start.");
      // Optionally clear chat history and notify clients if needed
      sharedData.liveChatHistory = [];
      io.emit("liveChatCleared"); // Notify overlay to clear chat
      return;
  }

  console.log(`Initializing live chat for stream ID: ${livestreamID}`);

  // Set initialization timestamp to track new vs. old messages
  const initTimestamp = Date.now() + 3000;
  sharedData.liveChatInitTime = initTimestamp;

  try {
    const mc = await Masterchat.init(livestreamID);
    currentChatInstance = mc; // Store the new instance

    mc.on("chat", (chat) => {
      console.log(chat.authorName + ": " + stringify(chat.message));
      if (stringify(chat.message).substring(0, 1) == "!") {
        // TODO: Handle commands
        console.log("Command detected, ignoring.");
        return;
      }

      if (/\bhttps?:\/\/\S+/i.test(stringify(chat.message))) {
        console.log("URL detected, ignoring.");
        return;
      }

      const timestamp = Date.now();
      const chatMessage = {
        authorName: chat.authorName,
        message: stringify(chat.message),
        timestamp: timestamp,
      };

      sharedData.liveChatHistory.push(chatMessage);
      io.emit("liveChat", chatMessage);

      // Only add to TTS queue if it's a new message (received after initialization)
      if (timestamp >= sharedData.liveChatInitTime) {
        sharedData.ttsQueue.enqueue(
          chat.authorName + " said: " + stringify(chat.message),
        );

        // Emit TTS status update to all clients
        io.emit("ttsStatus", {
          currentlyPlaying: sharedData.ttsPlaying,
          isPaused: sharedData.ttsPaused,
          queueSize: sharedData.ttsQueue.size(),
          upcomingMessages: sharedData.ttsQueue.items,
        });
      }
    });

    // Listen for any events
    //   See below for a list of available action types
    mc.on("actions", (actions) => {
      const chats = actions.filter(
        (action) => action.type === "addChatItemAction",
      );
      const superChats = actions.filter(
        (action) => action.type === "addSuperChatItemAction",
      );
      const superStickers = actions.filter(
        (action) => action.type === "addSuperStickerItemAction",
      );
      // TODO: Handle superchats/stickers if needed
    });

    // Handle errors
    mc.on("error", (err) => {
      if (err && err.code) {
          console.error(`Masterchat Error Code: ${err.code}`);
      } else {
          console.error("Masterchat Error (Unknown Code):", err); // Log the full error if code is missing
      }
      // Handle specific error codes
      switch (err.code) {
          case "disabled":
              console.error("Live chat is disabled for this stream.");
              break;
          case "membersOnly":
              console.error("Live chat is members-only.");
              break;
          case "private":
              console.error("Video is private.");
              break;
          case "unavailable":
              console.error("Video is unavailable (deleted or wrong ID?).");
              break;
          case "unarchived":
              console.error("Live stream recording is not available.");
              break;
          case "denied":
              console.error("Access denied (rate limited?).");
              break;
          case "invalid":
              console.error("Invalid request.");
              break;
          default:
              console.error(`Unhandled Masterchat error code: ${err.code}`);
      }
      // Attempt to stop the instance if it's the one that errored
      if (currentChatInstance === mc) { // Ensure we are referencing the correct instance
          try {
              const stopPromise = currentChatInstance.stop();
              // Check if stop returned a promise-like object before using .catch
              if (stopPromise && typeof stopPromise.catch === 'function') {
                  stopPromise.catch(stopErr => console.error("Error stopping instance after error:", stopErr));
              }
          } catch (syncStopError) { // Catch potential synchronous errors during stop
              console.error("Synchronous error calling stop() after masterchat error:", syncStopError);
          } finally {
              currentChatInstance = null; // Clear the instance regardless of stop success/failure
          }
      }
      // Notify clients about the error?
      io.emit("liveChatError", { code: err.code, message: err.message });
    });

    // Handle end event
    mc.on("end", () => {
      console.log("Live stream has ended or polling stopped.");
      if (currentChatInstance === mc) {
          currentChatInstance = null; // Clear the instance if it ended naturally
      }
      // Notify clients?
      io.emit("liveChatEnded");
    });

    // Start polling live chat API
    await mc.listen();
    console.log("Live chat listener started.");

  } catch (error) {
      console.error(`Failed to initialize Masterchat for ${livestreamID}:`, error);
      // Notify clients about the initialization failure?
      io.emit("liveChatError", { code: "initFailed", message: error.message });
      currentChatInstance = null; // Ensure instance is null on failure
  }
}

export { initLiveChat };
