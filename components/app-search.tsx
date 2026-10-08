"use client";

import { useRef, useState, useEffect, useCallback, useId } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useKeypress } from "@/hooks/use-keypress";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { SearchIcon, XIcon } from "lucide-react";
import { navLinks } from "@/components/app-shared";

// Only include items that have a real path (no hash routes)
const SEARCHABLE = navLinks.filter(
  (item) => item.path && !item.path.startsWith("#")
);

export function AppSearch() {
  const listId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { open, setOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Filter nav items by query
  const results = query.trim()
    ? SEARCHABLE.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      )
    : SEARCHABLE; // show all when query is empty but focused

  // ── Open sidebar + focus on shortcut ──────────────────────────────────────
  useKeypress({
    combo: ["meta+k", "ctrl+k", "/"],
    callback: () => {
      setOpen(true);
      // Small delay so sidebar animation doesn't swallow focus
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
    },
  });

  // ── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (!groupRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  // ── Close + clear on route change ─────────────────────────────────────────
  useEffect(() => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }, [pathname]);

  // ── Keyboard navigation inside the dropdown ───────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = results[activeIndex] ?? results[0];
        if (target?.path) {
          router.push(target.path);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
      }
    },
    [isOpen, results, activeIndex, router]
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleClear = () => {
    setQuery("");
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleSelect = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <div
      ref={groupRef}
      className={cn("relative", !open && "hidden")}
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-owns={listId}
    >
      <InputGroup>
        <InputGroupAddon align="inline-start" className="pl-1.75">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          aria-label="Search pages"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={
            activeIndex >= 0 ? `search-item-${activeIndex}` : undefined
          }
          name="q"
          placeholder="Search"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        />
        <InputGroupAddon align="inline-end">
          {query ? (
            <InputGroupButton
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <XIcon />
            </InputGroupButton>
          ) : (
            <Kbd>/</Kbd>
          )}
        </InputGroupAddon>
      </InputGroup>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          aria-label="Page suggestions"
          className={cn(
            "absolute left-0 top-full z-50 mt-1 w-full overflow-hidden",
            "rounded-lg border border-border bg-popover shadow-md",
            "py-1 text-sm text-popover-foreground",
            "max-h-52 overflow-y-auto"
          )}
        >
          {results.map((item, i) => (
            <li
              key={item.path}
              id={`search-item-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onPointerDown={(e) => {
                // Prevent input blur before click fires
                e.preventDefault();
              }}
              onClick={() => item.path && handleSelect(item.path)}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                i === activeIndex && "bg-accent text-accent-foreground",
                pathname === item.path &&
                  "font-medium text-primary"
              )}
            >
              {/* Icon */}
              <span className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md border bg-background",
                "[&_svg]:size-3.5 [&_svg]:text-muted-foreground",
                i === activeIndex && "[&_svg]:text-accent-foreground",
                pathname === item.path && "border-primary/30 [&_svg]:text-primary"
              )}>
                {item.icon}
              </span>

              {/* Label */}
              <span className="flex-1 truncate">{item.title}</span>

              {/* Active indicator */}
              {pathname === item.path && (
                <span className="text-xs text-primary/70">current</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* No results */}
      {isOpen && query.trim() && results.length === 0 && (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-1 w-full",
            "rounded-lg border border-border bg-popover px-3 py-4 text-center",
            "text-xs text-muted-foreground shadow-md"
          )}
        >
          No pages match &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
