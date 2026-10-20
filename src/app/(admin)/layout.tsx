import '@/styles/global.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/components/ui/ThemeProvider';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
	title: { template: '%s | Vomatt Admin', default: 'Vomatt Admin' },
	robots: { index: false, follow: false },
};

// Root layout for the admin views; the Studio gets its own under (sanity)
export default function AdminLayout({ children }: { children: ReactNode }) {
	return (
		// next-themes sets the theme class on <html> before hydration
		<html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
			<body className="font-sans antialiased">
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
