"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Moon, Sun, Monitor } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();
	const [isExpanded, setIsExpanded] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// Theme options with their icons and labels
	const themes = [
		{ value: "light" as const, icon: Sun, label: "Light" },
		{ value: "dark" as const, icon: Moon, label: "Dark" },
		{ value: "system" as const, icon: Monitor, label: "System" },
	];

	// Get the current theme's icon and label
	const currentTheme = themes.find((t) => t.value === theme);
	const CurrentIcon = currentTheme?.icon || Monitor;
	const currentLabel = currentTheme?.label || "System";

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsExpanded(false);
			}
		};

		if (isExpanded) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isExpanded]);

	const handleThemeChange = (value: "light" | "dark" | "system") => {
		setTheme(value);
		setIsExpanded(false);
	};

	return (
		<TooltipProvider>
			<div ref={containerRef} className="flex items-center rounded-md border bg-muted/50">
				{/* Expanded Menu - slides in responsively with background */}
				<div
					className={`flex items-center gap-1 overflow-hidden transition-all duration-300 ease-in-out ${
						isExpanded
							? "max-w-[200px] opacity-100 pl-2"
							: "max-w-0 opacity-0"
					}`}
				>
					{themes.map(({ value, icon: Icon, label }) => (
						<Tooltip key={value}>
							<TooltipTrigger asChild>
								<Button
									variant={theme === value ? "default" : "ghost"}
									size="icon-sm"
									onClick={() => handleThemeChange(value)}
									className="whitespace-nowrap"
									aria-label={`Switch to ${label} mode`}
								>
									<Icon />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom" sideOffset={8}>
								{label}
							</TooltipContent>
						</Tooltip>
					))}
				</div>

				{/* Icon Button with Tooltip - matches other header buttons */}
				{!isExpanded ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => setIsExpanded(!isExpanded)}
								aria-label={`Current theme: ${currentLabel}`}
								className={`border-0 ${
									isExpanded ? "bg-background shadow-sm ring-1 ring-border/50" : ""
								}`}
							>
								<CurrentIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom" sideOffset={8}>
							{currentLabel} Mode
						</TooltipContent>
					</Tooltip>
				) : (
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => setIsExpanded(!isExpanded)}
						aria-label={`Current theme: ${currentLabel}`}
						className="border-0 bg-background shadow-sm ring-1 ring-border/50"
					>
						<CurrentIcon />
					</Button>
				)}
			</div>
		</TooltipProvider>
	);
}
