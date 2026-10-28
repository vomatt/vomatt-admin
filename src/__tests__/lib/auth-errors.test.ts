import { toAuthErrorMessage } from '@/lib/api/auth-errors';

describe('toAuthErrorMessage', () => {
	it('explains the daily OTP send limit instead of the generic 429 text', () => {
		expect(toAuthErrorMessage('auth.otp.daily_limit', 429)).toBe(
			'Too many codes requested today. Try again tomorrow.',
		);
	});

	it('falls back to the generic message on a 429 without a known code', () => {
		expect(toAuthErrorMessage('common.rate_limited', 429)).toBe(
			'Too many requests. Try again in a moment.',
		);
	});
});
