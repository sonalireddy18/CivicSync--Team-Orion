"use client";

import { useRouter } from "next/navigation";
import { useView } from "@/components/layout/ViewProvider";

export default function Home() {
  const { view, setView } = useView();
  const router = useRouter();

  function go(v: "citizen" | "authority") {
    setView(v);
    router.push("/projects");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero */}
      <section
        id="home"
        className="mx-auto max-w-6xl px-6 py-24 text-center"
      >
        <p className="mb-5 inline-block rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
          Better coordination. Better communities.
        </p>

        <h2 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Public works,
          <span className="text-emerald-700"> made transparent.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Discover ongoing projects in your neighbourhood, track their
          progress, and help build a more accountable civic system.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            onClick={() => go("citizen")}
            className="rounded-lg bg-emerald-700 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            Explore Public Works →
          </button>

          <button
            onClick={() => go("authority")}
            className="rounded-lg border border-slate-300 bg-white px-7 py-3.5 font-semibold transition hover:bg-slate-100"
          >
            Municipal Dashboard
          </button>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Currently viewing:{" "}
          <span className="font-semibold text-emerald-700">
            {view === "citizen" ? "Citizen View" : "Municipal Authority View"}
          </span>
        </p>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h3 className="text-3xl font-bold">One platform. Better civic works.</h3>
            <p className="mt-3 text-slate-600">
              Everything communities need to stay informed and connected.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Feature
              icon="📍"
              title="Project Tracking"
              description="View ongoing and planned public works, deadlines, budgets, and responsible departments."
            />

            <Feature
              icon="🤝"
              title="Smart Coordination"
              description="Identify overlapping projects and help departments coordinate excavation work."
            />

            <Feature
              icon="📸"
              title="Citizen Verification"
              description="Submit site photos and report stalled or incomplete public works."
            />
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-slate-900 px-6 py-12 text-center text-white">
        <h3 className="text-xl font-bold">CivicSync</h3>
        <p className="mt-2 text-sm text-slate-300">
          Connecting citizens, departments, and communities.
        </p>
        <p className="mt-6 text-xs text-slate-400">
          Built for civic transparency.
        </p>
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-7 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-4 text-3xl">{icon}</div>
      <h4 className="mb-3 text-xl font-bold">{title}</h4>
      <p className="leading-7 text-slate-600">{description}</p>
    </div>
  );
}
