import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { companies: true },
        });

        if (!user || !user.isActive) {
          return null;
        }

        // 1. Comparar con hash bcrypt
        let isValid = false;
        try {
          isValid = await bcrypt.compare(credentials.password, user.password);
        } catch {
          isValid = false;
        }

        // 2. Compatibilidad retroactiva durante migración si estaba en texto plano
        if (!isValid && user.password === credentials.password) {
          isValid = true;
          // Actualizar inmediatamente a hash seguro
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
          });
        }

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companies[0]?.companyId || null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "veltrix-default-production-secret-key-2026",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
