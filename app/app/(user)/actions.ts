"use server";

import { getSession } from "@/lib/auth-session";
import { env } from "../config/env";
import { revalidatePath } from "next/cache";

export interface ReservationResult {
  id: string;
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  seatNumber: number;
  createdAt: string;
}

// Reserve a seat for a concert
export async function reserveSeatAction(concertId: string): Promise<ReservationResult> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.accessToken) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/concerts/${concertId}/reserve`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to reserve seat");
  }

  // Revalidate pages that might show updated concert data
  revalidatePath("/user");
  revalidatePath("/");

  return response.json();
}

// Cancel a reservation
export async function cancelReservationAction(concertId: string): Promise<{ message: string }> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.accessToken) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/concerts/${concertId}/reserve`,
    {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to cancel reservation");
  }

  // Revalidate pages that might show updated concert data
  revalidatePath("/user");
  revalidatePath("/");

  return response.json();
}

// Check if user is authenticated
export async function checkAuthenticationAction(): Promise<boolean> {
  try {
    const session = await getSession();
    return session.isLoggedIn && !!session.accessToken;
  } catch {
    return false;
  }
}
