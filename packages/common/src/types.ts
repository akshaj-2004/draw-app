import { z } from "zod";

export const UserSchema = z.object({
  id: z.number().int().optional(),
  email: z.string().email(),
  password: z
    .string()
    .min(5)
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  name: z.string().min(1),
  photo: z.string().url().optional(),
});

export const RoomSchema = z.object({
  id: z.number().int().optional(),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  createdAt: z.date().optional(),
  adminId: z.number().int(),
});

export const ChatSchema = z.object({
  id: z.number().int().optional(),
  message: z.string().max(500),
  userId: z.number().int(),
  roomId: z.number().int(),
});
