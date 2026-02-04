import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.clearanceLevel = user.clearanceLevel;
        token.departmentId = user.departmentId;
        token.title = user.title;
        token.designation = user.designation;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.clearanceLevel = token.clearanceLevel as number;
        session.user.departmentId = token.departmentId as string | null;
        session.user.title = token.title as string | null;
        session.user.designation = token.designation as string | null;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const publicRoutes = ["/", "/apply", "/letter"];
      const publicPrefixes = ["/invite/", "/letter/", "/api/auth"];

      const isPublicRoute =
        publicRoutes.includes(pathname) ||
        publicPrefixes.some((prefix) => pathname.startsWith(prefix));

      if (isPublicRoute) return true;
      if (!isLoggedIn) return false;

      return true;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
};
