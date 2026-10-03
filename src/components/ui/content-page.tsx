import { Breadcrumbs, type Crumb } from "./breadcrumbs";

export function ContentPage({
  title,
  intro,
  breadcrumbs,
  children,
  aside,
}: {
  title: string;
  intro?: string;
  breadcrumbs: Crumb[];
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="container-shop pt-4 pb-8 lg:pt-6">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-3 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article className="max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight lg:text-[1.75rem]">{title}</h1>
          {intro && <p className="mt-2 text-[0.9375rem] text-ink-soft">{intro}</p>}
          <div className="prose-shop mt-6">{children}</div>
        </article>
        {aside}
      </div>
    </div>
  );
}
