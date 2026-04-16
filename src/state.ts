/**
 * State initialization, static text reading, and DOM discovery.
 */

import { OrthographyState, parseGate } from "./types";
import { deriveUidFromWrap, getNodes } from "./dom";

export function ensureState(
  stateMap: Record<string, OrthographyState>,
  uid: string
): OrthographyState {
  if (!stateMap[uid]) {
    stateMap[uid] = {
      uid,
      cfg: null,
      gate: { mode: "on", n: 0 },
      start: "",
      solution: "",
      liveValue: null,
      solved: false,
      tries: 0,
      checkToken: 0,
      resolvePending: false
    };
  }
  return stateMap[uid];
}

export function readStaticTexts(
  stateMap: Record<string, OrthographyState>,
  uid: string
): void {
  const S = ensureState(stateMap, uid);
  const N = getNodes(uid, S.cfg);

  if (!S.start) {
    if (N.start) {
      S.start = N.start.textContent || "";
    } else if (N.input) {
      S.start = N.input.getAttribute("value") || N.input.defaultValue || "";
    }
  }

  if (N.solution) {
    S.solution = N.solution.textContent || S.solution || "";
  }

  if (S.liveValue === null) {
    if (N.input) S.liveValue = N.input.value;
    else S.liveValue = S.start;
  }
}

export function discoverAll(stateMap: Record<string, OrthographyState>): void {
  const wraps = document.querySelectorAll<HTMLElement>(".orthography-wrap");
  wraps.forEach((wrap) => {
    const uid = deriveUidFromWrap(wrap);
    if (!uid) return;
    const S = ensureState(stateMap, uid);
    wrap.dataset.orthoUid = uid;
    if (!S.cfg) {
      S.cfg = { uid };
      S.gate = parseGate(wrap.dataset.orthoGate);
    }
    readStaticTexts(stateMap, uid);
  });
}
