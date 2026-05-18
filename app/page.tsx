import AthleteCard from "../components/AthleteCard";
import Navbar from "../components/Navbar";
import { athletes } from "../data/athletes";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0B1F5C_0%,#114DFF_60%,#0B1F5C_100%)] opacity-95" />
        <div className="absolute -left-16 top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-0 top-10 h-96 w-96 rounded-full bg-[#D8F200]/10 blur-3xl" />

        <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-12 px-6 py-16 md:px-10 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
              The athlete platform
            </p>

            <h1 className="mb-6 max-w-3xl text-5xl font-extrabold leading-tight md:text-7xl">
              Elevate your game.
              <span className="block text-[#D8F200]">
                Connect. Get recruited.
              </span>
            </h1>

            <p className="mb-8 max-w-2xl text-lg text-white/80 md:text-xl">
              Build your athlete profile, showcase highlights, and get noticed
              by coaches, scouts, and recruiters.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <a
  href="/signup"
  className="rounded-xl bg-[#D8F200] px-6 py-4 text-base font-bold text-[#0B1F5C] shadow-lg transition hover:scale-[1.02]"
>
  Create Your Profile
</a>

              <button className="rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-base font-bold text-white backdrop-blur transition hover:bg-white/20">
                Learn More
              </button>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="grid w-full max-w-xl gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
                <div className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                  Featured profile
                </div>
                <div className="mb-2 text-3xl font-extrabold">Cora Phillips</div>
                <div className="mb-6 text-white/75">Point Guard • Newcastle Falcons U14 JPL</div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-2xl bg-[#081642] p-4">
                    <div className="text-xs uppercase text-white/60">
                      Points
                    </div>
                    <div className="mt-2 text-2xl font-extrabold">17</div>
                  </div>
                  <div className="rounded-2xl bg-[#081642] p-4">
                    <div className="text-xs uppercase text-white/60">
                      Steals
                    </div>
                    <div className="mt-2 text-2xl font-extrabold">10</div>
                  </div>
                  <div className="rounded-2xl bg-[#081642] p-4">
                    <div className="text-xs uppercase text-white/60">
                      Assists
                    </div>
                    <div className="mt-2 text-2xl font-extrabold">20</div>
                  </div>
                  <div className="rounded-2xl bg-[#081642] p-4">
                    <div className="text-xs uppercase text-white/60">
                      PG Rating
                    </div>
                    <div className="mt-2 text-2xl font-extrabold">62.5</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="mb-2 text-xl font-bold">For Athletes</div>
                  <div className="text-sm text-white/75">
                    Build your profile and showcase your talent.
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="mb-2 text-xl font-bold">For Coaches</div>
                  <div className="text-sm text-white/75">
                    Find athletes and track emerging talent.
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="mb-2 text-xl font-bold">For Recruiters</div>
                  <div className="text-sm text-white/75">
                    Discover prospects and review profiles fast.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-extrabold">Featured Athletes</h2>
          <button className="rounded-lg border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
            View All
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {athletes.map((athlete) => (
            <AthleteCard
  key={athlete.slug}
  name={athlete.name}
  sport={athlete.sport}
  image={athlete.image}
  slug={athlete.slug}
  country={athlete.country}
  state={athlete.state}
/>
          ))}
        </div>
      </section>

      <section className="bg-white text-[#0B1F5C]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:px-10 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="mb-3 text-2xl font-extrabold">
              Build Your Profile
            </h3>
            <p className="text-slate-600">
              Create a standout athlete profile with stats, achievements, and
              highlight content.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="mb-3 text-2xl font-extrabold">Share Your Game</h3>
            <p className="text-slate-600">
              Upload highlights and present your development in one professional
              place.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="mb-3 text-2xl font-extrabold">Get Seen</h3>
            <p className="text-slate-600">
              Make it easier for coaches, recruiters, and clubs to discover
              your talent.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 text-center md:px-10">
        <h2 className="mb-4 text-4xl font-extrabold">
          Ready to get in the game?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-white/75">
          Create your PLAYR profile today and start building your athlete
          presence.
        </p>
        <button className="rounded-xl bg-[#D8F200] px-8 py-4 text-lg font-bold text-[#0B1F5C] shadow-lg transition hover:scale-[1.02]">
          <a
  href="/signup"
  className="rounded-xl bg-[#D8F200] px-8 py-4 text-lg font-bold text-[#0B1F5C] shadow-lg transition hover:scale-[1.02]"
>
  Join PLAYR Now
</a>
        </button>
      </section>
    </main>
  );
}