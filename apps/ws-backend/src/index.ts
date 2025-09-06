import { JWT_SECRET } from "@repo/backend-common/config";
import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from 'jsonwebtoken'

const ws = new WebSocketServer({ port: 8080 });

ws.on("connection", (socket, req) => {
  const token = req.headers["authorization"];
  if (!token) {
    socket.close();
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !(decoded as JwtPayload).userId) {
      socket.close();
      return;
    }
    socket.on("message", (event) => {
      socket.send('hi')
    })
  } catch (err: any) {
    socket.close();

  }

})