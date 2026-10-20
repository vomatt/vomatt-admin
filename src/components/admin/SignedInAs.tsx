/** The signed-in admin, shown above Sign out in the sidebar footer. */
export function SignedInAs({ email }: { email: string }) {
	return (
		<div className="flex items-center gap-2 px-2 py-1.5 text-sm">
			<span
				aria-hidden
				className="flex size-8 shrink-0 items-center justify-center rounded-full bg-avatar-sky font-medium text-volt-foreground uppercase"
			>
				{email.charAt(0)}
			</span>
			<div className="min-w-0">
				<p className="text-xs text-muted-foreground">Signed in as</p>
				{/* Wraps rather than truncates, so the whole address stays readable */}
				<p className="[overflow-wrap:anywhere]">{email}</p>
			</div>
		</div>
	);
}
