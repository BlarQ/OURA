import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — AdeManual',
  description: 'Sign in to access your AdeManual IT procedure documentation.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#ffffff] text-[#040404] selection:bg-[#98e58e] selection:text-[#040404]">
      <div className="w-full max-w-[440px] mx-auto">
        {children}
      </div>
    </div>
  );
}
