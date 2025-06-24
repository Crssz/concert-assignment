"use server";

import { env } from "@/app/config/env";
import { handleApiResponse, UnauthorizedError } from "@/lib/api-error-handler";
import { getSession } from "@/lib/auth-session";

export interface AdminDashboardStats {
  totalSeats: number;
  totalReservations: number;
  totalCancelledReservations: number;
}

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

// Fetch dashboard stats (requires authentication)
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.accessToken) {
    throw new UnauthorizedError("Not authenticated");
  }

  const response = await fetch(`${env.APP_API}/concerts/admin/dashboard-stats`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
  });

  await handleApiResponse(response);

  return response.json();
}

// Fetch user concerts (requires authentication)
export async function getUserConcerts(page: number = 1, limit: number = 10): Promise<PaginatedConcertResponse> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.accessToken) {
    throw new UnauthorizedError("Not authenticated");
  }

  const response = await fetch(
    `${env.APP_API}/concerts/my-concerts?page=${page}&limit=${limit}`,
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

// Fetch owner reservation history (requires authentication)
export async function getOwnerReservationHistory(page: number = 1, limit: number = 20): Promise<PaginatedReservationHistoryResponse> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.accessToken) {
    throw new UnauthorizedError("Not authenticated");
  }

  const response = await fetch(
    `${env.APP_API}/concerts/owner-history?page=${page}&limit=${limit}`,
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