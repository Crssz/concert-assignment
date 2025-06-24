"use server";

import { redirect } from "next/navigation";
import { 
  loginUser, 
  registerUser, 
  createSession, 
  destroySession, 
  getSession,
  LoginRequest,
  RegisterRequest 
} from "@/lib/auth-session";

export async function loginAction(data: LoginRequest) {
  try {
    const response = await loginUser(data);
    await createSession(response.user, response.accessToken);
    return { success: true, user: response.user };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Login failed" 
    };
  }
}

export async function registerAction(data: RegisterRequest) {
  try {
    const response = await registerUser(data);
    await createSession(response.user, response.accessToken);
    return { success: true, user: response.user };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Registration failed" 
    };
  }
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function getSessionData() {
  const session = await getSession();
  return {
    user: session.user || null,
    isLoggedIn: session.isLoggedIn,
  };
} 