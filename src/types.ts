/**
 * Shared types and pure utility functions used across all modules.
 */

export interface OrthographyConfig {
  uid: string;
  gateRaw?: string | boolean | number;
  idUi?: string;
  idTask?: string;
  idCheck?: string;
  idWrap?: string;
  idInput?: string;
  idReset?: string;
  idStart?: string;
  idSolution?: string;
  startText?: string;
  solutionText?: string;
}

export interface GateConfig {
  mode: "on" | "off" | "attempts";
  n: number;
}

export interface OrthographyState {
  uid: string;
  cfg: OrthographyConfig | null;
  gate: GateConfig;
  start: string;
  solution: string;
  liveValue: string | null;
  solved: boolean;
  tries: number;
  checkToken: number;
  resolvePending: boolean;
}

export interface OrthographyNodes {
  ui: HTMLElement | null;
  task: HTMLElement | null;
  checkRoot: HTMLElement | null;
  wrap: HTMLElement | null;
  input: HTMLInputElement | null;
  reset: HTMLButtonElement | null;
  start: HTMLElement | null;
  solution: HTMLElement | null;
}

export interface QuizBinding {
  quiz: HTMLElement | null;
  control: HTMLElement | null;
  check: HTMLElement | null;
  resolve: HTMLElement | null;
}

export function norm(s: string): string {
  return String(s || "")
    .normalize("NFKC")
    .replace(/[„“”‟«»‹›"]/g, '"')
    .replace(/[‚‘’‛]/g, "'")
    .replace(/\u00A0/g, " ")
    .toLocaleLowerCase()
    .replace(/\s+/g, "");
}

export function parseGate(raw: string | boolean | number | undefined): GateConfig {
  const s = String(raw || "").trim().toLowerCase();
  if (s === "false" || s === "0" || s === "off" || s === "no") {
    return { mode: "off", n: 0 };
  }
  const n = parseInt(s, 10);
  if (Number.isFinite(n) && n > 0) {
    return { mode: "attempts", n: n };
  }
  return { mode: "on", n: 0 };
}

export function parseUidFromString(v: string, prefix: string): string {
  v = String(v || "");
  if (!v) return "";
  if (prefix && v.indexOf(prefix) === 0) return v.slice(prefix.length);
  return "";
}

export function getRootWindow(): Window {
  let w: Window = window;
  try {
    while (w.parent && w.parent !== w) w = w.parent;
  } catch(e){}
  return w;
}
