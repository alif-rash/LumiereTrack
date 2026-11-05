import { useState, type ReactNode } from "react";
import { Copy, RefreshCw, Ban, UserMinus, UserPlus, Crown, KeyRound, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Panel, Initials, Pill, fmtDate } from "@/components/kit";
import { useToast } from "@/hooks/use-toast";
import { useWs, useAct, isProf, isLeader, nameOf, groupCtx, type Rec } from "@/lib/ws";

function Note({ children }: { children: ReactNode }) {
  return <p className="flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{children}</p>;
}

export function Capacity({ g, compact }: { g: Rec; compact?: boolean }) {
  const size = g.groupSize ?? 0;
  const count = g.memberCount ?? g.memberIds?.length ?? 0;
  return (
    <div data-testid={`capacity-${g.id}`}>
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.max(size, count) }).map((_, i) => (
          <span key={i} className={`h-2 flex-1 rounded-full transition-colors ${i < count ? "bg-[#28B8A6]" : "bg-[hsl(var(--soft))]"}`} />
        ))}
      </div>
      {!compact && <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground"><span className="font-mono-num">{count}/{size || "?"} members</span><span>{g.remainingSlots ?? Math.max(0, size - count)} slot{(g.remainingSlots ?? size - count) === 1 ? "" : "s"} left{g.minGroupSize ? ` · min ${g.minGroupSize}` : ""}</span></div>}
    </div>
  );
}

export function GroupManage({ g }: { g: Rec }) {
  const ws = useWs();
  const { toast } = useToast();
  const { run, pending } = useAct();
  const prof = isProf(ws);
  const leader = isLeader(ws, g);
  const canCodes = prof || leader;
  const formationOpen = g.groupFormationOpen !== false;
  const canRemove = prof || (leader && formationOpen && g.allowMemberManagement !== false);
  const canRegen = canCodes && formationOpen && g.allowJoin !== false;
  const members = g.memberIds ?? [];
  const full = (g.remainingSlots ?? 1) <= 0;
  const expired = !!g.inviteExpiresAt && new Date(g.inviteExpiresAt).getTime() < Date.now();
  const inviteUsable = !expired && formationOpen && g.allowJoin !== false;
  const { course } = groupCtx(ws, g);
  const [addId, setAddId] = useState("");
  const taken = new Set(ws.groups.filter((x) => x.assignmentId === g.assignmentId).flatMap((x) => x.memberIds ?? []));
  const addable = ws.people.filter((p) => course?.memberIds?.includes(p.id) && p.role !== "professor" && !taken.has(p.id));

  const copy = async () => {
    if (!g.code) return;
    try {
      await navigator.clipboard.writeText(g.code);
      toast({ title: "Invitation code copied", description: `Share ${g.code} with teammates.` });
    } catch {
      toast({ title: "Couldn't copy automatically", description: `Select and copy the code: ${g.code}`, variant: "destructive" });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Panel tone="lavender" title="Members" icon={<Crown className="h-4 w-4" />} testId="panel-group-members"
        action={<div className="flex gap-1.5"><Pill s={formationOpen ? "open" : "closed"} />{full && <Pill s="Full" />}</div>}>
        <Capacity g={g} />
        <ul className="mt-5 divide-y">
          {members.map((m) => {
            const isL = m === g.leaderId;
            return (
              <li key={m} className="flex items-center gap-3 py-3" data-testid={`row-member-${m}`}>
                <Initials name={nameOf(ws, m)} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{nameOf(ws, m)}{m === ws.profile.id && <span className="font-normal text-muted-foreground"> (you)</span>}</div>
                  <div className="text-[11px] text-muted-foreground">{ws.people.find((p) => p.id === m)?.email}</div>
                </div>
                {isL && <Pill s="Leader" />}
                {canRemove && !isL && m !== ws.profile.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={pending} data-testid={`button-remove-member-${m}`}><UserMinus className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {nameOf(ws, m)}?</AlertDialogTitle>
                        <AlertDialogDescription>Members with tasks, submissions, grades or other recorded history can't be removed — the server will refuse and explain why.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-remove">Keep member</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void run({ action: "removeGroupMember", groupId: g.id, userId: m })} data-testid="button-confirm-remove">Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </li>
            );
          })}
        </ul>
        {!members.length && <p className="text-sm text-muted-foreground">No members yet.</p>}
        {!g.leaderId && <Note>This group was formed by the professor and has no student leader.</Note>}
        {leader && g.allowMemberManagement === false && <Note>Your professor has turned off member management for this assignment.</Note>}
        {leader && !formationOpen && <Note>Formation is closed. Ask your professor if membership needs to change.</Note>}
        {canRemove && <div className="mt-3"><Note>Leaders can't be removed, nor can members with recorded work.</Note></div>}
        {prof && (
          <div className="mt-5 rounded-xl border bg-[hsl(var(--soft)/0.5)] p-3">
            <div className="mb-2 text-xs font-semibold">Add an enrolled student</div>
            {addable.length && !full ? (
              <div className="flex gap-2">
                <Select value={addId} onValueChange={setAddId}>
                  <SelectTrigger className="bg-card" data-testid="select-add-member"><SelectValue placeholder="Choose a student" /></SelectTrigger>
                  <SelectContent>{addable.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
                <Button disabled={!addId || pending} onClick={async () => { const r = await run({ action: "addGroupMember", groupId: g.id, userId: addId }); if (r) setAddId(""); }} data-testid="button-add-member"><UserPlus className="mr-1.5 h-4 w-4" />Add</Button>
              </div>
            ) : <Note>{full ? "The group is at maximum size." : "Every enrolled student already has a group for this assignment."}</Note>}
          </div>
        )}
      </Panel>

      <Panel tone="teal" title="Invitation code" icon={<KeyRound className="h-4 w-4" />} testId="panel-group-invite">
        {g.code && g.inviteActive !== false ? (
          <>
            <div className="t-soft rounded-xl px-4 py-5 text-center">
              <div className="font-mono-num text-3xl font-semibold tracking-[0.3em] t-fg" data-testid="text-group-code">{g.code}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{g.inviteExpiresAt ? `Expires ${fmtDate(g.inviteExpiresAt, "MMM d, h:mm a")}` : "Active until revoked"}</div>
            </div>
            <Button className="mt-3 w-full" onClick={copy} disabled={!inviteUsable} data-testid="button-copy-invite"><Copy className="mr-2 h-4 w-4" />Copy invitation code</Button>
            {expired && <p className="mt-2 text-xs text-destructive">This code has expired. The leader or professor can regenerate it while formation is open.</p>}
          </>
        ) : (
          <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground" data-testid="text-no-invite">No active invitation code.</div>
        )}
        {canCodes ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={!canRegen || pending} onClick={() => void run({ action: "regenerateGroupCode", groupId: g.id })} data-testid="button-regenerate-code"><RefreshCw className="mr-1.5 h-4 w-4" />{g.code && g.inviteActive !== false ? "Regenerate" : "Generate"}</Button>
            <Button variant="outline" className="text-destructive hover:text-destructive" disabled={!g.code || g.inviteActive === false || pending} onClick={() => void run({ action: "revokeGroupCode", groupId: g.id })} data-testid="button-revoke-code"><Ban className="mr-1.5 h-4 w-4" />Revoke</Button>
          </div>
        ) : <div className="mt-3"><Note>Only the group leader or professor can change the code.</Note></div>}
        <div className="mt-3 space-y-1.5">
          {canCodes && !formationOpen && <Note>Group formation is closed, so a new code can't be generated.</Note>}
          {canCodes && formationOpen && g.allowJoin === false && <Note>Your professor doesn't allow joining by code for this assignment.</Note>}
          {full && <Note>The group is full — codes won't admit anyone new.</Note>}
        </div>
      </Panel>
    </div>
  );
}
