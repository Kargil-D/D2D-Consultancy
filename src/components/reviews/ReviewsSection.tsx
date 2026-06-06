"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { REVIEWS } from "@/data/reviews";
import SectionHeading from "@/components/common/SectionHeading";

/**
 * Customer testimonials displayed as a responsive card grid.
 * Each card highlights the traveller, their trip and a star rating.
 */
export default function ReviewsSection() {
  return (
    <section
      id="reviews"
      className="relative pt-4 pb-6 md:pt-6 md:pb-8 bg-gradient-to-b from-slate-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Traveller Stories"
          title="Journeys They Loved"
          description="Real reviews from real journeys"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.slice(0, 3).map((review, idx) => (
            <motion.article
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              whileHover={{ y: -6 }}
              className="group relative flex flex-col p-6 md:p-7 bg-white rounded-3xl shadow-md shadow-slate-900/5 ring-1 ring-slate-100 hover:shadow-xl hover:shadow-slate-900/10 transition-shadow"
            >
              <Quote className="absolute top-5 right-5 w-9 h-9 text-cyan-100 group-hover:text-cyan-200 transition-colors" />

              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-cyan-100">
                  <Image
                    src={review.avatar}
                    alt={review.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {review.name}
                  </h3>
                  <p className="text-xs text-slate-500">{review.location}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
                <span className="ml-2 text-xs font-medium text-slate-500">
                  {review.trip}
                </span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                &quot;{review.comment}&quot;
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
