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
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-paper-white text-ink-black selection:bg-sprout-green selection:text-ink-black">
      <div className="w-full max-w-110 mx-auto">
        {children}
      </div>
    </div>
  );
}
