import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Terminal Designation",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            console.log("[Auth] Missing credentials");
            return null;
          }

          const username = credentials.username as string;
          const password = credentials.password as string;

          console.log("[Auth] Attempting login for:", username);

          const user = await db.query.users.findFirst({
            where: eq(users.username, username.toLowerCase()),
          });

          if (!user || !user.isActive) {
            console.log("[Auth] User not found or inactive:", username);
            return null;
          }

          console.log("[Auth] User found, checking password");
          const isValid = await bcrypt.compare(password, user.passwordHash);

          if (!isValid) {
            console.log("[Auth] Invalid password for:", username);
            return null;
          }

          console.log("[Auth] Login successful for:", username);

          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id));

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.displayName,
            clearanceLevel: user.clearanceLevel,
            departmentId: user.primaryDepartmentId,
            title: user.title,
            designation: user.designation,
          };
        } catch (error) {
          console.error("[Auth] Error during authorization:", error);
          return null;
        }
      },
    }),
  ],
});
