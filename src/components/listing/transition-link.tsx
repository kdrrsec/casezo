"use client";

import { useListingTransition } from "./listing-transition";

/**
 * Link binnen een productoverzicht die via de gedeelde overgang navigeert
 * (resultaten dimmen, scrollpositie blijft). Werkt ook zonder JavaScript.
 */
export function TransitionLink({
  href,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { navigate } = useListingTransition();
  return (
    <a
      {...rest}
      href={href}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
