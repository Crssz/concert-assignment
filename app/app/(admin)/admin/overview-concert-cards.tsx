import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  getUserConcerts,
  type ConcertResponse,
  type PaginationMeta,
} from "../loader";
import { DeleteConcertButton } from "./delete-concert-button";

interface OverviewConcertCardsProps {
  searchParams: Promise<{ page?: string; limit?: string }>;
}

function getAvailabilityStatus(availableSeats: number, totalSeats: number) {
  const percentage = (availableSeats / totalSeats) * 100;

  if (percentage === 0) {
    return { status: "Sold Out", variant: "destructive" as const };
  } else if (percentage <= 20) {
    return { status: "Almost Full", variant: "secondary" as const };
  } else if (percentage <= 50) {
    return { status: "Half Full", variant: "outline" as const };
  } else {
    return { status: "Available", variant: "default" as const };
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function OverviewConcertCards({
  searchParams,
}: OverviewConcertCardsProps) {
  const { page: pageParam, limit: limitParam } = await searchParams;
  const currentPage = Number(pageParam) || 1;
  const limit = Number(limitParam) || 9;

  let concerts: ConcertResponse[] = [];
  let meta: PaginationMeta | null = null;
  let error: string | null = null;

  try {
    const data = await getUserConcerts(currentPage, limit);
    concerts = data.data;
    meta = data.meta;
  } catch (err) {
    error = err instanceof Error ? err.message : "An error occurred";
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold tracking-tight">My Concerts</h3>
        </div>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-destructive mb-4">Error: {error}</p>
            <Link href="/admin">
              <Button>Try Again</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">My Concerts</h3>
          {meta && (
            <p className="text-muted-foreground">
              {meta.totalItems} concert{meta.totalItems !== 1 ? "s" : ""} total
            </p>
          )}
        </div>
      </div>

      {concerts.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No concerts yet</h3>
            <p className="text-muted-foreground">
              Use the &ldquo;Create Concert&rdquo; tab to add your first
              concert.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Concert Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {concerts.map((concert) => {
              const availability = getAvailabilityStatus(
                concert.availableSeats,
                concert.totalSeats
              );

              return (
                <Card
                  key={concert.id}
                  className="group hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                          {concert.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {concert.description}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={availability.variant}
                        className="ml-2 shrink-0"
                      >
                        {availability.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2 shrink-0" />
                      <span>
                        {concert.availableSeats} of {concert.totalSeats} seats
                        available
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2 shrink-0" />
                      <span>Created {formatDate(concert.createdAt)}</span>
                    </div>

                    {/* Progress bar for seat availability */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Occupancy</span>
                        <span>
                          {Math.round(
                            ((concert.totalSeats - concert.availableSeats) /
                              concert.totalSeats) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              ((concert.totalSeats - concert.availableSeats) /
                                concert.totalSeats) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2 pt-3 justify-end">
                    <DeleteConcertButton
                      concertId={concert.id}
                      concertName={concert.name}
                    />
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Link href={`/admin?page=${currentPage - 1}&limit=${limit}    `}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPreviousPage}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              </Link>

              <div className="flex items-center gap-1">
                {/* Show page numbers */}
                {Array.from(
                  { length: Math.min(5, meta.totalPages) },
                  (_, i) => {
                    let pageNum;

                    // Smart pagination logic
                    if (meta.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= meta.totalPages - 2) {
                      pageNum = meta.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Link
                        key={pageNum}
                        href={`/admin?page=${pageNum}&limit=${limit}`}
                      >
                        <Button
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      </Link>
                    );
                  }
                )}
              </div>

              <Link
                href={
                  meta.hasNextPage
                    ? `/admin?page=${currentPage + 1}&limit=${limit}`
                    : `/admin?page=${currentPage}&limit=${limit}`
                }
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNextPage}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
