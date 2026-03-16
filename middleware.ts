export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/circles/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/games/:path*",
    "/discover",
    "/feed",
    "/journal",
  ],
};
