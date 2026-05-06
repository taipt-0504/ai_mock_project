import Image from "next/image";

import LoginButton from "@/src/components/login/LoginButton";

const HERO_DESCRIPTION = "Bắt đầu hành trình của bạn cùng SAA 2025.\nĐăng nhập để khám phá!";

export default function HeroSection() {
  return (
    <section className="relative z-10 flex min-h-[845px] w-full flex-col items-start justify-center px-36 py-24">
      <div className="flex w-full max-w-[1152px] flex-col items-start justify-center gap-20">
        {/* B.1 — "ROOT FURTHER" key visual (rendered as image in Figma) */}
        <div className="flex flex-col items-start gap-6">
          <Image
            src="/assets/login/images/root-further.png"
            alt="ROOT FURTHER"
            width={451}
            height={200}
            priority
          />
        </div>
        {/* B.2 — description + B.3 — login button */}
        <div className="flex flex-col items-start gap-6 pl-4">
          <p className="font-display text-xl font-bold leading-10 tracking-[0.5px] whitespace-pre-line text-saa-page-fg">
            {HERO_DESCRIPTION}
          </p>
          <LoginButton />
        </div>
      </div>
    </section>
  );
}
