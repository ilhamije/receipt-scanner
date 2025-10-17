import { useState, useEffect } from "react";
import { getReceipts } from "../services/api";
import type { Receipt } from "../types/receipt";

export const useReceipts = (filters = {}) => {
    const [data, setData] = useState<Receipt[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        getReceipts({ limit: 10, offset: page * 10, ...filters })
            .then((res) => {
                setData(res.data.results);
                setTotal(res.data.total);
            })
            .finally(() => setLoading(false));
    }, [page, JSON.stringify(filters)]);

    return { data, total, page, setPage, loading };
};
