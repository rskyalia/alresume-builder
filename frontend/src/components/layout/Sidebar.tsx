'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, LogOut } from 'lucide-react';

import { cn } from '@/lib/utils';
import { CreditBadge } from '@/components/layout/CreditBadge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/contexts/AuthContext';

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/resumes', label: 'Resume Saya', icon: FileText },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthContext();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r bg-background">
      {/* Brand */}
      <div className="flex h-14 items-center px-4 font-semibold tracking-tight">
        <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
          AlresumeBuilder
        </Link>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 flex-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer: credits + logout */}
      <div className="flex flex-col gap-3 p-3">
        {user && (
          <div className="px-1">
            <CreditBadge plan={user.plan} credits={user.resume_credits} />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Keluar
        </Button>
      </div>
    </aside>
  );
}

export default Sidebar;
