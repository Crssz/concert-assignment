import { getAllConcerts, getUserReservations } from "../loader";
import ConcertList from "./concert-list";

export default async function UserPage(props: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const { page: pageParam, limit: limitParam } = await props.searchParams;
  const currentPage = Number(pageParam) || 1;
  const limit = Number(limitParam) || 12;
  const [concerts, reservations] = await Promise.all([
    getAllConcerts(currentPage, limit),
    getUserReservations(1, 50),
  ]);
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Available Concerts
        </h1>
        <p className="text-gray-600">
          Browse and reserve seats for upcoming concerts
        </p>
      </div>

      <ConcertList
        concerts={concerts.data}
        meta={concerts.meta}
        reservations={reservations.data}
      />
    </div>
  );
}
