export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-4px_rgba(15,23,42,0.08)]">
        {children}
      </div>
    </div>
  );
}
