"use server";

import { env } from "../config/env";
import { ConcertsResponse } from "./page";

export async function loader({
  page,
}: {
  page: number;
}): Promise<ConcertsResponse> {
  "use cache";
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/concerts?page=${page}`
  );
  return response.json() as Promise<ConcertsResponse>;
}
