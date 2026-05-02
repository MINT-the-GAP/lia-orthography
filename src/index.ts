/**
 * LiaScript Orthography Plugin
 * Provides orthography exercises with gated resolve, sticky solutions, and reset functionality
 */

import { OrthographyConfig, OrthographyState, parseGate, getRootWindow } from "./types";
import { readStaticTexts, ensureState } from "./state";
import { syncUid, scheduleSync, setInputValue } from "./sync";
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
    S.comment = (cfg && cfg.commentRaw) ? String(cfg.commentRaw) : S.comment;
    S.gate = parseGate((cfg && cfg.gateRaw) || S.comment);

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

  public getAllStates(): Record<string, OrthographyState> {
    return this.state;
  }

  public setState(uid: string, value: string): void {
    const S = ensureState(this.state, uid);
    S.liveValue = value;
    setInputValue(uid, S.cfg, value);
    syncUid(this.state, uid);
  }
}

const ROOT = getRootWindow() as any;
const KEY = "__ORTHOGRAPHY_EXPORT_V8__";

if (!ROOT[KEY]) {
  const MOD = new OrthographyModule();
  ROOT[KEY] = MOD;
  MOD.startGlobal();
}
