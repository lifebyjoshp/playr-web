import Link from "next/link";

type AthleteCardProps = {
  name: string;
  sport: string;
  image: string;
  slug: string;
  country: string;
  state: string;
};

export default function AthleteCard({
  name,
  sport,
  image,
  slug,
  country,
  state,
}: AthleteCardProps) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/10 p-4 shadow-lg backdrop-blur transition hover:-translate-y-2 hover:shadow-2xl">
      
      <div className="relative mb-4 h-56 overflow-hidden rounded-xl">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-lg font-bold">{name}</div>
          <div className="text-sm text-white/80">{sport}</div>

          {/* NEW LOCATION */}
          <div className="mt-1 text-xs text-white/70">
            {state}, {country}
          </div>
        </div>
      </div>

      <Link
        href={`/athletes/${slug}`}
        className="block w-full rounded-lg bg-[#D8F200] py-2 text-center text-sm font-bold text-[#0B1F5C] transition hover:scale-[1.02]"
      >
        View Profile
      </Link>
    </div>
  );
}