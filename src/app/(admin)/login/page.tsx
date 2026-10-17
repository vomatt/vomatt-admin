import type { Metadata } from 'next';

import { LoginForm } from '@/components/LoginForm';
import { SessionEndReason } from '@/lib/login';
import { getSafeRedirectPath } from '@/lib/routes';

export const metadata: Metadata = { title: 'Sign in' };

// Set by the proxy and by admin views when the API ends the session
const NOTICES: Record<SessionEndReason, string> = {
	expired: 'Your session has ended. Sign in again.',
	security: 'You were signed out for security. Sign in again.',
	forbidden: 'This account no longer has admin access.',
};

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
	const params = await searchParams;
	const redirect = typeof params.redirect === 'string' ? params.redirect : null;
	const reason = params.session_expired as SessionEndReason | undefined;

	return (
		<main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8">
			<h1 className="display-heading text-2xl">Vomatt Admin</h1>
			<LoginForm redirectTo={getSafeRedirectPath(redirect)} notice={reason ? NOTICES[reason] : undefined} />
		</main>
	);
}
