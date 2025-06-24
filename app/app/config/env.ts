import { z } from "zod/v4";

    
export const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
  SESSION_SECRET: z.string().min(32).optional(),
});

export type Env = z.infer<typeof env>;

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
});