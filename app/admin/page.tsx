"use client";

import { useState, useEffect } from "react";
import { AdminLogin } from "@/components/admin-login";
import { AdminPortal } from "@/components/admin-portal";

export default function AdminPage() {
	const [authenticated, setAuthenticated] = useState<boolean | null>(null);

	// Check if already authenticated via cookie on mount
	useEffect(() => {
		fetch("/api/admin/session")
			.then((r) => r.json())
			.then((d) => setAuthenticated(d.authenticated === true))
			.catch(() => setAuthenticated(false));
	}, []);

	// Still checking session
	if (authenticated === null) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-sm text-muted-foreground">Loading…</div>
			</div>
		);
	}

	if (!authenticated) {
		return <AdminLogin onLogin={() => setAuthenticated(true)} />;
	}

	return <AdminPortal onLogout={() => setAuthenticated(false)} />;
}
