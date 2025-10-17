// src/pages/LandingPage.tsx
import React, { useState } from "react";
import { uploadReceipt } from "../services/api";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, requireLogin } from "../utils/auth";

export default function LandingPage() {
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await uploadReceipt(formData);
            setResult(res.data);
        } catch (err: any) {
            console.error(err);
            setError("Failed to process receipt. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (!isLoggedIn()) {
            requireLogin();
            return;
        }
        // Placeholder: once login is built, call API to persist
        alert("Receipt saved to your account!");
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 max-w-3xl mx-auto min-h-[80vh]">
            <h1 className="text-3xl font-bold mb-2 text-center">
                Receipt Scanner MVP
            </h1>
            <p className="text-gray-500 text-center mb-6">
                Upload your receipt image and get instant expense extraction.
            </p>

            {/* Upload Card */}
            <div className="border-2 border-dashed rounded-xl p-6 text-center w-full max-w-md bg-gray-50">
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-600 mb-3"
                />

                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="bg-blue-600 text-white px-5 py-2 rounded-md disabled:opacity-50"
                >
                    {loading ? "Processing..." : "Upload & Scan"}
                </button>

                {error && (
                    <p className="text-red-500 text-sm mt-3">{error}</p>
                )}
            </div>

            {/* Display parsed result */}
            {result && (
                <div className="mt-6 w-full max-w-lg bg-white rounded-xl shadow-md p-4">
                    <h2 className="text-xl font-semibold mb-3 border-b pb-2">
                        Parsed Receipt
                    </h2>

                    <div className="text-sm space-y-2">
                        <p><b>Vendor:</b> {result.parsed?.vendor?.name ?? result.vendor ?? "-"}</p>
                        <p><b>Total:</b> {result.parsed?.transaction?.summary?.total_amount ?? result.amount ?? "-"}</p>
                        <p><b>Currency:</b> {result.parsed?.transaction?.summary?.currency ?? result.currency ?? "-"}</p>
                        <p><b>Payment:</b> {result.parsed?.transaction?.summary?.payment_method ?? "-"}</p>
                        <p><b>Confidence:</b> {result.parsed?.meta?.parse_confidence ?? "-"}</p>
                    </div>

                    {result.parsed?.transaction?.items?.length > 0 && (
                        <div className="mt-4 border-t pt-2">
                            <h3 className="font-semibold text-sm mb-1">Items</h3>
                            <ul className="text-sm text-gray-700 list-disc list-inside">
                                {result.parsed.transaction.items.map((item: any, idx: number) => (
                                    <li key={idx}>
                                        {item.name} — {item.category} ({item.quantity || 1}x)
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mt-5 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                            Save to My Account
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
