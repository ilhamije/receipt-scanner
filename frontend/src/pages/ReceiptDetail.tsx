// src/pages/ReceiptDetail.tsx
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { deleteReceipt, getReceiptDetail } from "../services/api";
import type { Receipt } from "./ReceiptList";

interface ReceiptDetailProps {
    receipt: Receipt;
    onClose: () => void;
    onUpdated?: () => void;
    onEdit?: (receipt: Receipt) => void;
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
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<Receipt | null>(null);

    // 🧠 Fetch full detail on open
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await getReceiptDetail(receipt.id);
                setDetail(res.data);
            } catch (err) {
                console.error("Failed to fetch receipt detail:", err);
                toast.error("Failed to load receipt details");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [receipt.id]);

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
            onUpdated?.();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete receipt");
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    // ✅ Use detail (fetched) or fallback to list item
    const r = detail || receipt;
    const data = r.data || {};
    const vendor = data.vendor || r.vendor || "—";
    const amount = data.amount || r.amount || null;
    const currency = data.currency || r.currency || "IDR";
    const category = data.category || r.category || "—";
    const expenseDate = data.expense_date || r.expense_date || "—";
    const createdAt = new Date(r.created_at).toLocaleString();
    const items = data.items || [];

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                    <p className="text-gray-600">Loading receipt details...</p>
                </div>
            </div>
        );
    }

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
                        <span>{vendor}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Amount:</span>
                        <span>
                            {amount
                                ? `${currency} ${Number(amount).toLocaleString()}`
                                : "—"}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Category:</span>
                        <span>{category || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Expense Date:</span>
                        <span>{expenseDate}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Created At:</span>
                        <span>{createdAt}</span>
                    </div>

                    {/* 🧾 Items Table */}
                    {items.length > 0 && (
                        <div className="mt-5 border-t pt-3">
                            <p className="font-medium mb-2">Items:</p>
                            <div className="overflow-x-auto max-h-60">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 text-gray-700">
                                            <th className="text-left py-1.5 px-2">Item</th>
                                            <th className="text-right py-1.5 px-2">Qty</th>
                                            <th className="text-right py-1.5 px-2">Unit Price</th>
                                            <th className="text-right py-1.5 px-2">Total</th>
                                            <th className="text-left py-1.5 px-2">Category</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item: any, i: number) => (
                                            <tr
                                                key={i}
                                                className="border-t border-gray-100 hover:bg-gray-50"
                                            >
                                                <td className="py-1.5 px-2">{item.name || "-"}</td>
                                                <td className="py-1.5 px-2 text-right">
                                                    {item.quantity || 1}
                                                </td>
                                                <td className="py-1.5 px-2 text-right">
                                                    {item.unit_price
                                                        ? Number(item.unit_price).toLocaleString()
                                                        : "-"}
                                                </td>
                                                <td className="py-1.5 px-2 text-right">
                                                    {item.total_price
                                                        ? Number(item.total_price).toLocaleString()
                                                        : "-"}
                                                </td>
                                                <td className="py-1.5 px-2">{item.category || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
                                    onClick={() => onEdit(r)}
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
