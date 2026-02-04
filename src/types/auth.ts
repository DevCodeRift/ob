import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      clearanceLevel: number;
      departmentId: string | null;
      title: string | null;
      designation: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    clearanceLevel: number;
    departmentId: string | null;
    title: string | null;
    designation: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    username: string;
    clearanceLevel: number;
    departmentId: string | null;
    title: string | null;
    designation: string | null;
  }
}
