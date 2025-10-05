import { createUserSchema, signInSchema } from "@repo/common/types";
import { prisma } from "@repo/db/client";
import express, { Router } from "express"
import bcrypt from "bcrypt";
import { JWT_SECRET } from "@repo/backend-common/config";
import jwt from "jsonwebtoken";

const router: Router = express.Router()
router.use(express.json())


router.post("/signup", async (req, res) => {
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
      message: "User created",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Error while signing up",
      error: err.message,
    });
  }
});


router.post("/signin", async (req, res) => {
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
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
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

export { router as authRouter };
