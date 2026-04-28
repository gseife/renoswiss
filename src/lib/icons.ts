import {
  Layers,
  Home,
  Flame,
  AppWindow,
  Sun,
  Zap,
  Box,
  type LucideIcon,
} from "lucide-react";

export const moduleIcons: Record<string, LucideIcon> = {
  facade: Layers,
  roof: Home,
  heatpump: Flame,
  windows: AppWindow,
  solar: Sun,
  electrical: Zap,
  basement: Box,
};
