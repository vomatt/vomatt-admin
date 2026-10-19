import { Badge } from '@/components/ui/badge';

export function RoleBadges({ roles }: { roles: string[] }) {
	return (
		<div className="flex flex-wrap gap-1">
			{roles.map((role) => (
				<Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
					{role}
				</Badge>
			))}
		</div>
	);
}

export function UserStatusBadge({ active }: { active: boolean }) {
	return active ? <Badge variant="outline">Active</Badge> : <Badge variant="destructive">Suspended</Badge>;
}
