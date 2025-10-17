import React, { useState } from "react";

interface Props {
    onFilterChange: (filters: Record<string, any>) => void;
}

export const ReceiptFilterBar: React.FC<Props> = ({ onFilterChange }) => {
    const [vendor, setVendor] = useState("");
    const [category, setCategory] = useState("");
    const [year, setYear] = useState("");
    const [month, setMonth] = useState("");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [includeDeleted, setIncludeDeleted] = useState(false);

    const handleApply = () => {
        onFilterChange({
            vendor: vendor || undefined,
            category: category || undefined,
            year: year ? parseInt(year) : undefined,
            month: month ? parseInt(month) : undefined,
            min_amount: minAmount ? parseFloat(minAmount) : undefined,
            max_amount: maxAmount ? parseFloat(maxAmount) : undefined,
            include_deleted: includeDeleted || undefined,
        });
    };

    const handleReset = () => {
        setVendor("");
        setCategory("");
        setYear("");
        setMonth("");
        setMinAmount("");
        setMaxAmount("");
        setIncludeDeleted(false);
        onFilterChange({});
    };

    return (
        <div className="bg-white border rounded-xl shadow-sm p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Filter Receipts
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                <input
                    type="text"
                    placeholder="Vendor"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="border rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-400"
                />

                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="border rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-400"
                >
                    <option value="">All Categories</option>
                    <option value="MAKANAN">Makanan</option>
                    <option value="MINUMAN">Minuman</option>
                    <option value="TAKE AWAY">Take Away</option>
                </select>

                <input
                    type="number"
                    placeholder="Year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="border rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-400"
                />

                <input
                    type="number"
                    placeholder="Month (1–12)"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="border rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-400"
                />

                <input
                    type="number"
                    placeholder="Min Amount"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="border rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-400"
                />

                <input
                    type="number"
                    placeholder="Max Amount"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="border rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-400"
                />

                <label className="flex items-center gap-2 text-gray-600 col-span-2 sm:col-span-1">
                    <input
                        type="checkbox"
                        checked={includeDeleted}
                        onChange={(e) => setIncludeDeleted(e.target.checked)}
                        className="accent-blue-600"
                    />
                    Include Deleted
                </label>
            </div>

            <div className="flex justify-end gap-3 mt-4">
                <button
                    onClick={handleReset}
                    className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
                >
                    Reset
                </button>
                <button
                    onClick={handleApply}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Apply
                </button>
            </div>
        </div>
    );
};
