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
import { useTransition } from "react";
import { toast } from "sonner";
import { cancelReservationAction } from "../../actions";
import {
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface UserReservationResponse {
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

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ReservationListProps {
  reservations: UserReservationResponse[];
  meta: PaginationMeta;
}

export default function ReservationList({
  reservations,
  meta,
}: ReservationListProps) {
  const [isPending, startTransition] = useTransition();
  const cancelReservation = async (concertId: string) => {
    startTransition(async () => {
      try {
        await cancelReservationAction(concertId);
        toast.success("Reservation cancelled successfully!");
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to cancel reservation";
        toast.error(errorMessage);
        console.error("Error cancelling reservation:", error);
      } finally {
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0-8v8m0-8h6a2 2 0 012 2v6a2 2 0 01-2 2h-6m0-8v8"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Reservations Yet
          </h3>
          <p className="text-gray-500">
            You haven&apos;t made any reservations yet. Browse concerts to
            reserve your seats.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pagination Info */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Showing {(meta.currentPage - 1) * meta.itemsPerPage + 1} to{" "}
          {Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems)} of{" "}
          {meta.totalItems} reservations
        </span>
        <span>
          Page {meta.currentPage} of {meta.totalPages}
        </span>
      </div>

      {/* Reservations Grid */}
      <div className="block space-y-2">
        {reservations.map((reservation) => (
          <Card
            key={reservation.id}
            className="transition-all duration-200 hover:shadow-lg"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-gray-900">
                    {reservation.concertName}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Seat #{reservation.seatNumber}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="ml-2 shrink-0">
                  Reserved
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Seat Number:
                  </span>
                  <p className="text-lg font-semibold text-blue-600">
                    #{reservation.seatNumber}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Reserved On:
                  </span>
                  <p className="text-sm text-gray-900">
                    {formatDate(reservation.createdAt)}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex border-t border-gray-100">
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
                        Are you sure to cancel your reservation for
                        <br />
                        {reservation.concertName}
                      </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => cancelReservation(reservation.concertId)}
                        className="bg-destructive cursor-pointer text-white hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasPreviousPage}
            className="flex items-center space-x-1"
          >
            <span>Previous</span>
          </Button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
              const pageNumber = i + Math.max(1, meta.currentPage - 2);
              if (pageNumber > meta.totalPages) return null;

              return (
                <Button
                  key={pageNumber}
                  variant={
                    pageNumber === meta.currentPage ? "default" : "outline"
                  }
                  size="sm"
                  className="min-w-[40px]"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasNextPage}
            className="flex items-center space-x-1"
          >
            <span>Next</span>
          </Button>
        </div>
      )}
    </div>
  );
}
