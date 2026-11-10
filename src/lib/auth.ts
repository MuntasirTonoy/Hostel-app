import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getI18n } from "@/i18n/server";
import { loginSchema } from "@/schemas/auth";
import { findOrCreateOAuthUser, verifyAdminCredentials } from "@/services/admin-service";

/**
 * Google sign-in is enabled only when both env vars are set
 * (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET, read automatically by Auth.js).
 */
export const isGoogleAuthEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

/**
 * Auth.js (NextAuth v5) configuration.
 *
 * Users sign in with email + password, or with Google when configured.
 * Accounts are created through public sign-up (/register) or on the first
 * Google sign-in (a verified Google email signs in to the existing account
 * with that email). The session is an encrypted JWT cookie holding the user's
 * database id (`token.sub`); the user's hostel is looked up on the server for
 * every request, so nothing secret is exposed to the browser.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login", error: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "ইমেইল", type: "email" },
        password: { label: "পাসওয়ার্ড", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name || user.email };
      },
    }),
    ...(isGoogleAuthEnabled ? [Google] : []),
  ],
  callbacks: {
    signIn({ account, profile }) {
      // Only trust Google accounts whose email Google has verified.
      if (account?.provider === "google") {
        return Boolean(profile?.email && profile.email_verified);
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      // First OAuth sign-in: map the Google account to our own user id.
      if (account && account.provider !== "credentials") {
        const email = profile?.email ?? token.email;
        if (!email) throw new Error("OAuth account has no email");
        let hostelName: string | undefined;
        try {
          hostelName = (await getI18n()).t.auth.defaultHostelName;
        } catch {
          // No request context: use the service default.
        }
        const user = await findOrCreateOAuthUser(email, profile?.name ?? token.name ?? "", hostelName);
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
});
