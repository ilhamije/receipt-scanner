// src/services/api.ts
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8001",
    timeout: 30000, // avoid hanging requests
});

// Fetch receipts with optional filters & pagination
export const getReceipts = (params?: Record<string, any>) =>
    api.get("/receipts/", { params });

// Upload a new receipt
export const uploadReceipt = (formData: FormData) =>
    api.post("/receipts/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

// Fetch a single receipt detail
export const getReceiptDetail = (id: string) => {
    return api.get(`/receipts/${id}`);
};

// Update an existing receipt (PATCH)
export const updateReceipt = (id: string, payload: Record<string, any>) =>
    api.patch(`/receipts/${id}`, payload);

export const deleteReceipt = (id: string) => api.delete(`/receipts/${id}`);

export default api;
