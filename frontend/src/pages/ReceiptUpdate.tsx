import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Dialog } from "@headlessui/react";

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
    onUpdated?: () => void; // refresh parent list
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
    const [expenseDate, setExpenseDate] = useState(
        initialData?.expense_date || ""
    );
    const [loading, setLoading] = useState(false);

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

            await axios.patch(`/api/receipts/${receiptId}`, payload);
            toast.success("Receipt updated successfully");
            if (onUpdated) onUpdated();
            onClose();
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to update receipt");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                    <Dialog.Title className="text-lg font-semibold mb-4">
                        Edit Receipt
                    </Dialog.Title>

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
                            <label className="block text-sm font-medium mb-1">
                                Expense Date
                            </label>
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
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default ReceiptUpdateModal;
