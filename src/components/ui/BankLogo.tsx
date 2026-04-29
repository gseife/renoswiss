import type { Bank } from "@/data/banks";

interface BankLogoProps {
  bank: Bank;
  size?: number;
}

export const BankLogo = ({ bank, size = 40 }: BankLogoProps) => {
  const fontSize = bank.monogram.length === 1 ? size * 0.55 : size * 0.36;
  return (
    <div
      className="grid shrink-0 place-items-center rounded-md font-serif font-bold tracking-tight"
      style={{
        background: bank.bg,
        color: bank.fg,
        width: size,
        height: size,
        fontSize,
        letterSpacing: bank.monogram.length === 1 ? 0 : "-0.02em",
      }}
      aria-label={`${bank.name} logo`}
    >
      {bank.monogram}
    </div>
  );
};
