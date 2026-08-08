/**
 * Sync logic: input value management, reset/resolve state, and scheduled sync scheduling.
 */

import { OrthographyState, norm, parseDoubleSpaceHelp, parseGate } from "./types";
import { ensureQuizBinding, getNodes } from "./dom";
import { discoverAll, ensureState, readStaticTexts } from "./state";

function setAttributeIfChanged(
  element: HTMLElement,
  name: string,
  value: string
): void {
  if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
}

function removeAttributeIfPresent(element: HTMLElement, name: string): void {
  if (element.hasAttribute(name)) {
    element.removeAttribute(name);
  }
}

function setClassPresence(
  element: HTMLElement,
  name: string,
  present: boolean
): void {
  if (element.classList.contains(name) !== present) {
    element.classList.toggle(name, present);
  }
}

export function setInputValue(uid: string, cfg: ReturnType<typeof ensureState>["cfg"], value: string): void {
  const N = getNodes(uid, cfg);
  if (!N.input) return;

  N.input.value = value;
  N.input.defaultValue = value;
  if (N.input.tagName !== "TEXTAREA") {
    try { N.input.setAttribute("value", value); } catch(e){}
  }
}

export function syncSolvedFromQuiz(
  stateMap: Record<string, OrthographyState>,
  uid: string
): void {
  const S = ensureState(stateMap, uid);
  const B = ensureQuizBinding(uid, S.cfg);
  const quiz = B?.quiz;

  if (!quiz) return;

  if (S.cfg?.gateRaw === undefined) {
    const gateRaw = quiz.getAttribute("data-solution-button");
    if (gateRaw !== null) {
      S.gate = parseGate(gateRaw);
    }
  }

  if (S.cfg?.doubleSpaceHelpRaw === undefined) {
    const doubleSpaceHelpRaw = quiz.getAttribute("doublespacehelp");
    if (doubleSpaceHelpRaw !== null) {
      S.doubleSpaceHelp = parseDoubleSpaceHelp(doubleSpaceHelpRaw);
    }
  }

  if (!S.solved) {
    S.solved =
      quiz.classList.contains("solved") ||
      quiz.classList.contains("resolved");
  }
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

  const valuesMatch =
    S.solved && S.doubleSpaceHelp
      ? current === desired
      : norm(current) === norm(desired);

  if (!valuesMatch) {
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
  setClassPresence(N.reset, "ortho-reset-below", true);

  if (N.reset.parentElement !== N.wrap || N.reset.previousElementSibling !== N.input) {
    N.input.insertAdjacentElement("afterend", N.reset);
  }

  if (S.solved) {
    N.reset.disabled = true;
    setAttributeIfChanged(N.reset, "aria-hidden", "true");
    setAttributeIfChanged(N.reset, "tabindex", "-1");
  } else {
    N.reset.disabled = false;
    removeAttributeIfPresent(N.reset, "aria-hidden");
    removeAttributeIfPresent(N.reset, "tabindex");
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
    setAttributeIfChanged(resolve, "aria-hidden", "true");
    setAttributeIfChanged(resolve, "tabindex", "-1");
    setClassPresence(resolve, "ortho-resolve-faded", true);
    return;
  }

  setClassPresence(resolve, "ortho-resolve-faded", false);

  if (S.gate.mode === "off") {
    resolve.disabled = true;
    resolve.style.display = "none";
    setAttributeIfChanged(resolve, "aria-hidden", "true");
    setAttributeIfChanged(resolve, "tabindex", "-1");
    return;
  }

  if (S.gate.mode === "attempts") {
    if (S.tries >= S.gate.n) {
      resolve.disabled = false;
      resolve.style.display = "";
      removeAttributeIfPresent(resolve, "aria-hidden");
      removeAttributeIfPresent(resolve, "tabindex");
    } else {
      resolve.disabled = true;
      resolve.style.display = "none";
      setAttributeIfChanged(resolve, "aria-hidden", "true");
      setAttributeIfChanged(resolve, "tabindex", "-1");
    }
    return;
  }

  resolve.disabled = false;
  resolve.style.display = "";
  removeAttributeIfPresent(resolve, "aria-hidden");
  removeAttributeIfPresent(resolve, "tabindex");
}

export function syncUid(stateMap: Record<string, OrthographyState>, uid: string): void {
  const S = ensureState(stateMap, uid);
  readStaticTexts(stateMap, uid);
  syncSolvedFromQuiz(stateMap, uid);
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
  if (flags.syncScheduled) return;
  flags.syncScheduled = true;

  const run = () => {
    flags.syncScheduled = false;
    syncAll(stateMap);
  };

  try { requestAnimationFrame(run); } catch(e) { setTimeout(run, 16); }

  clearTimeout(flags.lateSyncTimer ?? undefined);
  flags.lateSyncTimer = window.setTimeout(() => syncAll(stateMap), 90);
}
