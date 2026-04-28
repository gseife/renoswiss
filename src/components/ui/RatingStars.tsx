import { Star, StarHalf } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  showNumber?: boolean;
}

export const RatingStars = ({ rating, showNumber = true }: RatingStarsProps) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span className="inline-flex items-center gap-0.5 text-gold-soft">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} size={13} fill="currentColor" strokeWidth={0} />
      ))}
      {half && <StarHalf size={13} fill="currentColor" strokeWidth={0} />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} size={13} className="text-line" strokeWidth={1.5} />
      ))}
      {showNumber && <span className="ml-1 text-[12px] font-semibold text-navy">{rating}</span>}
    </span>
  );
};
