import { z } from "zod"

export const createUserSchema = z.object({
    email: z.email(),
    password: z.string(),
    name: z.string().min(1),
    photo: z.url().optional()
})

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createRoomSchema = z.object({
    slug: z.string().min(3).max(50).regex(/^[a-z0-9-_]+$/i)
})

export const createChatSchema = z.object({
    room_id: z.number().int().positive(),
    user_id: z.number().int().positive(),
    message: z.string().max(2000),
})

export const idSchema = z.object({
    id: z.number().int().positive()
})