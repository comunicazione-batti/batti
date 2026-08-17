import Link from "next/link";
import Image from "next/image";

export function TopBar({ title, backHref }: { title: string; backHref?: string }) {
  return (
    <div className="topbar">
      <div className="brand">
        <Image src="/logo-icon.png" alt="BattiBecco" width={30} height={26} className="brand-icon" />
        <span className="brand-title">{title}</span>
      </div>
      <div>{backHref && <Link className="btn btn-ghost btn-sm" href={backHref}>Home</Link>}</div>
    </div>
  );
}
