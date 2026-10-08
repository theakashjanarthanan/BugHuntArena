"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ZapIcon,
  LightbulbIcon,
  BugIcon,
  CodeIcon,
  CalendarIcon,
} from "lucide-react";

export type Question = {
  id: string;
  title: string;
  description: string;
  language: string;
  difficulty: "easy" | "medium" | "hard";
  code: string;
  bugLine: number;
  bugExplanation: string;
  hints: string[];
  xp: number;
  createdAt: string;
};

type Props = {
  question: Question | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DiffBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, string> = {
    easy: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
    hard: "bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400",
  };
  return (
    <Badge variant="outline" className={cn(map[difficulty] ?? "")}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </Badge>
  );
}

function CodePreview({ code, bugLine }: { code: string; bugLine: number }) {
  const lines = code.split("\n");
  return (
    <div className="overflow-hidden rounded-lg border bg-muted/40 font-mono text-xs">
      <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-1.5">
        <div className="size-2.5 rounded-full bg-red-400/80" />
        <div className="size-2.5 rounded-full bg-yellow-400/80" />
        <div className="size-2.5 rounded-full bg-green-400/80" />
        <span className="ml-1 text-muted-foreground">code</span>
      </div>
      <div className="overflow-x-auto p-3 max-h-60">
        <table className="border-collapse">
          <tbody>
            {lines.map((line, i) => {
              const n = i + 1;
              const isBug = n === bugLine;
              return (
                <tr key={i} className={cn(isBug && "bg-red-500/15 dark:bg-red-500/20")}>
                  <td className="w-8 select-none pr-3 text-right text-muted-foreground/50">
                    {n}
                  </td>
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

export function QuestionDetailsDialog({ question, open, onOpenChange }: Props) {
  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-0">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-lg">{question.title}</DialogTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {question.language}
                </Badge>
                <DiffBadge difficulty={question.difficulty} />
                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30 dark:text-amber-400">
                  <ZapIcon className="size-3" />
                  {question.xp} XP
                </Badge>
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <CalendarIcon className="size-3" />
                  {question.createdAt}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Description */}
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{question.description}</p>
            </div>

            <Separator />

            {/* Code */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CodeIcon className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Code (Bug on line {question.bugLine})</h3>
              </div>
              <CodePreview code={question.code} bugLine={question.bugLine} />
            </div>

            <Separator />

            {/* Bug Explanation */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BugIcon className="size-4 text-destructive" />
                <h3 className="text-sm font-medium">Bug Explanation</h3>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm">{question.bugExplanation}</p>
              </div>
            </div>

            <Separator />

            {/* Hints */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <LightbulbIcon className="size-4 text-amber-500" />
                <h3 className="text-sm font-medium">Hints ({question.hints.length})</h3>
              </div>
              <div className="space-y-2">
                {question.hints.map((hint, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-medium text-muted-foreground">
                      {i + 1}
                    </div>
                    <p className="text-sm text-muted-foreground flex-1 pt-0.5">{hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
