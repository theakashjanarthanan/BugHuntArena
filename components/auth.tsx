"use client";

import { cn } from "@/lib/utils";
import { GoogleIcon } from "@/components/google-icon";
import { Button } from "@/components/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { AuthDivider } from "@/components/auth-divider";
import { DecorIcon } from "@/components/decor-icon";
import { AtSignIcon, LockIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export function AuthPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<{
		email?: string;
		password?: string;
	}>({});
	const router = useRouter();

	const validateEmail = (value: string) => {
		if (!value) {
			return "Email is required";
		}
		if (!value.includes("@")) {
			return "Email must contain @ symbol";
		}
		return "";
	};

	const validatePassword = (value: string) => {
		if (!value) {
			return "Password is required";
		}
		const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
		if (!passwordRegex.test(value)) {
			return "Password must be 8+ chars with 1 uppercase, 1 number, and 1 symbol";
		}
		return "";
	};

	const handleEmailBlur = () => {
		const error = validateEmail(email);
		setErrors(prev => ({ ...prev, email: error }));
	};

	const handlePasswordBlur = () => {
		const error = validatePassword(password);
		setErrors(prev => ({ ...prev, password: error }));
	};

	// Check if form is valid
	const isFormValid = () => {
		return (
			email.trim() !== "" &&
			password.trim() !== "" &&
			validateEmail(email) === "" &&
			validatePassword(password) === ""
		);
	};

	const handleGoogleSignIn = async () => {
		const loadingToast = toast.loading("Signing in with Google...");
		
		try {
			const provider = new GoogleAuthProvider();
			const result = await signInWithPopup(auth, provider);
			const user = result.user;

			// Send user data to backend to create/update user in MongoDB
			const response = await fetch("/api/auth/firebase", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					uid: user.uid,
					email: user.email,
					name: user.displayName,
					provider: "google",
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to authenticate with backend");
			}

			// Save user data to localStorage
			const userData = {
				name: user.displayName || user.email?.split("@")[0] || "User",
				email: user.email || "",
				id: user.uid,
				authMethod: "google",
				photoURL: user.photoURL || "",
				loginTime: new Date().toISOString(),
			};
			localStorage.setItem("userData", JSON.stringify(userData));

			toast.dismiss(loadingToast);
			toast.success(`Welcome, ${user.displayName || user.email}!`);
			router.push("/dashboard");
		} catch (error: any) {
			toast.dismiss(loadingToast);
			if (error.code === "auth/popup-closed-by-user") {
				toast.error("Sign-in cancelled");
			} else {
				toast.error("Failed to sign in with Google");
			}
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		// Validate all fields
		const emailError = validateEmail(email);
		const passwordError = validatePassword(password);

		if (emailError || passwordError) {
			setErrors({
				email: emailError,
				password: passwordError,
			});
			if (emailError) toast.error(emailError);
			else if (passwordError) toast.error(passwordError);
			return;
		}

		setLoading(true);

		try {
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			if (result?.error) {
				toast.error("Invalid email or password");
			} else {
				// Fetch user session to get name
				const response = await fetch("/api/auth/session");
				const session = await response.json();
				const userName = session?.user?.name || "User";
				const userEmail = session?.user?.email || email;
				const userId = session?.user?.id || "";
				
				// Save user data to localStorage
				const userData = {
					name: userName,
					email: userEmail,
					id: userId,
					authMethod: "email",
					loginTime: new Date().toISOString(),
				};
				localStorage.setItem("userData", JSON.stringify(userData));
				
				toast.success(`Welcome, ${userName}!`);
				router.push("/dashboard");
			}
		} catch (error) {
			toast.error("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 md:px-8">
			<div
				className={cn(
					"relative flex w-full max-w-sm flex-col justify-between p-6 md:p-8",
					"dark:bg-[radial-gradient(50%_80%_at_20%_0%,--theme(--color-foreground/.1),transparent)]"
				)}
			>
				<div className="absolute -inset-y-6 -left-px w-px bg-border" />
				<div className="absolute -inset-y-6 -right-px w-px bg-border" />
				<div className="absolute -inset-x-6 -top-px h-px bg-border" />
				<div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
				<DecorIcon position="top-left" />
				<DecorIcon position="bottom-right" />

				<div className="w-full max-w-sm animate-in space-y-8">
					<div className="flex flex-col space-y-1">
						<h1 className="font-bold text-2xl tracking-wide">Welcome Back!</h1>
						<p className="text-base text-muted-foreground">
							Sign in to continue your bug hunting journey
						</p>
					</div>
					<div className="space-y-4">
						<form className="space-y-4" onSubmit={handleSubmit} noValidate aria-label="Sign in form">
							<div className="space-y-1">
								<div className="flex items-center justify-between mb-1">
									<label htmlFor="auth-email" className="text-sm font-medium text-foreground">
										Email
									</label>
									{errors.email && (
										<div role="alert" className="flex items-center gap-1 text-destructive text-xs">
											<AlertCircle className="size-3" aria-hidden="true" />
											<span id="auth-email-error">{errors.email}</span>
										</div>
									)}
								</div>
								<InputGroup>
									<InputGroupInput
										id="auth-email"
										placeholder="Enter your email"
										type="email"
										autoComplete="email"
										value={email}
										aria-invalid={!!errors.email}
										aria-describedby={errors.email ? "auth-email-error" : undefined}
										onChange={(e) => {
											setEmail(e.target.value);
											if (errors.email) {
												setErrors(prev => ({ ...prev, email: "" }));
											}
										}}
										onBlur={handleEmailBlur}
										disabled={loading}
										className={errors.email ? "border-destructive" : ""}
									/>
									<InputGroupAddon align="inline-start">
										<AtSignIcon aria-hidden="true" />
									</InputGroupAddon>
								</InputGroup>
							</div>

							<div className="space-y-1">
								<div className="flex items-center justify-between mb-1">
									<label htmlFor="auth-password" className="text-sm font-medium text-foreground">
										Password
									</label>
									{errors.password && (
										<div role="alert" className="flex items-center gap-1 text-destructive text-xs">
											<AlertCircle className="size-3" aria-hidden="true" />
											<span id="auth-password-error">{errors.password}</span>
										</div>
									)}
								</div>
								<InputGroup>
									<InputGroupInput
										id="auth-password"
										placeholder="Enter your password"
										type="password"
										autoComplete="current-password"
										value={password}
										aria-invalid={!!errors.password}
										aria-describedby={errors.password ? "auth-password-error" : undefined}
										onChange={(e) => {
											setPassword(e.target.value);
											if (errors.password) {
												setErrors(prev => ({ ...prev, password: "" }));
											}
										}}
										onBlur={handlePasswordBlur}
										disabled={loading}
										className={errors.password ? "border-destructive" : ""}
									/>
									<InputGroupAddon align="inline-start">
										<LockIcon aria-hidden="true" />
									</InputGroupAddon>
								</InputGroup>
							</div>

							<Button
								className="w-full"
								size="sm"
								type="submit"
								disabled={loading || !isFormValid()}
								aria-busy={loading}
							>
								{loading ? "Signing in..." : "Sign In"}
							</Button>
						</form>
						<AuthDivider>OR</AuthDivider>
						<Button
							className="w-full"
							type="button"
							variant="outline"
							onClick={handleGoogleSignIn}
							disabled={loading}
							aria-label="Continue with Google"
						>
							<GoogleIcon data-icon="inline-start" aria-hidden="true" />
							Continue with Google
						</Button>
					</div>
					<p className="text-center text-sm text-muted-foreground">
						Don't have an account?{" "}
						<Link
							href="/signup"
							className="underline underline-offset-4 hover:text-primary font-medium"
						>
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
