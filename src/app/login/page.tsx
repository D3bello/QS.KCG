"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { loginUser, AuthActionResponse } from "@/lib/auth-actions"; // Assuming alias @ is configured for src
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // For client-side redirection

const initialState: AuthActionResponse = {
    message: null,
    type: null,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50"
            type="submit"
            aria-disabled={pending}
            disabled={pending}
        >
            {pending ? "Signing In..." : "Sign In"}
        </button>
    );
}

export default function LoginPage() {
    const [state, formAction] = useFormState(loginUser, initialState);
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.type === "success") {
            console.log("Login successful, message:", state.message);
            // Redirect to projects page on successful login
            // Note: Server actions cannot redirect directly, so client-side redirect is used.
            router.push("/projects"); 
            formRef.current?.reset();
        }
        if (state.type === "error") {
            console.error("Login error:", state.message);
        }
    }, [state, router]);

    return (
        <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
            <div className="w-full max-w-xs">
                <form ref={formRef} action={formAction} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <div className="mb-4">
                        <h1 className="text-xl font-bold text-center text-gray-700 mb-6">Login</h1>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="email" name="email" type="email" placeholder="your@email.com" required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            id="password" name="password" type="password" placeholder="******************" required
                        />
                    </div>
                    {state.message && (
                        <div className={`mb-4 p-3 rounded text-center ${state.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {state.message}
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <SubmitButton />
                    </div>
                    <p className="text-center text-gray-500 text-xs mt-4">
                        Don_t have an account? <Link href="/register" className="text-blue-500 hover:text-blue-800">Sign up</Link>
                    </p>
                </form>
                <p className="text-center text-gray-500 text-xs">
                    &copy;{new Date().getFullYear()} Your Company Name. All rights reserved.
                </p>
            </div>
        </div>
    );
}

