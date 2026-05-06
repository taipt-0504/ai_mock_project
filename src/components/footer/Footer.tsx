/**
 * Footer (mms_D_Footer) — Server Component, non-interactive (FR-012),
 * fixed at the bottom of the Login viewport (FR-013). Spec restricts copy
 * to a single localized copyright line.
 */
const FOOTER_COPYRIGHT = "Bản quyền thuộc về Sun* © 2025";

export default function Footer() {
  return (
    <footer className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center border-t border-saa-divider px-[90px] py-10">
      <p className="font-display-alt text-base font-bold leading-6 text-saa-page-fg">
        {FOOTER_COPYRIGHT}
      </p>
    </footer>
  );
}
