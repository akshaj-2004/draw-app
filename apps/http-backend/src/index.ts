import { createRoomSchema, createUserSchema, signInSchema } from "@repo/common/types";
import { prisma } from "@repo/db/client";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { authMiddleware } from "./middleware.js";

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid signup data",
      errors: parsed.error,
    });
  }

  const { email, password, name, photo } = parsed.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, photo },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Error while signing up",
      error: err.message,
    });
  }
});

app.post("/signin", async (req, res) => {
  const parsed = signInSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid signin data",
      errors: parsed.error,
    });
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Incorrect credentials" });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ message: "Incorrect credentials" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    return res.status(200).json({
      message: "Signin successful",
      token,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Error while signing in",
      error: err.message,
    });
  }
});

app.post("/create-room", authMiddleware, async (req, res) => {
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
            connect: { id: userId }
            }
        }
    });


    return res.status(201).json({
      message: "Room created successfully",
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

app.listen(3001, () => {
  console.log("Server started on port 3001");
});
