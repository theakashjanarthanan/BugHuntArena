"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOutIcon } from "lucide-react";

export function NavUser() {
	const { data: session } = useSession();
	const router = useRouter();
	const [firebaseUser, setFirebaseUser] = useState<any>(null);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setFirebaseUser(user);
		});
		return () => unsubscribe();
	}, []);

	const displayName = session?.user?.name || firebaseUser?.displayName || "User";
	const displayEmail = session?.user?.email || firebaseUser?.email || "";
	const avatarUrl = firebaseUser?.photoURL || "";
	const initials = displayName.charAt(0).toUpperCase();

	const handleSignOut = async () => {
		toast.loading("Signing out...");
		
		try {
			// Clear localStorage
			localStorage.removeItem("userData");
			
			// Sign out from Firebase if user is logged in via Firebase
			if (firebaseUser) {
				await firebaseSignOut(auth);
			}
			
			// Sign out from NextAuth if user is logged in via credentials
			if (session) {
				await signOut({ callbackUrl: "/auth" });
			} else {
				router.push("/auth");
			}
			
			toast.success("Signed out successfully");
		} catch (error) {
			toast.error("Failed to sign out");
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Avatar className="size-8 cursor-pointer" aria-label={`User menu for ${displayName}`}>
					<AvatarImage src={avatarUrl} alt={displayName} />
					<AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-60" aria-label="User menu">
				<DropdownMenuItem className="flex items-center justify-start gap-2">
					<DropdownMenuLabel className="flex items-center gap-3">
						<Avatar className="size-10">
							<AvatarImage src={avatarUrl} alt={displayName} />
							<AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
						</Avatar>
						<div>
							<span className="font-medium text-foreground">{displayName}</span>{" "}
							<br />
							<div className="max-w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-muted-foreground text-xs">
								{displayEmail}
							</div>
						</div>
					</DropdownMenuLabel>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						className="w-full cursor-pointer"
						variant="destructive"
						onClick={handleSignOut}
					>
						<LogOutIcon />
						Log out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
