import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					// Staff-only app: never framed, never indexed
					{ key: 'X-Frame-Options', value: 'DENY' },
					{ key: 'X-Robots-Tag', value: 'noindex, nofollow' },
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
					{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
				],
			},
		];
	},
};

export default nextConfig;
