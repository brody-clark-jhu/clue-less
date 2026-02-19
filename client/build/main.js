"use strict";
const heading = document.querySelector('h1');
if (heading) {
    heading.textContent = 'Hello TypeScript App!';
}
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
