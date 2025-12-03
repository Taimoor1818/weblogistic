import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function TestLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}