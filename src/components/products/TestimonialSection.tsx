import { Star } from "lucide-react";

interface Testimonial {
  id: string;
  rating: number;
  text: string;
  user: {
    firstName: string;
    lastName: string;
    jobTitle: string | null;
    organization: string | null;
    profileImage: string | null;
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={16}
          className={i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

export default function TestimonialSection({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  if (testimonials.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Avis clients ({testimonials.length})
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#D0E4F2] flex items-center justify-center text-[#80368D] font-bold text-sm">
                {t.user.firstName[0]}
                {t.user.lastName[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {t.user.firstName} {t.user.lastName[0]}.
                </p>
                {t.user.jobTitle && (
                  <p className="text-xs text-gray-500">
                    {t.user.jobTitle}
                    {t.user.organization ? ` - ${t.user.organization}` : ""}
                  </p>
                )}
              </div>
            </div>
            <StarRating rating={t.rating} />
            <p className="text-sm text-gray-700 mt-3">{t.text}</p>
            <span className="inline-block mt-3 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
              Achat vérifié
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
