"use server";

import { getSession } from "@/lib/auth-session";
import { env } from "../config/env";
import { revalidatePath } from "next/cache";

export interface CreateConcertData {
  name: string;
  description: string;
  totalSeats: number;
}

export async function createConcert(data: CreateConcertData) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accessToken) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/concerts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create concert");
  }

  return response.json();
}

export async function deleteConcert(concertId: string) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accessToken) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/concerts/${concertId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${session.accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete concert");
  }

  revalidatePath("/admin");
  revalidatePath("/user");
  revalidatePath("/");

  return response.json() as Promise<{ message: string }>;
}   