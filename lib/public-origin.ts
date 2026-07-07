export function publicOrigin(reqUrl: string) {
  const configured = process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(reqUrl).origin;
}
