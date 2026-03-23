export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full h-screen p-4 md:p-6 gap-6 relative z-10">
      {children}
    </div>
  );
}
