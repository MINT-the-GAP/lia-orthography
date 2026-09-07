/**
 * Global event handlers: input, reset, check, and resolve interactions.
 */

import { OrthographyState, normalizeAnswer, parseUidFromString } from "./types";
import { getNodes, ensureStyle } from "./dom";
import { ensureState } from "./state";
import { syncUid, syncAll, scheduleSync, setInputValue } from "./sync";

const NATIVE_QUIZ_SOLUTION = "orthography-check";

const ARROW_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);

function setNativeQuizAnswer(uid: string, correct: boolean): void {
  const host = document.getElementById("orthography-native-" + uid);
  const input = host?.querySelector<HTMLInputElement>("input.lia-quiz__input");
  if (!input) return;

  const value = correct ? NATIVE_QUIZ_SOLUTION : "";
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;

  if (setter) {
    setter.call(input, value);
  } else {
    input.value = value;
  }
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function disableBrowserWritingAids(root?: ParentNode | null): void {
  const scope = root || document;
  const elements = scope.querySelectorAll<HTMLElement>(
    "input, textarea, [contenteditable='true'], [contenteditable=''], [contenteditable='plaintext-only']"
  );

  elements.forEach((element) => {
    if ("spellcheck" in element) {
      (element as HTMLElement).spellcheck = false;
    }
    element.setAttribute("spellcheck", "false");
    element.setAttribute("autocorrect", "off");
    element.setAttribute("autocapitalize", "none");
    element.setAttribute("autocomplete", "off");
    element.setAttribute("aria-autocomplete", "none");
    element.setAttribute("data-gramm", "false");
    element.setAttribute("data-gramm_editor", "false");
    element.setAttribute("data-enable-grammarly", "false");
  });
}

/** Nearest ancestor already tagged with a uid by getNodes/ensureQuizBinding. */
function getTaggedUid(node: Element): string {
  const direct = node.closest<HTMLElement>("[data-ortho-uid]");
  return direct?.dataset?.orthoUid ? String(direct.dataset.orthoUid) : "";
}

function getUidFromOrthographyInput(node: Element): string {
  const tagged = getTaggedUid(node);
  if (tagged) return tagged;

  const input = node.closest<HTMLElement>('[id^="orthography-input-"], [id^="orthographytext-input-"], [data-id^="lia-quiz-"]');
  if (input) {
    if (input.id) {
      const byId =
        parseUidFromString(input.id, "orthography-input-") ||
        parseUidFromString(input.id, "orthographytext-input-");
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
  const tagged = getTaggedUid(node);
  if (tagged) return tagged;

  if (node.id) {
    const uid =
      parseUidFromString(node.id, "orthography-reset-") ||
      parseUidFromString(node.id, "orthographytext-reset-");
    if (uid) return uid;
  }

  return "";
}

function getUidFromOrthographyControl(node: Element): string {
  const tagged = getTaggedUid(node);
  if (tagged) return tagged;

  for (const selector of [".lia-quiz__control", ".lia-quiz"]) {
    const host = node.closest<HTMLElement>(selector);
    if (host?.dataset?.orthoUid) return String(host.dataset.orthoUid);
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

function suppressEvent(ev: Event): void {
  ev.preventDefault();
  ev.stopPropagation();
  ev.stopImmediatePropagation();
}

function handleReset(
  stateMap: Record<string, OrthographyState>,
  uid: string,
  ev?: Event
): void {
  const S = ensureState(stateMap, uid);

  if (ev) suppressEvent(ev);

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
    if (ev) suppressEvent(ev);
    return;
  }

  const N = getNodes(uid, S.cfg);
  if (!N.input) return;

  const beforeValue = N.input.value;
  const wasCorrect =
    normalizeAnswer(beforeValue, S.doubleSpaceHelp) ===
    normalizeAnswer(S.solution, S.doubleSpaceHelp);
  setNativeQuizAnswer(uid, wasCorrect);
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
    if (ev) suppressEvent(ev);
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

function trimInputElement(inp: HTMLInputElement | HTMLTextAreaElement): boolean {
  if (!inp) return false;

  const v = String(inp.value);
  const t = v.replace(/^\s+|\s+$/g, "");
  if (t === v) return false;

  const proto =
    inp.tagName === "TEXTAREA"
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  const setter = desc && desc.set;
  if (setter) {
    setter.call(inp, t);
  } else {
    inp.value = t;
  }
  try { inp.dispatchEvent(new Event("input", { bubbles: true })); } catch (e) {}
  try { inp.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}
  return true;
}

function trimAllDiktatInputs(): void {
  const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    '.lia-diktat input, .lia-diktat textarea'
  );
  inputs.forEach((inp) => trimInputElement(inp));
}

function bindDiktatTrim(): void {
  // Primary mechanism: trim on focus loss BEFORE the click on .lia-quiz__check is processed.
  // Elm's input listener fires synchronously on the dispatched "input" event, so the model
  // holds the trimmed value by the time the check button's click handler runs.
  document.addEventListener("focusout", (ev) => {
    const target = ev.target;
    if (!(target instanceof Element)) return;
    if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;
    if (!target.closest(".lia-diktat")) return;
    trimInputElement(target as HTMLInputElement | HTMLTextAreaElement);
  }, true);

  // Belt and braces: also trim all diktat inputs on any quiz check click.
  document.addEventListener("click", (ev) => {
    const target = ev.target;
    if (!(target instanceof Element)) return;
    if (!target.closest(".lia-quiz__check")) return;
    trimAllDiktatInputs();
  }, true);
}

export function startGlobal(
  stateMap: Record<string, OrthographyState>,
  flags: { started: boolean; styleInstalled: { done: boolean }; syncScheduled: boolean; lateSyncTimer: number | null },
  observer: { ref: MutationObserver | null }
): void {
  if (flags.started) return;
  flags.started = true;

  ensureStyle(flags.styleInstalled);
  disableBrowserWritingAids(document);
  bindDiktatTrim();

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

  // Keep arrow keys inside the input: LiaScript uses them for slide navigation,
  // which would otherwise steal the caret while the learner is typing.
  const keepArrowKeysLocal = (ev: KeyboardEvent) => {
    if (!ARROW_KEYS.has(ev.key)) return;
    const target = ev.target;
    if (!(target instanceof Element)) return;
    if (!getUidFromOrthographyInput(target)) return;
    ev.stopPropagation();
    ev.stopImmediatePropagation();
  };

  document.addEventListener("keydown", keepArrowKeysLocal, true);
  document.addEventListener("keyup", keepArrowKeysLocal, true);

  document.addEventListener("click", (ev) => {
    const target = ev.target;
    if (!(target instanceof Element)) return;

    const reset = target.closest(".ortho-reset-below, [id^='orthography-reset-'], [id^='orthographytext-reset-']");
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

    observer.ref = new MutationObserver((mutations) => {
      let shouldSync = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          shouldSync = true;
        } else if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          mutation.target instanceof Element &&
          mutation.target.matches(".lia-quiz")
        ) {
          shouldSync = true;
        }

        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const element = node as Element;
          if (
            element.matches &&
            element.matches("input, textarea, [contenteditable='true'], [contenteditable=''], [contenteditable='plaintext-only']")
          ) {
            if (element.parentNode) disableBrowserWritingAids(element.parentNode as ParentNode);
          } else {
            disableBrowserWritingAids(element);
          }
        });
      });

      if (shouldSync) {
        scheduleSync(stateMap, flags);
      }
    });

    observer.ref.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"]
    });
  };

  startObserver();
  setTimeout(startObserver, 0);

  syncAll(stateMap);
  setTimeout(() => syncAll(stateMap), 0);
  setTimeout(() => syncAll(stateMap), 120);
  setTimeout(() => syncAll(stateMap), 260);
}
