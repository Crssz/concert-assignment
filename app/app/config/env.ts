import { z } from "zod/v4";

    
export const envSchema = z.object({
  APP_API: z.url(),
  SESSION_SECRET: z.string().min(32).optional(),
});

export type Env = z.infer<typeof env>;

export const env = envSchema.parse({
  APP_API: process.env.APP_API,
  SESSION_SECRET: process.env.SESSION_SECRET,
});