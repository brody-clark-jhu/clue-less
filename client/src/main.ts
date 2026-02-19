import './style.css'
const heading = document.querySelector('h1');
if (heading) {
    heading.textContent = 'Hello TypeScript App!';
}
const socket = new WebSocket('ws://clue-less-ip/ws');

socket.onopen = () => {
    console.log("Connected to the game server!");
    socket.send("Hello from the Frontend!");
};

socket.onmessage = (event) => {
    console.log("Server says:", event.data);
};

socket.onerror = (error) => {
    console.error("WebSocket Error:", error);
};
// const canvas = document.getElementById("game-board")!;
// interface BoardNode {
//   id: string;
//   x: number;
//   y: number;
//   radius: number; // or width/height
//   neighbors: string[];
// }
// function findNodeAt(x:number, y:number){
//  return BoardNode;
// }
// function sendMoveRequest(id: number){
// }
// canvas.addEventListener("click", (e) => {
//   const rect = canvas.getBoundingClientRect();
//   const x = e.clientX - rect.left;
//   const y = e.clientY - rect.top;
//   const node = findNodeAt(x, y);
//   if (!node) return;
//   sendMoveRequest(node.id);
// });