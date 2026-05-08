import Link from "next/link";

export default function StubPage({ title }: { title: string }) {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-saa-page px-8 py-20 text-center text-saa-page-fg">
      <h1 className="font-display text-3xl font-bold leading-tight">{title}</h1>
      <p className="font-display text-base font-normal leading-6 opacity-80">
        Trang đang được xây dựng — sẽ ra mắt sớm.
      </p>
      <Link
        href="/"
        className="rounded-md border border-saa-button-primary px-6 py-3 font-display text-sm font-bold leading-5 tracking-[0.1px] text-saa-button-primary motion-safe:transition-colors hover:bg-saa-button-primary/10"
      >
        ← Quay lại trang chủ
      </Link>
    </main>
  );
}
