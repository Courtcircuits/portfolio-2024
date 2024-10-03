export function hasEarlyAccess(url: string): boolean {
  const params = new URLSearchParams(url);
  console.log(url);
  return params.has("earlyAccess");
}
