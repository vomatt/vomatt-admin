import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
	coverageProvider: 'v8',
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
	collectCoverageFrom: [
		'src/**/*.{ts,tsx}',
		'!src/**/*.d.ts',
		'!src/sanity/schemaTypes/**',
		'!src/sanity/deskStructure/**',
	],
};

// groq-js (and its obug dependency) ship only ES modules, so Jest must transform them too
const esmPackages = ['groq-js', 'obug'];

export default async () => {
	const resolved = await createJestConfig(config)();
	return {
		...resolved,
		transformIgnorePatterns: resolved.transformIgnorePatterns?.map((pattern) =>
			pattern.startsWith('/node_modules/(?!.pnpm)')
				? pattern.replace('(?!.pnpm)', `(?!.pnpm)(?!(${esmPackages.join('|')})/)`)
				: pattern
		),
	};
};
