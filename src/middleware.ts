import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth|api/setup|api/health|api/public|api/invitations|api/applications|api/covenant/invitations|invite|apply|letter|covenant/initiation|dashboard).*)",
  ],
};
