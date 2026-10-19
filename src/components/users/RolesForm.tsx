'use client';

import { type FormEvent, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { setUserRoles } from '@/lib/api/services/users';
import { Role, ROLES } from '@/types';

/** Replaces the user's roles; the API signs them out so new roles apply at their next sign-in. */
export function RolesForm({ userId, roles }: { userId: string; roles: string[] }) {
	const [selected, setSelected] = useState(() => new Set(roles));
	const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
	const [pending, startTransition] = useTransition();
	const changed = selected.size !== roles.length || roles.some((role) => !selected.has(role));

	function toggle(role: Role, checked: boolean) {
		const next = new Set(selected);
		if (checked) next.add(role);
		else next.delete(role);
		setSelected(next);
		setMessage(null);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setMessage(null);
		startTransition(async () => {
			const result = await setUserRoles(userId, ROLES.filter((role) => selected.has(role)));
			setMessage(result.ok ? { error: false, text: 'Roles saved.' } : { error: true, text: result.message });
		});
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<fieldset className="flex flex-wrap gap-6">
				<legend className="sr-only">Roles</legend>
				{ROLES.map((role) => (
					<div key={role} className="flex items-center gap-2">
						<Checkbox
							id={`role-${role}`}
							checked={selected.has(role)}
							onCheckedChange={(checked) => toggle(role, checked === true)}
						/>
						<Label htmlFor={`role-${role}`} className="capitalize">
							{role}
						</Label>
					</div>
				))}
			</fieldset>
			<div className="flex items-center gap-3">
				<Button type="submit" size="sm" disabled={pending || !changed || selected.size === 0}>
					Save roles
				</Button>
				{selected.size === 0 ? <p className="text-sm text-muted-foreground">Pick at least one role.</p> : null}
				{message ? (
					<p role={message.error ? 'alert' : 'status'} className={message.error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
						{message.text}
					</p>
				) : null}
			</div>
		</form>
	);
}
