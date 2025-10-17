import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8001",
});

export const getReceipts = (params?: any) => api.get("/receipts", { params });
export const uploadReceipt = (formData: FormData) =>
    api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

export default api;
