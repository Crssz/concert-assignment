import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, defaultSession, sessionOptions } from "./session";
import { env } from "@/app/config/env";
import { handleApiResponse } from "./api-error-handler";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  accessToken: string;
}

export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  
  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn;
  }
  
  return session;
}

export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${env.APP_API}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  await handleApiResponse(response);

  return response.json();
}

export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${env.APP_API}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  await handleApiResponse(response);

  return response.json();
}

export async function createSession(user: AuthResponse["user"], accessToken: string) {
  const session = await getSession();
  
  session.user = user;
  session.accessToken = accessToken;
  session.isLoggedIn = true;
  
  await session.save();
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
} 