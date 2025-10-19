// src/pages/ReceiptList.tsx
import React, { useState } from "react";
import { ReceiptDetail } from "./ReceiptDetail";

export interface Receipt {
    id: string;
    vendor: string | null;
    amount: number | null;
    currency: string;
    category: string | null;
    expense_date: string | null;
    data: any;
    created_at: string;
    deleted: boolean;
}

interface Props {
    receipts: Receipt[];
}

export const ReceiptList: React.FC<Props> = ({ receipts }) => {
    const [selected, setSelected] = useState<Receipt | null>(null);

    // 🔍 Filter out receipts that failed OCR or are incomplete
    const validReceipts = receipts.filter((r) => {
        const hasError = !!r.data?.error;
        const hasVendor = !!r.vendor;
        const hasAmount = r.amount !== null && r.amount !== undefined;
        return !hasError && (hasVendor || hasAmount);
    });

    if (!validReceipts || validReceipts.length === 0) {
        return (
            <p className="text-center text-gray-500 mt-8">
                No valid receipts found yet. Try uploading one.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {validReceipts.map((r) => (
                <div
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`p-4 rounded-xl border shadow-sm transition cursor-pointer hover:shadow-md ${r.deleted ? "opacity-60 bg-gray-50" : "bg-white"
                        }`}
                >
                    <div className="flex justify-between items-start">
                        {/* Left Section */}
                        <div>
                            <p className="font-semibold text-lg">
                                {r.vendor ?? "Unknown Vendor"}
                            </p>
                            <p className="text-xs text-gray-500">
                                {new Date(r.created_at).toLocaleString()}
                            </p>
                            {r.category && (
                                <p className="text-xs text-gray-600 mt-1">
                                    Category:{" "}
                                    <span className="font-medium">
                                        {r.category}
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Right Section */}
                        {r.amount ? (
                            <p className="text-right text-green-700 font-semibold">
                                {r.currency} {r.amount.toLocaleString()}
                            </p>
                        ) : (
                            <p className="text-right text-sm text-gray-400 font-medium">
                                —
                            </p>
                        )}
                    </div>
                </div>
            ))}

            {/* Detail Modal */}
            {selected && (
                <ReceiptDetail
                    receipt={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
};
