export function TopNav() {
  return (
    <header className="isolate h-16 border-b border-border bg-background-main/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span>App</span>
        <span className="text-border">/</span>
        <span className="text-text-primary font-medium">Dashboard</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-500">
            System Healthy
          </span>
        </div>
      </div>
    </header>
  );
}
