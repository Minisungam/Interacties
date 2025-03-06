import Queue from "./queue.js";

const sharedData = {
  playerData: {},
  goalData: { current_amount: 0, target_amount: 0 },
  heartRate: 0,
  liveChatHistory: [],
  liveChatInitTime: new Date(),
  ttsQueue: new Queue(),
  ttsPlaying: false,
  ttsPaused: false,
  config: {},
};

export default sharedData;
