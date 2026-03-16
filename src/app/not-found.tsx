import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24 text-center">
      <h1 className="text-5xl font-bold mb-4 text-foreground">404</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Oops! The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-lg bg-foreground text-background px-4 h-9 text-sm font-medium hover:opacity-90 transition-opacity"
      >
        ← Back to home
      </Link>
    </main>
  )
}
