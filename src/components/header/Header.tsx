import LanguageSelector from "@/src/components/header/LanguageSelector";
import Logo from "@/src/components/header/Logo";

export default function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-10 flex h-20 items-center justify-between bg-saa-header px-36 py-3">
      <Logo />
      <LanguageSelector />
    </header>
  );
}
