import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8001",
});

// Get list of receipts with pagination + filters
export const getReceipts = (params?: Record<string, any>) =>
    api.get("/receipts", { params });

// Upload a new receipt
export const uploadReceipt = (formData: FormData) =>
    api.post("/receipts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

export default api;
