import { WebSocketServer, WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

const wss = new WebSocketServer({ port: 8080 });

interface User {
    userId: number;
    ws: WebSocket;
    rooms: string[];
}

const users: User[] = [];

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

    const existingIndex = users.findIndex(u => u.userId === userId);
    if (existingIndex !== -1) {
        users[existingIndex]?.ws.close();
        users.splice(existingIndex, 1);
    }

    const user: User = { userId, ws: socket, rooms: [] };
    users.push(user);

    socket.on("message", (data) => {
        let parsed_data: any;
        try {
            parsed_data = JSON.parse(data.toString());
        } catch {
            return;
        }

        if (parsed_data.type === "join_room") {
            if (!user.rooms.includes(parsed_data.roomId)) {
                user.rooms.push(parsed_data.roomId);
            }
        }

        else if (parsed_data.type === "leave_room") {
            user.rooms = user.rooms.filter(r => r !== parsed_data.roomId);
        }

        else if (parsed_data.type === "chat") {
            const roomId = parsed_data.roomId;
            const msg = parsed_data.message;

            users.forEach((x) => {
                if (x.rooms.includes(roomId)) {
                    x.ws.send(
                        JSON.stringify({
                            type: "chat",
                            message: msg,
                            roomId,
                            from: userId,
                        })
                    );
                }
            });
        }
    });

    socket.on("close", () => {
        const index = users.findIndex(u => u.ws === socket);
        if (index !== -1) {
            users.splice(index, 1);
        }
    });
});
