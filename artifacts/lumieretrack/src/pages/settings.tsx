import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Field, Initials } from "@/components/kit";
import { useAct, useWs, isProf } from "@/lib/ws";

export default function Settings() {
  const ws = useWs();
  const p = ws.profile;
  const { run, pending } = useAct();
  const [f, setF] = useState({ name: p.name, university: p.university, major: p.major, semester: p.semester, department: p.department, studentId: p.studentId, avatar: p.avatar || "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const dirty = (Object.keys(f) as (keyof typeof f)[]).some((k) => f[k] !== (p[k] || ""));
  return (
    <>
      <PageHeader eyebrow="Settings" title="Your profile" description="This information appears on reports and to members of your courses and groups." />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Panel>
          <div className="flex flex-col items-center text-center">
            {/^https?:\/\//.test(f.avatar) ? <img src={f.avatar} alt="" className="h-20 w-20 rounded-full object-cover border border-foreground/20" /> : <Initials name={f.name} className="h-20 w-20 text-xl" />}
            <div className="mt-4 font-display text-lg font-bold">{f.name}</div>
            <div className="text-sm text-muted-foreground">{p.email}</div>
            <span className="mt-3 pill capitalize">{p.role}</span>
            <p className="mt-4 text-xs text-muted-foreground">Your role was set during onboarding and can't be changed here.</p>
          </div>
        </Panel>
        <Panel title="Details">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (f.avatar && !/^https?:\/\/\S+$/.test(f.avatar)) return; run({ action: "updateProfile", ...f, avatar: f.avatar.trim() }); }}>
            <Field label="Full name"><Input required value={f.name} onChange={set("name")} data-testid="input-name" /></Field>
            <Field label="Avatar image URL (optional)" hint="Must start with http:// or https://"><Input type="url" value={f.avatar} onChange={set("avatar")} placeholder="https://" data-testid="input-avatar" /></Field>
            <Field label="University"><Input value={f.university} onChange={set("university")} data-testid="input-university" /></Field>
            {isProf(ws) ? (
              <Field label="Department"><Input value={f.department} onChange={set("department")} data-testid="input-department" /></Field>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Major"><Input value={f.major} onChange={set("major")} data-testid="input-major" /></Field>
                <Field label="Semester"><Input value={f.semester} onChange={set("semester")} data-testid="input-semester" /></Field>
                <Field label="Student ID"><Input value={f.studentId} onChange={set("studentId")} data-testid="input-student-id" /></Field>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" disabled={!dirty} onClick={() => setF({ name: p.name, university: p.university, major: p.major, semester: p.semester, department: p.department, studentId: p.studentId, avatar: p.avatar || "" })} data-testid="button-reset">Discard</Button>
              <Button type="submit" disabled={!dirty || pending} data-testid="button-save-profile">{pending ? "Saving…" : "Save changes"}</Button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  );
}
