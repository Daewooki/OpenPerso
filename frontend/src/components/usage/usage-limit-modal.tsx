"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface UsageLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
}

export function UsageLimitModal({ open, onOpenChange, message }: UsageLimitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="font-display">사용량 제한</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Link href="/pricing" className="block">
            <Button className="w-full rounded-xl font-semibold">
              <Sparkles className="mr-2 h-4 w-4" />
              Premium 알아보기
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
