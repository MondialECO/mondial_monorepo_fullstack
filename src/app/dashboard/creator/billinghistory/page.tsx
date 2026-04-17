"use client"
import BillingHeader from "@/components/billing/BillingHeader"
import BillingTable from "@/components/billing/BillingTable"
import Pagination from "@/components/billing/Pagination"
import { useBillingHistory } from "@/hooks/queries/creator"

export default function BillingHistoryPage() {
    const { data: billingItems = [], isLoading, isError, error } = useBillingHistory()

    return (
        <div className="w-full flex flex-col gap-6">
            <BillingHeader />
            <div className="w-full py-6 bg-card rounded-xl sm:rounded-2xl shadow-sm border border-border flex flex-col gap-4 sm:gap-6 overflow-hidden">
                {/* Transaction History Header */}
                <div className="px-5 sm:px-6 md:px-8">
                    <h2 className="text-foreground text-lg font-semibold leading-7">Transaction History</h2>
                </div>

                {isLoading && (
                    <div className="px-5 sm:px-6 md:px-8 py-8 flex justify-center items-center">
                        <div className="text-muted-foreground">Loading billing history...</div>
                    </div>
                )}

                {isError && (
                    <div className="px-5 sm:px-6 md:px-8 py-8 flex justify-center items-center">
                        <div className="text-destructive">
                            Failed to load billing history. {error instanceof Error ? error.message : 'Please try again later.'}
                        </div>
                    </div>
                )}

                {!isLoading && !isError && billingItems.length === 0 && (
                    <div className="px-5 sm:px-6 md:px-8 py-8 flex justify-center items-center">
                        <div className="text-muted-foreground">No billing history found.</div>
                    </div>
                )}

                {!isLoading && !isError && billingItems.length > 0 && (
                    <>
                        <div className="flex flex-col w-full max-w-full min-w-0">
                            <BillingTable items={billingItems} />
                        </div>

                        <Pagination />
                    </>
                )}
            </div>
        </div>
    )
}