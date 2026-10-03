import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-shop py-16 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Deze pagina bestaat niet (meer)</h1>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        Misschien is het product niet meer leverbaar of is de link veranderd. Zoek hierboven of ga terug naar de
        homepage.
      </p>
      <Link href="/" className="btn btn-primary mt-6">
        Naar de homepage
      </Link>
    </div>
  );
}
