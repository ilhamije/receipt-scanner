// src/pages/ReceiptsPage.tsx
import React, { useState } from "react";
import { uploadReceipt } from "../services/api";
import { useReceipts } from "../hooks/useReceipts";
import { ReceiptList } from "../pages/ReceiptList";
import { ReceiptFilterBar } from "../pages/ReceiptFilterBar";
import { isLoggedIn, requireLogin } from "../utils/auth";
import { FileUp, Receipt, Loader2 } from "lucide-react";
import { ReceiptUpdateModal } from "./ReceiptUpdate";

export default function ReceiptsPage() {
    const [filters, setFilters] = useState({});
    const { data, total, page, setPage, loading, refetch } = useReceipts(filters);

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsed, setParsed] = useState<any>(null);

    // ✅ Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

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
            setTimeout(() => setPage(0), 500); // reload first page
        } catch (err: any) {
            console.error(err);
            setError("Failed to process receipt. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = () => {
        if (!isLoggedIn()) {
            requireLogin();
            return;
        }
        alert("Receipt saved to your account!");
    };

    // ✅ Open edit modal from list
    const handleEditReceipt = (receipt: any) => {
        setSelectedReceipt(receipt);
        setModalOpen(true);
    };

    // ✅ Refresh list after update
    const handleUpdated = () => {
        setModalOpen(false);
        setTimeout(() => {
            if (refetch) refetch();
            else setPage(0);
        }, 300);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-blue-600" />
                Receipts Overview
            </h1>
            <p className="text-gray-500 mb-6">
                Upload your receipts and manage your expense history in one place.
            </p>

            {/* Filter section */}
            <div className="bg-white border rounded-xl shadow-sm p-4">
                <ReceiptFilterBar onFilterChange={setFilters} />
            </div>

            {/* Upload Section */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl shadow-sm p-6 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                    <FileUp className="w-8 h-8 text-blue-600" />
                    <p className="text-gray-700 font-medium">Upload a new receipt</p>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="text-sm text-gray-600 mb-2"
                    />

                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {uploading ? "Processing..." : "Upload & Scan"}
                    </button>

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
            </div>

            {/* Parsed result (preview) */}
            {parsed && (
                <div className="bg-white border rounded-xl shadow-md p-5">
                    <h2 className="text-lg font-semibold mb-3 border-b pb-2 text-gray-800">
                        Parsed Receipt Preview
                    </h2>

                    <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
                        <p>
                            <b>Vendor:</b> {parsed.vendor ?? "-"}
                        </p>
                        <p>
                            <b>Total:</b> {parsed.amount ?? "-"}
                        </p>
                        <p>
                            <b>Currency:</b> {parsed.currency ?? "-"}
                        </p>
                        <p>
                            <b>Date:</b> {parsed.expense_date ?? "-"}
                        </p>
                    </div>

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

            {/* Receipts list */}
            <div className="bg-white border rounded-xl shadow-sm p-5">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold text-gray-800">All Receipts</h2>
                    <p className="text-sm text-gray-500">
                        {total > 0 ? `${total} total receipts` : "No receipts yet"}
                    </p>
                </div>

                {loading ? (
                    <p className="text-gray-500 text-center mt-8">Loading receipts...</p>
                ) : (
                    <ReceiptList receipts={data} onEdit={handleEditReceipt} /> // ✅ pass handler
                )}

                {/* Pagination */}
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

            {/* ✅ Update Modal */}
            <ReceiptUpdateModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                receiptId={selectedReceipt?.id}
                initialData={selectedReceipt}
                onUpdated={handleUpdated}
            />
        </div>
    );
}
