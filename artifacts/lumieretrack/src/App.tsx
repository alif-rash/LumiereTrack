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

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "none" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#3478D4",
    colorForeground: "#142B4A",
    colorMutedForeground: "#5B6B82",
    colorDanger: "#D23F4C",
    colorBackground: "#FFFFFF",
    colorInput: "#F7F9FC",
    colorInputForeground: "#142B4A",
    colorNeutral: "#142B4A",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#E1E9F4] shadow-[0_30px_60px_-30px_rgba(20,43,74,0.35)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#142B4A] font-extrabold text-2xl",
    headerSubtitle: "text-[#5B6B82]",
    socialButtonsBlockButtonText: "text-[#142B4A] font-semibold",
    formFieldLabel: "text-[#142B4A] font-semibold",
    footerActionLink: "text-[#3478D4] font-semibold",
    footerActionText: "text-[#5B6B82]",
    dividerText: "text-[#5B6B82]",
    identityPreviewEditButton: "text-[#3478D4]",
    formFieldSuccessText: "text-[#1F7A5C]",
    alertText: "text-[#142B4A]",
    logoBox: "hidden",
    logoImage: "hidden",
    socialButtonsBlockButton: "border border-[#DCE5F1] bg-white hover:bg-[#EAF2FC]",
    formButtonPrimary: "bg-[#3478D4] text-white font-semibold",
    formFieldInput: "bg-[#F7F9FC] border border-[#DCE5F1] text-[#142B4A]",
    footerAction: "bg-[#F7F9FC]",
    dividerLine: "bg-[#E1E9F4]",
    alert: "bg-[#EAF2FC] border border-[#DCE5F1]",
    otpCodeFieldInput: "border border-[#DCE5F1] text-[#142B4A]",
    formFieldRow: "gap-3",
    main: "gap-5",
  },
};

function AuthLayout({ children, title, body }: { children: ReactNode; title: string; body: string }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[hsl(var(--navy))] p-12 text-white lg:flex">
        <Brand light />
        <div>
          <h1 className="max-w-md text-[42px] font-extrabold leading-[1.05]">{title}</h1>
          <p className="mt-4 max-w-sm text-white/70">{body}</p>
        </div>
        <div className="text-xs text-white/50">Responsibility · Evidence · Review · Grade</div>
      </div>
      <div className="grid-paper flex items-center justify-center bg-background px-4 py-10">{children}</div>
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
    <div className="min-h-[100dvh] bg-background lg:pl-[256px]">
      <div className="sidebar-navy fixed inset-y-0 left-0 hidden w-[256px] p-5 lg:block">
        <SkeletonBlock className="h-8 w-36" />
        <div className="mt-10 space-y-3">{Array.from({ length: 7 }).map((_, i) => <SkeletonBlock key={i} className="h-8" />)}</div>
      </div>
      <div className="mx-auto max-w-[1240px] space-y-6 px-4 py-10 md:px-8">
        <SkeletonBlock className="h-10 w-72" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-24" />)}</div>
        <SkeletonBlock className="h-80" />
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
