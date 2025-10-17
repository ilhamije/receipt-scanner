// frontend/src/App.tsx
import { Routes, Route } from "react-router-dom";
import ReceiptsPage from "./pages/ReceiptsPage";
import Navbar from "./components/layout/Navbar";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <div className="p-4">
        <Routes>
          {/* 🧾 Default landing page: receipts (upload + list) */}
          <Route path="/" element={<ReceiptsPage />} />

          {/* 📊 Dashboard route */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* 🔒 Temporary login notice */}
          <Route
            path="/login"
            element={
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h2 className="text-2xl font-bold mb-2">Login Required</h2>
                <p className="text-gray-600 mb-4">
                  Please log in to save your receipts.
                </p>
                <a
                  href="/"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Back to Home
                </a>
              </div>
            }
          />

          {/* 404 fallback */}
          <Route
            path="*"
            element={
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h2 className="text-2xl font-bold mb-2">404 - Not Found</h2>
                <p className="text-gray-600 mb-4">
                  The page you’re looking for doesn’t exist.
                </p>
                <a
                  href="/"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Go Home
                </a>
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
