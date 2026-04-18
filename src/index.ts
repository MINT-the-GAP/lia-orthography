/**
 * LiaScript Orthography Plugin
 * Provides orthography exercises with gated resolve, sticky solutions, and reset functionality
 */

import { OrthographyConfig, OrthographyState, parseGate, getRootWindow } from "./types";
import { readStaticTexts, ensureState } from "./state";
import { syncUid, scheduleSync } from "./sync";
import { startGlobal } from "./events";

class OrthographyModule {
  private state: Record<string, OrthographyState> = {};
  private observer: { ref: MutationObserver | null } = { ref: null };
  private flags = {
    started: false,
    styleInstalled: { done: false },
    syncScheduled: false,
    lateSyncTimer: null as number | null
  };

  public register(cfg: OrthographyConfig): void {
    const uid = String(cfg && cfg.uid || "").trim();
    if (!uid) return;

    const S = ensureState(this.state, uid);
    S.cfg = cfg || null;
    S.gate = parseGate(cfg && cfg.gateRaw);

    if (cfg && typeof cfg.startText === "string") {
      S.start = cfg.startText;
    }

    if (cfg && typeof cfg.solutionText === "string") {
      S.solution = cfg.solutionText;
    }

    readStaticTexts(this.state, uid);
    syncUid(this.state, uid);
    scheduleSync(this.state, this.flags);
  }

  public startGlobal(): void {
    startGlobal(this.state, this.flags, this.observer);
  }
}

const ROOT = getRootWindow() as any;
const KEY = "__ORTHOGRAPHY_EXPORT_V8__";

if (!ROOT[KEY]) {
  const MOD = new OrthographyModule();
  ROOT[KEY] = MOD;
  MOD.startGlobal();
}
