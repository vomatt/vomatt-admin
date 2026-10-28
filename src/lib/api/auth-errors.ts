// Sign-in messages by backend errorCode. vomatt-web keeps these in its
// locale files; the admin UI is English only.
const MESSAGES: Record<string, string> = {
	'auth.admin.forbidden': 'This account does not have admin access.',
	'auth.invalid_otp': 'That code is incorrect.',
	'auth.otp.invalid_or_expired': 'That code has expired. Request a new one.',
	'auth.otp.too_many_attempts': 'Too many wrong codes. Request a new one.',
	'auth.otp.resend_cooldown': 'A code was sent recently. Wait before requesting another.',
	'auth.email.send_failed': 'The email could not be sent. Try again later.',
	'auth.account_banned': 'This account is suspended.',
	'auth.passkey.invalid': 'That passkey could not be verified. Try again.',
};

/** Maps a backend `errorCode` and HTTP status to a message the login form shows. */
export function toAuthErrorMessage(errorCode: string | undefined, status?: number): string {
	if (errorCode && MESSAGES[errorCode]) return MESSAGES[errorCode];
	if (status === 429) return 'Too many requests. Try again in a moment.';
	if (status === 400) return 'Enter a valid email address.';
	return 'Something went wrong. Try again.';
}
