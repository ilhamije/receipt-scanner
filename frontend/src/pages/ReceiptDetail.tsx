// src/pages/ReceiptDetail.tsx
import React from "react";
import { X } from "lucide-react";
import type { Receipt } from "./ReceiptList";

interface Props {
    receipt: Receipt;
    onClose: () => void;
}

// useEffect(() => {
//     const handleEsc = (e: KeyboardEvent) => {
//         if (e.key === "Escape") onClose();
//     };
//     window.addEventListener("keydown", handleEsc);
//     return () => window.removeEventListener("keydown", handleEsc);
// }, [onClose]);


export const ReceiptDetail: React.FC<Props> = ({ receipt, onClose }) => {
    const d = receipt.data || {};
    const items = d.items || d.transaction?.items || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-3">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold">
                        {receipt.vendor ?? "Receipt Details"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 overflow-y-auto max-h-[80vh] space-y-4 text-sm">
                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className="font-medium text-gray-700">Created At:</span>
                            <div className="text-gray-600">
                                {new Date(receipt.created_at).toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Payment:</span>
                            <div className="text-gray-600">
                                {d.payment_method ??
                                    d.transaction?.summary?.payment_method ??
                                    "-"}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Currency:</span>
                            <div className="text-gray-600">
                                {d.currency ??
                                    d.transaction?.summary?.currency ??
                                    receipt.currency ??
                                    "-"}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Table:</span>
                            <div className="text-gray-600">{d.table_number ?? "-"}</div>
                        </div>
                    </div>

                    {/* Address & Vendor Info */}
                    <div>
                        {d.address && (
                            <p className="text-gray-700">
                                <span className="font-medium">Address:</span> {d.address}
                            </p>
                        )}
                        {d.phone && (
                            <p className="text-gray-700">
                                <span className="font-medium">Phone:</span> {d.phone}
                            </p>
                        )}
                    </div>

                    {/* Totals */}
                    <div className="grid grid-cols-3 gap-3 border-t border-b py-3">
                        <div>
                            <p className="text-gray-500 text-xs">Subtotal</p>
                            <p className="font-semibold">
                                {d.currency ?? "IDR"}{" "}
                                {(
                                    d.subtotal ??
                                    d.transaction?.summary?.total_items ??
                                    0
                                ).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs">Tax</p>
                            <p className="font-semibold">
                                {d.currency ?? "IDR"}{" "}
                                {(d.tax ?? d.transaction?.summary?.ppn ?? 0).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs">Total</p>
                            <p className="font-semibold text-green-700">
                                {d.currency ?? "IDR"}{" "}
                                {(
                                    d.total ??
                                    d.transaction?.summary?.total_amount ??
                                    receipt.amount ??
                                    0
                                ).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Items */}
                    {items.length > 0 ? (
                        <div>
                            <h3 className="text-md font-semibold mb-2 border-b pb-1">
                                Items
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead className="bg-gray-100 text-gray-700">
                                        <tr>
                                            <th className="text-left p-2">Name</th>
                                            <th className="text-center p-2">Qty</th>
                                            <th className="text-right p-2">Total</th>
                                            <th className="text-center p-2">Category</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((it: any, idx: number) => (
                                            <tr
                                                key={idx}
                                                className="border-b hover:bg-gray-50 transition"
                                            >
                                                <td className="p-2">{it.name ?? "-"}</td>
                                                <td className="p-2 text-center">
                                                    {it.quantity ?? 1}
                                                </td>
                                                <td className="p-2 text-right">
                                                    {it.total_price
                                                        ? it.total_price.toLocaleString()
                                                        : "-"}
                                                </td>
                                                <td className="p-2 text-center text-gray-600">
                                                    {it.category ?? "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No items detected.</p>
                    )}

                    {/* Notes */}
                    {d.notes && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-300 p-3 rounded-md text-gray-700 text-sm">
                            <strong>Notes:</strong> {d.notes}
                        </div>
                    )}

                    {/* OCR Error */}
                    {d.error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-md text-red-600 text-sm">
                            <strong>OCR Error:</strong> {d.error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
