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
import { ConflictError, UnauthorizedError } from "@/lib/api-error-handler";

export async function loginAction(data: LoginRequest) {
  try {
    const response = await loginUser(data);
    await createSession(response.user, response.accessToken);
    return { success: true, user: response.user };
  } catch (error) {
    let errorMessage = "Login failed";
    
    if (error instanceof UnauthorizedError) {
      errorMessage = "Invalid email or password";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
}

export async function registerAction(data: RegisterRequest) {
  try {
    const response = await registerUser(data);
    await createSession(response.user, response.accessToken);
    return { success: true, user: response.user };
  } catch (error) {
    let errorMessage = "Registration failed";
    
    if (error instanceof ConflictError) {
      errorMessage = "An account with this email already exists";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      error: errorMessage
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