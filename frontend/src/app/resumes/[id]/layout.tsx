import { Sidebar } from '@/components/layout/Sidebar';

export default function ResumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-muted/40 p-6">{children}</main>
    </div>
  );
}
