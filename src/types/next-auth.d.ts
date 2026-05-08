import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      emailVerified: boolean;
    };
  }

  interface User {
    role?: string;
    emailVerified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    emailVerified?: boolean;
    email?: string;
    name?: string;
    picture?: string;
  }
}
