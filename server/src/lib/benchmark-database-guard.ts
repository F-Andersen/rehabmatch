export const BENCHMARK_DATABASE_NAME = "rehabmatch_benchmark";

export function assertSafeBenchmarkDatabase(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Invalid BENCHMARK_DATABASE_URL"); }
  const local = new Set(["localhost", "127.0.0.1", "[::1]"]);
  if (!["postgresql:", "postgres:"].includes(url.protocol) || !local.has(url.hostname) ||
      decodeURIComponent(url.pathname) !== `/${BENCHMARK_DATABASE_NAME}` ||
      [...url.searchParams.keys()].some((key) => key !== "schema") ||
      url.searchParams.getAll("schema").length > 1 ||
      (url.searchParams.has("schema") && url.searchParams.get("schema") !== "public")) {
    throw new Error("Benchmark requires a local rehabmatch_benchmark database with public schema; other targets are refused");
  }
  return url;
}
