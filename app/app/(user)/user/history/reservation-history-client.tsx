"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, History, Calendar, MapPin, Clock, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { revokeSeatAction } from "../../actions";
import type { PaginatedReservationHistoryResponse } from "../../loader";

interface ReservationHistoryClientProps {
  historyData: PaginatedReservationHistoryResponse;
  currentPage: number;
  limit: number;
}

export default function ReservationHistoryClient({ 
  historyData, 
  currentPage, 
  limit 
}: ReservationHistoryClientProps) {
  const { data: reservationHistory, meta } = historyData;
  const [isPending, startTransition] = useTransition();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format action badge
  const getActionBadge = (action: 'RESERVED' | 'CANCELLED') => {
    if (action === 'RESERVED') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          Reserved
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        Cancelled
      </Badge>
    );
  };

  // Revoke a reservation
  const handleRevoke = async (concertId: string, historyId: string) => {
    setRevokingId(historyId);
    
    startTransition(async () => {
      try {
        await revokeSeatAction(concertId);
        toast.success("Reservation revoked successfully!");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to revoke reservation";
        toast.error(errorMessage);
        console.error("Error revoking reservation:", error);
      } finally {
        setRevokingId(null);
      }
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <History className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Reservation History
          </h1>
        </div>
        <p className="text-gray-600">
          View your complete reservation activity history
        </p>
      </div>

      {reservationHistory.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No History Found
            </h3>
            <p className="text-gray-500 mb-6">
              You haven&apos;t made any reservations yet.
            </p>
            <Button asChild>
              <a href="/user">Browse Concerts</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {reservationHistory.map((item) => (
              <Card
                key={item.id}
                className="transition-all duration-200 hover:shadow-md border-l-4 border-l-blue-200"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <CardTitle className="text-lg">{item.concertName}</CardTitle>
                      </div>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Seat #{item.seatNumber}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(item.createdAt)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      {getActionBadge(item.action)}
                      {item.action === 'RESERVED' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevoke(item.concertId, item.id)}
                          disabled={isPending || revokingId === item.id}
                          className="h-8"
                        >
                          {revokingId === item.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              Revoking...
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3 mr-1" />
                              Revoke
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Action:</span> {item.action === 'RESERVED' ? 'Seat reserved' : 'Reservation cancelled'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Transaction ID: {item.id}
                    </p>
                    {item.action === 'RESERVED' && (
                      <p className="text-xs text-amber-600 mt-2 font-medium">
                        ⚠️ You can revoke this reservation at any time
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(meta.currentPage - 1) * meta.itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems)}
                </span>{" "}
                of{" "}
                <span className="font-medium">{meta.totalItems}</span> results
              </div>

              <div className="flex items-center gap-2">
                {meta.hasPreviousPage && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/user/history?page=${meta.currentPage - 1}&limit=${limit}`}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </a>
                  </Button>
                )}

                <span className="text-sm text-gray-600">
                  Page {meta.currentPage} of {meta.totalPages}
                </span>

                {meta.hasNextPage && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/user/history?page=${meta.currentPage + 1}&limit=${limit}`}
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 