import { Quote, Star, MapPin } from "lucide-react";

interface TravelerStory {
  name: string;
  from: string;
  destination: string;
  rating: number;
  quote: string;
  avatarColor: string;
}

const STORIES: TravelerStory[] = [
  {
    name: "Priya & Rohan Mehta",
    from: "Bengaluru",
    destination: "Honeymoon in Bali",
    rating: 5,
    quote:
      "Every detail — from the seaplane transfer to our private villa dinner — was handled flawlessly. We just had to show up and fall in love all over again.",
    avatarColor: "from-rose-400 to-pink-500",
  },
  {
    name: "The Iyer Family",
    from: "Chennai",
    destination: "Thailand with Kids",
    rating: 5,
    quote:
      "Travelling with two kids felt effortless. The D2D team pre-booked everything, the hotels were premium and our concierge was a message away the whole trip.",
    avatarColor: "from-amber-400 to-orange-500",
  },
  {
    name: "Karan Verma",
    from: "Mumbai",
    destination: "Dubai City Break",
    rating: 5,
    quote:
      "Booked in under a day, zero surprises on the ground. The desert safari and yacht dinner were next level — already planning my next escape with them.",
    avatarColor: "from-cyan-400 to-teal-500",
  },
];

interface TravelerStoriesProps {
  destination?: string;
}

export default function TravelerStories({ destination }: TravelerStoriesProps) {
  return (
    <section className="relative bg-gradient-to-b from-slate-50 to-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 text-cyan-700 text-xs font-bold tracking-widest uppercase border border-cyan-100">
            <Quote className="w-3.5 h-3.5" />
            Tales from the Trail
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Stories from travellers who
            <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
              {" "}
              lived this dream
            </span>
          </h2>
          <p className="mt-3 text-slate-500">
            Real journeys, hand-crafted by D2D{destination ? ` — including this ${destination} experience.` : "."}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {STORIES.map((s) => (
            <article
              key={s.name}
              className="relative rounded-3xl bg-white p-6 ring-1 ring-slate-200/80 shadow-sm shadow-slate-900/5 hover:shadow-md hover:shadow-slate-900/10 transition-all flex flex-col"
            >
              <Quote className="absolute top-5 right-5 w-7 h-7 text-cyan-100" />

              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${s.avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-md`}
                  aria-hidden
                >
                  {s.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{s.name}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {s.from}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-0.5">
                {Array.from({ length: s.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="mt-3 text-sm text-slate-600 leading-relaxed flex-1">
                &ldquo;{s.quote}&rdquo;
              </p>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-cyan-700">
                {s.destination}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
