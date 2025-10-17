// src/components/layout/Navbar.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isLoggedIn, clearSession } from "../../utils/auth";

export default function Navbar() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const loggedIn = isLoggedIn();

    const handleLogout = () => {
        clearSession();
        navigate("/");
    };

    return (
        <nav className="flex justify-between items-center p-4 border-b bg-white shadow-sm">
            <Link to="/" className="text-xl font-bold text-blue-700">
                R-Scanner
            </Link>

            <div className="flex items-center gap-4 text-sm">
                <Link
                    to="/"
                    className={`transition ${pathname === "/" ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"
                        }`}
                >
                    Home
                </Link>

                <Link
                    to="/receipts"
                    className={`transition ${pathname === "/receipts" ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"
                        }`}
                >
                    Receipts
                </Link>

                <Link
                    to="/dashboard"
                    className={`transition ${pathname === "/dashboard" ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"
                        }`}
                >
                    Dashboard
                </Link>

                {loggedIn ? (
                    <button
                        onClick={handleLogout}
                        className="bg-red-50 text-red-600 px-3 py-1 rounded-md border border-red-200 hover:bg-red-100"
                    >
                        Logout
                    </button>
                ) : (
                    <Link
                        to="/login"
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                    >
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
}
