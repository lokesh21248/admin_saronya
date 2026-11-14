import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SARVONAYA | Enterprise Online Education Admin Portal',
  description: 'Mission-critical administration, student management, curriculum, Mux video, subscriptions, and Razorpay commerce for SARVONAYA.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F5F7FB] text-[#172033] min-h-screen">
        {children}
      </body>
    </html>
  );
}
