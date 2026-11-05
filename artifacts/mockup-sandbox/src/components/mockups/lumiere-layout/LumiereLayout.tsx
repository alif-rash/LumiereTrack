import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

const tasks = [
  { title: "Annotate interview transcripts", group: "Field Notes · Urban Memory", due: "Today", progress: 72, tone: "sage" },
  { title: "Draft the research question", group: "Field Notes · Urban Memory", due: "Tomorrow", progress: 38, tone: "ochre" },
  { title: "Review source bibliography", group: "Archive Futures", due: "Thu, 18 Apr", progress: 15, tone: "plum" },
];

const deadlines = [
  { day: "16", month: "APR", title: "Interview synthesis", group: "Field Notes", urgent: true },
  { day: "18", month: "APR", title: "Source bibliography", group: "Archive Futures", urgent: false },
  { day: "22", month: "APR", title: "Studio critique", group: "Ways of Seeing", urgent: false },
];

const activity = [
  { initial: "MK", name: "Mina Kwon", action: "left a note on your synthesis", time: "18 min ago", color: "lavender" },
  { initial: "JR", name: "Jonah Reed", action: "shared a new source", time: "2 hours ago", color: "ochre" },
  { initial: "AL", name: "Prof. Alvarez", action: "approved your field log", time: "Yesterday", color: "sage" },
];

function Metric({ label, value, foot, accent }: { label: string; value: string; foot: string; accent: string }) {
  return (
    <div className="min-w-0 border-l border-[#d9d2c2] pl-4 first:border-0 first:pl-0">
      <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[#77776b]">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-serif text-[30px] leading-none tracking-tight text-[#1d3028]">{value}</span>
        <span className={`text-[10px] font-medium ${accent}`}>{foot}</span>
      </div>
    </div>
  );
}

export default function LumiereLayout() {
  const [active, setActive] = useState("Overview");
  const [done, setDone] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const visibleTasks = tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-[100dvh] bg-[#f1eee5] text-[#24332c]" style={{ fontFamily: "'IBM Plex Sans', ui-sans-serif, sans-serif" }}>
      <header className="flex min-h-[66px] items-center justify-between border-b border-[#d9d2c2] bg-[#f7f5ed] px-5 md:px-9">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#214e40] text-[#f4eddc]">
            <span className="font-serif text-[18px] italic">L</span>
          </div>
          <span className="font-serif text-[18px] font-semibold tracking-[-.03em]">LumiereTrack</span>
          <span className="ml-2 hidden h-4 border-l border-[#d9d2c2] sm:block" />
          <span className="hidden text-[11px] uppercase tracking-[.15em] text-[#7b7c70] sm:block">Student studio</span>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Search" onClick={() => document.getElementById("task-search")?.focus()} className="grid h-9 w-9 place-items-center rounded-full text-[#667067] hover:bg-[#ebe8dd]">
            <Search size={17} />
          </button>
          <button aria-label="Notifications" onClick={() => setActive("Notifications")} className="relative grid h-9 w-9 place-items-center rounded-full text-[#667067] hover:bg-[#ebe8dd]">
            <Bell size={17} /><i className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-[#ad543d]" />
          </button>
          <button onClick={() => setActive("My profile")} className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-[#d9e1d4] text-[10px] font-semibold tracking-wide text-[#315344]">AM</button>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-7 md:px-9 md:pt-10">
        <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-[#d9d2c2]">
          {[
            { label: "Overview", icon: LayoutDashboard },
            { label: "Courses", icon: BookOpen },
            { label: "Projects", icon: FolderKanban },
            { label: "My tasks", icon: ListChecks },
          ].map(({ label, icon: Icon }) => (
            <button key={label} onClick={() => setActive(label)} className={`relative flex shrink-0 items-center gap-2 px-3 pb-3 text-[12px] transition-colors ${active === label ? "font-semibold text-[#214e40]" : "text-[#77776b] hover:text-[#24332c]"}`}>
              <Icon size={14} />{label}
              {active === label && <span className="absolute inset-x-3 bottom-[-1px] h-[2px] bg-[#214e40]" />}
            </button>
          ))}
          <button onClick={() => setShowAll(!showAll)} className="ml-auto hidden items-center gap-2 pb-3 text-[11px] text-[#77776b] hover:text-[#214e40] sm:flex">
            <SlidersHorizontal size={13} /> {showAll ? "Compact view" : "Customize"}
          </button>
        </nav>

        <section className="grid gap-8 border-b border-[#d9d2c2] pb-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#77776b]">
              <span className="h-px w-6 bg-[#b5883b]" /> Tuesday, April 16, 2024 <span className="text-[#b3ad9e]">/</span> Spring term
            </p>
            <h1 className="font-serif text-[38px] leading-[1.04] tracking-[-.04em] text-[#1d3028] md:text-[51px]">Good morning,<br className="sm:hidden" /> Amara.</h1>
            <p className="mt-3 max-w-[510px] text-[13px] leading-6 text-[#6c7269]">Three open responsibilities, one close deadline. Start with the story your group is shaping.</p>
          </div>
          <button onClick={() => setActive("Assignments")} className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-sm bg-[#214e40] px-4 text-[12px] font-semibold text-[#f7f5ed] transition hover:bg-[#173c31]">
            <Plus size={15} /> Join an assignment
          </button>
        </section>

        <section className="grid grid-cols-2 gap-y-5 border-b border-[#d9d2c2] py-6 sm:grid-cols-4 sm:gap-0">
          <Metric label="Courses" value="04" foot="in progress" accent="text-[#637c61]" />
          <Metric label="Project groups" value="03" foot="across studios" accent="text-[#9a7b3e]" />
          <Metric label="Open tasks" value="07" foot="1 overdue" accent="text-[#ad543d]" />
          <Metric label="Tasks approved" value="12/19" foot="↑ 3 this week" accent="text-[#637c61]" />
        </section>

        <div className="grid gap-9 pt-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(260px,.8fr)]">
          <main className="min-w-0">
            <section>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#9a7b3e]">Your workbench</p>
                  <h2 className="mt-1 font-serif text-[25px] tracking-[-.025em]">Tasks assigned to me</h2>
                </div>
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor="task-search">Filter tasks</label>
                  <input id="task-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a task" className="w-[118px] border-b border-[#c9c3b4] bg-transparent px-1 py-1.5 text-[11px] outline-none placeholder:text-[#99978a] focus:border-[#214e40]" />
                  <button onClick={() => setActive("My tasks")} className="text-[11px] font-semibold text-[#214e40] hover:underline">All tasks <ArrowUpRight size={12} className="ml-1 inline" /></button>
                </div>
              </div>
              <div className="divide-y divide-[#ddd7c9] border-y border-[#c9c3b4]">
                {visibleTasks.length ? visibleTasks.slice(0, showAll ? 3 : 3).map((task, index) => {
                  const checked = done.includes(task.title);
                  return (
                    <article key={task.title} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-4">
                      <button aria-label={checked ? "Mark task incomplete" : "Mark task complete"} onClick={() => setDone(checked ? done.filter((x) => x !== task.title) : [...done, task.title])} className={`grid h-6 w-6 place-items-center rounded-full border ${checked ? "border-[#63816c] bg-[#63816c] text-white" : "border-[#c4beaf] text-transparent hover:border-[#63816c]"}`}>
                        <Check size={13} />
                      </button>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-[13px] font-semibold ${checked ? "text-[#85877b] line-through" : "text-[#26372f]"}`}>{task.title}</h3>
                          {index === 0 && <span className="bg-[#f0e6d3] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[.08em] text-[#8e6730]">Focus</span>}
                        </div>
                        <p className="mt-1 text-[10px] text-[#7b7c70]">{task.group} <span className="px-1 text-[#c2bcad]">·</span> Due {task.due}</p>
                        <div className="mt-2 h-[3px] max-w-[340px] bg-[#e4dfd3]">
                          <div className={`h-full ${task.tone === "sage" ? "bg-[#718a72]" : task.tone === "ochre" ? "bg-[#b5883b]" : "bg-[#8a7487]"}`} style={{ width: `${task.progress}%` }} />
                        </div>
                      </div>
                      <span className="font-mono text-[10px] tabular-nums text-[#78796d]">{task.progress}%</span>
                    </article>
                  );
                }) : <p className="py-8 text-center text-[12px] text-[#77776b]">No tasks match that search.</p>}
              </div>
            </section>

            <section className="mt-9">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#637c61]">In motion</p>
                  <h2 className="mt-1 font-serif text-[25px] tracking-[-.025em]">Open group assignments</h2>
                </div>
                <button onClick={() => setActive("Assignments")} className="text-[11px] font-semibold text-[#214e40] hover:underline">Browse all <ArrowUpRight size={12} className="ml-1 inline" /></button>
              </div>
              <button onClick={() => setActive("Field Notes · Urban Memory")} className="group flex w-full flex-col justify-between gap-5 border border-[#d9d2c2] bg-[#f7f5ed] p-5 text-left transition hover:border-[#8d9d88] sm:flex-row sm:items-center">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center bg-[#e6ebdf] text-[#49644f]"><Sparkles size={18} /></div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[.15em] text-[#71816d]">Group forming · 3 of 5</p>
                    <h3 className="mt-1 font-serif text-[18px]">Field Notes: Urban Memory</h3>
                    <p className="mt-1 text-[11px] text-[#77776b]">Methods of Oral History <span className="px-1 text-[#c2bcad]">·</span> Formation closes Apr 19</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 self-end text-[11px] font-semibold text-[#214e40] sm:self-auto">View assignment <ChevronRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
              </button>
            </section>

            <section className="mt-9 border-t border-[#d9d2c2] pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#8a7487]">From your instructors</p>
                  <h2 className="mt-1 font-serif text-[23px] tracking-[-.025em]">Latest feedback</h2>
                </div>
                <MessageSquareText size={17} className="text-[#8a7487]" />
              </div>
              <div className="border-l-2 border-[#b4a2b0] pl-4">
                <p className="font-serif text-[15px] italic leading-6 text-[#48534b]">“A thoughtful foundation. Bring the neighborhood voices forward in your next pass.”</p>
                <p className="mt-2 text-[10px] text-[#77776b]">Prof. Alvarez <span className="px-1 text-[#c2bcad]">·</span> Field log <span className="px-1 text-[#c2bcad]">·</span> Yesterday</p>
              </div>
            </section>
          </main>

          <aside className="space-y-8 lg:border-l lg:border-[#d9d2c2] lg:pl-7">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#ad543d]">Keep an eye on</p>
                  <h2 className="mt-1 font-serif text-[23px] tracking-[-.025em]">Upcoming deadlines</h2>
                </div>
                <CalendarDays size={17} className="text-[#ad543d]" />
              </div>
              <div className="space-y-1">
                {deadlines.map((item) => (
                  <button key={item.title} onClick={() => setActive(item.title)} className="flex w-full items-center gap-3 border-b border-[#ddd7c9] py-3 text-left hover:bg-[#eae6db]">
                    <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center ${item.urgent ? "bg-[#a94f3c] text-[#fff8ed]" : "bg-[#e6e1d5] text-[#536257]"}`}>
                      <span className="font-serif text-[17px] leading-none">{item.day}</span><span className="mt-0.5 text-[7px] font-semibold tracking-[.12em]">{item.month}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold">{item.title}</p>
                      <p className="mt-0.5 text-[10px] text-[#77776b]">{item.group}</p>
                    </div>
                    {item.urgent ? <ArrowDownRight size={14} className="text-[#a94f3c]" /> : <ChevronRight size={14} className="text-[#9e9b8e]" />}
                  </button>
                ))}
              </div>
            </section>

            <section className="border-t border-[#d9d2c2] pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#9a7b3e]">Shared table</p>
                  <h2 className="mt-1 font-serif text-[23px] tracking-[-.025em]">My active groups</h2>
                </div>
                <button aria-label="Open projects" onClick={() => setActive("Projects")} className="text-[#77776b] hover:text-[#214e40]"><FolderKanban size={16} /></button>
              </div>
              {[
                { name: "Field Notes · Urban Memory", date: "Due Apr 16", progress: 68, color: "#718a72" },
                { name: "Archive Futures", date: "Due Apr 18", progress: 42, color: "#b5883b" },
                { name: "Ways of Seeing", date: "Due Apr 22", progress: 81, color: "#8a7487" },
              ].map((g) => (
                <button key={g.name} onClick={() => setActive(g.name)} className="mb-4 block w-full text-left">
                  <div className="mb-1.5 flex justify-between gap-2 text-[11px]"><span className="truncate font-semibold">{g.name}</span><span className="shrink-0 text-[10px] text-[#77776b]">{g.date}</span></div>
                  <div className="h-[3px] bg-[#e0dbcf]"><div className="h-full" style={{ width: `${g.progress}%`, background: g.color }} /></div>
                </button>
              ))}
            </section>

            <section className="border-t border-[#d9d2c2] pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#637c61]">Around your studio</p>
                  <h2 className="mt-1 font-serif text-[23px] tracking-[-.025em]">Recent activity</h2>
                </div>
                <Clock3 size={16} className="text-[#637c61]" />
              </div>
              <ol className="space-y-4">
                {activity.map((item) => (
                  <li key={item.name} className="flex gap-3">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[9px] font-semibold ${item.color === "lavender" ? "bg-[#e9e1e8] text-[#715d70]" : item.color === "ochre" ? "bg-[#efe5d1] text-[#8b6a31]" : "bg-[#e1e8df] text-[#4c6851]"}`}>{item.initial}</span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[11px] leading-[1.45]"><span className="font-semibold">{item.name}</span> {item.action}</p>
                      <p className="mt-1 text-[9px] text-[#858579]">{item.time}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
        <footer className="mt-10 flex items-center justify-between border-t border-[#d9d2c2] pt-4 text-[9px] uppercase tracking-[.13em] text-[#929084]">
          <span>LumiereTrack <span className="normal-case tracking-normal">· Learning, in the making</span></span>
          <button onClick={() => setActive("Courses")} className="inline-flex items-center gap-1.5 hover:text-[#214e40]"><Circle size={6} fill="currentColor" /> Courses <ChevronRight size={11} /></button>
        </footer>
      </div>
    </div>
  );
}
