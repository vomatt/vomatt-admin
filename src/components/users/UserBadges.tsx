import { Badge } from '@/components/ui/badge';

// Admin stands out because it grants this console; unknown roles stay neutral
const ROLE_VARIANTS: Record<string, 'warning' | 'info'> = { admin: 'warning', moderator: 'info' };

export function RoleBadges({ roles }: { roles: string[] }) {
	return (
		<div className="flex flex-wrap gap-1">
			{roles.map((role) => (
				<Badge key={role} variant={ROLE_VARIANTS[role] ?? 'neutral'}>
					{role}
				</Badge>
			))}
		</div>
	);
}

export function UserStatusBadge({ active }: { active: boolean }) {
	return active ? (
		<Badge variant="outline" dot className="before:bg-tone-success">
			Active
		</Badge>
	) : (
		<Badge variant="destructive" dot>
			Suspended
		</Badge>
	);
}
