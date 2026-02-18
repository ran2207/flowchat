export default function BroadcastsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Broadcasts</h1>
          <p className="mt-1 text-muted-foreground">Send targeted messages to your audience.</p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Create Broadcast
        </button>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <p className="text-lg font-medium text-foreground">No broadcasts yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first broadcast to send messages to your contacts.
        </p>
      </div>
    </div>
  )
}
