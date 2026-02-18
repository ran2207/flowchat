export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your account, channels, and integrations.
      </p>

      <div className="mt-8 space-y-6">
        <section className="rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your business account settings.
          </p>
        </section>

        <section className="rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">Channels</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect and manage your messaging channels.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {['Instagram', 'Facebook', 'WhatsApp', 'TikTok', 'Telegram', 'SMS', 'Email'].map(
              (channel) => (
                <div
                  key={channel}
                  className="flex items-center justify-between rounded-md border border-border p-4"
                >
                  <span className="text-sm font-medium text-foreground">{channel}</span>
                  <button className="rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                    Connect
                  </button>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">Team</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage team members and roles.</p>
        </section>

        <section className="rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">Billing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your subscription and billing.
          </p>
        </section>
      </div>
    </div>
  )
}
