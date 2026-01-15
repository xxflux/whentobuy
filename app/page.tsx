import Link from 'next/link';
import { Button } from '@/common/ui';

export default function HomePage() {
    return (
        <div className="container mx-auto py-12">
            <div className="flex flex-col items-center justify-center gap-8">
                <h1 className="text-4xl font-bold">Design System Bootstrap</h1>
                <p className="text-muted-foreground text-center max-w-2xl">
                    A Next.js bootstrap template with a complete design system including components, 
                    typography, colors, and animations.
                </p>
                <div className="flex gap-4">
                    <Button asChild>
                        <Link href="/design-system">View Design System</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">Dashboard</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
