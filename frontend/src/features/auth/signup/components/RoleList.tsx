import { ReactNode } from "react";

interface RoleListProps {
  children: ReactNode;
}

export function RoleList({ children }: RoleListProps) {
  return (
    <div className="flex flex-col gap-3.5">
      {children}
    </div>
  );
}
