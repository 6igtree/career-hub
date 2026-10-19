"use client";

import { useSyncExternalStore } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

const DESKTOP = "(min-width: 1024px)";

export function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = matchMedia(DESKTOP);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => matchMedia(DESKTOP).matches,
    () => false,
  );
}

/** 1件を編集する画面。スマホでは下から出し、パソコンでは中央に出す */
export function EditSheet({ open, onOpenChange, title, description, footer, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const desktop = useIsDesktop();

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg">{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto px-4 py-4">{children}</div>
        <DrawerFooter className="flex-row pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
