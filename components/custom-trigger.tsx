"use client";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/logo";
import { PanelLeftIcon, ChevronsRightIcon } from "lucide-react";

type Place = "sidebar" | "navbar";

export function CustomTrigger({ place }: { place: Place }) {
	const isMobile = useIsMobile();
	const { open, openMobile, toggleSidebar } = useSidebar();
	const sidebarOpen = isMobile ? openMobile : open;

	// In the sidebar slot when collapsed: show logo, on hover show expand icon
	if (place === "sidebar" && !sidebarOpen) {
		return (
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={toggleSidebar}
				aria-label="Expand sidebar"
				className="group transition-all duration-200"
			>
				{/* Logo: visible by default, hidden on hover */}
				<LogoIcon className="size-4 block group-hover:hidden" />
				{/* Expand arrow: hidden by default, visible on hover */}
				<ChevronsRightIcon className="size-4 hidden group-hover:block" />
			</Button>
		);
	}

	// In the sidebar slot when expanded: show collapse button
	if (place === "sidebar" && sidebarOpen) {
		return (
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={toggleSidebar}
				aria-label="Collapse sidebar"
			>
				<PanelLeftIcon className="size-4" />
			</Button>
		);
	}

	// In the navbar: only show when sidebar is collapsed
	return (
		<Button
			variant="ghost"
			size="icon-sm"
			onClick={toggleSidebar}
			aria-label="Toggle sidebar"
			className={cn(
				"transition-opacity duration-200",
				sidebarOpen ? "pointer-events-none opacity-0" : "opacity-100"
			)}
		>
			<PanelLeftIcon className="size-4" />
		</Button>
	);
}
