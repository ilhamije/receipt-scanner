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

    if (!receipts || receipts.length === 0) {
        return (
            <p className="text-center text-gray-500 mt-8">
                No receipts found yet. Try uploading one.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {receipts.map((r) => (
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
                                    Category: <span className="font-medium">{r.category}</span>
                                </p>
                            )}
                        </div>

                        {/* Right Section */}
                        {r.amount ? (
                            <p className="text-right text-green-700 font-semibold">
                                {r.currency} {r.amount.toLocaleString()}
                            </p>
                        ) : (
                            <p className="text-right text-sm text-red-500 font-medium">
                                OCR Error
                            </p>
                        )}
                    </div>

                    {/* Optional OCR error message */}
                    {r.data?.error && (
                        <p className="text-red-500 text-xs mt-2 border-t pt-2">
                            {r.data.error}
                        </p>
                    )}
                </div>
            ))}

            {/* Detail Modal */}
            {selected && (
                <ReceiptDetail receipt={selected} onClose={() => setSelected(null)} />
            )}
        </div>
    );
};
