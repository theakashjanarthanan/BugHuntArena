"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  ZapIcon,
  LightbulbIcon,
  ArrowUpDownIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

type QuestionActionsProps = {
  question: Question;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
};

function QuestionActions({ question, onEdit, onDelete }: QuestionActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon-sm" 
          aria-label="Actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={(e) => {
          e.stopPropagation();
          onEdit(question);
        }}>
          <PencilIcon />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={(e) => {
          e.stopPropagation();
          onDelete(question.id);
        }}>
          <TrashIcon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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

export function createColumns(
  onEdit: (question: Question) => void,
  onDelete: (id: string) => void
): ColumnDef<Question>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3"
          >
            Title
            <ArrowUpDownIcon className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium max-w-md">{row.getValue("title")}</div>
      ),
    },
    {
      accessorKey: "language",
      header: "Language",
      cell: ({ row }) => (
        <span className="capitalize text-sm">{row.getValue("language")}</span>
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "difficulty",
      header: "Difficulty",
      cell: ({ row }) => <DiffBadge difficulty={row.getValue("difficulty")} />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "xp",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3"
          >
            XP
            <ArrowUpDownIcon className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm">
          <ZapIcon className="size-3" />
          {row.getValue("xp")}
        </span>
      ),
    },
    {
      accessorKey: "hints",
      header: "Hints",
      cell: ({ row }) => {
        const hints = row.getValue("hints") as string[];
        return (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <LightbulbIcon className="size-3" />
            {hints.length}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3"
          >
            Created
            <ArrowUpDownIcon className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.getValue("createdAt")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <QuestionActions question={row.original} onEdit={onEdit} onDelete={onDelete} />
      ),
    },
  ];
}
