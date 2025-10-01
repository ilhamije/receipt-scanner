// frontend/src/components/Dashboard.tsx
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
    const { user, signOut } = useAuth();

    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-2">Welcome, {user?.email}</h1>
            <button
                onClick={signOut}
                className="bg-red-500 text-white px-3 py-1 rounded"
            >
                Sign Out
            </button>

            {/* Placeholder for next step */}
            <div className="mt-6 border p-4 rounded bg-gray-50">
                <p className="text-gray-700">📄 Receipt Upload UI will go here</p>
            </div>
        </div>
    );
}
