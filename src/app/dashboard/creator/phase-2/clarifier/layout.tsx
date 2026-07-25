// The Phase 2 chrome (dashboard layout) already suppresses padding for this route
// and supplies the reduced top bar + shared footer. This wrapper lays the clarifier
// out in normal flow — the transcript scrolls within its own bounds (stage 3),
// rather than the page being pinned to the viewport height with a second scroll.
export default function ClarifierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex w-full flex-col">{children}</div>;
}
