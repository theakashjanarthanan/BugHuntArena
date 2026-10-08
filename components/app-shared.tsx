import type { ReactNode } from "react";
import { LayoutDashboardIcon, BugIcon, TrophyIcon} from "lucide-react";

export type SidebarNavItem = {
	title: string;
	path?: string;
	icon?: ReactNode;
	isActive?: boolean;
	subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
	label: string;
	items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
	{
		label: "Bug Hunt",
		items: [
			{
				title: "Dashboard",
				path: "/dashboard",
				icon: (
					<LayoutDashboardIcon />
				),
			},
			{
				title: "Bug Hunt",
				path: "/hunt",
				icon: (
					<BugIcon />
				),
			},
			{
				title: "Leaderboard",
				path: "/leaderboard",
				icon: (
					<TrophyIcon />
				),
			},
		],
	},
];

export const navLinks: SidebarNavItem[] = [
	...navGroups.flatMap((group) =>
		group.items.flatMap((item) =>
			item.subItems?.length ? [item, ...item.subItems] : [item]
		)
	),
];
