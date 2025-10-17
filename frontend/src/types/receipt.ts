export interface Receipt {
    id: string;
    vendor: string | null;
    amount: number | null;
    currency: string;
    category: string | null;
    expense_date: string | null;
    data: Record<string, any>;
    created_at: string;
    deleted: boolean;
}
