import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      // Allow unauthenticated access to invite landing pages
      if (req.nextUrl.pathname.startsWith("/circles/join/")) {
        return true;
      }
      return !!token;
    },
  },
});

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
