'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  Truck, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { type: 'divider' },
  { name: 'Parti', href: '/parti', icon: Boxes },
  { name: 'Prodotti', href: '/prodotti', icon: Package },
  { name: 'Fornitori', href: '/fornitori', icon: Truck },
  { type: 'divider' },
  { name: 'Vendite', href: '/vendite', icon: ShoppingCart },
  { name: 'Report', href: '/report', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) setIsCollapsed(savedState === 'true');
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  const isAdmin = (session?.user as any)?.ruolo === 'ADMIN';

  const allNavItems = isAdmin 
    ? [...navItems, { type: 'divider' }, { name: 'Utenti', href: '/utenti', icon: Users }]
    : navItems;

  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-indigo-100 text-indigo-700',
    MANAGER: 'bg-emerald-100 text-emerald-700',
    VIEWER: 'bg-gray-100 text-gray-700'
  };
  const roleColor = roleColors[(session?.user as any)?.ruolo || 'VIEWER'] || roleColors.VIEWER;

  if (!isMounted) return null;

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsMobileOpen(!isMobileOpen)} className="bg-surface shadow-sm">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 bg-surface border-r border-border transform transition-all duration-300 ease-in-out flex flex-col md:relative",
        isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
        isCollapsed ? "md:w-20" : "md:w-64"
      )}>
        <div className="flex items-center h-16 px-4 border-b border-border justify-between">
          <div className="flex items-center overflow-hidden">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary rounded-lg text-white">
              <Package className="h-6 w-6" />
            </div>
            <span className={cn(
              "text-lg font-bold ml-3 text-text-primary transition-opacity duration-300 whitespace-nowrap",
              isCollapsed ? "opacity-0 w-0" : "opacity-100"
            )}>
              MagazzinoApp
            </span>
          </div>
          <button 
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-md hover:bg-gray-100 text-text-secondary"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 overflow-x-hidden">
          <nav className="space-y-1 px-3">
            {allNavItems.map((item, index) => {
              if (item.type === 'divider') {
                return <div key={`div-${index}`} className="h-px bg-border my-4 mx-2" />;
              }

              const isActive = pathname.startsWith(item.href as string);
              return (
                <div key={item.name} className="relative group">
                  <Link
                    href={item.href as string}
                    className={cn(
                      "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 relative",
                      isActive 
                        ? "bg-indigo-50 text-indigo-900" 
                        : "text-text-secondary hover:bg-gray-50 hover:text-text-primary",
                      isCollapsed ? "justify-center px-0" : ""
                    )}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r-full" />
                    )}
                    {item.icon && (
                      <item.icon className={cn(
                        "flex-shrink-0 h-5 w-5",
                        isActive ? "text-primary" : "text-text-secondary group-hover:text-text-primary",
                        !isCollapsed && "mr-3"
                      )} />
                    )}
                    <span className={cn(
                      "transition-all duration-300 whitespace-nowrap",
                      isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                    )}>
                      {item.name}
                    </span>
                  </Link>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                      {item.name}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border">
          <div className={cn(
            "flex items-center mb-4",
            isCollapsed ? "justify-center" : "px-2"
          )}>
            <div className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm",
              roleColor
            )}>
              {userInitials}
            </div>
            
            <div className={cn(
              "flex-1 min-w-0 ml-3 transition-all duration-300",
              isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"
            )}>
              <p className="text-sm font-medium text-text-primary truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-text-secondary truncate">
                {(session?.user as any)?.ruolo}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className={cn(
              "w-full text-danger hover:text-danger hover:bg-red-50",
              isCollapsed ? "justify-center px-0" : "justify-start"
            )}
            onClick={() => signOut({ callbackUrl: '/login' })}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && "Logout"}
          </Button>
        </div>
      </div>

      {/* Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
