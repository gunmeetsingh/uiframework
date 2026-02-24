import NextAuth, { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";
import { DEV_USERS } from "@/core/auth/dev-users";
import { AuditLogger } from "@/core/utils/audit-logger";

export const authOptions: NextAuthOptions = {
    providers: [
        // 1. Keycloak Provider (Production/Staging)
        KeycloakProvider({
            clientId: process.env.KEYCLOAK_ID || "nextjs-app",
            clientSecret: process.env.KEYCLOAK_SECRET || "dummy-secret",
            issuer: process.env.KEYCLOAK_ISSUER || "http://localhost:8080/realms/my-realm",
        }),
        // 2. Credentials Provider (Dev/Demo Fallback)
        CredentialsProvider({
            name: "Dev Login",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "admin" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                // Only allow this provider if NOT in production keycloak mode
                // OR if explicitly enabled via env var
                if (process.env.AUTH_MODE === 'keycloak') {
                    return null;
                }

                if (!credentials?.username || !credentials?.password) return null;

                const user = DEV_USERS.find(u => u.username === credentials.username && u.password === credentials.password);

                if (user) {
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        image: null,
                        // Pass custom properties to jwt callback
                        role: user.role,
                        permissions: user.permissions
                    };
                }
                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, account, profile }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.permissions = (user as any).permissions;
            }

            // If logging in via Keycloak, extract roles from profile
            if (account?.provider === "keycloak" && profile) {
                // Adjust this based on your Keycloak mapper configuration
                // Example: token.permissions = (profile as any).realm_access?.roles || [];
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).permissions = token.permissions;
            }
            return session;
        }
    },
    events: {
        async signIn({ user, account }) {
            await AuditLogger.log({
                username: user.email || (user as any).username || user.name || 'unknown',
                action: 'Login',
                status: 'Success',
                details: `Logged in via ${account?.provider}`
            });
        },
        async signOut({ token }) {
            await AuditLogger.log({
                username: token.email || (token as any).username || (token as any).name || 'unknown',
                action: 'Logout',
                status: 'Success'
            });
        },
    },
    pages: {
        signIn: '/', // Custom login page
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
