import Phase2Footer from "@/components/layout/Phase2Footer";

export default function Phase2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Content (provided by page and sub-routes) */}
      <div className="flex-1">
        {children}
      </div>

      {/* Phase 2 Footer */}
      <Phase2Footer />
    </div>
  );
}
