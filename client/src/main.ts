import './style.css'
const heading = document.querySelector('h1');
if (heading) {
    heading.textContent = 'Hello TypeScript App!';
}

// WebSocket connection retry 
let socket: WebSocket;
let retryCount = 0;
const MAX_RETRIES = 10;
const BASE_DELAY_MILLISECONDS = 500;

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
        socket = new WebSocket(wsUrl);
    } catch (error) {
        console.error("Failed to create WebSocket:", error);
        scheduleReconnect();
        return;
    }

    socket.onopen = () => {
        console.log("Connected to the game server.");
        retryCount = 0;
        socket.send(JSON.stringify({"message":"Hello on open"}));
    };

    socket.onmessage = (event) => {
        console.log("Server says:", event.data);
    };

    socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
    };

    socket.onclose = () => {
        console.warn("WebSocket connection closed");
        scheduleReconnect();
    };
}

function scheduleReconnect() {
    if (retryCount >= MAX_RETRIES) {
        console.error("Max retries reached. Could not connect to server.");
        return;
    }

    const delay = BASE_DELAY_MILLISECONDS * Math.pow(2, retryCount);
    console.log(`Retrying connection in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
    retryCount++;
    setTimeout(connectWebSocket, delay);
}

// Initial connection attempt
connectWebSocket();

const button = document.getElementById("request")!;
button.onclick = () =>{
  if (socket.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket not open, state=", socket.readyState);
    return;
  }
  socket.send(JSON.stringify({"message":"hello from client"}));
}
