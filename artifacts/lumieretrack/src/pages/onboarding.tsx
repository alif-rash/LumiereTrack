import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { GraduationCap, Presentation, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/kit";
import { Brand } from "@/components/app-shell";
import { useAct, useWs } from "@/lib/ws";
import { cn } from "@/lib/utils";

export default function Onboarding() {
  const ws = useWs();
  const { user } = useUser();
  const [, nav] = useLocation();
  const { run, pending } = useAct();
  const [role, setRole] = useState<"student" | "professor" | null>(null);
  const [f, setF] = useState({ name: ws.profile.name || user?.fullName || "", university: "", major: "", semester: "", department: "", studentId: "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="grid-paper min-h-[100dvh]">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Brand />
        <div className="rise mt-14">
          <div className="eyebrow">Step {role ? 2 : 1} of 2</div>
          <h1 className="mt-3 text-4xl md:text-5xl leading-[1.05]">{role ? "Tell us where you teach or study." : "How will you use LumiereTrack?"}</h1>
          <p className="mt-2 text-muted-foreground">{role ? "This appears on reports and helps classmates recognise you." : "Choose carefully — your role is set once and shapes your whole workspace."}</p>
        </div>

        {!role ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {([
              ["student", GraduationCap, "I'm a student", "Join courses, own tasks, submit evidence and track grades."],
              ["professor", Presentation, "I'm a professor", "Run courses, publish assignments, review work and grade fairly."],
            ] as const).map(([r, Icon, t, b]) => (
              <button key={r} onClick={() => setRole(r)} data-testid={`button-role-${r}`}
                className="group border border-foreground/25 bg-card p-6 text-left transition-colors hover:border-foreground focus-visible:border-foreground">
                <div className="text-primary"><Icon className="h-5 w-5" /></div>
                <div className="mt-5 font-display text-lg font-bold">{t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{b}</p>
              </button>
            ))}
          </div>
        ) : (
          <form className="rise mt-10 space-y-4 border-t-2 border-foreground bg-card p-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await run({ action: "onboard", role, ...f });
              if (r) nav("/dashboard");
            }}>
            <Field label="Full name"><Input required value={f.name} onChange={set("name")} data-testid="input-name" /></Field>
            <Field label="University"><Input required value={f.university} onChange={set("university")} placeholder="University of Edinburgh" data-testid="input-university" /></Field>
            {role === "student" ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Major"><Input value={f.major} onChange={set("major")} data-testid="input-major" /></Field>
                <Field label="Semester"><Input value={f.semester} onChange={set("semester")} placeholder="Fall 2025" data-testid="input-semester" /></Field>
                <Field label="Student ID"><Input value={f.studentId} onChange={set("studentId")} data-testid="input-student-id" /></Field>
              </div>
            ) : (
              <Field label="Department"><Input value={f.department} onChange={set("department")} placeholder="School of Informatics" data-testid="input-department" /></Field>
            )}
            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setRole(null)} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground" data-testid="button-back"><ArrowLeft className="h-4 w-4" /> Change role</button>
              <Button type="submit" disabled={pending} className={cn("px-6")} data-testid="button-finish-onboarding">{pending ? "Setting up…" : `Continue as ${role}`}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
