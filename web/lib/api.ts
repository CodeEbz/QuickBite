export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://quickbite-api-production-903f.up.railway.app";

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
