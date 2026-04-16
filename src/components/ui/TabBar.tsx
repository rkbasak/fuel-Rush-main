'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Fuel, Route, User, ListOrdered } from 'lucide-react';

const tabs = [
  { href: '/main/map', label: 'Map', icon: Map },
  { href: '/main/stations', label: 'Stations', icon: ListOrdered },
  { href: '/main/ration', label: 'Ration', icon: Fuel },
  { href: '/main/route', label: 'Route', icon: Route },
  { href: '/main/profile', label: 'Profile', icon: User },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-30 safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-7xl mx-auto px-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/main/map' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'text-primary' 
                  : 'text-text-muted hover:text-text-secondary'
                }
              `}
            >
              <div className={`relative ${isActive ? 'text-primary' : ''}`}>
                <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
