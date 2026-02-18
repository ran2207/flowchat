import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Flow<span className="text-primary">Chat</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Automate conversations across Instagram, Facebook, WhatsApp, TikTok, Telegram, SMS &
          Email. Build powerful chat flows with our visual builder.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/auth/register"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Get Started Free
          </Link>
          <Link
            href="/auth/login"
            className="text-sm font-semibold leading-6 text-foreground hover:text-primary"
          >
            Sign in <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
