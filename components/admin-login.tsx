"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { DecorIcon } from "@/components/decor-icon";
import { LogoIcon } from "@/components/logo";
import { UserIcon, LockIcon, AlertCircle, ShieldIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
	onLogin: () => void;
};

export function AdminLogin({ onLogin }: Props) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

	const validate = () => {
		const e: typeof errors = {};
		if (!username.trim()) e.username = "Username is required";
		if (!password.trim()) e.password = "Password is required";
		return e;
	};

	const isFormValid = () => username.trim() !== "" && password.trim() !== "";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const errs = validate();
		if (Object.keys(errs).length) {
			setErrors(errs);
			return;
		}

		setLoading(true);
		const loadingToast = toast.loading("Verifying credentials…");

		try {
			const res = await fetch("/api/admin/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});

			const data = await res.json();
			toast.dismiss(loadingToast);

			if (!res.ok) {
				toast.error(data.error || "Invalid credentials");
				setErrors({ password: "Invalid username or password" });
				return;
			}

			toast.success("Welcome, Admin!");
			onLogin();
		} catch {
			toast.dismiss(loadingToast);
			toast.error("Something went wrong. Try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 md:px-8">
			{/* Ambient glow */}
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
				<div className="size-[500px] rounded-full bg-primary/5 blur-3xl" />
			</div>

			<div
				className={cn(
					"relative flex w-full max-w-sm flex-col justify-between p-6 md:p-8",
					"dark:bg-[radial-gradient(50%_80%_at_20%_0%,--theme(--color-foreground/.1),transparent)]"
				)}
			>
				{/* Border lines */}
				<div className="absolute -inset-y-6 -left-px w-px bg-border" />
				<div className="absolute -inset-y-6 -right-px w-px bg-border" />
				<div className="absolute -inset-x-6 -top-px h-px bg-border" />
				<div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
				<DecorIcon position="top-left" />
				<DecorIcon position="top-right" />
				<DecorIcon position="bottom-left" />
				<DecorIcon position="bottom-right" />

				<div className="w-full max-w-sm animate-in space-y-8">
					{/* Brand */}
					<div className="flex flex-col items-center gap-3">
						<div className="flex items-center justify-center rounded-xl border bg-muted/50 p-3">
							<ShieldIcon className="size-6 text-primary" aria-hidden="true" />
						</div>
						<div className="flex items-center gap-2 text-muted-foreground">
							<LogoIcon className="size-4" aria-hidden="true" />
							<span className="text-sm font-medium">BugHuntArena</span>
						</div>
					</div>

					{/* Form */}
					<form className="space-y-4" onSubmit={handleSubmit} noValidate aria-label="Admin sign in form">
						{/* Username */}
						<div className="space-y-1">
							<div className="flex items-center justify-between">
								<label htmlFor="admin-username" className="text-sm font-medium">Username</label>
								{errors.username && (
									<span role="alert" id="admin-username-error" className="flex items-center gap-1 text-xs text-destructive">
										<AlertCircle className="size-3" aria-hidden="true" />
										{errors.username}
									</span>
								)}
							</div>
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<UserIcon aria-hidden="true" />
								</InputGroupAddon>
								<InputGroupInput
									id="admin-username"
									placeholder="Admin username"
									type="text"
									autoComplete="username"
									value={username}
									aria-invalid={!!errors.username}
									aria-describedby={errors.username ? "admin-username-error" : undefined}
									onChange={(e) => {
										setUsername(e.target.value);
										if (errors.username) setErrors((p) => ({ ...p, username: "" }));
									}}
									disabled={loading}
									className={errors.username ? "border-destructive" : ""}
								/>
							</InputGroup>
						</div>

						{/* Password */}
						<div className="space-y-1">
							<div className="flex items-center justify-between">
								<label htmlFor="admin-password" className="text-sm font-medium">Password</label>
								{errors.password && (
									<span role="alert" id="admin-password-error" className="flex items-center gap-1 text-xs text-destructive">
										<AlertCircle className="size-3" aria-hidden="true" />
										{errors.password}
									</span>
								)}
							</div>
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<LockIcon aria-hidden="true" />
								</InputGroupAddon>
								<InputGroupInput
									id="admin-password"
									placeholder="Admin password"
									type="password"
									autoComplete="current-password"
									value={password}
									aria-invalid={!!errors.password}
									aria-describedby={errors.password ? "admin-password-error" : undefined}
									onChange={(e) => {
										setPassword(e.target.value);
										if (errors.password) setErrors((p) => ({ ...p, password: "" }));
									}}
									disabled={loading}
									className={errors.password ? "border-destructive" : ""}
								/>
							</InputGroup>
						</div>

						<Button
							className="w-full gap-2"
							size="sm"
							type="submit"
							disabled={loading || !isFormValid()}
							aria-busy={loading}
						>
							{loading ? "Verifying…" : "Sign In as Admin"}
						</Button>
					</form>

					<p className="text-center text-xs text-muted-foreground">
						Not an admin?{" "}
						<a href="/auth" className="underline underline-offset-4 hover:text-primary font-medium">
							Return to app
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}
