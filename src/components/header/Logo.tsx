import Image from "next/image";
import Link from "next/link";

export default function Logo({ href }: { href?: string }) {
  const image = (
    <Image
      src="/assets/header/logos/saa-logo.png"
      alt="Sun Annual Awards 2025"
      width={52}
      height={48}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className="flex h-14 w-13 items-center">
        {image}
      </Link>
    );
  }

  return <div className="flex h-14 w-13 items-center">{image}</div>;
}
