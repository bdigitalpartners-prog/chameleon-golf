import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  // Use JWT sessions — no database dependency for auth
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // On initial sign-in, add user info to the token
      if (user) {
        token.id = user.id;
        token.role = "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id ?? token.sub;
        (session.user as any).role = token.role ?? "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
