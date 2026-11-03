import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Permitir siempre la ruta de autenticación
        if (req.nextUrl.pathname.startsWith("/api/auth")) {
          return true;
        }

        // Si no hay token de sesión
        if (!token) {
          return false;
        }

        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/((?!auth).*)"
  ],
};
