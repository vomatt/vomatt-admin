import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import type { AdminUser } from '@/types';

// The saved widths are module state, so each test loads a fresh copy of the table, sharing this React
let UsersTable: typeof import('@/components/users/UsersTable').UsersTable;

const alice: AdminUser = {
	id: 'u1',
	username: 'alice',
	displayName: 'Alice',
	email: 'a***@example.com',
	phoneNumber: null,
	authMethod: 'line',
	plan: 'PRO',
	roles: ['user'],
	active: true,
	lastLoginAt: null,
	createdAt: '2026-09-01T10:00:00+08:00',
};

const userHeader = () => screen.getByRole('columnheader', { name: /^User/ });

function dragUserColumn(by: number) {
	const handle = userHeader().querySelector('[role=separator]')!;
	fireEvent.mouseDown(handle, { clientX: 200 });
	fireEvent.mouseMove(document, { clientX: 200 + by });
	fireEvent.mouseUp(document, { clientX: 200 + by });
}

describe('UsersTable', () => {
	beforeEach(() => {
		localStorage.clear();
		jest.isolateModules(() => {
			jest.doMock('react', () => React);
			({ UsersTable } = require('@/components/users/UsersTable'));
		});
	});

	it('shows a row with its sign-in method and plan', () => {
		render(<UsersTable users={[alice]} />);

		expect(screen.getByRole('link', { name: 'alice' })).toHaveAttribute(
			'href',
			'/users/u1'
		);
		expect(screen.getByText('LINE')).toBeInTheDocument();
		expect(screen.getByText('PRO')).toBeInTheDocument();
	});

	it('widens a column by dragging its edge and keeps the width after a reload', () => {
		const { unmount } = render(<UsersTable users={[alice]} />);
		const before = parseFloat(userHeader().style.width);

		dragUserColumn(80);
		expect(parseFloat(userHeader().style.width)).toBe(before + 80);

		unmount();
		render(<UsersTable users={[alice]} />);
		expect(parseFloat(userHeader().style.width)).toBe(before + 80);
	});

	it('resets a column to its default width on double-click', () => {
		render(<UsersTable users={[alice]} />);
		const before = parseFloat(userHeader().style.width);

		dragUserColumn(80);
		fireEvent.doubleClick(userHeader().querySelector('[role=separator]')!);

		expect(parseFloat(userHeader().style.width)).toBe(before);
	});

	it('widens a column with the arrow keys on its resize handle', () => {
		render(<UsersTable users={[alice]} />);
		const before = parseFloat(userHeader().style.width);

		fireEvent.keyDown(userHeader().querySelector('[role=separator]')!, {
			key: 'ArrowRight',
		});

		expect(parseFloat(userHeader().style.width)).toBeGreaterThan(before);
	});

	it('ignores saved widths that are not an object', () => {
		localStorage.setItem('vomatt-admin:users-table:widths', 'null');

		render(<UsersTable users={[alice]} />);

		expect(parseFloat(userHeader().style.width)).toBe(200);
	});

	it('still resizes when localStorage refuses writes', () => {
		jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('blocked', 'SecurityError');
		});
		render(<UsersTable users={[alice]} />);

		dragUserColumn(80);

		expect(parseFloat(userHeader().style.width)).toBe(280);
		jest.restoreAllMocks();
	});

	it('says so when no user matches', () => {
		render(<UsersTable users={[]} />);

		expect(
			screen.getByText('No users match these filters.')
		).toBeInTheDocument();
	});
});
