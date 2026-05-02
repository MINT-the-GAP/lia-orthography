/**
 * DOM helpers: style injection, node lookup, and quiz binding.
 */

import { OrthographyConfig, OrthographyNodes, QuizBinding, parseUidFromString } from "./types";

export function ensureStyle(installed: { done: boolean }): void {
  if (installed.done) return;
  installed.done = true;

  const style = document.createElement("style");
  style.id = "orthography-export-style-v8b";
  style.textContent = `
      .orthography-ui{
        display:block;
        margin:0;
        padding:0;
      }

      .orthography-task{
        display:block;
        margin:0;
        padding:0;
      }

      .orthography-check{
        display:block;
        margin:0;
        padding:0;
      }

      .orthography-wrap{
        display:grid;
        grid-template-columns:minmax(0, 1fr) auto;
        column-gap:.5rem;
        row-gap:.35rem;
        align-items:center;
      }

      .orthography-wrap > .lia-quiz__input{
        grid-column:1;
        min-width:0;
        width:100%;
      }

      .orthography-wrap > .ortho-reset-below{
        grid-column:2;
        margin:0 !important;
        display:inline-flex !important;
        align-items:center;
        justify-content:center;
        white-space:nowrap;
        align-self:stretch;
      }

      .orthography-wrap[data-ortho-solved="1"] > .ortho-reset-below{
        display:none !important;
      }

      .lia-quiz__resolve.ortho-resolve-faded{
        opacity:.38 !important;
        transition:opacity .18s ease;
      }
    `;
  (document.head || document.documentElement).appendChild(style);
}

export function deriveUidFromWrap(wrap: HTMLElement): string {
  if (!wrap) return "";

  if (wrap.dataset && wrap.dataset.orthoUid) {
    return String(wrap.dataset.orthoUid);
  }

  const byInputId = wrap.querySelector<HTMLElement>('[id^="orthography-input-"]');
  if (byInputId && byInputId.id) {
    return parseUidFromString(byInputId.id, "orthography-input-");
  }

  const byDataId = wrap.querySelector<HTMLElement>('[data-id^="lia-quiz-"]');
  if (byDataId) {
    const uid = parseUidFromString(byDataId.getAttribute("data-id") || "", "lia-quiz-");
    if (uid) return uid;
  }

  const bySolution = wrap.querySelector<HTMLElement>('[id^="orthography-solution-"]');
  if (bySolution && bySolution.id) {
    return parseUidFromString(bySolution.id, "orthography-solution-");
  }

  const byReset = wrap.querySelector<HTMLElement>('[id^="orthography-reset-"]');
  if (byReset && byReset.id) {
    return parseUidFromString(byReset.id, "orthography-reset-");
  }

  return "";
}

export function getNodes(uid: string, cfg: OrthographyConfig | null): OrthographyNodes {
  const ui =
    document.getElementById((cfg?.idUi) || ("orthography-ui-" + uid));

  const task =
    document.getElementById((cfg?.idTask) || ("orthography-task-" + uid));

  const checkRoot =
    document.getElementById((cfg?.idCheck) || ("orthography-check-" + uid));

  const input =
    document.getElementById((cfg?.idInput) || ("orthography-input-" + uid)) as HTMLInputElement ||
    document.querySelector<HTMLInputElement>('[data-id="lia-quiz-' + uid + '"]');

  const wrap =
    (input ? input.closest<HTMLElement>(".orthography-wrap") : null) ||
    document.querySelector<HTMLElement>('.orthography-wrap[data-ortho-uid="' + uid + '"]') ||
    document.getElementById((cfg?.idWrap) || ("orthography-wrap-" + uid));

  const reset =
    document.getElementById((cfg?.idReset) || ("orthography-reset-" + uid)) as HTMLButtonElement ||
    (wrap ? wrap.querySelector<HTMLButtonElement>('[id^="orthography-reset-"]') : null);

  const start =
    document.getElementById((cfg?.idStart) || ("orthography-start-" + uid)) ||
    (wrap ? wrap.querySelector<HTMLElement>('[id^="orthography-start-"]') : null);

  const solution =
    document.getElementById((cfg?.idSolution) || ("orthography-solution-" + uid)) ||
    (wrap ? wrap.querySelector<HTMLElement>('[id^="orthography-solution-"]') : null);

  const comment =
    document.getElementById((cfg?.idComment) || ("orthography-comment-" + uid)) ||
    (wrap ? wrap.querySelector<HTMLElement>('[id^="orthography-comment-"]') : null);

  if (ui) ui.dataset.orthoUid = uid;
  if (task) task.dataset.orthoUid = uid;
  if (checkRoot) checkRoot.dataset.orthoUid = uid;
  if (wrap) wrap.dataset.orthoUid = uid;
  if (input) input.dataset.orthoUid = uid;
  if (reset) reset.dataset.orthoUid = uid;
  if (start) start.dataset.orthoUid = uid;
  if (solution) solution.dataset.orthoUid = uid;
  if (comment) comment.dataset.orthoUid = uid;

  return { ui, task, checkRoot, wrap, input, reset, start, solution, comment };
}

export function findQuiz(uid: string, cfg: OrthographyConfig | null): HTMLElement | null {
  const N = getNodes(uid, cfg);
  if (N.checkRoot) {
    const quizzes = N.checkRoot.querySelectorAll<HTMLElement>(".lia-quiz");
    if (quizzes.length) {
      return quizzes[quizzes.length - 1];
    }
  }

  const wrap = N.wrap;
  if (!wrap) return null;

  if (wrap.id) {
    const answers = document.querySelector<HTMLElement>('.lia-quiz__answers[aria-labelledby="' + wrap.id + '"]');
    if (answers) {
      const quiz = answers.closest<HTMLElement>(".lia-quiz");
      if (quiz) return quiz;
    }
  }

  let node = wrap.nextElementSibling as HTMLElement | null;
  while (node) {
    if (node.classList && node.classList.contains("orthography-wrap")) break;
    if (node.classList && node.classList.contains("lia-quiz")) return node;
    if (node.querySelector) {
      const quiz = node.querySelector<HTMLElement>(".lia-quiz");
      if (quiz) return quiz;
    }
    node = node.nextElementSibling as HTMLElement | null;
  }

  const root = document.body || document.documentElement;
  if (!root || !document.createTreeWalker || !root.contains(wrap)) return null;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  walker.currentNode = wrap;

  let current;
  while ((current = walker.nextNode())) {
    if (!(current instanceof Element)) continue;
    if (current !== wrap && current.classList && current.classList.contains("orthography-wrap")) break;
    if (current.classList && current.classList.contains("lia-quiz")) return current as HTMLElement;
  }

  return null;
}

export function ensureQuizBinding(uid: string, cfg: OrthographyConfig | null): QuizBinding | null {
  const quiz = findQuiz(uid, cfg);
  if (!quiz) return null;

  const control = quiz.querySelector<HTMLElement>(".lia-quiz__control");
  const check = control ? control.querySelector<HTMLElement>(".lia-quiz__check") : null;
  const resolve = control ? control.querySelector<HTMLElement>(".lia-quiz__resolve") : null;

  quiz.dataset.orthoUid = uid;
  if (control) control.dataset.orthoUid = uid;
  if (check) check.dataset.orthoUid = uid;
  if (resolve) resolve.dataset.orthoUid = uid;

  return { quiz, control, check, resolve };
}
