import Navbar from "../../../components/Navbar";
import { athletes } from "../../../data/athletes";

export default async function AthleteProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const athlete = athletes.find((item) => item.slug === slug);

  if (!athlete) {
    return (
      <main className="min-h-screen bg-[#0B1F5C] text-white">
        <Navbar />
        <div className="mx-auto max-w-4xl px-6 py-20">
          <h1 className="text-4xl font-extrabold">Athlete not found</h1>
          <p className="mt-4 text-white/70">
            The athlete profile you are looking for does not exist.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <section className="relative">
        <div className="h-64 w-full bg-[linear-gradient(135deg,#114DFF,#0B1F5C)]" />

        <div className="mx-auto max-w-6xl px-6">
          <div className="-mt-20 flex flex-col items-start gap-6 md:flex-row md:items-end">
            <img
              src={athlete.image}
              alt={athlete.name}
              className="h-40 w-40 rounded-2xl border-4 border-[#0B1F5C] object-cover"
            />

            <div>
              <h1 className="text-4xl font-extrabold">{athlete.name}</h1>
              <p className="text-white/70">
  {athlete.sport} • {athlete.state}, {athlete.country}
</p>
            </div>

            <div className="ml-auto">
              <button className="rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C]">
                Contact Athlete
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-6 text-2xl font-bold">Stats</h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {athlete.stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-[#081642] p-4">
              <div className="text-sm text-white/60">{stat.label}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <h2 className="mb-4 text-2xl font-bold">About</h2>
        <p className="max-w-3xl text-white/75">{athlete.about}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-6 text-2xl font-bold">Highlights</h2>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex h-48 items-center justify-center rounded-xl bg-white/10">
            Video 1
          </div>
          <div className="flex h-48 items-center justify-center rounded-xl bg-white/10">
            Video 2
          </div>
          <div className="flex h-48 items-center justify-center rounded-xl bg-white/10">
            Video 3
          </div>
        </div>
      </section>
    </main>
  );
}