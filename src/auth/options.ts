import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { normalizeRole } from "@/lib/auth/roles";
import { User } from "@/models/User";
import { authDebug } from "@/lib/auth/debug-log";

const credentialsSchema = z.object({
  email: z
    .string()
    .email()
    .transform((e) => e.trim().toLowerCase()),
  password: z.string().min(1),
});

const googleEnabled =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          authDebug("credentials:reject", { reason: "invalid_payload" });
          return null;
        }
        const { email, password } = parsed.data;
        await connectDB();
        authDebug("credentials:lookup", { email });
        const user = await User.findOne({ email }).select(
          "+passwordHash bannedAt deletedAt emailVerified",
        );
        if (!user?.passwordHash) {
          authDebug("credentials:reject", { reason: "no_user_or_no_password" });
          return null;
        }
        if (user.bannedAt || user.deletedAt) {
          authDebug("credentials:reject", { reason: "banned_or_deleted" });
          return null;
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          authDebug("credentials:reject", { reason: "password_mismatch" });
          return null;
        }
        if (!user.emailVerified) {
          authDebug("credentials:reject", { reason: "email_not_verified" });
          throw new Error("EmailNotVerified");
        }
        authDebug("credentials:ok", { email: user.email, id: user._id.toString() });
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? undefined,
          role: normalizeRole(user.role),
        };
      },
    }),
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await connectDB();
        const email = user.email.trim().toLowerCase();
        let doc = await User.findOne({ email });
        if (!doc) {
          doc = await User.create({
            email,
            name: user.name ?? "",
            role: "customer",
            emailVerified: new Date(),
            image: user.image ?? "",
          });
          const { Cart } = await import("@/models/Cart");
          await Cart.create({ userId: doc._id, items: [] }).catch(() => {});
        } else {
          if (doc.bannedAt || doc.deletedAt) {
            return false;
          }
          if (!doc.emailVerified) {
            doc.emailVerified = new Date();
          }
          if (user.image) {
            doc.image = user.image;
          }
          await doc.save();
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      await connectDB();
      let dbUser = null as InstanceType<typeof User> | null;
      if (user?.email) {
        authDebug("jwt:hydrate_from_user", { email: user.email });
        dbUser = await User.findOne({
          email: user.email.trim().toLowerCase(),
        });
      } else if (token.sub) {
        dbUser = await User.findById(token.sub);
      }
      if (dbUser) {
        token.sub = dbUser._id.toString();
        token.role = normalizeRole(dbUser.role);
        token.emailVerified = !!dbUser.emailVerified;
        token.email = dbUser.email;
        token.name = dbUser.name ?? "";
        token.picture = dbUser.image ?? "";
        if (user) {
          authDebug("jwt:after_sign_in", {
            sub: token.sub,
            role: token.role,
            emailVerified: token.emailVerified,
          });
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.name = (token.name as string) ?? session.user.name ?? "";
        session.user.image =
          (token.picture as string | undefined) ?? session.user.image;
        session.user.role = normalizeRole(token.role as string);
        session.user.emailVerified = token.emailVerified === true;
      }
      return session;
    },
  },
};
