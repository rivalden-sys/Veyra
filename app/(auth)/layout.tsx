export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-10 text-[#15171a]">
      {children}
    </main>
  );
}
