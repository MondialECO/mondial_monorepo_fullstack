"use client"
import BillingHeader from "@/components/billing/BillingHeader"
import BillingTable from "@/components/billing/BillingTable"
import Pagination from "@/components/billing/Pagination"
import { useBillingHistory } from "@/hooks/queries/creator"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/providers/LanguageProvider"

export default function BillingHistoryPage() {
    const { t } = useLanguage()
    const { data, isLoading, isError, error, refetch } = useBillingHistory()
    const billingItems = data ?? []

    return (
        <div className="w-full flex flex-col gap-6">
            <BillingHeader />
            <div className="w-full py-6 bg-card rounded-xl sm:rounded-2xl shadow-sm border border-border flex flex-col gap-4 sm:gap-6 overflow-hidden">
                {/* Transaction History Header */}
                <div className="px-5 sm:px-6 md:px-8">
                    <h2 className="text-foreground text-lg font-semibold leading-7">{t('creator.billing.title', 'Transaction History')}</h2>
                </div>

                {isLoading && (
                    <div className="px-5 sm:px-6 md:px-8 py-8 flex justify-center items-center">
                        <div className="text-muted-foreground">{t('creator.billing.loading', 'Loading billing history...')}</div>
                    </div>
                )}

                {isError && (
                    <div className="px-5 sm:px-6 md:px-8 py-8 flex flex-col gap-3 justify-center items-center text-center">
                        <div className="text-destructive">
                            {t('creator.billing.error', "Couldn't load billing history.")} {error instanceof Error ? error.message : 'Please try again.'}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => refetch()}>{t('creator.billing.retry', 'Retry')}</Button>
                    </div>
                )}

                {!isLoading && !isError && billingItems.length === 0 && (
                    <div className="px-5 sm:px-6 md:px-8 py-8 flex justify-center items-center">
                        <div className="text-muted-foreground">{t('creator.billing.empty', 'No billing history found.')}</div>
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