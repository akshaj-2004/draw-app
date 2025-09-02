import { UserSchema } from "@repo/common/types";
import { prisma } from "@repo/db/client";
import express from "express";
import bcrypt from "bcrypt";

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

app.listen(3001, () => {
  console.log("app started");
});
