import { memo } from "react";
import { Download, CreditCard, ChevronRight } from "lucide-react";
import { BillingItem } from "@/types/billing";

interface BillingRowProps {
    item: BillingItem;
}

const BillingRow = memo(({ item }: BillingRowProps) => {
    return (
        <div className="w-full px-5 py-4 md:py-0 border-b border-border flex flex-col md:inline-flex md:flex-row justify-start md:items-center hover:bg-muted/10 transition-colors gap-3 md:gap-0">
            {/* Plan */}
            <div className="w-full md:w-40 md:h-16 md:p-4 flex justify-between md:justify-start items-center">
                <span className="md:hidden text-muted-foreground text-sm font-semibold">Plan</span>
                <div className="px-2 py-1 bg-card rounded-md border border-border flex justify-start items-center gap-1.5 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <div className="text-center text-foreground text-xs font-medium leading-5">{item.plan}</div>
                </div>
            </div>

            {/* Price */}
            <div className="w-full md:w-24 md:h-16 md:p-4 flex justify-between md:justify-start items-center">
                <span className="md:hidden text-muted-foreground text-sm font-semibold">Price</span>
                <div className="text-muted-foreground text-sm font-normal leading-5">${item.price.toFixed(2)}</div>
            </div>

            {/* Date */}
            <div className="w-full md:w-32 md:h-16 md:p-4 flex justify-between md:justify-start items-center">
                <span className="md:hidden text-muted-foreground text-sm font-semibold">Date</span>
                <div className="text-muted-foreground text-sm font-normal leading-5">{item.date}</div>
            </div>

            {/* Tax */}
            <div className="w-full md:w-28 md:h-16 md:p-4 flex justify-between md:justify-start items-center">
                <span className="md:hidden text-muted-foreground text-sm font-semibold">Taxes</span>
                <div className="text-muted-foreground text-sm font-normal leading-5">${item.tax.toFixed(2)}</div>
            </div>

            {/* Payment Method */}
            <div className="w-full md:w-52 md:h-16 md:p-4 flex justify-between md:justify-start items-center gap-3">
                <span className="md:hidden text-muted-foreground text-sm font-semibold">Method</span>
                <div className="flex items-center gap-3">
                    <div className="w-11 h-8 bg-muted rounded-md border border-border flex items-center justify-center shadow-sm">
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="inline-flex flex-col justify-start items-start">
                        <div className="text-muted-foreground text-xs font-normal leading-5 text-right md:text-left">{item.paymentMethod.type}</div>
                        <div className="text-muted-foreground text-xs font-normal leading-5 text-right md:text-left">Expires {item.paymentMethod.expiry}</div>
                    </div>
                </div>
            </div>

            {/* Status */}
            <div className="w-full md:w-28 md:h-16 md:p-4 flex justify-between md:justify-start items-center">
                <span className="md:hidden text-muted-foreground text-sm font-semibold">Status</span>
                <div className="text-green-600 dark:text-green-500 text-sm font-semibold leading-5 capitalize">{item.status}</div>
            </div>

            {/* Download */}
            <div className="w-full md:w-32 md:h-16 pt-2 md:pt-0 md:p-4 flex justify-end md:justify-center items-center">
                <button aria-label="Download Invoice" className="w-full md:w-auto p-2 border border-border md:border-transparent rounded-lg flex justify-center items-center gap-2 hover:bg-muted transition-colors text-foreground md:text-muted-foreground hover:text-foreground shadow-sm md:shadow-none">
                    <span className="md:hidden text-sm font-semibold">Download</span>
                    <Download className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
});

BillingRow.displayName = "BillingRow";
export default BillingRow;
