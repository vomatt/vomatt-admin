'use client';

import { RiComputerLine, RiMoonLine, RiSunLine } from '@remixicon/react';
import { useTheme } from 'next-themes';
import { useState, useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils';

const THEMES = [
	{ value: 'light', label: 'Light', icon: RiSunLine },
	{ value: 'dark', label: 'Dark', icon: RiMoonLine },
	{ value: 'system', label: 'System', icon: RiComputerLine },
];

const subscribe = () => () => {};

/** Pill behind one of the three equal columns, sliding between them. */
function Pill({ index, className }: { index: number; className: string }) {
	return (
		<span
			aria-hidden
			className={cn(
				'absolute inset-y-0 left-0 w-1/3 rounded-sm transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none',
				className,
			)}
			style={{ transform: `translateX(${index * 100}%)` }}
		/>
	);
}

/** Light / dark / system choice for the sidebar footer. */
export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();
	// The saved theme is only known in the browser, so nothing is checked until hydration
	const mounted = useSyncExternalStore(subscribe, () => true, () => false);
	const [hovered, setHovered] = useState<number | null>(null);
	// Keeps the hover pill where it last was while it fades out
	const [lastHovered, setLastHovered] = useState(0);
	const checkedIndex = mounted ? THEMES.findIndex(({ value }) => value === theme) : -1;

	return (
		<div className="rounded-md bg-sidebar-accent p-1">
			<div
				role="radiogroup"
				aria-label="Theme"
				className="relative grid grid-cols-3"
				onPointerLeave={() => setHovered(null)}
			>
				<Pill index={lastHovered} className={cn('bg-sidebar-border', hovered === null && 'opacity-0')} />
				<Pill
					index={Math.max(checkedIndex, 0)}
					className={cn('bg-background shadow-xs', checkedIndex === -1 && 'opacity-0')}
				/>
				{THEMES.map(({ value, label, icon: Icon }, index) => {
					const checked = index === checkedIndex;
					return (
						<button
							key={value}
							type="button"
							role="radio"
							aria-checked={checked}
							aria-label={label}
							title={label}
							onClick={() => setTheme(value)}
							onPointerEnter={() => {
								setHovered(index);
								setLastHovered(index);
							}}
							className={cn(
								'relative flex h-7 items-center justify-center rounded-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring',
								checked && 'text-foreground',
							)}
						>
							<Icon aria-hidden className="size-4" />
						</button>
					);
				})}
			</div>
		</div>
	);
}
