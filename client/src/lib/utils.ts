import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as dfFormat, parseISO, isDate } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateDisplay(
  input: Date | string | number | null | undefined,
) {
  if (!input) return "";
  const d = isDate(input)
    ? (input as Date)
    : typeof input === "string"
      ? new Date(input)
      : new Date(Number(input));
  if (isNaN(d.getTime())) return "";
  return dfFormat(d, "dd/MM/yyyy");
}

export function formatFullName(
  firstName?: string | null,
  lastName?: string | null,
) {
  const f = (firstName || "").trim();
  const l = (lastName || "").trim();
  if (f && l) return `${f} ${l}`;
  return f || l || "";
}

export function formatVNDAccounting(value: number | string) {
  const num = Number(value);
  const abs = Math.abs(num);
  const formatted = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(abs);
  const withSymbol = `${formatted} ₫`;
  if (num < 0) return `(${withSymbol})`;
  return withSymbol;
}

export function formatVNDCompact(value: number) {
  const v = Math.abs(value);
  const compact = new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);
  const s = `${compact} ₫`;
  return value < 0 ? `(${s})` : s;
}

export function parseDateInputToISO(input?: string | null): string | undefined {
  if (!input) return undefined;
  const s = input.trim();
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{8}$/.test(s)) {
    const d = s.slice(0, 2);
    const mo = s.slice(2, 4);
    const y = s.slice(4);
    return `${y}-${mo}-${d}`;
  }
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (m) {
    const d = m[1];
    const mo = m[2];
    const y = m[3];
    return `${y}-${mo}-${d}`;
  }
  return s;
}

const numberWords = [
  "không",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
];

function readTriple(n: number, full: boolean) {
  const hundred = Math.floor(n / 100);
  const tenUnit = n % 100;
  const ten = Math.floor(tenUnit / 10);
  const unit = tenUnit % 10;
  const parts: string[] = [];
  if (hundred > 0 || full) {
    if (hundred > 0) {
      parts.push(numberWords[hundred], "trăm");
    } else if (full) {
      parts.push("không", "trăm");
    }
  }
  if (ten > 1) {
    parts.push(numberWords[ten], "mươi");
    if (unit === 1) parts.push("mốt");
    else if (unit === 5) parts.push("lăm");
    else if (unit > 0) parts.push(numberWords[unit]);
  } else if (ten === 1) {
    parts.push("mười");
    if (unit === 5) parts.push("lăm");
    else if (unit > 0) parts.push(numberWords[unit]);
  } else {
    if (unit > 0) {
      if (hundred > 0 || full) parts.push("linh");
      parts.push(numberWords[unit]);
    } else {
      if (parts.length === 0) parts.push(numberWords[0]);
    }
  }
  return parts.join(" ");
}

export function vndToWords(value: number | string) {
  let num = Math.round(Number(value));
  if (!isFinite(num)) return "";
  if (num === 0) return "Không đồng";
  const negative = num < 0;
  if (negative) num = Math.abs(num);
  const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  const chunks: number[] = [];
  while (num > 0 && chunks.length < units.length) {
    chunks.push(num % 1000);
    num = Math.floor(num / 1000);
  }
  const highest = (() => {
    for (let i = chunks.length - 1; i >= 0; i--) {
      if (chunks[i] > 0) return i;
    }
    return 0;
  })();
  const parts: string[] = [];
  for (let i = highest; i >= 0; i--) {
    const chunk = chunks[i] || 0;
    if (chunk === 0) continue;
    const chunkText = readTriple(chunk, i < highest);
    const unitText = units[i];
    parts.push(unitText ? `${chunkText} ${unitText}` : chunkText);
  }
  let text = parts.join(" ");
  text = text.replace(/\s+/g, " ").trim();
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (negative) text = "Âm " + text;
  return `${text} đồng`;
}
