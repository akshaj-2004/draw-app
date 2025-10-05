import { WebSocketServer, WebSocket, OPEN } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prisma } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

const users = new Map<number, WebSocket>();   //map of userid and websocket
const room = new Map<number, Set<number>>(); //map of roomid and set of userid

function sendJSON(ws: WebSocket, data: object) {
    if (ws.readyState === OPEN) {
        ws.send(JSON.stringify(data));
    }
}

wss.on("connection", (socket, request) => {
    const url = request.url;
    if (!url) {
        socket.close();
        return;
    }
    const queryParams = new URLSearchParams(url.split("?")[1]);
    const token = queryParams.get("token");

    if (!token) {
        socket.close();
        return;
    }
    let decoded: JwtPayload;
    try {
        decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (err) {
        socket.close();
        return;
    }
    if (!decoded?.userId) {
        socket.close();
        return;
    }
    const userId = decoded.userId;
    if(users.has(userId)){
        users.get(userId)?.close();
        users.delete(userId)
    }
    users.set(userId, socket);

    socket.on("message", async (raw) => {
        let data: any
        try{
            data = JSON.parse(raw.toString());
        } catch{
            return;
        }
        if(data.type === "join_room"){
            const roomId = data.roomId
            if(!roomId) return;
            const membership = prisma.roomMember.findUnique({
                where: {userId_roomId: {userId, roomId}}
            })
            if (!membership) {
                sendJSON(socket, { type: "error", message: "Not a member of this room" });
                return;
            }
            if(!room.has(roomId)){
                room.set(roomId, new Set());
            }
            room.get(roomId)?.add(userId)
            sendJSON(socket, { type: "joined_room", roomId });
        } else if(data.type === "leave_room"){
            const roomId = data.roomId
            if(!roomId) return;
            if(room.has(roomId)){
                room.get(roomId)?.delete(userId)
            }
            sendJSON(socket, { type: "left_room", roomId });
        } else if(data.type === "chat"){
            const roomId = data.roomId;
            const message = data.message;
            if(!room.get(roomId)?.has(userId)){
                sendJSON(socket, { type: "error", message: "You are not in this room" });
                return;
            }
            room.get(roomId)?.forEach((uid) => {
                const ws = users.get(uid);
                if(ws && ws.readyState === OPEN){
                    sendJSON(ws, { type: "chat", roomId, from: userId, message });
                }
            })
            try{
                await prisma.chat.create({
                    data: {
                        room_id: roomId,
                        message,
                        user_id: userId
                    }
                })
            }catch(e: any){
                console.error("DB error:", e);
            }
        }
    })    
});
