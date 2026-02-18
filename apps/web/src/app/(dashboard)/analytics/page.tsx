export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
      <p className="mt-2 text-muted-foreground">Track your performance across all channels.</p>

      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <p className="text-lg font-medium text-foreground">No data yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Analytics will appear once your flows start processing messages.
        </p>
      </div>
    </div>
  )
}
