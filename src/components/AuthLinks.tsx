"use client"; // This component uses client-side hooks

import Link from "next/link";
import { getSessionStatus, logoutUser, UserPayload } from "@/lib/auth-actions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SessionState {
    isLoggedIn: boolean;
    user: UserPayload | null;
}

export default function AuthLinks() {
    const [session, setSession] = useState<SessionState>({ isLoggedIn: false, user: null });
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const status = await getSessionStatus();
            setSession(status);
        };
        checkSession();
    }, []); // Check session on initial mount

    // Listen for storage events to sync session state across tabs (optional but good UX)
    useEffect(() => {
        const syncLogout = (event: StorageEvent) => {
            if (event.key === "qto_logout_event") {
                setSession({ isLoggedIn: false, user: null });
                router.push("/login");
            }
        };
        window.addEventListener("storage", syncLogout);
        return () => {
            window.removeEventListener("storage", syncLogout);
        };
    }, [router]);

    const handleLogout = async () => {
        await logoutUser();
        setSession({ isLoggedIn: false, user: null }); // Update UI immediately
        // Trigger a storage event for other tabs to sync logout
        localStorage.setItem("qto_logout_event", Date.now().toString());
        localStorage.removeItem("qto_logout_event");
        router.push("/login"); // Redirect to login page
        // router.refresh(); // Refresh server components if needed, or let redirect handle it
    };

    return (
        <div className="space-x-2 flex items-center">
            {session.isLoggedIn && session.user ? (
                <>
                    <span className="text-sm text-gray-400 hidden sm:inline">Welcome, {session.user.username}! ({session.user.role})</span>
                    <button 
                        onClick={handleLogout} 
                        className="bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-1 px-3 rounded"
                    >
                        Logout
                    </button>
                </>
            ) : (
                <>
                    <Link href="/login" className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded">
                        Login
                    </Link>
                    <Link href="/register" className="bg-green-500 hover:bg-green-700 text-white text-sm font-bold py-1 px-3 rounded">
                        Register
                    </Link>
                </>
            )}
        </div>
    );
}

