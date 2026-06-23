// This layout removes the default padding from the parent dashboard wrapper
// so the clarifier workspace fills the full available area edge-to-edge.
export default function ClarifierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      {children}
    </div>
  );
}
