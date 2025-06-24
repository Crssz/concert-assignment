"use server";

import { env } from "../config/env";
import { ConcertsResponse } from "./page";
import { handleApiResponse } from "@/lib/api-error-handler";

export async function loader({
  page,
}: {
  page: number;
}): Promise<ConcertsResponse> {
  "use cache";
  const response = await fetch(
    `${env.APP_API}/concerts?page=${page}`
  );
  
  await handleApiResponse(response);
  
  return response.json() as Promise<ConcertsResponse>;
}
