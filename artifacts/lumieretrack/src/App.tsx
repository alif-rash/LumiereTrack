import { useEffect, useRef, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell, Brand } from "@/components/app-shell";
import { ErrorState, SkeletonBlock } from "@/components/kit";
import { useWorkspaceQuery, WsContext, errMsg } from "@/lib/ws";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import Projects from "@/pages/projects";
import Assignments from "@/pages/assignments";
import ProjectDetail from "@/pages/project-detail";
import Tasks from "@/pages/tasks";
import Reviews from "@/pages/reviews";
import Grades from "@/pages/grades";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } } });

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const INK = "#1A2420", PAPER = "#FAF7F0", GREEN = "#1B5448", MUTED = "#5A645F", RULE = "#D9D3C4";
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "none" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: GREEN,
    colorForeground: INK,
    colorMutedForeground: MUTED,
    colorDanger: "#B5402A",
    colorBackground: PAPER,
    colorInput: "#FFFDF8",
    colorInputForeground: INK,
    colorNeutral: INK,
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    borderRadius: "0.25rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#FAF7F0] rounded-[4px] w-[440px] max-w-full overflow-hidden border border-[#1A2420] shadow-none",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#1A2420] font-semibold text-[26px] [font-family:Fraunces,Georgia,serif] tracking-tight",
    headerSubtitle: "text-[#5A645F]",
    socialButtonsBlockButtonText: "text-[#1A2420] font-medium",
    formFieldLabel: "text-[#1A2420] font-semibold",
    footerActionLink: "text-[#1B5448] font-semibold underline underline-offset-2",
    footerActionText: "text-[#5A645F]",
    dividerText: "text-[#5A645F] uppercase tracking-[0.14em] text-[10px] [font-family:'IBM_Plex_Mono',monospace]",
    identityPreviewEditButton: "text-[#1B5448]",
    formFieldSuccessText: "text-[#1B5448]",
    alertText: "text-[#1A2420]",
    logoBox: "hidden",
    logoImage: "hidden",
    socialButtonsBlockButton: "border border-[#D9D3C4] bg-[#FFFDF8] hover:bg-[#F1ECDF] rounded-[3px]",
    formButtonPrimary: "bg-[#1B5448] text-[#FAF7F0] font-semibold rounded-[3px] shadow-none",
    formFieldInput: "bg-[#FFFDF8] border border-[#D9D3C4] text-[#1A2420] rounded-[3px]",
    footerAction: "bg-[#F1ECDF] border-t border-[#D9D3C4]",
    dividerLine: "bg-[#D9D3C4]",
    alert: "bg-[#F5E6E1] border border-[#B5402A]/30 rounded-[3px]",
    otpCodeFieldInput: "border border-[#D9D3C4] text-[#1A2420]",
    formFieldRow: "gap-3",
    main: "gap-5",
  },
};

function AuthLayout({ children, title, body }: { children: ReactNode; title: string; body: string }) {
  return (
    <div className="grid min-h-[100dvh] bg-background lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden flex-col justify-between bg-foreground p-12 text-[hsl(42_38%_96%)] lg:flex">
        <Brand light />
        <div>
          <div className="mb-5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[hsl(42_38%_96%/0.55)]">Evidence-first group work</div>
          <h1 className="max-w-md text-[46px] font-medium leading-[1.02]">{title}</h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[hsl(42_38%_96%/0.7)]">{body}</p>
        </div>
        <ol className="grid grid-cols-4 border-t border-[hsl(42_38%_96%/0.2)] pt-4 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[hsl(42_38%_96%/0.6)]">
          {["Responsibility", "Evidence", "Review", "Grade"].map((s, i) => <li key={s}><span className="text-[hsl(38_78%_60%)]">0{i + 1}</span><br />{s}</li>)}
        </ol>
      </div>
      <div className="grid-paper flex items-center justify-center px-4 py-10">
        <div className="w-full">
          <div className="mb-8 flex justify-center lg:hidden"><Brand /></div>
          {children}
        </div>
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthLayout title="Welcome back to the record." body="Pick up where your group left off — tasks, evidence and feedback are waiting.">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </AuthLayout>
  );
}

function SignUpPage() {
  return (
    <AuthLayout title="Fair grades start with a clear record." body="Create your account, then choose whether you're a student or a professor.">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </AuthLayout>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

function LoadingShell() {
  return (
    <div className="min-h-[100dvh] bg-background lg:pl-[240px]" aria-busy="true" aria-label="Loading workspace">
      <div className="sidebar-navy fixed inset-y-0 left-0 hidden w-[240px] border-r border-foreground/15 p-5 lg:block">
        <SkeletonBlock className="h-7 w-36" />
        <div className="mt-10 space-y-3">{Array.from({ length: 7 }).map((_, i) => <SkeletonBlock key={i} className="h-6" />)}</div>
      </div>
      <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-12 md:px-8">
        <SkeletonBlock className="h-3 w-40" />
        <SkeletonBlock className="h-10 w-80" />
        <div className="h-px bg-foreground" />
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-16" />)}</div>
        <SkeletonBlock className="h-72" />
      </div>
    </div>
  );
}

function Gate({ children, onboarding }: { children: ReactNode; onboarding?: boolean }) {
  const q = useWorkspaceQuery();
  if (q.isLoading) return <LoadingShell />;
  if (q.isError || !q.data) return <div className="grid min-h-[100dvh] place-items-center px-4"><ErrorState message={q.error ? errMsg(q.error) : undefined} onRetry={() => q.refetch()} /></div>;
  const role = q.data.profile.role;
  if (role === "unassigned" && !onboarding) return <Redirect to="/onboarding" />;
  if (role !== "unassigned" && onboarding) return <Redirect to="/dashboard" />;
  return <WsContext.Provider value={q.data}>{onboarding ? children : <AppShell>{children}</AppShell>}</WsContext.Provider>;
}

function Protected({ children, onboarding }: { children: ReactNode; onboarding?: boolean }) {
  return (
    <>
      <Show when="signed-in"><Gate onboarding={onboarding}>{children}</Gate></Show>
      <Show when="signed-out"><Redirect to="/" /></Show>
    </>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><Home /></Show>
    </>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Sign in to LumiereTrack", subtitle: "Your courses, groups and evidence" } },
        signUp: { start: { title: "Create your account", subtitle: "Students and professors start here" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <RoutedErrorBoundary>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route path="/onboarding"><Protected onboarding><Onboarding /></Protected></Route>
              <Route path="/dashboard"><Protected><Dashboard /></Protected></Route>
              <Route path="/courses"><Protected><Courses /></Protected></Route>
              <Route path="/courses/:id"><Protected><CourseDetail /></Protected></Route>
              <Route path="/assignments"><Protected><Assignments /></Protected></Route>
              <Route path="/projects"><Protected><Projects /></Protected></Route>
              <Route path="/projects/:id"><Protected><ProjectDetail /></Protected></Route>
              <Route path="/tasks"><Protected><Tasks /></Protected></Route>
              <Route path="/reviews"><Protected><Reviews /></Protected></Route>
              <Route path="/grades"><Protected><Grades /></Protected></Route>
              <Route path="/notifications"><Protected><Notifications /></Protected></Route>
              <Route path="/settings"><Protected><Settings /></Protected></Route>
              <Route component={NotFound} />
            </Switch>
          </RoutedErrorBoundary>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
