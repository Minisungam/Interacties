import { Masterchat, stringify } from "@stu43005/masterchat";
import sharedData from "../entities/data.js";

// Initialize the YouTube live chat module
async function initLiveChat(io) {
  if (sharedData.config.enableLiveChat) {
    // Set initialization timestamp to track new vs. old messages
    const initTimestamp = Date.now() + 3000; // Now + 3 seconds
    sharedData.liveChatInitTime = initTimestamp;
    
    const mc = await Masterchat.init(sharedData.config.youtubeLivestreamID);

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
        timestamp: timestamp
      };
      
      sharedData.liveChatHistory.push(chatMessage);
      io.emit("liveChat", chatMessage);
      
      // Only add to TTS queue if it's a new message (received after initialization)
      if (timestamp >= sharedData.liveChatInitTime) {
        sharedData.ttsQueue.enqueue(
          chat.authorName + " said, " + stringify(chat.message),
        );
        
        // Emit TTS status update to all clients
        io.emit("ttsStatus", {
          currentlyPlaying: sharedData.ttsPlaying,
          isPaused: sharedData.ttsPaused,
          queueSize: sharedData.ttsQueue.size(),
          upcomingMessages: sharedData.ttsQueue.items
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
    });

    // Handle errors
    mc.on("error", (err) => {
      console.log("Masterchat Error: " + err.code);
      // "disabled" => Live chat is disabled
      // "membersOnly" => No permission (members-only)
      // "private" => No permission (private video)
      // "unavailable" => Deleted OR wrong video id
      // "unarchived" => Live stream recording is not available
      // "denied" => Access denied (429)
      // "invalid" => Invalid request
    });

    // Handle end event
    mc.on("end", () => {
      console.log("Live stream has ended");
    });

    // Start polling live chat API
    mc.listen();
  }
}

export { initLiveChat };
