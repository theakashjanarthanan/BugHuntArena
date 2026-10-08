"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AdminQuestionForm, type QuestionFormData } from "@/components/admin-question-form";
import { DataTable } from "@/components/data-table";
import { createColumns, type Question } from "@/components/admin-questions-columns";
import { QuestionDetailsDialog } from "@/components/question-details-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LogoIcon } from "@/components/logo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { toast } from "sonner";
import {
  PlusIcon,
  BugIcon,
  LogOutIcon,
  ShieldIcon,
  ListIcon,
  ChevronLeftIcon,
  ZapIcon,
  CodeIcon,
  BarChartIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "list" | "create" | "edit";

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-4 pt-4">
        <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Portal ──────────────────────────────────────────────────────────────

type Props = {
  onLogout: () => void;
};

export function AdminPortal({ onLogout }: Props) {
  const [view, setView] = useState<View>("list");
  const [editTarget, setEditTarget] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Confirm dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Search input ref — used by "/" shortcut
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search on "/" keypress (when not already in an input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isEditable =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
        (e.target as HTMLElement).isContentEditable;

      if (e.key === "/" && !isEditable && view === "list") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }

      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view]);

  // Fetch questions on mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/questions");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const mapped = data.questions.map((q: any) => ({
        ...q,
        createdAt: new Date(q.createdAt).toISOString().split("T")[0],
      }));
      setQuestions(mapped);
    } catch (error) {
      toast.error("Failed to load questions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    onLogout();
    toast.success("Logged out of admin portal");
  };

  const handleCreate = async (data: QuestionFormData) => {
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create");
      }

      toast.success("Question created successfully");
      await fetchQuestions();
      setView("list");
    } catch (error: any) {
      toast.error(error.message || "Failed to create question");
      throw error;
    }
  };

  const handleEdit = async (data: QuestionFormData) => {
    if (!editTarget) return;
    try {
      const res = await fetch(`/api/admin/questions/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update");
      }

      toast.success("Question updated successfully");
      await fetchQuestions();
      setView("list");
      setEditTarget(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update question");
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    setQuestionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;

    try {
      const res = await fetch(`/api/admin/questions/${questionToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success("Question deleted successfully");
      await fetchQuestions();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete question");
    } finally {
      setQuestionToDelete(null);
    }
  };

  const startEdit = (q: Question) => {
    setEditTarget(q);
    setView("edit");
  };

  const startNew = () => {
    setEditTarget(null);
    setView("create");
  };

  const goBack = () => {
    setView("list");
    setEditTarget(null);
  };

  const handleRowClick = (question: Question) => {
    setSelectedQuestion(question);
    setDetailsDialogOpen(true);
  };

  // Calculate statistics
  const langs = Array.from(new Set(questions.map((q) => q.language)));
  const byDiff = { easy: 0, medium: 0, hard: 0 };
  questions.forEach((q) => byDiff[q.difficulty]++);
  const totalXp = questions.reduce((s, q) => s + q.xp, 0);

  // Create columns with handlers
  const columns = createColumns(startEdit, handleDelete);

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      {/* ── Top nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background px-4 md:px-6">
        <div className="relative flex h-12 w-full items-center justify-between gap-4">
          {/* Brand — Left */}
          <div className="flex items-center gap-3">
            <LogoIcon className="size-5" />
            <span className="font-semibold">BugHuntArena</span>
            <Separator orientation="vertical" className="h-4" />
          </div>

          {/* Admin Portal — Center */}
          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldIcon className="size-3.6 text-primary" />
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Separator orientation="vertical" className="h-8" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <LogOutIcon className="size-3.5" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {/* Breadcrumb / view title */}
        <div className="mb-6 flex items-center gap-2">
          {view !== "list" && (
            <Button variant="ghost" size="icon-sm" onClick={goBack} aria-label="Back">
              <ChevronLeftIcon className="size-4" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              {view === "list" && "Question Manager"}
              {view === "create" && "New Question"}
              {view === "edit" && `Edit: ${editTarget?.title}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {view === "list" && "Create, edit and manage all Bug Hunt challenges"}
              {view === "create" && "Fill in all fields to publish a new challenge"}
              {view === "edit" && "Update the question details and save changes"}
            </p>
          </div>
        </div>

        {/* Views */}
        {view === "list" && (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total Questions" value={questions.length} icon={<ListIcon className="size-4" />} />
              <StatCard label="Total XP Pool" value={totalXp} icon={<ZapIcon className="size-4 text-amber-500" />} sub="across all questions" />
              <StatCard label="Languages" value={langs.length} icon={<CodeIcon className="size-4" />} sub={langs.map((lang) => lang.charAt(0).toUpperCase() + lang.slice(1)).join(", ")} />
              <StatCard
                label="By Difficulty"
                value={`${byDiff.easy}E · ${byDiff.medium}M · ${byDiff.hard}H`}
                icon={<BarChartIcon className="size-4" />}
              />
            </div>

            {/* Data Table Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ListIcon className="size-4 text-muted-foreground" />
                      All Questions
                    </CardTitle>
                    <CardDescription>{questions.length} questions in the database</CardDescription>
                  </div>
                  <Button size="sm" onClick={startNew} className="gap-1.5">
                    <PlusIcon className="size-3.5" />
                    New Question
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={questions}
                    searchKey="title"
                    searchPlaceholder="Search questions by title"
                    onRowClick={handleRowClick}
                    searchInputRef={searchInputRef}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {view === "create" && (
          <AdminQuestionForm mode="create" onSave={handleCreate} onCancel={goBack} />
        )}

        {view === "edit" && editTarget && (
          <AdminQuestionForm mode="edit" initial={editTarget} onSave={handleEdit} onCancel={goBack} />
        )}
      </main>

      {/* Question Details Dialog */}
      <QuestionDetailsDialog
        question={selectedQuestion}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone and will permanently remove the question from the database."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        icon="delete"
        onConfirm={confirmDelete}
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="Logout"
        description="Are you sure you want to logout from the admin portal? You will need to login again to access this page."
        confirmLabel="Logout"
        cancelLabel="Stay"
        variant="default"
        icon="logout"
        onConfirm={confirmLogout}
      />
    </div>
  );
}
