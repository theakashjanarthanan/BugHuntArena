"use client";

import { usePathname } from "next/navigation";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { navLinks } from "@/components/app-shared";
import { NavUser } from "@/components/nav-user";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Separator } from "@/components/ui/separator";

export function AppHeader() {
	const pathname = usePathname();
	const activeItem = navLinks.find((item) => item.path && pathname === item.path);
	const pageTitle = activeItem?.title ?? "BugHuntArena";

	return (
		<header
			aria-label="Application header"
			className="sticky top-0 z-50 flex h-(--app-header-height) w-full shrink-0 items-center justify-between gap-2 border-b bg-background px-4 md:px-6"
		>
			<div className="flex items-center gap-3" />

			<Breadcrumb aria-label="Current page">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage>{pageTitle}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<div className="flex items-center gap-3" role="toolbar" aria-label="Header actions">
				<ThemeSwitcher />
				<Separator orientation="vertical" className="h-8" aria-hidden="true" />
				<NavUser />
			</div>
		</header>
	);
}
