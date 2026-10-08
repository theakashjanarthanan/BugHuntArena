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
import { AtSignIcon, UserIcon, LockIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export function SignupPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<{
		name?: string;
		email?: string;
		password?: string;
	}>({});
	const router = useRouter();

	const validateName = (value: string) => {
		if (!value) {
			return "Name is required";
		}
		if (value.length > 15) {
			return "Name must be 15 characters or less";
		}
		const nameRegex = /^[a-zA-Z\s]+$/;
		if (!nameRegex.test(value)) {
			return "Only letters and spaces allowed";
		}
		return "";
	};

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
			return "8+ chars, 1 uppercase, 1 number, 1 symbol";
		}
		return "";
	};

	const handleNameBlur = () => {
		const error = validateName(name);
		setErrors(prev => ({ ...prev, name: error }));
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
			name.trim() !== "" &&
			email.trim() !== "" &&
			password.trim() !== "" &&
			validateName(name) === "" &&
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
		const nameError = validateName(name);
		const emailError = validateEmail(email);
		const passwordError = validatePassword(password);

		if (nameError || emailError || passwordError) {
			setErrors({
				name: nameError,
				email: emailError,
				password: passwordError,
			});
			if (nameError) toast.error(nameError);
			else if (emailError) toast.error(emailError);
			else if (passwordError) toast.error(passwordError);
			return;
		}

		setLoading(true);
		const loadingToast = toast.loading("Creating your account...");

		try {
			// Create user account
			const response = await fetch("/api/auth/signup", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name, email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				toast.dismiss(loadingToast);
				toast.error(data.error || "Failed to create account");
				setLoading(false);
				return;
			}

			toast.dismiss(loadingToast);
			toast.success("Account created successfully!");

			// Auto sign in after successful signup
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			if (result?.error) {
				toast.error("Account created but failed to sign in. Please try logging in.");
			} else {
				// Save user data to localStorage
				const userData = {
					name: name,
					email: email,
					id: data.userId,
					authMethod: "email",
					loginTime: new Date().toISOString(),
				};
				localStorage.setItem("userData", JSON.stringify(userData));
				
				toast.success(`Welcome, ${name}!`);
				router.push("/dashboard");
			}
		} catch (error) {
			toast.dismiss(loadingToast);
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
						<h1 className="font-bold text-2xl tracking-wide">Join Now...</h1>
						<p className="text-base text-muted-foreground">
							Sign up to start your journey.
						</p>
					</div>
					<div className="space-y-4">
						<form className="space-y-4" onSubmit={handleSubmit} noValidate aria-label="Sign up form">
							<div className="space-y-1">
								<div className="flex items-center justify-between mb-1">
									<label htmlFor="signup-name" className="text-sm font-medium text-foreground">
										Name
									</label>
									{errors.name && (
										<div role="alert" className="flex items-center gap-1 text-destructive text-xs">
											<AlertCircle className="size-3" aria-hidden="true" />
											<span id="signup-name-error">{errors.name}</span>
										</div>
									)}
								</div>
								<InputGroup>
									<InputGroupInput
										id="signup-name"
										placeholder="Your display name"
										type="text"
										autoComplete="name"
										value={name}
										aria-invalid={!!errors.name}
										aria-describedby={errors.name ? "signup-name-error" : undefined}
										onChange={(e) => {
											setName(e.target.value);
											if (errors.name) {
												setErrors(prev => ({ ...prev, name: "" }));
											}
										}}
										onBlur={handleNameBlur}
										maxLength={15}
										disabled={loading}
										className={errors.name ? "border-destructive" : ""}
									/>
									<InputGroupAddon align="inline-start">
										<UserIcon aria-hidden="true" />
									</InputGroupAddon>
								</InputGroup>
							</div>

							<div className="space-y-1">
								<div className="flex items-center justify-between mb-1">
									<label htmlFor="signup-email" className="text-sm font-medium text-foreground">
										Email
									</label>
									{errors.email && (
										<div role="alert" className="flex items-center gap-1 text-destructive text-xs">
											<AlertCircle className="size-3" aria-hidden="true" />
											<span id="signup-email-error">{errors.email}</span>
										</div>
									)}
								</div>
								<InputGroup>
									<InputGroupInput
										id="signup-email"
										placeholder="Your email address"
										type="email"
										autoComplete="email"
										value={email}
										aria-invalid={!!errors.email}
										aria-describedby={errors.email ? "signup-email-error" : undefined}
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
									<label htmlFor="signup-password" className="text-sm font-medium text-foreground">
										Password
									</label>
									{errors.password && (
										<div role="alert" className="flex items-center gap-1 text-destructive text-xs">
											<AlertCircle className="size-3" aria-hidden="true" />
											<span id="signup-password-error">{errors.password}</span>
										</div>
									)}
								</div>
								<InputGroup>
									<InputGroupInput
										id="signup-password"
										placeholder="Create a password"
										type="password"
										autoComplete="new-password"
										value={password}
										aria-invalid={!!errors.password}
										aria-describedby={errors.password ? "signup-password-error" : "signup-password-hint"}
										onChange={(e) => {
											setPassword(e.target.value);
											if (errors.password) {
												setErrors(prev => ({ ...prev, password: "" }));
											}
										}}
										onBlur={handlePasswordBlur}
										minLength={8}
										disabled={loading}
										className={errors.password ? "border-destructive" : ""}
									/>
									<InputGroupAddon align="inline-start">
										<LockIcon aria-hidden="true" />
									</InputGroupAddon>
								</InputGroup>
								<p id="signup-password-hint" className="text-xs text-muted-foreground">
									8+ characters with 1 uppercase, 1 number, and 1 symbol
								</p>
							</div>

							<Button
								className="w-full"
								size="sm"
								type="submit"
								disabled={loading || !isFormValid()}
								aria-busy={loading}
							>
								{loading ? "Creating Account..." : "Create Account"}
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
					<p className="text-muted-foreground text-sm">
						By clicking continue, you agree to our{" "}
						<a
							className="underline underline-offset-4 hover:text-primary"
							href="#"
						>
							Terms of Service
						</a>{" "}
						and{" "}
						<a
							className="underline underline-offset-4 hover:text-primary"
							href="#"
						>
							Privacy Policy
						</a>
						.
					</p>
					<p className="text-center text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link
							href="/auth"
							className="underline underline-offset-4 hover:text-primary font-medium"
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
