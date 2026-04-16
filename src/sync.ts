/**
 * Sync logic: input value management, reset/resolve state, and scheduled sync scheduling.
 */

import { OrthographyState, norm } from "./types";
import { ensureQuizBinding, getNodes } from "./dom";
import { discoverAll, ensureState, readStaticTexts } from "./state";

export function setInputValue(uid: string, cfg: ReturnType<typeof ensureState>["cfg"], value: string): void {
  const N = getNodes(uid, cfg);
  if (!N.input) return;

  N.input.value = value;
  N.input.defaultValue = value;
  try { N.input.setAttribute("value", value); } catch(e){}
}

export function restoreLiveValue(
  stateMap: Record<string, OrthographyState>,
  uid: string
): void {
  const S = ensureState(stateMap, uid);
  const N = getNodes(uid, S.cfg);
  if (!N.input) return;

  const desired = S.solved ? S.solution : (S.liveValue == null ? S.start : S.liveValue);
  const current = N.input.value;

  N.input.readOnly = !!S.solved;

  if (norm(current) !== norm(desired)) {
    setInputValue(uid, S.cfg, desired);
  }
}

export function ensureResetPlacement(
  stateMap: Record<string, OrthographyState>,
  uid: string
): void {
  const S = ensureState(stateMap, uid);
  const N = getNodes(uid, S.cfg);
  if (!N.wrap || !N.input || !N.reset) return;

  N.wrap.dataset.orthoUid = uid;
  N.wrap.dataset.orthoSolved = S.solved ? "1" : "0";
  N.reset.dataset.orthoUid = uid;
  N.reset.classList.add("ortho-reset-below");

  if (N.reset.parentElement !== N.wrap || N.reset.previousElementSibling !== N.input) {
    N.input.insertAdjacentElement("afterend", N.reset);
  }

  if (S.solved) {
    N.reset.disabled = true;
    N.reset.setAttribute("aria-hidden", "true");
    N.reset.setAttribute("tabindex", "-1");
  } else {
    N.reset.disabled = false;
    N.reset.removeAttribute("aria-hidden");
    N.reset.removeAttribute("tabindex");
  }
}

export function applyResolveState(
  stateMap: Record<string, OrthographyState>,
  uid: string
): void {
  const S = ensureState(stateMap, uid);
  const B = ensureQuizBinding(uid, S.cfg);
  if (!B || !B.resolve) return;

  const resolve = B.resolve as HTMLButtonElement;

  if (S.solved) {
    resolve.style.display = "";
    resolve.disabled = true;
    resolve.setAttribute("aria-hidden", "true");
    resolve.setAttribute("tabindex", "-1");
    resolve.classList.add("ortho-resolve-faded");
    return;
  }

  resolve.classList.remove("ortho-resolve-faded");

  if (S.gate.mode === "off") {
    resolve.disabled = true;
    resolve.style.display = "none";
    resolve.setAttribute("aria-hidden", "true");
    resolve.setAttribute("tabindex", "-1");
    return;
  }

  if (S.gate.mode === "attempts") {
    if (S.tries >= S.gate.n) {
      resolve.disabled = false;
      resolve.style.display = "";
      resolve.removeAttribute("aria-hidden");
      resolve.removeAttribute("tabindex");
    } else {
      resolve.disabled = true;
      resolve.style.display = "none";
      resolve.setAttribute("aria-hidden", "true");
      resolve.setAttribute("tabindex", "-1");
    }
    return;
  }

  resolve.disabled = false;
  resolve.style.display = "";
  resolve.removeAttribute("aria-hidden");
  resolve.removeAttribute("tabindex");
}

export function syncUid(stateMap: Record<string, OrthographyState>, uid: string): void {
  const S = ensureState(stateMap, uid);
  readStaticTexts(stateMap, uid);
  ensureResetPlacement(stateMap, uid);
  ensureQuizBinding(uid, S.cfg);
  applyResolveState(stateMap, uid);
  restoreLiveValue(stateMap, uid);

  const N = getNodes(uid, S.cfg);
  if (N.wrap) {
    N.wrap.dataset.orthoTries = String(S.tries);
    N.wrap.dataset.orthoSolved = S.solved ? "1" : "0";
  }
}

export function syncAll(stateMap: Record<string, OrthographyState>): void {
  discoverAll(stateMap);
  Object.keys(stateMap).forEach((uid) => {
    try { syncUid(stateMap, uid); } catch(e){}
  });
}

export function scheduleSync(
  stateMap: Record<string, OrthographyState>,
  flags: { syncScheduled: boolean; lateSyncTimer: number | null }
): void {
  clearTimeout(flags.lateSyncTimer ?? undefined);

  if (flags.syncScheduled) return;
  flags.syncScheduled = true;

  const run = () => {
    flags.syncScheduled = false;
    syncAll(stateMap);
  };

  try { requestAnimationFrame(run); } catch(e) { setTimeout(run, 16); }

  flags.lateSyncTimer = window.setTimeout(() => syncAll(stateMap), 90);
}
