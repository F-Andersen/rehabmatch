export type HealthResponse = {
  data: {
    status: string;
  };
};

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch("/api/v1/health", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  return (await response.json()) as HealthResponse;
}
