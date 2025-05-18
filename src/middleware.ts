import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import type { UserPayload } from "@/lib/auth-actions"; // Assuming alias @ is configured for src

const JWT_SECRET = process.env.JWT_SECRET || "your-very-secure-and-long-jwt-secret-for-dev";
const COOKIE_NAME = "qto_session_token";

// Define public paths that do not require authentication
const publicPaths = ["/login", "/register", "/"]; // Add home page and any other public static pages

// Define paths that require authentication but are accessible by any authenticated user
const authenticatedPaths = ["/projects"]; // And sub-paths like /projects/new, /projects/edit/*

// Define paths that require specific roles (example)
// const adminPaths = ["/admin"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(COOKIE_NAME)?.value;

    // Allow access to public paths
    if (publicPaths.some(path => pathname === path || (path === "/" && pathname.startsWith("/images")) || (path === "/" && pathname.startsWith("/_next/static")) )) {
        return NextResponse.next();
    }

    let user: UserPayload | null = null;
    if (token) {
        try {
            user = jwt.verify(token, JWT_SECRET) as UserPayload;
        } catch (error) {
            // Invalid token, clear it and treat as unauthenticated
            console.warn("Middleware: Invalid token", error);
            const response = NextResponse.redirect(new URL("/login", request.url));
            response.cookies.delete(COOKIE_NAME);
            return response;
        }
    }

    // If trying to access a protected path without a valid token/user
    if (!user && authenticatedPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL("/login?redirected=true", request.url));
    }

    // If user is authenticated, allow access to general authenticated paths
    if (user && authenticatedPaths.some(path => pathname.startsWith(path))) {
        // Further role-based checks can be added here if needed for specific sub-paths
        // For example:
        // if (pathname.startsWith("/admin") && user.role !== "Admin") {
        //     return NextResponse.redirect(new URL("/unauthorized", request.url));
        // }
        return NextResponse.next();
    }
    
    // If user is logged in and tries to access login/register, redirect to projects
    if (user && (pathname === "/login" || pathname === "/register")) {
        return NextResponse.redirect(new URL("/projects", request.url));
    }

    // Default: allow if no specific rules matched (should be reviewed for security)
    // Or, if it's not a public or known authenticated path, and user is not logged in, redirect to login.
    if (!user && !publicPaths.some(path => pathname.startsWith(path))) {
         return NextResponse.redirect(new URL("/login?from=middleware", request.url));
    }

    return NextResponse.next();
}

// Specify which paths the middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images (public images)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
    ],
};

