import express, { Router } from "express"
import { createRoomSchema } from "@repo/common/types";
import { prisma } from "@repo/db/client";
import { authMiddleware } from "../middleware/middleware.js";

const router: Router = express.Router()
router.use(express.json())

router.post("/create-room", authMiddleware, async (req, res) => {
  const parsed = createRoomSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid room data",
      errors: parsed.error,
    });
  }

  const { slug } = parsed.data;
  const userId = req.userId;

  try {
    const existingRoom = await prisma.room.findUnique({ where: { slug } });
    if (existingRoom) {
      return res.status(409).json({ message: "Room slug already exists" });
    }

    const room = await prisma.room.create({
      data: {
        slug,
        admin: {
          connect: { id: userId },
        },
      },
    });

    return res.status(201).json({
      message: "Room created",
      room: {
        id: room.id,
        slug: room.slug,
        createdAt: room.createdAt,
        adminId: room.adminId,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Error while creating room",
      error: err.message,
    });
  }
});


router.get("/:roomId", authMiddleware, async (req, res) => {
  const roomId = Number(req.params.roomId);
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ msg: "Not authenticated" });
  }
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      return res.status(404).json({ msg: "No such room" });
    }
    return res.status(200).json({
      message: "Room details",
      details: room,
    });
  } catch (e: any) {
    return res.status(500).json({
      message: "Error fetching room details",
    });
  }
});


router.post("/join-room/:roomId", authMiddleware, async (req, res) => {
  const roomId = Number(req.params.roomId);
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ msg: "Not authenticated" });
  }
  try{
    const room = await prisma.room.findUnique({
        where: { id: roomId },
    });

    if (!room) {
        return res.status(404).json({ msg: "No such room" });
    }
    await prisma.roomMember.upsert({
        where: { userId_roomId: { userId, roomId } },
        update: {},
        create: { userId, roomId },
    });

    return res.status(201).json({ message: "Room joined" });
  }catch(e: any){
    return res.status(404).json({ message: "Error joining room" });
  }  
});


router.delete("/leave-room/:roomId", authMiddleware, async (req, res) => {
  const roomId = Number(req.params.roomId);
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ msg: "Not authenticated" });
  }

  try {
    const room = await prisma.room.findUnique({
        where: { id: roomId },
    });

    if (!room) {
        return res.status(404).json({ msg: "No such room" });
    }
    await prisma.roomMember.delete({
      where: { userId_roomId: { userId, roomId } },
    });
    return res.status(200).json({ message: "Room left" });
  } catch (e: any) {
    return res.status(404).json({ message: "Not a member of this room" });
  }
});

router.get("/:roomId/messages", authMiddleware, async(req, res) => {
    const roomId = Number(req.params.roomId);
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ msg: "Not authenticated" });
    }
    try{
        const room = await prisma.room.findUnique({
            where: { id: roomId },
        });
        if (!room) {
            return res.status(404).json({ msg: "No such room" });
        }
        const messages = await prisma.chat.findMany({
            where: {
                room_id: roomId,
                user_id: userId
            },
            orderBy: {
                id: 'desc'
            }
        })
        return res.status(200).json({
            messages
        })
    } catch(e: any){
        return res.status(404).json({ message: "Error fetching messages" });
    }
})

export { router as roomRouter }