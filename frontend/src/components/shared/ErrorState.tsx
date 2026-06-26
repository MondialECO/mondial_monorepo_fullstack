export interface ErrorStateProps {
  title?: string;
  message?: string;
}

export default function ErrorState({
  title = "Error",
  message = "Failed to load data. Please try again later.",
}: ErrorStateProps) {
  return (
    <div className="w-full max-w-7xl mx-auto text-center py-12">
      <div className="mb-4">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-800">
          <span className="text-xl text-red-500">⚠️</span>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto">{message}</p>
    </div>
  );
}
