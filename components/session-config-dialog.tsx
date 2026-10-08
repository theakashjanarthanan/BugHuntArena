"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ClockIcon,
  ZapIcon,
  PlayIcon,
  InfoIcon,
} from "lucide-react";

type TimeframeOption = {
  value: number;
  label: string;
  description: string;
  badge?: string;
};

const TIMEFRAMES: TimeframeOption[] = [
  {
    value: 30,
    label: "Quick Sprint",
    description: "30 minutes",
    badge: "Beginner",
  },
  {
    value: 60,
    label: "Standard Session",
    description: "1 hour",
    badge: "Popular",
  },
  {
    value: 120,
    label: "Marathon Mode",
    description: "2 hours",
    badge: "Expert",
  },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: string;
  difficulty: string;
  onStart: (timeframe: number) => void;
  loading?: boolean;
};

export function SessionConfigDialog({
  open,
  onOpenChange,
  language,
  difficulty,
  onStart,
  loading = false,
}: Props) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(60);

  const handleStart = () => {
    onStart(selectedTimeframe);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ZapIcon className="size-5 text-primary" />
            Start New Hunt Session
          </DialogTitle>
          <DialogDescription>
            Ready to hunt? Configure your session, sharpen your focus, and start finding bugs. The clock keeps ticking until you end the hunt or time runs out.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selected Settings */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium mb-2">Session Settings</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                {language}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {difficulty}
              </Badge>
            </div>
          </div>

          {/* Timeframe Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">Choose Session Duration</p>
            </div>
            
            <div className="space-y-2">
              {TIMEFRAMES.map((timeframe) => (
                <button
                  key={timeframe.value}
                  onClick={() => setSelectedTimeframe(timeframe.value)}
                  className={cn(
                    "w-full rounded-lg border-2 p-4 text-left transition-all",
                    "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedTimeframe === timeframe.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          selectedTimeframe === timeframe.value
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        )}>
                          {selectedTimeframe === timeframe.value && (
                            <div className="size-2 rounded-full bg-primary-foreground" />
                          )}
                        </div>
                        <p className="font-medium text-sm">{timeframe.label}</p>
                        {timeframe.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {timeframe.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground ml-7">
                        {timeframe.description}
                      </p>
                    </div>
                    <ClockIcon className="size-4 text-muted-foreground mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="flex gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-sm">
            <InfoIcon className="size-4 shrink-0 text-blue-500 mt-0.5" />
            <div className="space-y-1 text-muted-foreground">
              <p>Your progress will be saved automatically. You can resume this session anytime before it expires.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>Processing...</>
            ) : (
              <>
                <PlayIcon className="size-4" />
                Start Hunt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
