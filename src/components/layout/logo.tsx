import Image from "next/image";
import Link from "next/link";

import logo from "../../../public/brand/casezo-logo.png";

/** Casezo-logo; bronbestand staat in public/brand/casezo-logo.png. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex shrink-0 items-center ${className}`} aria-label="Casezo – naar de homepage">
      <Image src={logo} alt="Casezo" width={156} height={28} loading="eager" className="h-[22px] w-auto lg:h-7" />
    </Link>
  );
}
