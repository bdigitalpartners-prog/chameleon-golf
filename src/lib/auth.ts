import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  // Use JWT sessions — no database dependency for auth
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        try {
          // Ensure table exists
          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "auth_users" (
              "id" TEXT PRIMARY KEY,
              "email" VARCHAR(255) NOT NULL UNIQUE,
              "password_hash" TEXT NOT NULL,
              "first_name" VARCHAR(255) NOT NULL,
              "last_name" VARCHAR(255) NOT NULL,
              "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
          `);

          const users = await prisma.$queryRawUnsafe<
            {
              id: string;
              email: string;
              password_hash: string;
              first_name: string;
              last_name: string;
            }[]
          >(
            `SELECT id, email, password_hash, first_name, last_name FROM "auth_users" WHERE email = $1`,
            email
          );

          if (users.length === 0) {
            return null;
          }

          const user = users[0];
          const passwordValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!passwordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Look up the Prisma User record by email so we use the correct users.id
        // (auth_users.id and users.id are different — FK references point to users.id)
        try {
          // Use raw SQL to avoid Prisma schema mismatch with production DB
          const dbUsers = await prisma.$queryRaw<
            Array<{ id: string; role: string | null }>
          >`SELECT id, role FROM users WHERE email = ${token.email} LIMIT 1`;

          if (dbUsers.length > 0) {
            token.id = dbUsers[0].id;
            token.role = dbUsers[0].role ?? "user";
          } else if (token.email) {
            // Create a users entry via raw SQL so admin role can be set later
            const newUsers = await prisma.$queryRaw<Array<{ id: string; role: string }>>`
              INSERT INTO users (email, name, role)
              VALUES (${token.email}, ${user.name ?? null}, 'user')
              ON CONFLICT (email) DO UPDATE SET name = COALESCE(EXCLUDED.name, users.name)
              RETURNING id, role
            `;
            if (newUsers.length > 0) {
              token.id = newUsers[0].id;
              token.role = newUsers[0].role ?? "user";
            } else {
              token.id = user.id;
              token.role = "user";
            }
          } else {
            token.id = user.id;
            token.role = "user";
          }
        } catch (err) {
          console.error("JWT callback error (falling back):", err);
          token.id = user.id;
          token.role = "user";
        }
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
