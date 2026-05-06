/**
 * Login route segment layout. Renders only the children — the Header and
 * Footer are positioned absolutely by the page itself so they overlay the
 * background artwork stack.
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
