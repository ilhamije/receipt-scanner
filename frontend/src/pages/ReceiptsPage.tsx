import React, { useState } from "react";
import { uploadReceipt } from "../services/api";
import { useReceipts } from "../hooks/useReceipts";
import { ReceiptList } from "./ReceiptList";
import { ReceiptFilterBar } from "./ReceiptFilterBar";
import { isLoggedIn, requireLogin } from "../utils/auth";

export default function ReceiptsPage() {
    const [filters, setFilters] = useState({});
    const { data, total, page, setPage, loading } = useReceipts(filters);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsed, setParsed] = useState<any>(null);

    // 📸 Handle receipt upload
    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);
        setParsed(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await uploadReceipt(formData);
            setParsed(res.data);
        } catch (err: any) {
            console.error(err);
            setError("Failed to process receipt. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    // 💾 Save parsed data (requires login)
    const handleSave = () => {
        if (!isLoggedIn()) {
            requireLogin();
            return;
        }
        // Placeholder: will call POST /receipts later
        alert("Receipt saved to your account!");
    };

    return (
        <div className="p-4 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Receipts</h1>

            {/* 📤 Upload New Receipt */}
            <div className="border-2 border-dashed rounded-xl p-6 text-center w-full bg-gray-50 mb-6">
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-600 mb-3"
                />
                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="bg-blue-600 text-white px-5 py-2 rounded-md disabled:opacity-50"
                >
                    {uploading ? "Processing..." : "Upload & Scan"}
                </button>

                {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            </div>

            {/* 🧾 Display parsed result (optional preview before saving) */}
            {parsed && (
                <div className="mt-4 w-full bg-white rounded-xl shadow-md p-4">
                    <h2 className="text-lg font-semibold mb-3 border-b pb-2">
                        Parsed Receipt
                    </h2>
                    <div className="text-sm space-y-2">
                        <p>
                            <b>Vendor:</b> {parsed.parsed?.vendor?.name ?? parsed.vendor ?? "-"}
                        </p>
                        <p>
                            <b>Total:</b>{" "}
                            {parsed.parsed?.transaction?.summary?.total_amount ??
                                parsed.amount ??
                                "-"}
                        </p>
                        <p>
                            <b>Payment:</b>{" "}
                            {parsed.parsed?.transaction?.summary?.payment_method ?? "-"}
                        </p>
                        <p>
                            <b>Confidence:</b> {parsed.parsed?.meta?.parse_confidence ?? "-"}
                        </p>
                    </div>

                    {parsed.parsed?.transaction?.items?.length > 0 && (
                        <div className="mt-3 border-t pt-2">
                            <h3 className="font-semibold text-sm mb-1">Items</h3>
                            <ul className="text-sm text-gray-700 list-disc list-inside">
                                {parsed.parsed.transaction.items.map((item: any, idx: number) => (
                                    <li key={idx}>
                                        {item.name} — {item.category} ({item.quantity || 1}x)
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                            Save to My Account
                        </button>
                    </div>
                </div>
            )}

            {/* 🧩 Filter Bar */}
            <ReceiptFilterBar onFilterChange={setFilters} />

            {/* 🧾 Receipt List */}
            {loading ? (
                <p className="text-gray-500 text-center mt-8">Loading receipts...</p>
            ) : (
                <div className="mt-6">
                    <ReceiptList receipts={data} />
                </div>
            )}

            {/* 📄 Pagination */}
            <div className="flex justify-center gap-3 mt-6">
                <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    disabled={(page + 1) * 10 >= total}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
