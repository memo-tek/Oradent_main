export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-stone-50">
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-3.5 0-6 1.5-7.5 4s-2.5 5-2.5 8c0 3 .5 6 1.5 9s2 6 3.5 8c1 1.5 2 2 3 .5.5-1 1-1 1.5-.5 1 1.5 2-.5 3-2 1.5-2.5 2.5-5 3.5-8s1.5-6 1.5-9c0-3-1-5.5-2.5-8S33.5 5 30 5z' fill='%231c1917' fill-opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
