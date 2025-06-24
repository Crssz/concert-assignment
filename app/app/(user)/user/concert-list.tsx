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
import { cancelReservationAction, reserveSeatAction } from "../actions";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/api-error-handler";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConcertResponse {
  id: string;
  name: string;
  description: string;
  totalSeats: number;
  availableSeats: number;
  createdAt: string;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
}

interface UserReservationResponse {
  concertId: string;
  seatNumber: number;
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

  const router = useRouter();
  const currentPage = meta.currentPage;
  const totalPages = meta.totalPages;

  // Check if user has reservation for a concert
  const hasReservation = (concertId: string): boolean => {
    return reservations.some(
      (reservation) => reservation.concertId === concertId
    );
  };

  // Get user's seat number for a concert
  const getUserSeatNumber = (concertId: string): number | null => {
    return (
      reservations.find((reservation) => reservation.concertId === concertId)
        ?.seatNumber || null
    );
  };

  // Reserve a seat
  const reserveSeat = async (concertId: string) => {
    setReservingConcertId(concertId);

    startTransition(async () => {
      try {
        const reservation = await reserveSeatAction(concertId);

        toast.success(`Seat #${reservation.seatNumber} reserved successfully!`);
        router.refresh();
      } catch (error) {
        let errorMessage = "Failed to reserve seat";

        if (error instanceof ConflictError) {
          if (error.message.includes("already has a reservation")) {
            errorMessage = "You already have a reservation for this concert";
          } else if (error.message.includes("fully booked")) {
            errorMessage = "Sorry, this concert is now fully booked";
          } else if (error.message.includes("lock")) {
            errorMessage =
              "Someone else is booking. Please try again in a few seconds";
          } else {
            errorMessage = error.message;
          }
        } else if (error instanceof NotFoundError) {
          errorMessage = "This concert is no longer available";
          router.refresh();
        } else if (error instanceof UnauthorizedError) {
          errorMessage = "Please sign in to reserve a seat";
          router.push("/");
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        console.error("Error reserving seat:", error);
      } finally {
        setReservingConcertId(null);
      }
    });
  };

  // Cancel a reservation
  const cancelReservation = async (concertId: string) => {
    startTransition(async () => {
      try {
        await cancelReservationAction(concertId);

        toast.success("Reservation cancelled successfully!");
        router.refresh();
      } catch (error) {
        let errorMessage = "Failed to cancel reservation";

        if (error instanceof NotFoundError) {
          errorMessage =
            "Reservation not found. It may have already been cancelled";
          router.refresh();
        } else if (error instanceof UnauthorizedError) {
          errorMessage = "Please sign in to cancel your reservation";
          router.push("/");
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        console.error("Error cancelling reservation:", error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="block space-y-2">
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <div className="ml-auto">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isPending}
                            className="ml-auto cursor-pointer"
                          >
                            {isPending ? "Cancelling..." : "Cancel Reservation"}
                          </Button>
                        </div>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you sure to cancel your reservation for this
                            concert?
                            <br />
                            {concert.name}
                          </AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="cursor-pointer">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancelReservation(concert.id)}
                            className="bg-destructive cursor-pointer text-white hover:bg-destructive/90"
                          >
                            Cancel Reservation
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                      className="cursor-pointer disabled:cursor-not-allowed ml-auto"
                    >
                      {reservingConcertId === concert.id
                        ? "Reserving..."
                        : isAvailable
                        ? "Reserve Seat"
                        : "Sold Out"}
                    </Button>
                  )}
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
