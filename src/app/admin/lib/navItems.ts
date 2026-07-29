import { LayoutGrid, ChevronsUp, TrendingUp, Wallet, Users, Bell, ListChecks, Trophy } from 'lucide-react';

export const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/upgrade', label: 'Upgrade', icon: ChevronsUp },
  { href: '/admin/investments', label: 'Investments', icon: TrendingUp },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: Wallet },
  { href: '/admin/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/admin/popup', label: 'Notification', icon: Bell },
  { href: '/admin/users', label: 'Users', icon: Users }
] as const;
