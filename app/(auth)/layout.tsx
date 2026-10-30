import AuthHeader from "@/components/shell/AuthHeader";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="auth-frame">
      <AuthHeader />
      <main id="main" className="auth-main">
        {children}
      </main>
    </div>
  );
}
