import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/app-shell";

const STATES = ["To Do", "In Progress", "Submitted", "Under Review", "Changes Requested", "Approved"];

/** Schematic only — grey bars stand in for content. No people, marks or stats are invented. */
function RecordSchematic() {
  const rows = [
    { s: "Approved", w: "w-[70%]" },
    { s: "Under Review", w: "w-[55%]" },
    { s: "Changes Requested", w: "w-[62%]" },
    { s: "In Progress", w: "w-[48%]" },
  ];
  const Bar = ({ className }: { className: string }) => <span aria-hidden className={`block h-2 bg-foreground/12 ${className}`} />;
  return (
    <figure className="rise border border-foreground bg-card" style={{ animationDelay: "120ms" }} aria-label="Schematic of a LumiereTrack project record">
      <div className="flex items-center justify-between border-b border-foreground px-5 py-3">
        <span className="eyebrow">Project record — schematic</span>
        <span className="eyebrow">Responsibility · Evidence · Review</span>
      </div>
      <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-border px-5 py-2.5">
        {["Task and owner", "Evidence", "Decision"].map((h) => <span key={h} className="eyebrow !text-[9.5px]">{h}</span>)}
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-6 w-6 shrink-0 rounded-full border border-foreground/25 bg-secondary" />
            <div className="w-full space-y-1.5"><Bar className={r.w} /><Bar className="w-[35%] !bg-foreground/7" /></div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground"><span aria-hidden className="h-3.5 w-3 border border-foreground/30" />v{i === 2 ? 2 : 1}</div>
          <div><span className="pill" data-s={r.s}>{r.s}</span></div>
        </div>
      ))}
      <div className="grid grid-cols-2 divide-x divide-border">
        <div className="px-5 py-4"><div className="eyebrow !text-[9.5px]">Group mark</div><Bar className="mt-2 w-16" /></div>
        <div className="px-5 py-4"><div className="eyebrow !text-[9.5px]">Individual mark — visible only to that student</div><Bar className="mt-2 w-16" /></div>
      </div>
      <figcaption className="border-t border-foreground bg-secondary px-5 py-2.5 text-[11px] text-muted-foreground">Illustration of structure only. Your workspace starts empty and fills with your own course records.</figcaption>
    </figure>
  );
}

export default function Home() {
  return (
    <div className="paper-noise min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-foreground/15 bg-background/95">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4">
          <Brand />
          <nav aria-label="Sections" className="hidden gap-8 text-[13px] text-muted-foreground md:flex">
            <a href="#problem" className="hover:text-foreground">The problem</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#roles" className="hover:text-foreground">Students and professors</a>
            <a href="#faq" className="hover:text-foreground">Questions</a>
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/sign-in" className="px-3 py-2 text-sm font-medium hover:underline hover:underline-offset-4" data-testid="link-signin">Sign in</Link>
            <Link href="/sign-up" className="rounded-[3px] bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-primary" data-testid="link-signup">Create account</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-5 pb-20 pt-14 md:pt-20">
        <div className="eyebrow rise mb-8 flex items-center gap-3"><span className="h-px w-10 bg-foreground" />A workspace for university group projects</div>
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div className="rise">
            <h1 className="text-[48px] font-medium leading-[0.98] tracking-[-0.025em] md:text-[78px]">
              Who did the work should <em className="font-normal italic text-primary">never</em> be a guess.
            </h1>
            <p className="mt-8 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
              Students record who owns each responsibility and attach the evidence. Professors review each version and grade the group and the individual — from the record, not from clicks or attendance.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-[3px] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-foreground" data-testid="link-hero-signup">
                Start your workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/sign-in" className="rounded-[3px] border border-foreground px-5 py-3 text-sm font-semibold hover:bg-card" data-testid="link-hero-signin">I already have an account</Link>
            </div>
          </div>
          <RecordSchematic />
        </div>
      </section>

      <section id="problem" className="border-y border-foreground bg-card">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-20 md:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="eyebrow mb-4">01 — The problem</div>
            <h2 className="text-[36px] leading-[1.05] md:text-[44px]">Group work has a fairness problem.</h2>
          </div>
          <div className="space-y-5 text-[16px] leading-relaxed text-muted-foreground">
            <p>One person carries the report. Another joins the final call. Everyone receives the same mark. Activity metrics do not fix it — logins and edit counts reward noise, not substance.</p>
            <p>LumiereTrack replaces guesswork with a documented chain: <span className="font-semibold text-foreground">responsibility, evidence, review, grade</span>. Every step is attributable, and every revision is kept.</p>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1200px] px-5 py-20">
        <div className="eyebrow mb-4">02 — How it works</div>
        <h2 className="max-w-2xl text-[36px] leading-[1.05] md:text-[44px]">From brief to grade in four documented steps.</h2>
        <ol className="mt-12 grid border-t border-foreground md:grid-cols-4">
          {[
            ["Brief", "Professors publish an assignment with instructions, deliverables, rubric, group size, a formation deadline and a submission deadline."],
            ["Divide", "Students form or join a group with a code, then split the work into tasks — each with one owner, a priority and dates."],
            ["Evidence", "Owners submit notes, links and files. A resubmission becomes a new version; nothing is overwritten."],
            ["Assess", "Professors approve or request changes on each version, then award group and individual marks."],
          ].map(([t, b], i) => (
            <li key={t} className="border-b border-border py-7 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0">
              <div className="font-mono text-[12px] text-primary">0{i + 1}</div>
              <div className="mt-8 font-display text-2xl">{t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 border border-border bg-card p-6">
          <div className="eyebrow mb-4">Six states every task and submission moves through</div>
          <div className="flex flex-wrap items-center gap-2">
            {STATES.map((s, i) => <span key={s} className="flex items-center gap-2"><span className="pill" data-s={s}>{s}</span>{i < STATES.length - 1 && <span aria-hidden className="h-px w-4 bg-foreground/30" />}</span>)}
          </div>
        </div>
      </section>

      <section id="roles" className="bg-foreground text-background">
        <div className="mx-auto grid max-w-[1200px] md:grid-cols-2">
          {[
            { k: "03 — For students", h: "Your work, on the record.", pts: ["One list of the tasks you own across every project", "Versioned submissions with files, links and notes", "Reviews and your private marks in one place", "A printable contribution report for any group"] },
            { k: "04 — For professors", h: "Grade with the evidence in hand.", pts: ["Courses, invite codes and roster management", "Group formation rules, deadlines and capacity", "A review queue across every group, oldest first", "Separate group and individual marks with feedback"] },
          ].map((c, i) => (
            <div key={c.k} className={`px-5 py-16 md:px-12 ${i === 0 ? "md:border-r md:border-background/20 md:pl-5" : ""}`}>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[hsl(38_78%_60%)]">{c.k}</div>
              <h3 className="mt-4 text-[32px] leading-[1.05]">{c.h}</h3>
              <ul className="mt-8 border-t border-background/20">
                {c.pts.map((p) => <li key={p} className="border-b border-background/20 py-3 text-[15px] text-background/80">{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20">
        <div className="eyebrow mb-4">05 — Principles</div>
        <h2 className="max-w-2xl text-[36px] leading-[1.05] md:text-[44px]">Built on a few stubborn rules.</h2>
        <dl className="mt-12 grid border-t border-foreground sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Evidence over activity", "No leaderboards, no streaks. What counts is what was delivered and approved."],
            ["Nothing is overwritten", "Every resubmission is a new version with its own review trail."],
            ["Individual fairness", "Professors grade the group and each member separately."],
            ["Private by default", "You only see the courses, groups and records you belong to. Individual marks reach only the student concerned."],
            ["Clear ownership", "Every task has one owner, a priority and a date — visible to the whole group."],
            ["Records outlast edits", "Members with recorded work cannot be quietly removed from a group."],
          ].map(([t, b]) => (
            <div key={t} className="border-b border-border py-6 sm:pr-8">
              <dt className="font-display text-xl">{t}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{b}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="faq" className="border-t border-foreground bg-card">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-20 md:grid-cols-[1fr_1.6fr]">
          <div><div className="eyebrow mb-4">06 — Questions</div><h2 className="text-[36px] leading-[1.05]">Answered plainly.</h2></div>
          <div className="border-t border-foreground">
            {[
              ["Who creates courses?", "Professors. Students join with an invite code or are added by email."],
              ["Can students form their own groups?", "If the assignment allows it. The creator becomes leader and shares a code; joining shows the group and its capacity before you confirm."],
              ["Can I export a report?", "Yes. Any project you can access opens as a printable document you can save as PDF. It contains only what your account may see."],
              ["Is there an assistant?", "Yes. It answers questions using only the records your account can see."],
            ].map(([q, a]) => (
              <details key={q} className="group border-b border-border py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{q}<span aria-hidden className="font-mono text-muted-foreground group-open:rotate-45">+</span></summary>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="grid-paper border-t border-foreground">
        <div className="mx-auto max-w-[1200px] px-5 py-24">
          <h2 className="max-w-3xl text-[44px] leading-[1] md:text-[64px]">Start this term with a fair record.</h2>
          <Link href="/sign-up" className="mt-10 inline-flex items-center gap-2 rounded-[3px] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-foreground" data-testid="link-footer-signup">Create your account <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
      <footer className="border-t border-foreground">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-3 px-5 py-8 text-xs text-muted-foreground md:flex-row">
          <span className="font-display text-base text-foreground">LumiereTrack</span>
          <span>Evidence-first workspace for university group projects.</span>
        </div>
      </footer>
    </div>
  );
}
