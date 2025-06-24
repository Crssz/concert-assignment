"use server";

import { env } from "@/app/config/env";
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