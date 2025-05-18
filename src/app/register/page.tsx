
"use client"; // Required for useFormState and useEffect

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { registerUser, AuthActionResponse } from "@/lib/auth-actions"; // Assuming alias @ is configured for src
import { useEffect, useRef } from "react";

const initialState: AuthActionResponse = {
    message: null,
    type: null,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50"
            type="submit" 
            aria-disabled={pending}
            disabled={pending}
        >
            {pending ? "Signing Up..." : "Sign Up"}
        </button>
    );
}

export default function RegisterPage() {
    const [state, formAction] = useFormState(registerUser, initialState);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.type === "success") {
            // Optionally reset form or redirect
            // For now, just log and keep message
            console.log("Registration successful, message:", state.message);
            formRef.current?.reset(); // Reset form on success
        }
        if (state.type === "error") {
            console.error("Registration error:", state.message);
        }
    }, [state]);

    return (
        <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
            <div className="w-full max-w-md">
                <form ref={formRef} action={formAction} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <div className="mb-4">
                        <h1 className="text-xl font-bold text-center text-gray-700 mb-6">Create Account</h1>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">
                            Full Name
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="fullName" name="fullName" type="text" placeholder="Your Full Name" required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="email" name="email" type="email" placeholder="your@email.com" required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="password" name="password" type="password" placeholder="******************" required minLength={8}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                            Confirm Password
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            id="confirmPassword" name="confirmPassword" type="password" placeholder="******************" required minLength={8}
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
                        Already have an account? <Link href="/login" className="text-blue-500 hover:text-blue-800">Log in</Link>
                    </p>
                </form>
                <p className="text-center text-gray-500 text-xs">
                    &copy;{new Date().getFullYear()} Your Company Name. All rights reserved.
                </p>
            </div>
        </div>
    );
}

