// src/pages/DashboardPage.tsx
import React from "react";
import { BarChart3, FileText, CreditCard } from "lucide-react";

export default function DashboardPage() {
    // Mock summary data — later this can be fetched from backend analytics
    const stats = [
        {
            label: "Total Receipts",
            value: 42,
            icon: <FileText className="w-6 h-6 text-blue-600" />,
            color: "bg-blue-50",
        },
        {
            label: "Total Spent",
            value: "IDR 5,470,000",
            icon: <CreditCard className="w-6 h-6 text-green-600" />,
            color: "bg-green-50",
        },
        {
            label: "Average per Receipt",
            value: "IDR 130,000",
            icon: <BarChart3 className="w-6 h-6 text-purple-600" />,
            color: "bg-purple-50",
        },
    ];

    const recent = [
        { vendor: "Bebek Kaleyo", total: 292006, date: "2025-10-17" },
        { vendor: "Starbucks", total: 58000, date: "2025-10-14" },
        { vendor: "Indomaret", total: 120000, date: "2025-10-10" },
    ];

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {stats.map((s, i) => (
                    <div
                        key={i}
                        className={`flex items-center gap-3 p-4 rounded-xl shadow-sm border ${s.color}`}
                    >
                        <div className="p-2 bg-white rounded-lg shadow-sm">{s.icon}</div>
                        <div>
                            <p className="text-gray-500 text-sm">{s.label}</p>
                            <p className="text-lg font-semibold">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent receipts list */}
            <div className="bg-white border rounded-xl shadow-sm p-4">
                <h2 className="text-lg font-semibold mb-3">Recent Receipts</h2>
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100 text-gray-600">
                        <tr>
                            <th className="text-left p-2">Vendor</th>
                            <th className="text-right p-2">Total</th>
                            <th className="text-center p-2">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recent.map((r, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="p-2">{r.vendor}</td>
                                <td className="p-2 text-right">IDR {r.total.toLocaleString()}</td>
                                <td className="p-2 text-center text-gray-600">{r.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Placeholder for future chart */}
            <div className="mt-8 text-center text-gray-400 italic">
                [Chart placeholder — spending trend will go here]
            </div>
        </div>
    );
}
