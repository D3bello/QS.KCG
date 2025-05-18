"use server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers"; // For managing cookies
// Re-use the response type, it's general enough
// export interface AuthActionResponse {
//     message: string | null;
//     type: "success" | "error" | null;
// }

// This type is available globally in Cloudflare Workers / Pages environment
declare global {
    interface ProcessEnv {
        DB: D1Database;
        JWT_SECRET: string; // Add JWT_SECRET to environment variables
    }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-very-secure-and-long-jwt-secret-for-dev"; // Fallback for local dev, ensure this is set in prod
const COOKIE_NAME = "qto_session_token";

export interface UserPayload {
    userId: number;
    username: string;
    role: string;
    // Add other session data as needed
}

export interface AuthActionResponse {
    message: string | null;
    type: "success" | "error" | null;
    user?: UserPayload | null; // Optionally return user on success
}


export async function registerUser(prevState: AuthActionResponse, formData: FormData): Promise<AuthActionResponse> {
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!fullName || !email || !password || !confirmPassword) {
        return { message: "All fields are required.", type: "error" };
    }

    if (password !== confirmPassword) {
        return { message: "Passwords do not match.", type: "error" };
    }

    if (!email.includes("@") || email.length < 5) {
        return { message: "Invalid email format.", type: "error" };
    }

    if (password.length < 8) {
        return { message: "Password must be at least 8 characters long.", type: "error" };
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const d1 = process.env.DB;

        const existingUserByEmail = await d1.prepare("SELECT id FROM Users WHERE email = ?").bind(email).first();
        if (existingUserByEmail) {
            return { message: "Email already registered.", type: "error" };
        }

        const existingUserByUsername = await d1.prepare("SELECT id FROM Users WHERE username = ?").bind(email).first();
        if (existingUserByUsername) {
            return { message: "Username (email) already registered.", type: "error" };
        }

        const stmt = d1.prepare(
            "INSERT INTO Users (username, password_hash, role, email, full_name) VALUES (?, ?, ?, ?, ?)"
        );
        // Default role for new users is 'Data Entry'
        await stmt.bind(email, hashedPassword, "Data Entry", email, fullName).run();

        return { message: "User registered successfully! Please login.", type: "success" };

    } catch (error: any) {
        console.error("Registration error:", error.message, error.cause);
        if (error.cause && typeof error.cause.message === "string" && error.cause.message.includes("UNIQUE constraint failed")) {
             if (error.cause.message.includes("Users.email")) {
                return { message: "Email already registered.", type: "error" };
            }
            if (error.cause.message.includes("Users.username")) {
                return { message: "Username (email) already registered.", type: "error" };
            }
        }
        return { message: "Registration failed due to a server error. Please try again.", type: "error" };
    }
}

export async function loginUser(prevState: AuthActionResponse, formData: FormData): Promise<AuthActionResponse> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { message: "Email and password are required.", type: "error" };
    }

    try {
        const d1 = process.env.DB;
        const user = await d1.prepare("SELECT id, username, password_hash, role FROM Users WHERE email = ?").bind(email).first<{
            id: number;
            username: string;
            password_hash: string;
            role: string;
        }>();

        if (!user) {
            return { message: "Invalid email or password.", type: "error" };
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return { message: "Invalid email or password.", type: "error" };
        }

        const userPayload: UserPayload = {
            userId: user.id,
            username: user.username,
            role: user.role
        };

        const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "1h" }); // Token expires in 1 hour

        cookies().set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Use secure cookies in production
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 // 1 hour in seconds
        });

        return { message: "Login successful! Redirecting...", type: "success", user: userPayload };

    } catch (error: any) {
        console.error("Login error:", error.message, error.cause);
        return { message: "Login failed due to a server error. Please try again.", type: "error" };
    }
}

export async function getSessionStatus(): Promise<{ isLoggedIn: boolean; user: UserPayload | null }> {
    const token = cookies().get(COOKIE_NAME)?.value;

    if (!token) {
        return { isLoggedIn: false, user: null };
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
        return { isLoggedIn: true, user: decoded };
    } catch (error) {
        console.warn("Session token verification failed:", error);
        cookies().delete(COOKIE_NAME);
        return { isLoggedIn: false, user: null };
    }
}

export async function logoutUser(): Promise<AuthActionResponse> {
    cookies().delete(COOKIE_NAME);
    return { message: "Logged out successfully.", type: "success" };
}

// Helper function to get current authenticated user (for server actions)
export async function getCurrentAuthenticatedUser(): Promise<UserPayload | null> {
    const session = await getSessionStatus();
    return session.isLoggedIn ? session.user : null;
}

