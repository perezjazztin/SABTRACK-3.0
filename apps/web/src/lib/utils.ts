import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility combining clsx conditional classes and tailwind-merge to deduplicate conflicting Tailwind styles.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
