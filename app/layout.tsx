import { TooltipProvider } from '@/common/ui';
import { HeaderNavigation } from '@/common/components';
import { ThemeProvider } from 'next-themes';
import type { Metadata } from 'next';

import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';

import '../public/assets/globals.css';

export const metadata: Metadata = {
    title: 'Design System Bootstrap',
    description: 'Bootstrap template with design system',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ThemeProvider attribute="class" defaultTheme="light" themes={['light', 'dark']}>
                    <div className="flex min-h-screen flex-col">
                        <HeaderNavigation />
                        <TooltipProvider>
                            <main className="flex-1">{children}</main>
                        </TooltipProvider>
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
