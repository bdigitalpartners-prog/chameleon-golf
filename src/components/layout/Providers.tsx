"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { CompareProvider } from "@/contexts/CompareContext";
import { BucketListProvider } from "@/contexts/BucketListContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ToastProvider } from "@/components/ui/ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
  }));

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SidebarProvider>
            <CompareProvider>
              <BucketListProvider>
                {children}
                <ToastProvider />
              </BucketListProvider>
            </CompareProvider>
          </SidebarProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
