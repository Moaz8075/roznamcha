export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand">
        Roznamcha
      </p>
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-brand">
        Web app placeholder
      </h1>
      <p className="mb-8 text-lg leading-relaxed text-black/70">
        The mobile app ships first. This Next.js app will share{' '}
        <code className="rounded bg-brand-muted px-1.5 py-0.5 text-sm">
          @roznamcha/api-client
        </code>
        , types, and validation packages with the same NestJS API.
      </p>
      <ul className="space-y-2 text-base text-black/80">
        <li>• API: NestJS at /api/v1</li>
        <li>• Mobile: Expo + Expo Router</li>
        <li>• Shared packages under /packages</li>
      </ul>
    </main>
  );
}
