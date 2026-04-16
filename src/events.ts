/**
 * Global event handlers: input, reset, check, and resolve interactions.
 */

import { OrthographyState, norm, parseUidFromString } from "./types";
import { getNodes, ensureStyle } from "./dom";
import { ensureState } from "./state";
import { syncUid, syncAll, scheduleSync, setInputValue } from "./sync";

function getUidFromOrthographyInput(node: Element): string {
  const direct = node.closest<HTMLElement>("[data-ortho-uid]");
  if (direct && direct.dataset && direct.dataset.orthoUid) {
    return String(direct.dataset.orthoUid);
  }

  const input = node.closest<HTMLElement>('[id^="orthography-input-"], [data-id^="lia-quiz-"]');
  if (input) {
    if (input.id) {
      const byId = parseUidFromString(input.id, "orthography-input-");
      if (byId) return byId;
    }
    const dataId = input.getAttribute("data-id");
    if (dataId) {
      const byData = parseUidFromString(dataId, "lia-quiz-");
      if (byData) return byData;
    }
  }

  return "";
}

function getUidFromReset(node: Element): string {
  const direct = node.closest<HTMLElement>("[data-ortho-uid]");
  if (direct && direct.dataset && direct.dataset.orthoUid) {
    return String(direct.dataset.orthoUid);
  }

  if (node.id) {
    const uid = parseUidFromString(node.id, "orthography-reset-");
    if (uid) return uid;
  }

  return "";
}

function getUidFromOrthographyControl(node: Element): string {
  const direct = node.closest<HTMLElement>("[data-ortho-uid]");
  if (direct && direct.dataset && direct.dataset.orthoUid) {
    return String(direct.dataset.orthoUid);
  }

  const control = node.closest<HTMLElement>(".lia-quiz__control");
  if (control && control.dataset && control.dataset.orthoUid) {
    return String(control.dataset.orthoUid);
  }

  const quiz = node.closest<HTMLElement>(".lia-quiz");
  if (quiz && quiz.dataset && quiz.dataset.orthoUid) {
    return String(quiz.dataset.orthoUid);
  }

  return "";
}

function handleInput(stateMap: Record<string, OrthographyState>, uid: string): void {
  const S = ensureState(stateMap, uid);
  if (S.solved) return;

  const N = getNodes(uid, S.cfg);
  if (!N.input) return;

  S.liveValue = N.input.value;
}

function handleReset(
  stateMap: Record<string, OrthographyState>,
  uid: string,
  ev?: Event
): void {
  const S = ensureState(stateMap, uid);

  if (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    if ((ev as any).stopImmediatePropagation) (ev as any).stopImmediatePropagation();
  }

  if (S.solved) return;

  S.liveValue = S.start;
  setInputValue(uid, S.cfg, S.start);
}

function finishCheck(
  stateMap: Record<string, OrthographyState>,
  flags: { syncScheduled: boolean; lateSyncTimer: number | null },
  uid: string,
  token: number,
  beforeValue: string,
  wasCorrect: boolean
): void {
  const S = ensureState(stateMap, uid);
  if (token !== S.checkToken) return;

  if (!S.solved && S.gate.mode === "attempts") {
    S.tries += 1;
  }

  if (wasCorrect) {
    S.solved = true;
    S.liveValue = S.solution;
  } else {
    S.liveValue = beforeValue;
  }

  syncUid(stateMap, uid);
  scheduleSync(stateMap, flags);
}

function handleCheck(
  stateMap: Record<string, OrthographyState>,
  flags: { syncScheduled: boolean; lateSyncTimer: number | null },
  uid: string,
  ev?: Event
): void {
  const S = ensureState(stateMap, uid);
  if (S.solved) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if ((ev as any).stopImmediatePropagation) (ev as any).stopImmediatePropagation();
    }
    return;
  }

  const N = getNodes(uid, S.cfg);
  if (!N.input) return;

  const beforeValue = N.input.value;
  const wasCorrect = norm(beforeValue) === norm(S.solution);
  const token = ++S.checkToken;

  setTimeout(() => finishCheck(stateMap, flags, uid, token, beforeValue, wasCorrect), 0);
}

function handleResolve(
  stateMap: Record<string, OrthographyState>,
  flags: { syncScheduled: boolean; lateSyncTimer: number | null },
  uid: string,
  ev?: Event
): void {
  const S = ensureState(stateMap, uid);

  if (S.solved || S.resolvePending) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if ((ev as any).stopImmediatePropagation) (ev as any).stopImmediatePropagation();
    }
    return;
  }

  S.resolvePending = true;

  setTimeout(() => {
    S.resolvePending = false;
    S.solved = true;
    S.liveValue = S.solution;
    syncUid(stateMap, uid);
    scheduleSync(stateMap, flags);
  }, 0);
}

export function startGlobal(
  stateMap: Record<string, OrthographyState>,
  flags: { started: boolean; styleInstalled: { done: boolean }; syncScheduled: boolean; lateSyncTimer: number | null },
  observer: { ref: MutationObserver | null }
): void {
  if (flags.started) return;
  flags.started = true;

  ensureStyle(flags.styleInstalled);

  document.addEventListener("input", (ev) => {
    const target = ev.target;
    if (!(target instanceof Element)) return;
    const uid = getUidFromOrthographyInput(target);
    if (!uid) return;
    handleInput(stateMap, uid);
  }, true);

  document.addEventListener("change", (ev) => {
    const target = ev.target;
    if (!(target instanceof Element)) return;
    const uid = getUidFromOrthographyInput(target);
    if (!uid) return;
    handleInput(stateMap, uid);
  }, true);

  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
    const target = ev.target;
    if (!(target instanceof Element)) return;
    const uid = getUidFromOrthographyInput(target);
    if (!uid) return;
    ev.stopPropagation();
    if ((ev as any).stopImmediatePropagation) (ev as any).stopImmediatePropagation();
  }, true);

  document.addEventListener("click", (ev) => {
    const target = ev.target;
    if (!(target instanceof Element)) return;

    const reset = target.closest(".ortho-reset-below, [id^='orthography-reset-']");
    if (reset) {
      const uid = getUidFromReset(reset);
      if (uid) handleReset(stateMap, uid, ev);
      return;
    }

    const check = target.closest(".lia-quiz__check");
    if (check) {
      const uid = getUidFromOrthographyControl(check);
      if (uid) handleCheck(stateMap, flags, uid, ev);
      return;
    }

    const resolve = target.closest(".lia-quiz__resolve");
    if (resolve) {
      const uid = getUidFromOrthographyControl(resolve);
      if (uid) handleResolve(stateMap, flags, uid, ev);
    }
  }, true);

  const startObserver = () => {
    if (observer.ref) return;

    const target = document.body || document.documentElement;
    if (!target) return;

    observer.ref = new MutationObserver(() => {
      scheduleSync(stateMap, flags);
    });

    observer.ref.observe(target, { childList: true, subtree: true });
  };

  startObserver();
  setTimeout(startObserver, 0);

  syncAll(stateMap);
  setTimeout(() => syncAll(stateMap), 0);
  setTimeout(() => syncAll(stateMap), 120);
  setTimeout(() => syncAll(stateMap), 260);
}
