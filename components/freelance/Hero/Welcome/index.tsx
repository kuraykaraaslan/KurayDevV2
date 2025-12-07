"use client";

export default function Welcome() {
  return (
    <section className="min-h-[80vh] bg-base-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 py-12 md:flex-row md:py-20">
        {/* Left: Text */}
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-200 px-3 py-1 text-xs font-medium">
            <span className="badge badge-success badge-xs" />
            <span>Available for freelance projects</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
            Transform your{" "}
            <span className="text-primary">ideas</span> into
            <span className="block text-secondary">production-ready products.</span>
          </h1>

          <p className="max-w-xl text-base-content/70">
            Full-stack freelance developer helping startups and teams ship fast,
            scalable, and cleanly designed web & mobile apps. From MVP to
            production – without the agency overhead.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <button className="btn btn-primary btn-lg rounded-full">
              Book a free call
            </button>
            <button className="btn btn-ghost btn-lg rounded-full">
              View portfolio
            </button>
          </div>

          {/* Social proof / highlights */}
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-base-content/70">
            <div className="flex items-center gap-2">
              <span className="badge badge-outline badge-sm badge-primary" />
              <span>5+ years shipping production apps</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-outline badge-sm" />
              <span>React • Next.js • Node.js • PostgreSQL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-outline badge-sm badge-secondary" />
              <span>Remote-friendly, Europe time zone</span>
            </div>
          </div>
        </div>

        {/* Right: Card / mini case study */}
        <div className="flex-1">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                Recent project
              </span>
              <h2 className="card-title text-lg">
                SaaS dashboard for IoT analytics
              </h2>
              <p className="text-sm text-base-content/70">
                Designed and built a responsive analytics dashboard with real-time
                metrics, role-based access, and custom reports – delivered in 6
                weeks from scratch.
              </p>

              <ul className="text-xs text-base-content/70 space-y-1">
                <li>• 40% faster load times vs. previous version</li>
                <li>• Tech: Next.js, Tailwind, Node.js, PostgreSQL</li>
                <li>• Fully documented & handoff-ready</li>
              </ul>

              <div className="divider my-2" />

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-base-content/60">
                    Typical engagement
                  </p>
                  <p className="text-sm font-semibold">2–6 weeks / project</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-base-content/60">
                    Fit for
                  </p>
                  <p className="text-sm font-semibold">
                    Startups & growing teams
                  </p>
                </div>
              </div>

              <div className="card-actions pt-2">
                <button className="btn btn-outline btn-sm w-full">
                  Download CV / profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
