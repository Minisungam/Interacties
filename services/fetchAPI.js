import fetch from "node-fetch";
import sharedData from "../entities/data.js";

// Refresh goal data from Youtube
async function refreshGoalData() {
  try {
    await fetch(
      "https://www.googleapis.com/youtube/v3/channels?id=" +
        sharedData.config.youtubeChannelID +
        "&key=" +
        sharedData.config.googleAPIKey +
        "&part=statistics",
      { method: "GET" },
    )
      .then((res) => res.json())
      .then((json) => {
        sharedData.goalData.current_amount = Number(
          json.items[0].statistics.subscriberCount,
        );
      });
  } catch (error) {
    console.log("Error refreshing goal data: " + error);
  }
}

// Refresh BeatSaver player information
async function refreshPlayerData() {
  try {
    await fetch(sharedData.config.scoreSaberProfileLink, { method: "GET" })
      .then((res) => res.json())
      .then((json) => {
        sharedData.playerData = json;
      });
  } catch (error) {
    console.log("Error refreshing player data: " + error);
  }
}

export { refreshGoalData, refreshPlayerData };
