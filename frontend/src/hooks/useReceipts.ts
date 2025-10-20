// src/hooks/useReceipts.ts
import { useState, useEffect, useCallback } from "react";
import { getReceipts } from "../services/api";
import type { Receipt } from "../pages/ReceiptList";

export const useReceipts = (filters: Record<string, any> = {}) => {
    const [data, setData] = useState<Receipt[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getReceipts({ limit: 10, offset: page * 10, ...filters });
            const { results, total } = res.data || {};
            if (Array.isArray(results)) {
                setData(results);
                setTotal(total ?? results.length);
            } else if (Array.isArray(res.data)) {
                setData(res.data);
                setTotal(res.data.length);
            } else {
                setData([]);
                setTotal(0);
            }
        } catch (err) {
            console.error("Failed to load receipts:", err);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [page, JSON.stringify(filters)]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, total, page, setPage, loading, refetch: fetchData };
};
