export default function ContactsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="mt-1 text-muted-foreground">Manage your subscribers and contacts.</p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Import Contacts
        </button>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <p className="text-lg font-medium text-foreground">No contacts yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Contacts will appear here when people interact with your channels.
        </p>
      </div>
    </div>
  )
}
