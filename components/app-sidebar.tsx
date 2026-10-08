"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { AppSearch } from "@/components/app-search";
import { navGroups } from "@/components/app-shared";
import { CustomTrigger } from "@/components/custom-trigger";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function AppSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar
			className={cn(
				"*:data-[slot=sidebar-inner]:bg-background",
				"transition-[left,right,top,width]"
			)}
			collapsible="icon"
			variant="sidebar"
		>
			<SidebarHeader className="h-(--app-header-height,3rem) flex-row items-center justify-between">
				<Button
					asChild
					variant="ghost"
					className="group-data-[collapsible=icon]:hidden gap-2.5 px-2"
				>
					<a href="/dashboard">
						<span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
							<LogoIcon className="size-4" />
						</span>
						<span className="font-semibold tracking-tight">BugHunt<span className="text-primary">Arena</span></span>
					</a>
				</Button>
				{/* Shown only when collapsed — icon only */}
				<div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full">
					<a href="/dashboard" className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
						<LogoIcon className="size-4" />
					</a>
				</div>
				{/* Trigger — shown only when expanded */}
				<div className="group-data-[collapsible=icon]:hidden">
					<CustomTrigger place="sidebar" />
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<AppSearch />
				</SidebarGroup>
				{navGroups.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none">
							{group.label}
						</SidebarGroupLabel>
						<SidebarMenu>
							{group.items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										isActive={!!item.path && pathname === item.path}
										tooltip={item.title}
									>
										<a href={item.path}>
											{item.icon}
											<span>{item.title}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
