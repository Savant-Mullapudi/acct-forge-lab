import { QueryClient } from "@tanstack/react-query";

async function handleResponse(response: Response) {
  if (response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  }

  let errorMessage: string;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const error = await response.json();
    errorMessage = error.message || `${response.status}: ${response.statusText}`;
  } else {
    errorMessage = `${response.status}: ${response.statusText}`;
  }

  throw new Error(errorMessage);
}

const defaultFetcher = async ({ queryKey }: { queryKey: [string, ...any[]] }) => {
  const [url] = queryKey;
  const response = await fetch(url, {
    credentials: "include",
  });
  return handleResponse(response);
};

export const apiRequest = async (
  method: string,
  url: string,
  data?: any
) => {
  const response = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    credentials: "include",
    body: data ? JSON.stringify(data) : undefined,
  });
  return handleResponse(response);
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultFetcher,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
    },
  },
});
