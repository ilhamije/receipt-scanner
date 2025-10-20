// src/pages/ReceiptDetail.tsx
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { deleteReceipt } from "../services/api"; // ✅ centralized API
import type { Receipt } from "./ReceiptList";

interface ReceiptDetailProps {
    receipt: Receipt;
    onClose: () => void;
    onUpdated?: () => void; // trigger refresh from parent
    onEdit?: (receipt: Receipt) => void; // optional — open update modal
}

export const ReceiptDetail: React.FC<ReceiptDetailProps> = ({
    receipt,
    onClose,
    onUpdated,
    onEdit,
}) => {
    const modalRef = useRef<HTMLDivElement | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // ESC to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteReceipt(receipt.id);
            toast.success("Receipt deleted successfully");
            if (onUpdated) onUpdated();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete receipt");
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
            aria-modal="true"
            role="dialog"
        >
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Receipt Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex justify-between">
                        <span className="font-medium">Vendor:</span>
                        <span>{receipt.vendor || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Amount:</span>
                        <span>
                            {receipt.currency}{" "}
                            {receipt.amount
                                ? receipt.amount.toLocaleString()
                                : "—"}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Category:</span>
                        <span>{receipt.category || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Expense Date:</span>
                        <span>
                            {receipt.expense_date
                                ? new Date(receipt.expense_date).toLocaleDateString()
                                : "—"}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Created At:</span>
                        <span>
                            {new Date(receipt.created_at).toLocaleString()}
                        </span>
                    </div>

                    {/* Optional parsed details */}
                    {receipt.data?.parsed?.transaction?.items?.length > 0 && (
                        <div className="mt-4">
                            <p className="font-medium mb-1">Items:</p>
                            <ul className="list-disc list-inside text-gray-600 text-sm">
                                {receipt.data.parsed.transaction.items.map((item: any, i: number) => (
                                    <li key={i}>
                                        {item.name} — {item.category || "General"} ({item.quantity || 1}×)
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="flex justify-end space-x-3 mt-6">
                    {confirmDelete ? (
                        <>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting ? "Deleting..." : "Confirm Delete"}
                            </button>
                        </>
                    ) : (
                        <>
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(receipt)}
                                    className="px-4 py-2 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50"
                                >
                                    Edit
                                </button>
                            )}
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="px-4 py-2 rounded-md border border-red-500 text-red-600 hover:bg-red-50"
                            >
                                Delete
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReceiptDetail;
