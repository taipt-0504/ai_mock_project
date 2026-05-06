import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex h-14 w-13 items-center">
      <Image
        src="/assets/header/logos/saa-logo.png"
        alt="Sun Annual Awards 2025"
        width={52}
        height={48}
        priority
      />
    </div>
  );
}
