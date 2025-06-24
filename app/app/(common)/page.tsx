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
import { faker } from "@faker-js/faker";
import { Clock, MapPin, Music, Star, Users } from "lucide-react";
import Link from "next/link";
import { loader } from "./loader";
import { AuthSection } from "./auth-section";
import { getSessionData } from "./auth-actions";

export interface Concert {
  id: string;
  name: string;
  description: string;
  totalSeats: number;
  availableSeats: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
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
              Discover amazing concerts and reserve your seats
            </p>
          </div>
        </div>
        {sessionData.isLoggedIn && (
          <div className="container mx-auto px-4 w-fit py-2">
            <Link
              href="/user"
              className="text-md font-bold text-gray-900 dark:text-white mb-2"
            >
              <Button variant="outline">🎵 Go to your profile</Button>
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
                  {/* Concert Image */}
                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={
                          concert.availableSeats === 0
                            ? "destructive"
                            : concert.availableSeats < 50
                            ? "secondary"
                            : "default"
                        }
                      >
                        {concert.availableSeats === 0
                          ? "Sold Out"
                          : `${concert.availableSeats} left`}
                      </Badge>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className="bg-white/90">
                        <Music className="w-3 h-3 mr-1" />
                        Concert
                      </Badge>
                    </div>
                  </div>

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
                      {concert.totalSeats} total seats
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      {concert.owner.firstName} {concert.owner.lastName}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
                      {faker.number.float({
                        min: 4.0,
                        max: 5.0,
                        fractionDigits: 1,
                      })}{" "}
                      rating
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2 pt-3">
                    <Button
                      className="flex-1"
                      disabled={concert.availableSeats === 0}
                    >
                      {concert.availableSeats === 0
                        ? "Sold Out"
                        : "Reserve Seat"}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Clock className="w-4 h-4" />
                    </Button>
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
