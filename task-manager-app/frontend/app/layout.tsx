import './globals.css';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'TaskMaster AI — Smart Scheduling, Tough-Love Alerts & Roadmaps',
  description: 'AI-driven task organizer that fits commitments into your actual free hours, keeps you accountable with harsh reminders, and decomposes goals into execution roadmaps.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22%20%220%22%20%22100%22%20%22100%22><text y=%22.9em%22 font-size=%2290%22>🎯</text></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#f8fafc] text-slate-900 antialiased selection:bg-rose-500 selection:text-white bg-grid-pattern pb-24 md:pb-12">
        <div className="relative min-h-screen flex flex-col">
          {/* Ambient luminous glow top banner */}
          <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-r from-violet-500/10 via-rose-500/10 to-amber-500/10 blur-[100px] rounded-full -z-10" />
          
          <main className="flex-1 w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
