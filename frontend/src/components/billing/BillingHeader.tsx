export default function BillingHeader() {
    return (
        <div className="w-full px-2 sm:px-0">
            <div className="inline-flex flex-col justify-start items-start gap-1 sm:gap-2">
                <h1 className="text-foreground text-xl sm:text-2xl font-semibold leading-6">Billing History</h1>
                <p className="text-muted-foreground text-sm font-normal leading-5">View all past payments in one place.</p>
            </div>
        </div>
    );
}
