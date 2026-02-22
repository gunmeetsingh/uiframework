import { AppShell } from '@/components/Shell/AppShell';

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppShell>{children}</AppShell>;
}
