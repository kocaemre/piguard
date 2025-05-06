import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../prisma";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

// Next.js 15'te cookies API await edilmeli, bu nedenle fonksiyon olarak dönüş yapan bir yapı kuruyoruz
export const getAuthOptions = async (): Promise<NextAuthOptions> => {
  return {
    adapter: PrismaAdapter(prisma),
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: "/login",
    },
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      }),
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            return null;
          }

          if (user.role !== "ADMIN" && user.role !== "APPROVED") {
            throw new Error("Your account is not approved yet. Please wait for administrator approval.");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.role = user.role as Role;
          token.id = user.id;
        }
        return token;
      },
      async session({ session, token }) {
        if (token) {
          session.user.role = token.role as Role;
          session.user.id = token.id as string;
        }
        return session;
      },
    },
  };
};

// Geriye dönük uyumluluk için
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  // Diğer özellikler getAuthOptions'dan erişilmeli
} as NextAuthOptions; 