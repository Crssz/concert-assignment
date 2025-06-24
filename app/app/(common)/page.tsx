import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users } from "lucide-react";
import Link from "next/link";
import { getSessionData } from "./auth-actions";
import { AuthSection } from "./auth-section";
import { loader } from "./loader";

export interface Concert {
  id: string;
  name: string;
  description: string;
  totalSeats: number;
  availableSeats: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConcertsResponse {
  data: Concert[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default async function ConcertLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ page: string }>;
}) {
  const { page: _page } = await searchParams;
  const page = isNaN(Number(_page)) ? 1 : Number(_page);

  const [{ data: concerts, totalPages }, sessionData] = await Promise.all([
    loader({ page: Number(page) }),
    getSessionData(),
  ]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1" />
            <AuthSection
              user={sessionData.user}
              isLoggedIn={sessionData.isLoggedIn}
            />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              🎵 Concert Reservations
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Free concert reservation platform
            </p>
          </div>
        </div>
        {sessionData.isLoggedIn && (
          <div className="container mx-auto px-4 w-fit py-2">
            <Link
              href="/user"
              className="text-md font-bold text-gray-900 dark:text-white mb-2"
            >
              <Button variant="outline">🎵 Go to your Dashboard</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {concerts.length === 0 ? (
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>No Concerts Available</CardTitle>
                <CardDescription>
                  Check back later for upcoming concerts!
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : (
          <>
            {/* Concert Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {concerts.map((concert) => (
                <Card
                  key={concert.id}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-1">
                      {concert.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {concert.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      <span
                        className={
                          concert.availableSeats === 0
                            ? "text-red-500"
                            : "text-green-600"
                        }
                      >
                        {concert.availableSeats}/{concert.totalSeats} available
                        seats
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2 pt-3">
                    {concert.availableSeats > 0 ? (
                      <Link
                        className="w-full "
                        href={sessionData.isLoggedIn ? `/user` : `/`}
                      >
                        <Button
                          disabled={!sessionData.isLoggedIn}
                          className="w-full cursor-pointer"
                        >
                          {sessionData.isLoggedIn
                            ? "Reserve Seat at Dashboard"
                            : "Sign in to Reserve Seat"}
                        </Button>
                      </Link>
                    ) : (
                      <Button className="flex-1" disabled>
                        Sold Out
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Link href={`/?page=${Number(page) - 1}`}>
                  <Button variant="outline" disabled={Number(page) === 1}>
                    Previous
                  </Button>
                </Link>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Link key={pageNum} href={`/?page=${pageNum}`}>
                        <Button
                          variant={
                            Number(page) === pageNum ? "default" : "outline"
                          }
                          size="icon"
                        >
                          {pageNum}
                        </Button>
                      </Link>
                    );
                  })}
                </div>

                <Link href={`/?page=${Number(page) + 1}`}>
                  <Button
                    variant="outline"
                    disabled={Number(page) === totalPages}
                  >
                    Next
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
