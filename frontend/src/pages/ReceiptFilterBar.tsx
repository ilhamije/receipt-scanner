// src/pages/ReceiptFilterBar.tsx
import React, { useState, useEffect } from "react";

interface Props {
    onFilterChange: (filters: Record<string, any>) => void;
}

export const ReceiptFilterBar: React.FC<Props> = ({ onFilterChange }) => {
    const [search, setSearch] = useState(localStorage.getItem("receiptSearch") || "");
    const [category, setCategory] = useState(localStorage.getItem("receiptCategory") || "");

    // Handle filter updates (in real-time)
    useEffect(() => {
        const filters: Record<string, any> = {
            search: search || undefined,
            category: category || undefined,
        };

        // Store to localStorage
        localStorage.setItem("receiptSearch", search);
        localStorage.setItem("receiptCategory", category);

        // Trigger callback
        onFilterChange(filters);
    }, [search, category]);

    return (
        <div className="bg-white border rounded-xl shadow-sm p-3 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex-1 flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Search receipts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-400"
                />

                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="border rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-400"
                >
                    <option value="">All</option>
                    <option value="MAKANAN">Makanan</option>
                    <option value="MINUMAN">Minuman</option>
                    <option value="TAKE AWAY">Take Away</option>
                </select>
            </div>
        </div>
    );
};
