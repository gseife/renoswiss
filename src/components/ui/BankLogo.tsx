import type { Bank } from "@/data/banks";

interface BankLogoProps {
  bank: Bank;
  size?: number;
}

/**
 * Bank wordmarks loaded from public/banks/{id}.svg. Files are the
 * canonical SVG logos hosted on Wikimedia Commons; rendered in a wide
 * rectangle on white so the brand reads at a glance in the offer list.
 */
export const BankLogo = ({ bank, size = 40 }: BankLogoProps) => {
  const src = `${import.meta.env.BASE_URL}banks/${bank.id}.svg`;
  return (
    <div
      className="grid shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-white"
      style={{
        width: size * 2,
        height: size,
      }}
      aria-label={`${bank.name} logo`}
    >
      <img
        src={src}
        alt={bank.name}
        className="block max-h-full max-w-full"
        style={{ padding: size * 0.12, objectFit: "contain" }}
        draggable={false}
      />
    </div>
  );
};
