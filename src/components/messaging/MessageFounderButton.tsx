"use client";

import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ROLE_DASHBOARD_ROUTES } from "@/lib/roles";
import { useCreateConversationByCompany } from "@/hooks/queries/chat";

interface MessageFounderButtonProps {
  companyId: string;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}

// Contextual "Message Founder" action for Discovery / Opportunity Detail /
// Pipeline. Creates (or fetches) the conversation with the company's owner
// server-side, then opens the thread — no manual user-id entry.
export default function MessageFounderButton({
  companyId,
  label = "Message Founder",
  variant = "outline",
  size = "sm",
  className,
}: MessageFounderButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const createByCompany = useCreateConversationByCompany();

  const open = async () => {
    if (createByCompany.isPending) return;
    try {
      const convo = await createByCompany.mutateAsync(companyId);
      const base = user ? ROLE_DASHBOARD_ROUTES[user.role] : "/dashboard/investor";
      router.push(`${base}/messages?c=${convo.id}`);
    } catch {
      // Surfaced minimally; contextual action shouldn't block the host screen.
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={open}
      disabled={createByCompany.isPending}
    >
      <MessageSquare className="h-4 w-4" aria-hidden />
      {createByCompany.isPending ? "Opening…" : label}
    </Button>
  );
}
