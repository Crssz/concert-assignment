import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { getOwnerReservationHistory } from "../../loader";

export default async function AdminReservationHistoryPage(props: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const { page: pageParam, limit: limitParam } = await props.searchParams;
  const currentPage = Number(pageParam) || 1;
  const limit = Number(limitParam) || 20;
  
  const historyData = await getOwnerReservationHistory(currentPage, limit);
  const { data: reservationHistory, meta } = historyData;

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <History className="h-6 w-6 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            All Reservations History
          </h1>
        </div>
        <p className="text-gray-600">
          View all reservation activity for your concerts
        </p>
      </div>

      {reservationHistory.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Reservation History Found
            </h3>
            <p className="text-gray-500 mb-6">
              No reservations have been made for your concerts yet.
            </p>
            <Button asChild>
              <a href="/admin">Go to Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-8">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Concert
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reservationHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.concertName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            #{item.seatNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">
                              {item.userFirstName} {item.userLastName}
                            </div>
                            <div className="text-xs text-gray-500 md:hidden">
                              {item.userEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm text-gray-600">
                            {item.userEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getActionBadge(item.action)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm text-gray-900">
                              {formatDate(item.createdAt)}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {item.id.slice(0, 8)}...
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
                      href={`/admin/reservation-history?page=${meta.currentPage - 1}&limit=${limit}`}
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
                      href={`/admin/reservation-history?page=${meta.currentPage + 1}&limit=${limit}`}
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
