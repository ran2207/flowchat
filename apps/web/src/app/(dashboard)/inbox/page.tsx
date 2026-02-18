export default function InboxPage() {
  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-border">
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <h1 className="text-lg font-semibold text-foreground">Inbox</h1>
          <div className="flex gap-2">
            <button className="rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Open
            </button>
            <button className="rounded-md px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent">
              All
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">No conversations yet</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-lg font-medium text-foreground">Select a conversation</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a conversation from the sidebar to start chatting.
        </p>
      </div>
    </div>
  )
}
