"use server";

import { getSession } from "@/lib/auth-session";
import { env } from "../config/env";
import { revalidatePath } from "next/cache";
import { handleApiResponse, UnauthorizedError } from "@/lib/api-error-handler";

export interface CreateConcertData {
  name: string;
  description: string;
  totalSeats: number;
}

export async function createConcert(data: CreateConcertData) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accessToken) {
    throw new UnauthorizedError("Not authenticated");
  }

  const response = await fetch(`${env.APP_API}/concerts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(data),
  });

  await handleApiResponse(response);

  return response.json();
}

export async function deleteConcert(concertId: string) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accessToken) {
    throw new UnauthorizedError("Not authenticated");
  }

  const response = await fetch(`${env.APP_API}/concerts/${concertId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${session.accessToken}`,
    },
  });

  await handleApiResponse(response);

  revalidatePath("/admin");
  revalidatePath("/user");
  revalidatePath("/");

  return response.json() as Promise<{ message: string }>;
}   