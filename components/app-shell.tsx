"use client";

import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { useEffect, useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useState(true);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		// Load sidebar state from localStorage on mount
		const savedState = localStorage.getItem("sidebarOpen");
		if (savedState !== null) {
			setOpen(savedState === "true");
		}
		setMounted(true);
	}, []);

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		// Save sidebar state to localStorage
		localStorage.setItem("sidebarOpen", String(newOpen));
	};

	// Prevent hydration mismatch by not rendering until mounted
	if (!mounted) {
		return null;
	}

	return (
		<TooltipProvider>
			<SidebarProvider
				open={open}
				onOpenChange={handleOpenChange}
				className={cn(
					"[--app-wrapper-max-width:80rem]",
					"[--app-header-height:3rem]"
				)}
			>
				<AppSidebar />
				<SidebarInset className="bg-muted dark:bg-background">
					<AppHeader />
					<main
						id="main-content"
						tabIndex={-1}
						className={cn(
							"flex flex-1 flex-col p-4 md:p-6",
							"mx-auto w-full max-w-(--app-wrapper-max-width)"
						)}
					>
						{children}
					</main>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	);
}
