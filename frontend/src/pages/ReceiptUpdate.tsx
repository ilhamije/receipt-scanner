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
        items?: any[];
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
    const [items, setItems] = useState<any[]>(initialData?.items || []);
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
            setItems(initialData.items || []);
        }
    }, [open, initialData]);

    // 🧠 Handle item field change (auto total)
    const handleItemChange = (index: number, field: string, value: any) => {
        setItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;
                const updated = { ...item, [field]: value };

                // Auto-calc total if qty/unit_price changes
                if (field === "quantity" || field === "unit_price") {
                    const q = Number(updated.quantity || 0);
                    const p = Number(updated.unit_price || 0);
                    updated.total_price = q * p;
                }
                return updated;
            })
        );
    };

    const handleAddItem = () => {
        setItems([
            ...items,
            { name: "", quantity: 1, unit_price: 0, total_price: 0, category: "" },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

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
            if (items.length > 0) payload.items = items;

            await updateReceipt(receiptId, payload);
            toast.success("Receipt updated successfully");
            onUpdated?.();
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
            className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
            aria-modal="true"
            role="dialog"
        >
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Edit Receipt
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Body (Form) */}
                <form onSubmit={handleUpdate} className="space-y-4 text-sm text-gray-700">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-medium mb-1">Vendor</label>
                            <input
                                type="text"
                                value={vendor}
                                onChange={(e) => setVendor(e.target.value)}
                                className="w-full rounded-md border border-gray-300 p-2"
                            />
                        </div>

                        <div>
                            <label className="block font-medium mb-1">Amount</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value))}
                                className="w-full rounded-md border border-gray-300 p-2"
                            />
                        </div>

                        <div>
                            <label className="block font-medium mb-1">Currency</label>
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
                            <label className="block font-medium mb-1">Category</label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full rounded-md border border-gray-300 p-2"
                            />
                        </div>

                        <div>
                            <label className="block font-medium mb-1">Expense Date</label>
                            <input
                                type="date"
                                value={expenseDate ? expenseDate.split("T")[0] : ""}
                                onChange={(e) => setExpenseDate(e.target.value)}
                                className="w-full rounded-md border border-gray-300 p-2"
                            />
                        </div>
                    </div>

                    {/* 🧾 Items Editing Table */}
                    <div className="mt-6 border-t pt-3">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium text-gray-800">Items</h3>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-sm px-3 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                            >
                                + Add Item
                            </button>
                        </div>

                        {items.length > 0 ? (
                            <div className="overflow-x-auto max-h-60">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 text-gray-700">
                                            <th className="text-left py-1.5 px-2">Item</th>
                                            <th className="text-right py-1.5 px-2">Qty</th>
                                            <th className="text-right py-1.5 px-2">Unit Price</th>
                                            <th className="text-right py-1.5 px-2">Total</th>
                                            <th className="text-left py-1.5 px-2">Category</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, i) => (
                                            <tr
                                                key={i}
                                                className="border-t border-gray-100 hover:bg-gray-50"
                                            >
                                                <td className="py-1.5 px-2">
                                                    <input
                                                        type="text"
                                                        value={item.name || ""}
                                                        onChange={(e) =>
                                                            handleItemChange(i, "name", e.target.value)
                                                        }
                                                        className="w-full border border-gray-300 rounded-md p-1"
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2 text-right">
                                                    <input
                                                        type="number"
                                                        value={item.quantity || 1}
                                                        onChange={(e) =>
                                                            handleItemChange(
                                                                i,
                                                                "quantity",
                                                                parseInt(e.target.value) || 0
                                                            )
                                                        }
                                                        className="w-16 border border-gray-300 rounded-md p-1 text-right"
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2 text-right">
                                                    <input
                                                        type="number"
                                                        value={item.unit_price || 0}
                                                        onChange={(e) =>
                                                            handleItemChange(
                                                                i,
                                                                "unit_price",
                                                                parseFloat(e.target.value) || 0
                                                            )
                                                        }
                                                        className="w-20 border border-gray-300 rounded-md p-1 text-right"
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2 text-right">
                                                    <input
                                                        type="number"
                                                        value={item.total_price || 0}
                                                        onChange={(e) =>
                                                            handleItemChange(
                                                                i,
                                                                "total_price",
                                                                parseFloat(e.target.value) || 0
                                                            )
                                                        }
                                                        className="w-20 border border-gray-300 rounded-md p-1 text-right"
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2">
                                                    <input
                                                        type="text"
                                                        value={item.category || ""}
                                                        onChange={(e) =>
                                                            handleItemChange(i, "category", e.target.value)
                                                        }
                                                        className="w-24 border border-gray-300 rounded-md p-1"
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(i)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm italic mt-2">
                                No items. Click “+ Add Item” to add one.
                            </p>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
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
