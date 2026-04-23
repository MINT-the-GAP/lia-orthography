/**
 * LiaScript Orthography Plugin
 * Provides orthography exercises with gated resolve, sticky solutions, and reset functionality
 */ /**
 * Shared types and pure utility functions used across all modules.
 */ function $faefaad95e5fcca0$export$1991ecd29cc92c6b(s) {
    return String(s || "").normalize("NFKC").replace(/[„“”‟«»‹›"]/g, '"').replace(/[‚‘’‛]/g, "'").replace(/\u00A0/g, " ").toLocaleLowerCase().replace(/\s+/g, "");
}
function $faefaad95e5fcca0$export$fab1ce0fa1765516(raw) {
    const s = String(raw || "").trim().toLowerCase();
    if (s === "false" || s === "0" || s === "off" || s === "no") return {
        mode: "off",
        n: 0
    };
    const n = parseInt(s, 10);
    if (Number.isFinite(n) && n > 0) return {
        mode: "attempts",
        n: n
    };
    return {
        mode: "on",
        n: 0
    };
}
function $faefaad95e5fcca0$export$51f7daf7ba0f1187(v, prefix) {
    v = String(v || "");
    if (!v) return "";
    if (prefix && v.indexOf(prefix) === 0) return v.slice(prefix.length);
    return "";
}
function $faefaad95e5fcca0$export$58e4a8be3070ab87() {
    let w = window;
    try {
        while(w.parent && w.parent !== w)w = w.parent;
    } catch (e) {}
    return w;
}


/**
 * State initialization, static text reading, and DOM discovery.
 */ 
/**
 * DOM helpers: style injection, node lookup, and quiz binding.
 */ 
function $2f96dbadf81a4e19$export$b9324dd3ed41badd(installed) {
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
function $2f96dbadf81a4e19$export$8ef5ec77fcb82f69(wrap) {
    if (!wrap) return "";
    if (wrap.dataset && wrap.dataset.orthoUid) return String(wrap.dataset.orthoUid);
    const byInputId = wrap.querySelector('[id^="orthography-input-"]');
    if (byInputId && byInputId.id) return (0, $faefaad95e5fcca0$export$51f7daf7ba0f1187)(byInputId.id, "orthography-input-");
    const byDataId = wrap.querySelector('[data-id^="lia-quiz-"]');
    if (byDataId) {
        const uid = (0, $faefaad95e5fcca0$export$51f7daf7ba0f1187)(byDataId.getAttribute("data-id") || "", "lia-quiz-");
        if (uid) return uid;
    }
    const bySolution = wrap.querySelector('[id^="orthography-solution-"]');
    if (bySolution && bySolution.id) return (0, $faefaad95e5fcca0$export$51f7daf7ba0f1187)(bySolution.id, "orthography-solution-");
    const byReset = wrap.querySelector('[id^="orthography-reset-"]');
    if (byReset && byReset.id) return (0, $faefaad95e5fcca0$export$51f7daf7ba0f1187)(byReset.id, "orthography-reset-");
    return "";
}
function $2f96dbadf81a4e19$export$d668e62f6e0051f4(uid, cfg) {
    const ui = document.getElementById(cfg?.idUi || "orthography-ui-" + uid);
    const task = document.getElementById(cfg?.idTask || "orthography-task-" + uid);
    const checkRoot = document.getElementById(cfg?.idCheck || "orthography-check-" + uid);
    const input = document.getElementById(cfg?.idInput || "orthography-input-" + uid) || document.querySelector('[data-id="lia-quiz-' + uid + '"]');
    const wrap = (input ? input.closest(".orthography-wrap") : null) || document.querySelector('.orthography-wrap[data-ortho-uid="' + uid + '"]') || document.getElementById(cfg?.idWrap || "orthography-wrap-" + uid);
    const reset = document.getElementById(cfg?.idReset || "orthography-reset-" + uid) || (wrap ? wrap.querySelector('[id^="orthography-reset-"]') : null);
    const start = document.getElementById(cfg?.idStart || "orthography-start-" + uid) || (wrap ? wrap.querySelector('[id^="orthography-start-"]') : null);
    const solution = document.getElementById(cfg?.idSolution || "orthography-solution-" + uid) || (wrap ? wrap.querySelector('[id^="orthography-solution-"]') : null);
    if (ui) ui.dataset.orthoUid = uid;
    if (task) task.dataset.orthoUid = uid;
    if (checkRoot) checkRoot.dataset.orthoUid = uid;
    if (wrap) wrap.dataset.orthoUid = uid;
    if (input) input.dataset.orthoUid = uid;
    if (reset) reset.dataset.orthoUid = uid;
    if (start) start.dataset.orthoUid = uid;
    if (solution) solution.dataset.orthoUid = uid;
    return {
        ui: ui,
        task: task,
        checkRoot: checkRoot,
        wrap: wrap,
        input: input,
        reset: reset,
        start: start,
        solution: solution
    };
}
function $2f96dbadf81a4e19$export$2927fd8de59b288a(uid, cfg) {
    const N = $2f96dbadf81a4e19$export$d668e62f6e0051f4(uid, cfg);
    if (N.checkRoot) {
        const quizzes = N.checkRoot.querySelectorAll(".lia-quiz");
        if (quizzes.length) return quizzes[quizzes.length - 1];
    }
    const wrap = N.wrap;
    if (!wrap) return null;
    if (wrap.id) {
        const answers = document.querySelector('.lia-quiz__answers[aria-labelledby="' + wrap.id + '"]');
        if (answers) {
            const quiz = answers.closest(".lia-quiz");
            if (quiz) return quiz;
        }
    }
    let node = wrap.nextElementSibling;
    while(node){
        if (node.classList && node.classList.contains("orthography-wrap")) break;
        if (node.classList && node.classList.contains("lia-quiz")) return node;
        if (node.querySelector) {
            const quiz = node.querySelector(".lia-quiz");
            if (quiz) return quiz;
        }
        node = node.nextElementSibling;
    }
    const root = document.body || document.documentElement;
    if (!root || !document.createTreeWalker || !root.contains(wrap)) return null;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    walker.currentNode = wrap;
    let current;
    while(current = walker.nextNode()){
        if (!(current instanceof Element)) continue;
        if (current !== wrap && current.classList && current.classList.contains("orthography-wrap")) break;
        if (current.classList && current.classList.contains("lia-quiz")) return current;
    }
    return null;
}
function $2f96dbadf81a4e19$export$20fbbf30e1f4ce8a(uid, cfg) {
    const quiz = $2f96dbadf81a4e19$export$2927fd8de59b288a(uid, cfg);
    if (!quiz) return null;
    const control = quiz.querySelector(".lia-quiz__control");
    const check = control ? control.querySelector(".lia-quiz__check") : null;
    const resolve = control ? control.querySelector(".lia-quiz__resolve") : null;
    quiz.dataset.orthoUid = uid;
    if (control) control.dataset.orthoUid = uid;
    if (check) check.dataset.orthoUid = uid;
    if (resolve) resolve.dataset.orthoUid = uid;
    return {
        quiz: quiz,
        control: control,
        check: check,
        resolve: resolve
    };
}


function $a05669264f67e39b$export$b637efaa3fcc9599(stateMap, uid) {
    if (!stateMap[uid]) stateMap[uid] = {
        uid: uid,
        cfg: null,
        gate: {
            mode: "on",
            n: 0
        },
        start: "",
        solution: "",
        liveValue: null,
        solved: false,
        tries: 0,
        checkToken: 0,
        resolvePending: false
    };
    return stateMap[uid];
}
function $a05669264f67e39b$export$7ff8ace17f87623e(stateMap, uid) {
    const S = $a05669264f67e39b$export$b637efaa3fcc9599(stateMap, uid);
    const N = (0, $2f96dbadf81a4e19$export$d668e62f6e0051f4)(uid, S.cfg);
    if (!S.start) {
        if (N.start) S.start = N.start.textContent || "";
        else if (N.input) S.start = N.input.getAttribute("value") || N.input.defaultValue || "";
    }
    if (N.solution) S.solution = N.solution.textContent || S.solution || "";
    if (S.liveValue === null) {
        if (N.input) S.liveValue = N.input.value;
        else S.liveValue = S.start;
    }
}
function $a05669264f67e39b$export$d3ae10d3b2070029(stateMap) {
    const wraps = document.querySelectorAll(".orthography-wrap");
    wraps.forEach((wrap)=>{
        const uid = (0, $2f96dbadf81a4e19$export$8ef5ec77fcb82f69)(wrap);
        if (!uid) return;
        const S = $a05669264f67e39b$export$b637efaa3fcc9599(stateMap, uid);
        wrap.dataset.orthoUid = uid;
        if (!S.cfg) {
            S.cfg = {
                uid: uid
            };
            S.gate = (0, $faefaad95e5fcca0$export$fab1ce0fa1765516)(wrap.dataset.orthoGate);
        }
        $a05669264f67e39b$export$7ff8ace17f87623e(stateMap, uid);
    });
}


/**
 * Sync logic: input value management, reset/resolve state, and scheduled sync scheduling.
 */ 


function $f322f17f239b2b8e$export$d395e3b20a2c5108(uid, cfg, value) {
    const N = (0, $2f96dbadf81a4e19$export$d668e62f6e0051f4)(uid, cfg);
    if (!N.input) return;
    N.input.value = value;
    N.input.defaultValue = value;
    try {
        N.input.setAttribute("value", value);
    } catch (e) {}
}
function $f322f17f239b2b8e$export$8506aef7b04f3a79(stateMap, uid) {
    const S = (0, $a05669264f67e39b$export$b637efaa3fcc9599)(stateMap, uid);
    const B = (0, $2f96dbadf81a4e19$export$20fbbf30e1f4ce8a)(uid, S.cfg);
    const quiz = B?.quiz;
    if (!quiz) return;
    if (!S.solved) S.solved = quiz.classList.contains("solved") || quiz.classList.contains("resolved");
}
function $f322f17f239b2b8e$export$1ab7fa8d75d027ec(stateMap, uid) {
    const S = (0, $a05669264f67e39b$export$b637efaa3fcc9599)(stateMap, uid);
    const N = (0, $2f96dbadf81a4e19$export$d668e62f6e0051f4)(uid, S.cfg);
    if (!N.input) return;
    const desired = S.solved ? S.solution : S.liveValue == null ? S.start : S.liveValue;
    const current = N.input.value;
    N.input.readOnly = !!S.solved;
    if ((0, $faefaad95e5fcca0$export$1991ecd29cc92c6b)(current) !== (0, $faefaad95e5fcca0$export$1991ecd29cc92c6b)(desired)) $f322f17f239b2b8e$export$d395e3b20a2c5108(uid, S.cfg, desired);
}
function $f322f17f239b2b8e$export$eecd29dc1a4e8610(stateMap, uid) {
    const S = (0, $a05669264f67e39b$export$b637efaa3fcc9599)(stateMap, uid);
    const N = (0, $2f96dbadf81a4e19$export$d668e62f6e0051f4)(uid, S.cfg);
    if (!N.wrap || !N.input || !N.reset) return;
    N.wrap.dataset.orthoUid = uid;
    N.wrap.dataset.orthoSolved = S.solved ? "1" : "0";
    N.reset.dataset.orthoUid = uid;
    N.reset.classList.add("ortho-reset-below");
    if (N.reset.parentElement !== N.wrap || N.reset.previousElementSibling !== N.input) N.input.insertAdjacentElement("afterend", N.reset);
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
function $f322f17f239b2b8e$export$c78cb1561c965c1c(stateMap, uid) {
    const S = (0, $a05669264f67e39b$export$b637efaa3fcc9599)(stateMap, uid);
    const B = (0, $2f96dbadf81a4e19$export$20fbbf30e1f4ce8a)(uid, S.cfg);
    if (!B || !B.resolve) return;
    const resolve = B.resolve;
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
function $f322f17f239b2b8e$export$10c851eaeed5d679(stateMap, uid) {
    const S = (0, $a05669264f67e39b$export$b637efaa3fcc9599)(stateMap, uid);
    (0, $a05669264f67e39b$export$7ff8ace17f87623e)(stateMap, uid);
    $f322f17f239b2b8e$export$8506aef7b04f3a79(stateMap, uid);
    $f322f17f239b2b8e$export$eecd29dc1a4e8610(stateMap, uid);
    (0, $2f96dbadf81a4e19$export$20fbbf30e1f4ce8a)(uid, S.cfg);
    $f322f17f239b2b8e$export$c78cb1561c965c1c(stateMap, uid);
    $f322f17f239b2b8e$export$1ab7fa8d75d027ec(stateMap, uid);
    const N = (0, $2f96dbadf81a4e19$export$d668e62f6e0051f4)(uid, S.cfg);
    if (N.wrap) {
        N.wrap.dataset.orthoTries = String(S.tries);
        N.wrap.dataset.orthoSolved = S.solved ? "1" : "0";
    }
}
function $f322f17f239b2b8e$export$d1e86e2cf4ed4afc(stateMap) {
    (0, $a05669264f67e39b$export$d3ae10d3b2070029)(stateMap);
    Object.keys(stateMap).forEach((uid)=>{
        try {
            $f322f17f239b2b8e$export$10c851eaeed5d679(stateMap, uid);
        } catch (e) {}
    });
}
function $f322f17f239b2b8e$export$702081a5d9f33ebc(stateMap, flags) {
    if (flags.syncScheduled) return;
    flags.syncScheduled = true;
    const run = ()=>{
        flags.syncScheduled = false;
        $f322f17f239b2b8e$export$d1e86e2cf4ed4afc(stateMap);
    };
    try {
        requestAnimationFrame(run);
    } catch (e) {
        setTimeout(run, 16);
    }
    clearTimeout(flags.lateSyncTimer ?? undefined);
    flags.lateSyncTimer = window.setTimeout(()=>$f322f17f239b2b8e$export$d1e86e2cf4ed4afc(stateMap), 90);
}


/**
 * Global event handlers: input, reset, check, and resolve interactions.
 */ 



function $a541277566782c5f$var$getUidFromOrthographyInput(node) {
    const direct = node.closest("[data-ortho-uid]");
    if (direct && direct.dataset && direct.dataset.orthoUid) return String(direct.dataset.orthoUid);
    const input = node.closest('[id^="orthography-input-"], [data-id^="lia-quiz-"]');
    if (input) {
        if (input.id) {
            const byId = (0, $faefaad95e5fcca0$export$51f7daf7ba0f1187)(input.id, "orthography-input-");
            if (byId) return byId;
        }
        const dataId = input.getAttribute("data-id");
        if (dataId) {
            const byData = (0, $faefaad95e5fcca0$export$51f7daf7ba0f1187)(dataId, "lia-quiz-");
            if (byData) return byData;
        }
    }
    return "";
}
function $a541277566782c5f$var$getUidFromReset(node) {
    const direct = node.closest("[data-ortho-uid]");
    if (direct && direct.dataset && direct.dataset.orthoUid) return String(direct.dataset.orthoUid);
    if (node.id) {
        const uid = (0, $faefaad95e5fcca0$export$51f7daf7ba0f1187)(node.id, "orthography-reset-");
        if (uid) return uid;
    }
    return "";
}
function $a541277566782c5f$var$getUidFromOrthographyControl(node) {
    const direct = node.closest("[data-ortho-uid]");
    if (direct && direct.dataset && direct.dataset.orthoUid) return String(direct.dataset.orthoUid);
    const control = node.closest(".lia-quiz__control");
    if (control && control.dataset && control.dataset.orthoUid) return String(control.dataset.orthoUid);
    const quiz = node.closest(".lia-quiz");
    if (quiz && quiz.dataset && quiz.dataset.orthoUid) return String(quiz.dataset.orthoUid);
    return "";
}
function $a541277566782c5f$var$handleInput(stateMap, uid) {
    const S = (0, $a05669264f67e39b$export$b637efaa3fcc9599)(stateMap, uid);
    if (S.solved) return;
    const N = (0, $2f96dbadf81a4e19$export$d668e62f6e0051f4)(uid, S.cfg);
    if (!N.input) return;
    S.liveValue = N.input.value;
}
function $a541277566782c5f$var$handleReset(stateMap, uid, ev) {
    const S = (0, $a05669264f67e39b$export$b637efaa3fcc9599)(stateMap, uid);
    if (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    }
    if (S.solved) return;
    S.liveValue = S.start;
    (0, $f322f17f239b2b8e$export$d395e3b20a2c5108)(uid, S.cfg, S.start);
}
function $a541277566782c5f$var$finishCheck(stateMap, flags, uid, token, beforeValue, wasCorrect) {
    const S = (0, $a05669264f67e39b$export$b637efaa3fcc9599)(stateMap, uid);
    if (token !== S.checkToken) return;
    if (!S.solved && S.gate.mode === "attempts") S.tries += 1;
    if (wasCorrect) {
        S.solved = true;
        S.liveValue = S.solution;
    } else S.liveValue = beforeValue;
    (0, $f322f17f239b2b8e$export$10c851eaeed5d679)(stateMap, uid);
    (0, $f322f17f239b2b8e$export$702081a5d9f33ebc)(stateMap, flags);
}
function $a541277566782c5f$var$handleCheck(stateMap, flags, uid, ev) {
    const S = (0, $a05669264f67e39b$export$b637efaa3fcc9599)(stateMap, uid);
    if (S.solved) {
        if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        }
        return;
    }
    const N = (0, $2f96dbadf81a4e19$export$d668e62f6e0051f4)(uid, S.cfg);
    if (!N.input) return;
    const beforeValue = N.input.value;
    const wasCorrect = (0, $faefaad95e5fcca0$export$1991ecd29cc92c6b)(beforeValue) === (0, $faefaad95e5fcca0$export$1991ecd29cc92c6b)(S.solution);
    const token = ++S.checkToken;
    setTimeout(()=>$a541277566782c5f$var$finishCheck(stateMap, flags, uid, token, beforeValue, wasCorrect), 0);
}
function $a541277566782c5f$var$handleResolve(stateMap, flags, uid, ev) {
    const S = (0, $a05669264f67e39b$export$b637efaa3fcc9599)(stateMap, uid);
    if (S.solved || S.resolvePending) {
        if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        }
        return;
    }
    S.resolvePending = true;
    setTimeout(()=>{
        S.resolvePending = false;
        S.solved = true;
        S.liveValue = S.solution;
        (0, $f322f17f239b2b8e$export$10c851eaeed5d679)(stateMap, uid);
        (0, $f322f17f239b2b8e$export$702081a5d9f33ebc)(stateMap, flags);
    }, 0);
}
function $a541277566782c5f$export$2baef26cee7194d4(stateMap, flags, observer) {
    if (flags.started) return;
    flags.started = true;
    (0, $2f96dbadf81a4e19$export$b9324dd3ed41badd)(flags.styleInstalled);
    document.addEventListener("input", (ev)=>{
        const target = ev.target;
        if (!(target instanceof Element)) return;
        const uid = $a541277566782c5f$var$getUidFromOrthographyInput(target);
        if (!uid) return;
        $a541277566782c5f$var$handleInput(stateMap, uid);
    }, true);
    document.addEventListener("change", (ev)=>{
        const target = ev.target;
        if (!(target instanceof Element)) return;
        const uid = $a541277566782c5f$var$getUidFromOrthographyInput(target);
        if (!uid) return;
        $a541277566782c5f$var$handleInput(stateMap, uid);
    }, true);
    document.addEventListener("keydown", (ev)=>{
        if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight" && ev.key !== "ArrowUp" && ev.key !== "ArrowDown") return;
        const target = ev.target;
        if (!(target instanceof Element)) return;
        const uid = $a541277566782c5f$var$getUidFromOrthographyInput(target);
        if (!uid) return;
        ev.stopPropagation();
        if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    }, true);
    document.addEventListener("keyup", (ev)=>{
        if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight" && ev.key !== "ArrowUp" && ev.key !== "ArrowDown") return;
        const target = ev.target;
        if (!(target instanceof Element)) return;
        const uid = $a541277566782c5f$var$getUidFromOrthographyInput(target);
        if (!uid) return;
        ev.stopPropagation();
        if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    }, true);
    document.addEventListener("click", (ev)=>{
        const target = ev.target;
        if (!(target instanceof Element)) return;
        const reset = target.closest(".ortho-reset-below, [id^='orthography-reset-']");
        if (reset) {
            const uid = $a541277566782c5f$var$getUidFromReset(reset);
            if (uid) $a541277566782c5f$var$handleReset(stateMap, uid, ev);
            return;
        }
        const check = target.closest(".lia-quiz__check");
        if (check) {
            const uid = $a541277566782c5f$var$getUidFromOrthographyControl(check);
            if (uid) $a541277566782c5f$var$handleCheck(stateMap, flags, uid, ev);
            return;
        }
        const resolve = target.closest(".lia-quiz__resolve");
        if (resolve) {
            const uid = $a541277566782c5f$var$getUidFromOrthographyControl(resolve);
            if (uid) $a541277566782c5f$var$handleResolve(stateMap, flags, uid, ev);
        }
    }, true);
    const startObserver = ()=>{
        if (observer.ref) return;
        const target = document.body || document.documentElement;
        if (!target) return;
        observer.ref = new MutationObserver(()=>{
            (0, $f322f17f239b2b8e$export$702081a5d9f33ebc)(stateMap, flags);
        });
        observer.ref.observe(target, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: [
                "class",
                "aria-hidden",
                "tabindex"
            ]
        });
    };
    startObserver();
    setTimeout(startObserver, 0);
    (0, $f322f17f239b2b8e$export$d1e86e2cf4ed4afc)(stateMap);
    setTimeout(()=>(0, $f322f17f239b2b8e$export$d1e86e2cf4ed4afc)(stateMap), 0);
    setTimeout(()=>(0, $f322f17f239b2b8e$export$d1e86e2cf4ed4afc)(stateMap), 120);
    setTimeout(()=>(0, $f322f17f239b2b8e$export$d1e86e2cf4ed4afc)(stateMap), 260);
}


class $882b6d93070905b3$var$OrthographyModule {
    register(cfg) {
        const uid = String(cfg && cfg.uid || "").trim();
        if (!uid) return;
        const S = (0, $a05669264f67e39b$export$b637efaa3fcc9599)(this.state, uid);
        S.cfg = cfg || null;
        S.gate = (0, $faefaad95e5fcca0$export$fab1ce0fa1765516)(cfg && cfg.gateRaw);
        if (cfg && typeof cfg.startText === "string") S.start = cfg.startText;
        if (cfg && typeof cfg.solutionText === "string") S.solution = cfg.solutionText;
        (0, $a05669264f67e39b$export$7ff8ace17f87623e)(this.state, uid);
        (0, $f322f17f239b2b8e$export$10c851eaeed5d679)(this.state, uid);
        (0, $f322f17f239b2b8e$export$702081a5d9f33ebc)(this.state, this.flags);
    }
    startGlobal() {
        (0, $a541277566782c5f$export$2baef26cee7194d4)(this.state, this.flags, this.observer);
    }
    getAllStates() {
        return this.state;
    }
    setState(uid, value) {
        const S = (0, $a05669264f67e39b$export$b637efaa3fcc9599)(this.state, uid);
        S.liveValue = value;
        (0, $f322f17f239b2b8e$export$d395e3b20a2c5108)(uid, S.cfg, value);
        (0, $f322f17f239b2b8e$export$10c851eaeed5d679)(this.state, uid);
    }
    constructor(){
        this.state = {};
        this.observer = {
            ref: null
        };
        this.flags = {
            started: false,
            styleInstalled: {
                done: false
            },
            syncScheduled: false,
            lateSyncTimer: null
        };
    }
}
const $882b6d93070905b3$var$ROOT = (0, $faefaad95e5fcca0$export$58e4a8be3070ab87)();
const $882b6d93070905b3$var$KEY = "__ORTHOGRAPHY_EXPORT_V8__";
if (!$882b6d93070905b3$var$ROOT[$882b6d93070905b3$var$KEY]) {
    const MOD = new $882b6d93070905b3$var$OrthographyModule();
    $882b6d93070905b3$var$ROOT[$882b6d93070905b3$var$KEY] = MOD;
    MOD.startGlobal();
}


//# sourceMappingURL=index.js.map
