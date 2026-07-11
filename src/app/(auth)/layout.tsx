import AnimatedBackground from "@/components/auth/AnimatedBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] bg-white">
      <div className="hidden lg:block relative">
        <AnimatedBackground />
      </div>
      <div className="relative flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-10 sm:py-16">
          <div className="max-w-md mx-auto w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
