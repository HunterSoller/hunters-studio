"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { smoothScrollTo } from "@/lib/motion";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/** Same-page hash links get an eased scroll; cross-page links fall through to normal Next navigation. */
export default function ScrollLink({ href, onClick, ...rest }: Props) {
  const pathname = usePathname();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const [path, hash] = href.split("#");
    if (!hash || (path && path !== pathname)) return;
    if (smoothScrollTo(hash)) e.preventDefault();
  };

  return <Link href={href} onClick={handleClick} {...rest} />;
}
