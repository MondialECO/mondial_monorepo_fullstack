'use client';

import { useAuth } from '@/app/_providers/AuthProvider';
import { UserRole } from '@/lib/roles';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const ROLES: UserRole[] = ['Admin', 'Creator', 'Investor', 'Entrepreneur', 'ServiceProvider'];

const ROLE_ROUTES: Record<UserRole, string> = {
  Admin: '/dashboard/admin',
  Creator: '/dashboard/creator',
  Investor: '/dashboard/investor',
  Entrepreneur: '/dashboard/entrepreneur',
  ServiceProvider: '/dashboard/serviceprovider',
};

export default function RoleSwitcher() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!user || !token) return null;

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole === user.role) {
      setIsOpen(false);
      return;
    }

    // Update the user object with new role
    const updatedUser = { ...user, role: newRole };

    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));

    setIsOpen(false);

    // Redirect to the new role's dashboard
    router.push(ROLE_ROUTES[newRole]);

    // Refresh the page to update auth context
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium"
      >
        <span className="hidden sm:inline">{user.role}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-background shadow-lg z-50">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => handleRoleChange(role)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                role === user.role
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'hover:bg-muted'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
