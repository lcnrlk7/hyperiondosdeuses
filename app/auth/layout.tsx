export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Forca o tema claro (fintech azul) em todas as telas de autenticacao
  return <div className="light bg-background text-foreground min-h-screen">{children}</div>;
}
