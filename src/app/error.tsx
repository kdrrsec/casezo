"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-shop py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Er ging iets mis</h1>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        Deze pagina kon niet worden geladen. Probeer het opnieuw; lukt het niet, kom dan later terug.
      </p>
      <button type="button" onClick={reset} className="btn btn-primary mt-6">
        Opnieuw proberen
      </button>
    </div>
  );
}
