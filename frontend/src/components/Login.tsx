// frontend/src/components/Login.tsx
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) setError(error.message);
        setLoading(false);
    };

    const handleSignup = async () => {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) setError(error.message);
        setLoading(false);
    };

    const handleOAuth = async () => {
        await supabase.auth.signInWithOAuth({ provider: "google" });
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-6 rounded shadow w-96">
                <h1 className="text-2xl font-bold mb-4 text-center">Receipt Scanner</h1>

                <form onSubmit={handleLogin} className="flex flex-col gap-3">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border px-3 py-2 rounded"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border px-3 py-2 rounded"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

                <button
                    onClick={handleSignup}
                    disabled={loading}
                    className="mt-3 w-full bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    {loading ? "Signing up..." : "Sign Up"}
                </button>

                <div className="mt-4 flex items-center">
                    <hr className="flex-grow border-t" />
                    <span className="px-2 text-gray-500 text-sm">OR</span>
                    <hr className="flex-grow border-t" />
                </div>

                <button
                    onClick={handleOAuth}
                    className="mt-3 w-full bg-red-500 text-white px-4 py-2 rounded"
                >
                    Continue with Google
                </button>
            </div>
        </div>
    );
}
