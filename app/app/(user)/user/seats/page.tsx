import { getUserReservations } from "../../loader";
import ReservationList from "./reservation-list";

export default async function UserSeatsPage(props: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const { page: pageParam, limit: limitParam } = await props.searchParams;
  const currentPage = Number(pageParam) || 1;
  const limit = Number(limitParam) || 50;

  const reservations = await getUserReservations(currentPage, limit);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Reservations
        </h1>
        <p className="text-gray-600">
          View and manage your concert reservations
        </p>
      </div>

      <ReservationList
        reservations={reservations.data}
        meta={reservations.meta}
      />
    </div>
  );
}
