// src/pages/ReceiptUpdate.tsx
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { updateReceipt } from "../services/api";

interface ReceiptUpdateModalProps {
    open: boolean;
    onClose: () => void;
    receiptId: string;
    initialData?: {
        vendor?: string;
        amount?: number;
        currency?: string;
        category?: string;
        expense_date?: string;
    };
    onUpdated?: () => void;
}

export const ReceiptUpdateModal: React.FC<ReceiptUpdateModalProps> = ({
    open,
    onClose,
    receiptId,
    initialData,
    onUpdated,
}) => {
    const [vendor, setVendor] = useState(initialData?.vendor || "");
    const [amount, setAmount] = useState(initialData?.amount || 0);
    const [currency, setCurrency] = useState(initialData?.currency || "IDR");
    const [category, setCategory] = useState(initialData?.category || "");
    const [expenseDate, setExpenseDate] = useState(initialData?.expense_date || "");
    const [loading, setLoading] = useState(false);

    const modalRef = useRef<HTMLDivElement | null>(null);

    // 🔑 Close on ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        if (open) document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [open, onClose]);

    // 🔑 Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
        };
        if (open) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, onClose]);

    // Reset when reopened
    useEffect(() => {
        if (open && initialData) {
            setVendor(initialData.vendor || "");
            setAmount(initialData.amount || 0);
            setCurrency(initialData.currency || "IDR");
            setCategory(initialData.category || "");
            setExpenseDate(initialData.expense_date || "");
        }
    }, [open, initialData]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: Record<string, any> = {};
            if (vendor) payload.vendor = vendor;
            if (amount) payload.amount = parseFloat(amount.toString());
            if (currency) payload.currency = currency;
            if (category) payload.category = category;
            if (expenseDate) payload.expense_date = expenseDate;

            await updateReceipt(receiptId, payload); // ✅ use central API
            toast.success("Receipt updated successfully");
            if (onUpdated) onUpdated();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update receipt");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 backdrop-blur-sm"
            aria-modal="true"
            role="dialog"
        >
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative"
            >
                <h2 className="text-lg font-semibold mb-4">Edit Receipt</h2>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Vendor</label>
                        <input
                            type="text"
                            value={vendor}
                            onChange={(e) => setVendor(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Amount</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value))}
                            className="w-full rounded-md border border-gray-300 p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Currency</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2"
                        >
                            <option value="IDR">IDR</option>
                            <option value="USD">USD</option>
                            <option value="SAR">SAR</option>
                            <option value="JPY">JPY</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Expense Date</label>
                        <input
                            type="date"
                            value={expenseDate ? expenseDate.split("T")[0] : ""}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2"
                        />
                    </div>

                    <div className="flex justify-end space-x-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReceiptUpdateModal;
