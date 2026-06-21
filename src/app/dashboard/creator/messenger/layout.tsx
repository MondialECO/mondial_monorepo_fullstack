export default function CreatorMessengerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex h-screen w-full overflow-hidden">{children}</div>;
}
