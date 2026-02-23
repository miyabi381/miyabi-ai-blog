import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export const postSchema = z.object({
  title: z.string().min(3).max(120),
  content: z.string().min(10)
});

export const commentSchema = z.object({
  postId: z.number().int().positive(),
  content: z.string().min(1).max(2000)
});

