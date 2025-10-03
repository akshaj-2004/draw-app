import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (socket) => {
  console.log("Client connected");
  socket.send("hi");
  socket.on("message", (data) => {
    console.log("Received:", data.toString()); 
  });
});
