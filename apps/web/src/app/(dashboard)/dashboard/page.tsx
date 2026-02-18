export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Welcome to FlowChat. Your overview at a glance.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Contacts', value: '0', change: '+0%' },
          { label: 'Active Flows', value: '0', change: '+0%' },
          { label: 'Messages Sent', value: '0', change: '+0%' },
          { label: 'Open Conversations', value: '0', change: '+0%' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.change} from last month</p>
          </div>
        ))}
      </div>
    </div>
  )
}
