import { Link } from "wouter";
import { ArrowRight, FileCheck2, Scale, History, ListTree, ShieldCheck, MessageSquareText } from "lucide-react";
import { Brand } from "@/components/app-shell";

const columns = ["To Do", "In Progress", "Submitted", "Under Review", "Changes Requested", "Approved"];

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-transparent bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4">
          <Brand />
          <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#roles" className="hover:text-foreground">Students & professors</a>
            <a href="#principles" className="hover:text-foreground">Principles</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-muted" data-testid="link-signin">Sign in</Link>
            <Link href="/sign-up" className="rounded-lg bg-[hsl(var(--navy))] px-4 py-2 text-sm font-semibold text-white hover:bg-primary" data-testid="link-signup">Get started</Link>
          </div>
        </div>
      </header>

      <section className="grid-paper relative overflow-hidden">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-5 pb-20 pt-16 md:pt-24 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div className="rise">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-primary">For university group projects</div>
            <h1 className="text-[44px] font-extrabold leading-[1.02] text-[hsl(var(--navy))] md:text-[64px]">
              Assess the evidence.<br /><span className="text-primary">Not the clicks.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
              LumiereTrack gives every student a clear record of what they owned and delivered — and gives professors versioned, reviewable proof to grade fairly, person by person.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_hsl(214_65%_52%/0.8)] hover:bg-[hsl(var(--navy))]" data-testid="link-hero-signup">
                Create your workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/sign-in" className="rounded-xl border bg-card px-5 py-3 text-sm font-semibold hover:bg-accent" data-testid="link-hero-signin">I already have an account</Link>
            </div>
          </div>
          <div className="rise relative rounded-3xl border bg-card p-4 shadow-[0_40px_80px_-40px_hsl(215_57%_18%/0.35)]" style={{ animationDelay: "120ms" }}>
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">One workflow, six honest states</div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {columns.map((c, i) => (
                <div key={c} className="rounded-xl bg-[hsl(var(--background))] p-2.5">
                  <span className="pill" data-s={c}>{c}</span>
                  <div className="mt-3 space-y-1.5">
                    {Array.from({ length: (i % 3) + 1 }).map((_, j) => (
                      <div key={j} className="rounded-lg border bg-card p-2">
                        <div className="h-1.5 w-4/5 rounded bg-[hsl(var(--navy)/0.15)]" />
                        <div className="mt-1.5 h-1.5 w-1/2 rounded bg-[hsl(var(--navy)/0.08)]" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 md:grid-cols-[1fr_2fr]">
          <h2 className="text-3xl font-extrabold text-[hsl(var(--navy))]">Group work has a fairness problem.</h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>One person carries the report. Another joins the final call. Everyone gets the same mark. Activity metrics don't fix it — commit counts and login streaks reward noise, not substance.</p>
            <p>LumiereTrack replaces guesswork with a documented chain: <span className="font-semibold text-foreground">responsibility, evidence, review, grade</span>. Every step is attributable and every revision is kept.</p>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1200px] px-5 py-20">
        <div className="mb-12 max-w-xl">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-primary">How it works</div>
          <h2 className="mt-3 text-4xl font-extrabold text-[hsl(var(--navy))]">From brief to grade in four documented steps.</h2>
        </div>
        <ol className="grid gap-px overflow-hidden rounded-3xl border bg-border md:grid-cols-4">
          {[
            ["Brief", "Professors publish an assignment with instructions, deliverables, rubric, group size and marks."],
            ["Divide", "Groups split the work into owned tasks with priorities and dates — on a shared board."],
            ["Evidence", "Owners submit notes, links and files. Resubmissions become new versions, never overwrites."],
            ["Assess", "Professors approve or request changes, then award group and individual grades."],
          ].map(([t, b], i) => (
            <li key={t} className="bg-card p-7">
              <div className="font-mono-num text-xs text-primary">0{i + 1}</div>
              <div className="mt-6 font-display text-xl font-bold">{t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="roles" className="bg-[hsl(var(--navy))] text-white">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-5 py-20 md:grid-cols-2">
          {[
            { k: "For students", h: "Your work, on the record.", pts: ["A personal task list across every project", "Versioned submissions with files and links", "Feedback and grades in one place", "Exportable contribution reports"] },
            { k: "For professors", h: "Grade with proof in hand.", pts: ["Courses, invite codes and roster management", "A focused review queue across all groups", "Per-member contribution breakdowns", "Individual and group grading with feedback"] },
          ].map((c) => (
            <div key={c.k} className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#8DB6EC]">{c.k}</div>
              <h3 className="mt-3 text-3xl font-extrabold">{c.h}</h3>
              <ul className="mt-6 space-y-3">
                {c.pts.map((p) => <li key={p} className="flex gap-3 text-[15px] text-white/80"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3478D4]" />{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="principles" className="mx-auto max-w-[1200px] px-5 py-20">
        <h2 className="max-w-2xl text-4xl font-extrabold text-[hsl(var(--navy))]">Built on a few stubborn principles.</h2>
        <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [FileCheck2, "Evidence over activity", "No leaderboards, no streaks. What counts is what was delivered and approved."],
            [History, "Nothing is overwritten", "Every resubmission is a new version with its own review trail."],
            [Scale, "Individual fairness", "Professors can grade the group and each member separately."],
            [ShieldCheck, "Privacy by default", "You only ever see the courses, groups and records you belong to."],
            [ListTree, "Clear ownership", "Every task has one owner, a priority and a date — visible to the whole group."],
            [MessageSquareText, "Feedback that lands", "Reviews attach to specific submissions, so changes are never ambiguous."],
          ].map(([Icon, t, b]) => {
            const I = Icon as typeof FileCheck2;
            return (
              <div key={t as string}>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--soft))] text-primary"><I className="h-5 w-5" /></div>
                <div className="mt-4 font-display text-lg font-bold">{t as string}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pb-20">
        <div className="grid gap-8 rounded-3xl border bg-card p-8 md:grid-cols-2 md:p-12">
          <div>
            <h2 className="text-3xl font-extrabold text-[hsl(var(--navy))]">Questions, answered.</h2>
          </div>
          <div className="divide-y">
            {[
              ["Who creates courses?", "Professors. Students join with an invite code or are added by email."],
              ["Can students form their own groups?", "If the assignment allows it. Otherwise the professor assigns members."],
              ["Can I export a report?", "Yes — any project you can access exports to a printable document you can save as PDF."],
              ["Is there an AI assistant?", "Yes. It answers questions using only the data your account is allowed to see."],
            ].map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="cursor-pointer list-none font-semibold">{q}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="grid-paper border-t">
        <div className="mx-auto max-w-[1200px] px-5 py-20 text-center">
          <h2 className="mx-auto max-w-2xl text-4xl font-extrabold text-[hsl(var(--navy))] md:text-5xl">Start this semester with a fair record.</h2>
          <Link href="/sign-up" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-[hsl(var(--navy))]" data-testid="link-footer-signup">Create your account <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-3 px-5 py-8 text-xs text-muted-foreground md:flex-row">
          <span className="font-display font-bold text-foreground">LumiereTrack</span>
          <span>Evidence-first workspace for university group projects.</span>
        </div>
      </footer>
    </div>
  );
}
