import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Shell from "@/components/layout/Shell";
import Dashboard from "@/pages/Dashboard";
import Courses from "@/pages/Courses";
import NewRound from "@/pages/NewRound";
import PlayRound from "@/pages/PlayRound";
import RoundDetail from "@/pages/RoundDetail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  }
});

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/courses" component={Courses} />
        <Route path="/rounds/new" component={NewRound} />
        <Route path="/rounds/:id/play" component={PlayRound} />
        <Route path="/rounds/:id" component={RoundDetail} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
