import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type RegisterInput = z.infer<typeof registerSchema>

export const createPollSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  options: z.array(z.string().min(1, "Option cannot be empty")).min(2, "At least 2 options required"),
  config: z.object({
    maxVotes: z.number().optional(),
    votesPerUser: z.number().min(1, "Votes per user must be at least 1").default(1),
    requireAuth: z.boolean().default(false),
    ipLimit: z.number().min(1, "IP limit must be at least 1").default(1),
    deadline: z.date().optional(),
    captchaEnabled: z.boolean().default(false),
    showVoters: z.boolean().default(false),
  }).optional(),
})

export type CreatePollInput = z.infer<typeof createPollSchema>

export const castVoteSchema = z.object({
  optionId: z.string().min(1, "Option ID required"),
})

export type CastVoteInput = z.infer<typeof castVoteSchema>
