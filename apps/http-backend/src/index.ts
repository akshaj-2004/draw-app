import { RoomSchema, UserSchema } from "@repo/common/types";
import { prisma } from "@repo/db/client";
import express from "express";
import bcrypt from "bcrypt";
import { JWT_SECRET } from "@repo/backend-common/config";
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";


const app = express();
app.use(express.json());

app.get("", (req, res) => {
  res.json({
    msg: "app started",
  });
});

app.post("/signup", async (req, res) => {
  const { email, password, name, photo } = req.body;
  const result = UserSchema.safeParse({
    email,
    password,
    name,
    photo,
  });

  if (!result.success) {
    return res.status(400).json({
      msg: "Invalid input",
      errors: result.error,
    });
  }

  const val = result.data;

  try {
    const hashedPassword = await bcrypt.hash(val.password, 5);
    const user = await prisma.user.create({
      data: {
        email: val.email,
        password: hashedPassword,
        name: val.name,
        photo: val.photo,
      },
    });
    res.status(201).json({
      msg: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        photo: user.photo,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.post("/signin", async (req, res) => {

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user.id},
      JWT_SECRET
    );

    return res.json({
      msg: "Signin successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        photo: user.photo,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.post("/room", middleware, async (req, res) => {
  const { slug } = req.body;
  //@ts-ignore
  const userId = req.userId;

  const result = RoomSchema.safeParse({
    slug,
    adminId: userId,
  });

  if (!result.success) {
    return res.status(400).json({
      msg: "Invalid input",
      errors: result.error.format(),
    });
  }

  try {
    const room = await prisma.room.create({
      data: {
        slug: result.data.slug,
        adminId: result.data.adminId,
      },
    });

    res.status(201).json({
      message: "Room created successfully",
      roomId: room.id,
      slug: room.slug,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});


app.listen(3001, () => {
  console.log("app started");
});
