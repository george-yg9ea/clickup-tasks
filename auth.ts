import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_EMAIL_DOMAIN = "whiterabbit.group";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    signIn({ user, profile }) {
      const email = (user?.email ?? (profile as { email?: string })?.email) ?? "";
      if (!email) return false;
      const allowed = email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
      if (!allowed) {
        return "/auth/error?error=AccessDenied";
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});
