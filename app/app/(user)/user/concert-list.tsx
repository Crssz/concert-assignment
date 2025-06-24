"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
    cancelReservationAction,
    reserveSeatAction
} from "../actions";

interface ConcertResponse {
  id: string;
  name: string;
  description: string;
  totalSeats: number;
  availableSeats: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UserReservationResponse {
  id: string;
  concertId: string;
  concertName: string;
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  seatNumber: number;
  createdAt: string;
}

export default function ConcertList({
  concerts,
  meta,
  reservations,
}: {
  concerts: ConcertResponse[];
  meta: PaginationMeta;
  reservations: UserReservationResponse[];
}) {
  const [isPending, startTransition] = useTransition();
  const [reservingConcertId, setReservingConcertId] = useState<string | null>(
    null
  );
  const [cancellingConcertId, setCancellingConcertId] = useState<string | null>(
    null
  );
  const router = useRouter();
  const currentPage = meta.currentPage;
  const totalPages = meta.totalPages;

  // Check if user has reservation for a concert
  // Note: Current API doesn't include concertId in reservations, so we track in session
  const hasReservation = (concertId: string): boolean => {
    return reservations.some((reservation) => reservation.id === concertId);
  };

  // Get user's seat number for a concert
  // Note: Current API doesn't include concertId in reservations, so we track in session
  const getUserSeatNumber = (concertId: string): number | null => {
    return (
      reservations.find((reservation) => reservation.id === concertId)
        ?.seatNumber || null
    );
  };

  // Reserve a seat
  const reserveSeat = async (concertId: string) => {
    startTransition(async () => {
      try {
        const reservation = await reserveSeatAction(concertId);

        toast.success(`Seat #${reservation.seatNumber} reserved successfully!`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to reserve seat";
        toast.error(errorMessage);
        console.error("Error reserving seat:", error);
      } finally {
        setReservingConcertId(null);
      }
    });
  };

  // Cancel a reservation
  const cancelReservation = async (concertId: string) => {
    setCancellingConcertId(concertId);

    startTransition(async () => {
      try {
        await cancelReservationAction(concertId);

        toast.success("Reservation cancelled successfully!");
        router.refresh();
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to cancel reservation";
        toast.error(errorMessage);
        console.error("Error cancelling reservation:", error);
      } finally {
        setCancellingConcertId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {concerts.map((concert) => {
          const isAvailable = concert.availableSeats > 0;
          const userHasReservation = hasReservation(concert.id);
          const userSeatNumber = getUserSeatNumber(concert.id);

          return (
            <Card
              key={concert.id}
              className={`transition-all duration-200 ${
                isAvailable
                  ? "hover:shadow-lg bg-accent/5"
                  : "opacity-75 border-red-200 bg-red-50/30"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle
                      className={`text-lg ${
                        !isAvailable ? "text-gray-600" : ""
                      }`}
                    >
                      {concert.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {concert.description}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={isAvailable ? "default" : "destructive"}
                    className="ml-2 shrink-0"
                  >
                    {isAvailable ? "Available" : "Full"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">
                      Total Seats:
                    </span>
                    <p className="text-lg font-semibold">
                      {concert.totalSeats}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Available:
                    </span>
                    <p
                      className={`text-lg font-semibold ${
                        isAvailable ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {concert.availableSeats}
                    </p>
                  </div>
                </div>

                {userHasReservation && userSeatNumber && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800">
                      Your Seat: #{userSeatNumber}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {userHasReservation ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => cancelReservation(concert.id)}
                      disabled={cancellingConcertId === concert.id || isPending}
                      className="flex-1"
                    >
                      {cancellingConcertId === concert.id
                        ? "Cancelling..."
                        : "Cancel Reservation"}
                    </Button>
                  ) : (
                    <Button
                      variant={isAvailable ? "default" : "outline"}
                      size="sm"
                      onClick={() => reserveSeat(concert.id)}
                      disabled={
                        !isAvailable ||
                        reservingConcertId === concert.id ||
                        isPending
                      }
                      className="flex-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {reservingConcertId === concert.id
                        ? "Reserving..."
                        : isAvailable
                        ? "Reserve Seat"
                        : "Sold Out"}
                    </Button>
                  )}
                </div>

                <div className="text-xs text-gray-500 border-t pt-2">
                  Created: {new Date(concert.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/user?page=${currentPage - 1}`)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/user?page=${currentPage + 1}`)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {concerts.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No concerts available
          </h3>
          <p className="text-gray-600">Check back later for new concerts!</p>
        </div>
      )}
    </div>
  );
}
