import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { chromium, firefox, webkit } from "playwright";

const LIASCRIPT_URL =
  process.env.LIASCRIPT_STABLE_URL ?? "https://liascript.github.io/course/";
const ONLINE_TEMPLATE_URL = process.env.LIASCRIPT_TEMPLATE_URL?.trim();
const TEMPLATE_URL =
  ONLINE_TEMPLATE_URL ||
  "https://raw.githubusercontent.com/MINT-the-GAP/lia-orthography/__local_candidate__/README.md";
const BUNDLE_URL = new URL("./dist/index.js", TEMPLATE_URL).href;
const COURSE_URL = "https://lia-orthography.invalid/solution-blocks.md";

const [template, bundle] = await Promise.all([
  readFile(new URL("../../README.md", import.meta.url), "utf8"),
  readFile(new URL("../../dist/index.js", import.meta.url), "utf8"),
]);

const COURSE = `<!--
author: lia-orthography browser regression
version: 1.0.0
language: de
import: ${TEMPLATE_URL}
-->

# Musterlösungsblöcke

Anna ging in einen @diktat(Zoo). Dort konnte sie auf einem @diktat(Lama) reiten.
**************
<span id="diktat-musterloesung">Diktat-Musterlösung</span>
**************

@orthography(\`<!-- data-solution-button="4" -->\`,\`Es ist jetze um sechse.\`,\`Es ist jetzt um sechs.\`)
**************
<span id="orthography-musterloesung">Orthography-Musterlösung</span>
**************
`;

const ENGINES = [
  ["Chromium", chromium],
  ["Firefox", firefox],
  ["WebKit", webkit],
];

async function openCourse(browser) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const failures = [];
  const pageErrors = [];
  const statuses = new Map();

  await context.route(COURSE_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/plain; charset=utf-8",
      headers: { "access-control-allow-origin": "*" },
      body: COURSE,
    }),
  );

  if (!ONLINE_TEMPLATE_URL) {
    await context.route(TEMPLATE_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/plain; charset=utf-8",
        headers: { "access-control-allow-origin": "*" },
        body: template,
      }),
    );
    await context.route(BUNDLE_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/javascript; charset=utf-8",
        headers: { "access-control-allow-origin": "*" },
        body: bundle,
      }),
    );
  }

  const page = await context.newPage();
  const candidateUrls = new Set([COURSE_URL, TEMPLATE_URL, BUNDLE_URL]);
  page.on("pageerror", (error) => pageErrors.push(error.stack ?? error.message));
  page.on("requestfailed", (request) => {
    if (candidateUrls.has(request.url())) {
      failures.push(`${request.url()}: ${request.failure()?.errorText ?? "failed"}`);
    }
  });
  page.on("response", (response) => {
    if (candidateUrls.has(response.url())) statuses.set(response.url(), response.status());
  });

  await page.goto(`${LIASCRIPT_URL}?${COURSE_URL}#1`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.waitForFunction(
    () => window.__ORTHOGRAPHY_EXPORT_V8__?.getAllStates instanceof Function,
    undefined,
    { timeout: 60_000 },
  );
  await page.waitForSelector(".lia-diktat input", { state: "visible", timeout: 60_000 });
  await page.waitForSelector('[id^="orthography-input-"]', {
    state: "visible",
    timeout: 60_000,
  });
  await page.waitForFunction(
    () => {
      const input = document.querySelector('[id^="orthography-input-"]');
      const uid = input?.getAttribute("data-ortho-uid");
      return Array.from(document.querySelectorAll(".lia-quiz")).some(
        (quiz) => quiz.getAttribute("data-ortho-uid") === uid,
      );
    },
    undefined,
    { timeout: 30_000 },
  );

  for (const url of candidateUrls) {
    assert.equal(statuses.get(url), 200, `${url} did not load successfully`);
  }

  return { context, failures, page, pageErrors };
}

function quizLocators(page) {
  return {
    diktat: page.locator(".lia-quiz:not([data-ortho-uid])").first(),
    orthography: page.locator('.lia-quiz[data-ortho-uid]').first(),
  };
}

async function isVisible(page, selector) {
  return page.locator(selector).isVisible().catch(() => false);
}

async function assertInitiallyHidden(page) {
  assert.equal(await isVisible(page, "#diktat-musterloesung"), false);
  assert.equal(await isVisible(page, "#orthography-musterloesung"), false);
}

async function assertClean({ failures, page, pageErrors }) {
  await page.waitForTimeout(300);
  assert.deepEqual(failures, [], failures.join("\n"));
  assert.deepEqual(pageErrors, [], pageErrors.join("\n\n"));
}

async function solveBoth(browser) {
  const session = await openCourse(browser);
  const { context, page } = session;

  try {
    await assertInitiallyHidden(page);
    const quizzes = quizLocators(page);
    const diktatInputs = page.locator(".lia-diktat input");
    assert.equal(await diktatInputs.count(), 2);
    await diktatInputs.nth(0).fill("Zoo");
    await diktatInputs.nth(1).fill("Lama");
    await quizzes.diktat.locator(".lia-quiz__check").click();
    await page.locator("#diktat-musterloesung").waitFor({ state: "visible" });
    await page.waitForFunction(
      () =>
        document
          .querySelector(".lia-quiz:not([data-ortho-uid])")
          ?.classList.contains("solved"),
    );

    await page.locator('[id^="orthography-input-"]').fill("Es ist jetzt um sechs.");
    await quizzes.orthography.locator(".lia-quiz__check").click();
    await page.locator("#orthography-musterloesung").waitFor({ state: "visible" });
    await page.waitForFunction(() =>
      document.querySelector('.lia-quiz[data-ortho-uid]')?.classList.contains("solved"),
    );
    await assertClean(session);
  } finally {
    await context.close();
  }
}

async function resolveBoth(browser) {
  const session = await openCourse(browser);
  const { context, page } = session;

  try {
    await assertInitiallyHidden(page);
    const quizzes = quizLocators(page);
    await quizzes.diktat.locator(".lia-quiz__resolve").click();
    await page.locator("#diktat-musterloesung").waitFor({ state: "visible" });

    const input = page.locator('[id^="orthography-input-"]');
    const uid = await input.getAttribute("data-ortho-uid");
    assert.ok(uid);
    const resolve = quizzes.orthography.locator(".lia-quiz__resolve");
    assert.equal(await resolve.isVisible(), false);

    for (let tries = 1; tries <= 4; tries += 1) {
      await input.fill(`Falsch ${tries}`);
      await quizzes.orthography.locator(".lia-quiz__check").click();
      try {
        await page.waitForFunction(
          ({ expected, uid }) =>
            window.__ORTHOGRAPHY_EXPORT_V8__?.getAllStates?.()[uid]?.tries >= expected,
          { expected: tries, uid },
          { timeout: 5_000 },
        );
      } catch {
        const state = await page.evaluate((uid) => ({
          requestedUid: uid,
          states: window.__ORTHOGRAPHY_EXPORT_V8__?.getAllStates?.(),
          quizzes: Array.from(document.querySelectorAll(".lia-quiz")).map((quiz) => ({
            className: quiz.className,
            uid: quiz.getAttribute("data-ortho-uid"),
            solutionButton: quiz.getAttribute("data-solution-button"),
          })),
        }), uid);
        assert.fail(`Orthography state did not reach try ${tries}: ${JSON.stringify(state)}`);
      }
      assert.equal(await isVisible(page, "#orthography-musterloesung"), false);
      if (tries < 4) assert.equal(await resolve.isVisible(), false);
    }

    await resolve.waitFor({ state: "visible" });
    assert.equal(await isVisible(page, "#orthography-musterloesung"), false);
    await resolve.click();
    await page.locator("#orthography-musterloesung").waitFor({ state: "visible" });
    await page.waitForFunction(() => {
      const quiz = document.querySelector('.lia-quiz[data-ortho-uid]');
      return quiz?.classList.contains("resolved") || quiz?.classList.contains("solved");
    });
    await assertClean(session);
  } finally {
    await context.close();
  }
}

for (const [name, browserType] of ENGINES) {
  test(
    `${name}: native detailed solutions appear only after solve or resolve`,
    { timeout: 240_000 },
    async () => {
      const browser = await browserType.launch({ headless: true });
      try {
        await solveBoth(browser);
        await resolveBoth(browser);
      } finally {
        await browser.close();
      }
    },
  );
}
