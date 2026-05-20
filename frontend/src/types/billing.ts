export interface BillingItem {
    id: string;
    plan: string;
    price: number;
    date: string;
    tax: number;
    paymentMethod: {
        type: string;
        last4?: string;
        expiry: string;
    };
    status: "completed" | "pending" | "failed";
}
