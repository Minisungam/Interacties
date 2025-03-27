import sharedData from "../entities/data.js";

const PULSOID_WS_URL = 'wss://dev.pulsoid.net/api/v1/data/real_time';
const RECONNECT_DELAY = 5000;

async function initHeartRate(ioServer) {
  console.log('Initializing heart rate monitor...');
  
  // Validate configuration
  if (!sharedData.config.enableHeartRate) {
    console.log('Heart rate monitoring disabled in config');
    return;
  }

  if (!sharedData.config.pusloidAccessToken) {
    console.error('Missing Pulsoid access token in config');
    return;
  }

  const url = `${PULSOID_WS_URL}?access_token=${sharedData.config.pusloidAccessToken}&response_mode=legacy_json`;
  let socket;
  let reconnectTimeout;

  function connect() {
    console.log('Connecting to Pulsoid WebSocket...');
    socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('Successfully connected to Pulsoid WebSocket');
      clearTimeout(reconnectTimeout);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.data && message.data.heartRate !== undefined) {
          const heartRate = message.data.heartRate;
          sharedData.heartRate = heartRate.toString();
          ioServer.emit("heartRate", sharedData.heartRate);
        } else {
          console.warn('Received message with unexpected format:', message);
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      socket.close();
    };

    socket.onclose = (event) => {
      console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
      if (event.code !== 1000) {
        console.log(`Reconnecting in ${RECONNECT_DELAY/1000} seconds...`);
        reconnectTimeout = setTimeout(connect, RECONNECT_DELAY);
      }
    };
  }

  connect();

  return () => {
    clearTimeout(reconnectTimeout);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(1000, 'Server shutdown');
    }
  };
}

export { initHeartRate };
