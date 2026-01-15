'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/common/lib/class-name-utils';

export function HeaderNavigation() {
    const pathname = usePathname();

    const navItems = [
        { href: '/', label: 'Home' },
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/design-system', label: 'Design System' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 items-center">
                <nav className="flex items-center gap-6">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'text-sm font-medium transition-colors hover:text-foreground/80',
                                    isActive
                                        ? 'text-foreground'
                                        : 'text-muted-foreground'
                                )}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
