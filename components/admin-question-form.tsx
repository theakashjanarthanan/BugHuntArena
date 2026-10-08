"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
	PlusIcon,
	XIcon,
	BugIcon,
	LightbulbIcon,
	CodeIcon,
	SaveIcon,
	RotateCcwIcon,
	AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuestionFormData = {
	title: string;
	description: string;
	language: string;
	difficulty: "easy" | "medium" | "hard";
	code: string;
	bugLine: number;
	bugExplanation: string;
	hints: string[];
	xp: number;
};

const EMPTY_FORM: QuestionFormData = {
	title: "",
	description: "",
	language: "python",
	difficulty: "easy",
	code: "",
	bugLine: 1,
	bugExplanation: "",
	hints: [""],
	xp: 50,
};

const LANGUAGES = [
	{ id: "python",     label: "Python" },
	{ id: "javascript", label: "JavaScript" },
	{ id: "typescript", label: "TypeScript" },
	{ id: "java",       label: "Java" },
	{ id: "cpp",        label: "C++" },
];

const DIFFICULTIES = [
	{ value: "easy",   label: "Easy",   xp: 50,  color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400" },
	{ value: "medium", label: "Medium", xp: 75,  color: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400" },
	{ value: "hard",   label: "Hard",   xp: 120, color: "bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400" },
] as const;

// ─── Field Label ──────────────────────────────────────────────────────────────

function FieldLabel({
	label,
	required,
	error,
	htmlFor,
}: {
	label: string;
	required?: boolean;
	error?: string;
	htmlFor?: string;
}) {
	return (
		<div className="flex items-center justify-between mb-1.5">
			<label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
				{label}
				{required && <span className="ml-0.5 text-destructive" aria-label="required">*</span>}
			</label>
			{error && (
				<span role="alert" className="flex items-center gap-1 text-xs text-destructive">
					<AlertCircle className="size-3" aria-hidden="true" />
					{error}
				</span>
			)}
		</div>
	);
}

// ─── Code Preview ─────────────────────────────────────────────────────────────

function CodePreview({ code, bugLine }: { code: string; bugLine: number }) {
	const lines = code.split("\n");
	if (!code.trim()) {
		return (
			<div className="flex items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8 text-sm text-muted-foreground">
				<CodeIcon className="mr-2 size-4" />
				Code preview will appear here
			</div>
		);
	}
	return (
		<div className="overflow-hidden rounded-lg border bg-muted/40 font-mono text-xs">
			<div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-1.5">
				<div className="size-2.5 rounded-full bg-red-400/80" />
				<div className="size-2.5 rounded-full bg-yellow-400/80" />
				<div className="size-2.5 rounded-full bg-green-400/80" />
				<span className="ml-1 text-muted-foreground">preview</span>
			</div>
			<div className="overflow-x-auto p-3 max-h-52">
				<table className="border-collapse">
					<tbody>
						{lines.map((line, i) => {
							const n = i + 1;
							const isBug = n === bugLine;
							return (
								<tr key={i} className={cn(isBug && "bg-red-500/15 dark:bg-red-500/20")}>
									<td className="w-8 select-none pr-3 text-right text-muted-foreground/50">{n}</td>
									<td className={cn("whitespace-pre", isBug && "text-foreground")}>
										{line || " "}
										{isBug && (
											<span className="ml-2 inline-flex items-center gap-1 rounded bg-red-500/20 px-1 py-0.5 text-red-500 text-[10px] dark:text-red-400">
												<BugIcon className="size-2.5" />
												bug
											</span>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}

// ─── Main Form ────────────────────────────────────────────────────────────────

type Props = {
	initial?: QuestionFormData;
	onSave: (data: QuestionFormData) => Promise<void>;
	onCancel?: () => void;
	mode?: "create" | "edit";
};

export function AdminQuestionForm({
	initial,
	onSave,
	onCancel,
	mode = "create",
}: Props) {
	const [form, setForm] = useState<QuestionFormData>(initial ?? EMPTY_FORM);
	const [errors, setErrors] = useState<Partial<Record<keyof QuestionFormData | "hints", string>>>({});
	const [saving, setSaving] = useState(false);

	const set = <K extends keyof QuestionFormData>(key: K, value: QuestionFormData[K]) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
	};

	// Auto-set XP when difficulty changes
	const handleDifficultyChange = (d: QuestionFormData["difficulty"]) => {
		const preset = DIFFICULTIES.find((x) => x.value === d);
		setForm((prev) => ({ ...prev, difficulty: d, xp: preset?.xp ?? prev.xp }));
	};

	// Hints
	const setHint = (i: number, value: string) => {
		const next = [...form.hints];
		next[i] = value;
		set("hints", next);
	};

	const addHint = () => {
		if (form.hints.length >= 5) return;
		set("hints", [...form.hints, ""]);
	};

	const removeHint = (i: number) => {
		if (form.hints.length <= 1) return;
		set("hints", form.hints.filter((_, idx) => idx !== i));
	};

	// Validation
	const validate = (): boolean => {
		const e: typeof errors = {};
		if (!form.title.trim()) e.title = "Required";
		if (!form.description.trim()) e.description = "Required";
		if (!form.code.trim()) e.code = "Required";
		if (!form.bugExplanation.trim()) e.bugExplanation = "Required";
		if (form.hints.some((h) => !h.trim())) e.hints = "All hints must be filled";
		if (form.bugLine < 1 || form.bugLine > form.code.split("\n").length) {
			e.bugLine = `Must be 1–${form.code.split("\n").length}`;
		}
		if (form.xp < 1) e.xp = "Must be > 0";
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleSave = async () => {
		if (!validate()) {
			toast.error("Fix the errors before saving");
			return;
		}
		setSaving(true);
		try {
			await onSave(form);
		} finally {
			setSaving(false);
		}
	};

	const handleReset = () => {
		setForm(initial ?? EMPTY_FORM);
		setErrors({});
	};

	return (
		<div className="space-y-6">
			{/* ── Section 1: Metadata ──────────────────────────────────── */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm flex items-center gap-2">
						<BugIcon className="size-4 text-primary" />
						Question Metadata
					</CardTitle>
					<CardDescription>Basic info about this challenge</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Title */}
					<div>
						<FieldLabel label="Title" required error={errors.title} htmlFor="field-title" />
						<Input
							id="field-title"
							placeholder="e.g. Off-by-one Fibonacci"
							value={form.title}
							onChange={(e) => set("title", e.target.value)}
							aria-invalid={!!errors.title}
							className={cn(errors.title && "border-destructive")}
						/>
					</div>

					{/* Description */}
					<div>
						<FieldLabel label="Description" required error={errors.description} htmlFor="field-description" />
						<Textarea
							id="field-description"
							placeholder="Describe what the program is supposed to do, and hint at what might be wrong without giving the answer away…"
							value={form.description}
							onChange={(e) => set("description", e.target.value)}
							aria-invalid={!!errors.description}
							className={cn("min-h-20 resize-none", errors.description && "border-destructive")}
						/>
					</div>

					{/* Language + Difficulty row */}
					<div className="grid gap-4 sm:grid-cols-2">
						{/* Language */}
						<div>
							<FieldLabel label="Language" required htmlFor={undefined} />
							<div role="group" aria-label="Select programming language" className="flex flex-wrap gap-1.5">
								{LANGUAGES.map((lang) => (
									<button
										key={lang.id}
										type="button"
										onClick={() => set("language", lang.id)}
										aria-pressed={form.language === lang.id}
										className={cn(
											"flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
											"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
											form.language === lang.id
												? "border-primary bg-primary/10 text-primary"
												: "border-border bg-background hover:bg-muted text-foreground"
										)}
									>
										{lang.label}
									</button>
								))}
							</div>
						</div>

						{/* Difficulty */}
						<div>
							<FieldLabel label="Difficulty" required htmlFor={undefined} />
							<div role="group" aria-label="Select difficulty" className="flex gap-1.5">
								{DIFFICULTIES.map((d) => (
									<button
										key={d.value}
										type="button"
										onClick={() => handleDifficultyChange(d.value)}
										aria-pressed={form.difficulty === d.value}
										className={cn(
											"flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all",
											"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
											form.difficulty === d.value
												? cn(d.color, "ring-2 ring-offset-1 ring-offset-background")
												: "border-border bg-background hover:bg-muted text-foreground"
										)}
									>
										{d.label}
									</button>
								))}
							</div>
						</div>
					</div>

					{/* XP */}
					<div className="w-32">
						<FieldLabel label="XP Reward" required error={errors.xp as string} htmlFor="field-xp" />
						<Input
							id="field-xp"
							type="number"
							min={1}
							max={999}
							value={form.xp}
							onChange={(e) => set("xp", Number(e.target.value))}
							aria-invalid={!!errors.xp}
							className={cn(errors.xp && "border-destructive")}
						/>
					</div>
				</CardContent>
			</Card>

			{/* ── Section 2: Code ──────────────────────────────────────── */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm flex items-center gap-2">
						<CodeIcon className="size-4 text-primary" />
						Buggy Code
					</CardTitle>
					<CardDescription>Paste the code snippet containing the bug</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Code textarea */}
					<div>
						<FieldLabel label="Code Snippet" required error={errors.code} htmlFor="field-code" />
						<Textarea
							id="field-code"
							placeholder={`def fibonacci(n):\n    if n <= 0:\n        return 0\n    # ...`}
							value={form.code}
							onChange={(e) => set("code", e.target.value)}
							aria-invalid={!!errors.code}
							className={cn(
								"min-h-40 resize-y font-mono text-xs leading-relaxed",
								errors.code && "border-destructive"
							)}
							spellCheck={false}
						/>
					</div>

					{/* Bug line */}
					<div className="flex items-end gap-4">
						<div className="w-32">
							<FieldLabel label="Bug Line Number" required error={errors.bugLine as string} htmlFor="field-bug-line" />
							<Input
								id="field-bug-line"
								type="number"
								min={1}
								value={form.bugLine}
								onChange={(e) => set("bugLine", Number(e.target.value))}
								aria-invalid={!!errors.bugLine}
								className={cn(errors.bugLine && "border-destructive")}
							/>
						</div>
						{form.code.trim() && (
							<p className="mb-0.5 text-xs text-muted-foreground">
								{form.code.split("\n").length} lines total
							</p>
						)}
					</div>

					{/* Preview */}
					<div>
						<p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Preview
						</p>
						<CodePreview code={form.code} bugLine={form.bugLine} />
					</div>
				</CardContent>
			</Card>

			{/* ── Section 3: Answer & Hints ─────────────────────────────── */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm flex items-center gap-2">
						<LightbulbIcon className="size-4 text-amber-500" />
						Answer & Hints
					</CardTitle>
					<CardDescription>
						Explain the bug clearly, then write up to 5 progressive hints
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					{/* Bug explanation */}
					<div>
						<FieldLabel label="Bug Explanation (shown after submission)" required error={errors.bugExplanation} htmlFor="field-explanation" />
						<Textarea
							id="field-explanation"
							placeholder="Explain exactly what the bug is, why it happens, and how to fix it. This is shown to the user after they submit their answer."
							value={form.bugExplanation}
							onChange={(e) => set("bugExplanation", e.target.value)}
							aria-invalid={!!errors.bugExplanation}
							className={cn("min-h-24 resize-none", errors.bugExplanation && "border-destructive")}
						/>
					</div>

					<Separator />

					{/* Hints */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<FieldLabel label={`Hints (${form.hints.length}/5)`} required error={errors.hints as string} />
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addHint}
								disabled={form.hints.length >= 5}
								className="h-6 gap-1 text-xs"
								aria-label="Add a new hint"
							>
								<PlusIcon className="size-3" aria-hidden="true" />
								Add Hint
							</Button>
						</div>
						<p id="hints-description" className="text-xs text-muted-foreground -mt-1 mb-2">
							Order from vague → specific. Each hint revealed costs the user 10 XP.
						</p>
						<div className="space-y-2" role="list" aria-label="Hints list" aria-describedby="hints-description">
							{form.hints.map((hint, i) => (
								<div key={i} className="flex gap-2 items-start" role="listitem">
									<div
										className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-medium text-muted-foreground mt-1"
										aria-hidden="true"
									>
										{i + 1}
									</div>
									<Textarea
										id={`field-hint-${i}`}
										aria-label={`Hint ${i + 1} of ${form.hints.length}`}
										placeholder={
											i === 0
												? "Vague nudge — general direction only"
												: i === form.hints.length - 1
												? "Most specific hint — almost the answer"
												: `Hint ${i + 1} — progressively more specific`
										}
										value={hint}
										onChange={(e) => setHint(i, e.target.value)}
										className="min-h-12 resize-none text-sm flex-1"
									/>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										onClick={() => removeHint(i)}
										disabled={form.hints.length <= 1}
										className="mt-1 text-muted-foreground hover:text-destructive"
										aria-label={`Remove hint ${i + 1}`}
									>
										<XIcon className="size-3.5" aria-hidden="true" />
									</Button>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* ── Actions ──────────────────────────────────────────────── */}
			<div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
				<div className="flex gap-2">
					{onCancel && (
						<Button type="button" variant="ghost" size="sm" onClick={onCancel}>
							Cancel
						</Button>
					)}
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleReset}
						className="gap-1.5"
					>
						<RotateCcwIcon className="size-3.5" />
						Reset
					</Button>
				</div>
				<Button
					type="button"
					size="sm"
					onClick={handleSave}
					disabled={saving}
					className="gap-1.5"
				>
					<SaveIcon className="size-3.5" />
					{saving ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Question"}
				</Button>
			</div>
		</div>
	);
}
