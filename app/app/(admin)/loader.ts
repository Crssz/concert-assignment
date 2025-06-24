"use server";

import { env } from "@/app/config/env";
import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";

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

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.accessToken) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/concerts/admin/dashboard-stats`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch dashboard stats");
  }

  return response.json();
}

export async function getUserConcerts(page: number = 1, limit: number = 9): Promise<PaginatedConcertResponse> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.accessToken) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/concerts/my-concerts?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch concerts");
  }

  return response.json();
}

// Fetch owner reservation history (requires authentication)
export async function getOwnerReservationHistory(page: number = 1, limit: number = 20): Promise<PaginatedReservationHistoryResponse> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.accessToken) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/concerts/owner-history?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    if(response.status === 401) {
      session.destroy();
      redirect("/");
    }

    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch reservation history");
  }

  return response.json();
} 