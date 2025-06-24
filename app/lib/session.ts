import { SessionOptions } from "iron-session";
import { env } from "@/app/config/env";

export interface SessionData {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  accessToken?: string;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password:
    env.SESSION_SECRET ||
    "complex_password_at_least_32_characters_long_default_key_12345",
  cookieName: "concert-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
  },
};
