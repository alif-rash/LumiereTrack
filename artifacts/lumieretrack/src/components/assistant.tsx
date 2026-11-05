import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, X, ArrowUp } from "lucide-react";
import { askAssistant } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWs, errMsg } from "@/lib/ws";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "ai" | "error"; text: string };

export function Assistant() {
  const ws = useWs();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [groupId, setGroupId] = useState("all");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const ask = useMutation({
    mutationFn: (message: string) => askAssistant({ message, ...(groupId !== "all" ? { groupId } : {}) }),
    onSuccess: (r) => setMsgs((m) => [...m, { role: "ai", text: r.answer }]),
    onError: (e) => setMsgs((m) => [...m, { role: "error", text: errMsg(e) }]),
  });
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length, ask.isPending]);
  const send = () => {
    const t = text.trim();
    if (!t || ask.isPending) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setText("");
    ask.mutate(t.slice(0, 2000));
  };
  const prompts = ws.profile.role === "professor"
    ? ["Which groups have submissions waiting?", "Summarise contribution balance in my groups"]
    : ["What should I work on next?", "Which of my tasks are overdue?"];
  return (
    <>
      <button onClick={() => setOpen((o) => !o)} data-testid="button-assistant"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[hsl(var(--navy))] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_hsl(215_57%_18%/0.5)] transition-transform hover:-translate-y-0.5">
        {open ? <X className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />} {open ? "Close" : "Ask assistant"}
      </button>
      {open && (
        <div className="rise fixed bottom-20 right-4 z-40 flex h-[min(560px,75dvh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-[0_24px_60px_-20px_hsl(215_57%_18%/0.35)]">
          <div className="border-b bg-[hsl(var(--soft)/0.6)] px-4 py-3">
            <div className="font-display text-sm font-bold">Project assistant</div>
            <div className="mt-2">
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="h-8 bg-card text-xs" data-testid="select-assistant-context"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Context: my whole workspace</SelectItem>
                  {ws.groups.map((g) => <SelectItem key={g.id} value={g.id}>Context: {g.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {!msgs.length && (
              <div className="space-y-2 pt-6 text-center">
                <p className="text-sm text-muted-foreground">Answers draw only on data you're allowed to see.</p>
                {prompts.map((p) => (
                  <button key={p} onClick={() => setText(p)} className="block w-full rounded-xl border px-3 py-2 text-left text-xs hover:bg-accent" data-testid="button-assistant-prompt">{p}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={cn("max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                m.role === "user" ? "ml-auto bg-primary text-white" : m.role === "error" ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground")}>{m.text}</div>
            ))}
            {ask.isPending && <div className="flex w-16 gap-1 rounded-2xl bg-muted px-3.5 py-3">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 150}ms` }} />)}</div>}
            <div ref={end} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2 border-t p-3">
            <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1} maxLength={2000} placeholder="Ask about deadlines, feedback, workload…" className="max-h-28 flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" data-testid="input-assistant" />
            <button type="submit" disabled={!text.trim() || ask.isPending} className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white disabled:opacity-40" data-testid="button-assistant-send"><ArrowUp className="h-4 w-4" /></button>
          </form>
        </div>
      )}
    </>
  );
}
