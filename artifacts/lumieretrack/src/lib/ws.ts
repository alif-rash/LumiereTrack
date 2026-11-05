import { createContext, useContext } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useGetWorkspace,
  getGetWorkspaceQueryKey,
  performAction,
  requestUploadUrl,
  type ActionInput,
  type Workspace,
  type Record as Rec,
  type Profile,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export type { Rec, Profile, Workspace };

export const STATUSES = ["To Do", "In Progress", "Submitted", "Under Review", "Changes Requested", "Approved"] as const;

export function useWorkspaceQuery() {
  const { isSignedIn } = useAuth();
  return useGetWorkspace({
    query: { queryKey: getGetWorkspaceQueryKey(), enabled: !!isSignedIn, refetchInterval: 15000 },
  });
}

export const WsContext = createContext<Workspace | null>(null);
export function useWs(): Workspace {
  const w = useContext(WsContext);
  if (!w) throw new Error("Workspace unavailable");
  return w;
}

export function errMsg(e: unknown): string {
  const a = e as { data?: { error?: string } | null; message?: string };
  return a?.data?.error || a?.message || "Something went wrong";
}

export function useAct() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const m = useMutation({
    mutationFn: (i: ActionInput) => performAction(i),
    onSuccess: (r) => toast({ title: r.message || "Saved" }),
    onError: (e) => toast({ title: "That didn't go through", description: errMsg(e), variant: "destructive" }),
    onSettled: () => qc.invalidateQueries({ queryKey: getGetWorkspaceQueryKey() }),
  });
  const run = async (i: ActionInput) => {
    try {
      return await m.mutateAsync(i);
    } catch {
      return null;
    }
  };
  return { run, pending: m.isPending };
}

export async function uploadFile(file: File, groupId: string) {
  if (file.size > 20971520) throw new Error("Files must be 20 MB or smaller");
  const contentType = file.type || "application/octet-stream";
  const { uploadURL, objectPath } = await requestUploadUrl({ name: file.name, size: file.size, contentType, groupId });
  const r = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": contentType } });
  if (!r.ok) throw new Error("Upload failed — please try again");
  return { objectPath, fileName: file.name };
}

export const fileHref = (p: string) => `/api/storage${p.startsWith("/") ? p : "/" + p}`;
export const validUrl = (s: string) => !s || /^https?:\/\/[^\s.]+\.\S+/i.test(s.trim());

export const isProf = (ws: Workspace) => ws.profile.role === "professor";
export const personOf = (ws: Workspace, id?: string) =>
  id ? ws.people.find((p) => p.id === id) ?? (ws.profile.id === id ? ws.profile : undefined) : undefined;
export const nameOf = (ws: Workspace, id?: string) => personOf(ws, id)?.name ?? (id ? "Former member" : "Unassigned");

export function groupCtx(ws: Workspace, g?: Rec) {
  const assignment = g ? ws.assignments.find((a) => a.id === g.assignmentId) : undefined;
  const courseId = g?.courseId ?? assignment?.courseId;
  const course = ws.courses.find((c) => c.id === courseId);
  return { assignment, course };
}

export function progressOf(ws: Workspace, g: Rec) {
  if (typeof g.progress === "number") return Math.round(g.progress);
  const t = ws.tasks.filter((x) => x.groupId === g.id);
  if (!t.length) return 0;
  return Math.round((t.filter((x) => x.status === "Approved").length / t.length) * 100);
}
