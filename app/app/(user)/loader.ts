"use server";

import { env } from "@/app/config/env";
import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { handleApiResponse, UnauthorizedError } from "@/lib/api-error-handler";

export interface ConcertResponse {
  id: string;
  name: string;
  description: string;
  totalSeats: number;
  availableSeats: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedConcertResponse {
  data: ConcertResponse[];
  meta: PaginationMeta;
}

export interface UserReservationResponse {
  id: string;
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  seatNumber: number;
  createdAt: string;
  concertId: string;
  concertName: string;
}

export interface PaginatedReservationResponse {
  data: UserReservationResponse[];
  meta: PaginationMeta;
}

export interface ConcertDetailResponse extends ConcertResponse {
  reservations: {
    id: string;
    userId: string;
    userEmail: string;
    userFirstName: string;
    userLastName: string;
    seatNumber: number;
    createdAt: string;
  }[];
}

export interface ReservationResult {
  id: string;
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  seatNumber: number;
  createdAt: string;
}

export interface ReservationHistoryResponse {
  id: string;
  concertId: string;
  concertName: string;
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  seatNumber: number;
  action: 'RESERVED' | 'CANCELLED';
  createdAt: string;
}

export interface PaginatedReservationHistoryResponse {
  data: ReservationHistoryResponse[];
  meta: PaginationMeta;
}

// Fetch all concerts (public endpoint)
export async function getAllConcerts(page: number = 1, limit: number = 12): Promise<PaginatedConcertResponse> {
  const response = await fetch(
    `${env.APP_API}/concerts?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  await handleApiResponse(response);

  return response.json();
}

// Fetch user reservations (requires authentication)
export async function getUserReservations(page: number = 1, limit: number = 50): Promise<PaginatedReservationResponse> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.accessToken) {
    throw new UnauthorizedError("Not authenticated");
  }

  const response = await fetch(
    `${env.APP_API}/concerts/my-reservations?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok && response.status === 401) {
    await session.destroy();
    redirect("/");
  }

  await handleApiResponse(response);

  return response.json();
}

// Get concert details with reservations (requires authentication)
export async function getConcertById(concertId: string): Promise<ConcertDetailResponse> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.accessToken) {
    throw new UnauthorizedError("Not authenticated");
  }

  const response = await fetch(
    `${env.APP_API}/concerts/${concertId}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  await handleApiResponse(response);

  return response.json();
}

// Reserve a seat for a concert
export async function reserveSeat(concertId: string): Promise<ReservationResult> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.accessToken) {
    throw new UnauthorizedError("Not authenticated");
  }

  const response = await fetch(
    `${env.APP_API}/concerts/${concertId}/reserve`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  await handleApiResponse(response);

  return response.json();
}

// Cancel a reservation
export async function cancelReservation(concertId: string): Promise<{ message: string }> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.accessToken) {
    throw new UnauthorizedError("Not authenticated");
  }

  const response = await fetch(
    `${env.APP_API}/concerts/${concertId}/reserve`,
    {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  await handleApiResponse(response);

  return response.json();
}

// Check if user is authenticated
export async function checkAuthentication(): Promise<boolean> {
  try {
    const session = await getSession();
    return session.isLoggedIn && !!session.accessToken;
  } catch {
    return false;
  }
}

// Fetch user reservation history (requires authentication)
export async function getUserReservationHistory(page: number = 1, limit: number = 20): Promise<PaginatedReservationHistoryResponse> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.accessToken) {
    throw new UnauthorizedError("Not authenticated");
  }

  const response = await fetch(
    `${env.APP_API}/concerts/history?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok && response.status === 401) {
    await session.destroy();
    redirect("/");
  }

  await handleApiResponse(response);

  return response.json();
} 