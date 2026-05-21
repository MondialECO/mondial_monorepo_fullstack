import { EntrepreneurProgressProvider } from "@/providers/EntrepreneurProgressProvider";

export default function EntrepreneurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EntrepreneurProgressProvider>{children}</EntrepreneurProgressProvider>;
}
