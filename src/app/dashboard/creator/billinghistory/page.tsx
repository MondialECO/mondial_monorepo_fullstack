"use client"
import BillingHeader from "@/components/billing/BillingHeader"
import BillingTable from "@/components/billing/BillingTable"
import Pagination from "@/components/billing/Pagination"

export default function BillingHistoryPage() {
    return (
        <div className="w-full flex flex-col gap-6">
            <BillingHeader />
            <div className="w-full py-6 bg-card rounded-xl sm:rounded-2xl shadow-sm border border-border flex flex-col gap-4 sm:gap-6 overflow-hidden">
                {/* Transaction History Header */}
                <div className="px-5 sm:px-6 md:px-8">
                    <h2 className="text-foreground text-lg font-semibold leading-7">Transaction History</h2>
                </div>

                <div className="flex flex-col w-full max-w-full min-w-0">
                    <BillingTable />
                </div>
                
                <Pagination />
            </div>
        </div>
    )
}