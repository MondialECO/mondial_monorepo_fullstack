import BillingRow from "./BillingRow";
import { BillingItem } from "@/types/billing";

interface BillingTableProps {
    items?: BillingItem[];
}

export default function BillingTable({ items = [] }: BillingTableProps) {
    return (
        <div className="w-full overflow-x-auto">
            <div className="w-full md:min-w-[1000px] flex flex-col">
                <div className="w-full px-5 bg-muted/40 border-y border-border hidden md:inline-flex justify-start items-center">
                    <div className="w-40 h-11 px-4 py-3 flex justify-start items-center gap-3">
                        <div className="text-muted-foreground text-xs font-medium leading-5">Plan</div>
                    </div>
                    <div className="w-24 h-11 px-4 py-3 flex justify-start items-center gap-3">
                        <div className="text-muted-foreground text-xs font-medium leading-5">Price</div>
                    </div>
                    <div className="w-32 h-11 px-4 py-3 flex justify-start items-center gap-3">
                        <div className="text-muted-foreground text-xs font-medium leading-5">Date</div>
                    </div>
                    <div className="w-28 h-11 px-4 py-3 flex justify-start items-center gap-3">
                        <div className="text-muted-foreground text-xs font-medium leading-5">Taxes</div>
                    </div>
                    <div className="w-52 h-11 px-4 py-3 flex justify-start items-center gap-3">
                        <div className="text-muted-foreground text-xs font-medium leading-5">Payment Method</div>
                    </div>
                    <div className="w-28 h-11 px-4 py-3 flex justify-start items-center gap-3">
                        <div className="text-muted-foreground text-xs font-medium leading-5">Status</div>
                    </div>
                    <div className="w-32 h-11 px-6 py-3 flex justify-center items-center gap-3">
                        <div className="text-muted-foreground text-xs font-medium leading-5">Download</div>
                    </div>
                </div>
                {items.map((item) => (
                    <BillingRow key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}
