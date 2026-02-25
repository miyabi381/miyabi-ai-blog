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
  parentCommentId: z.number().int().positive().nullable().optional(),
  content: z.string().min(1).max(2000)
});

export const avatarSchema = z.object({
  avatarUrl: z
    .string()
    .trim()
    .max(1024)
    .refine((value) => value === "" || /^https?:\/\//.test(value), "画像URLはhttp://またはhttps://で始めてください。")
});

export const profileSettingsSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  avatarUrl: z
    .string()
    .trim()
    .max(1024)
    .refine((value) => value === "" || /^https?:\/\//.test(value), "画像URLはhttp://またはhttps://で始めてください。")
});
