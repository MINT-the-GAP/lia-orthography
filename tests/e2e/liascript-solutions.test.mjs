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

\`\`\`markdown @linenumbers
A **short** first authored line.
This deliberately long second authored line contains a [sample link](https://example.com/line) and enough additional words to wrap several times in a narrow reading area without ever receiving a second line number.

A final fourth authored line.
\`\`\`

Anna ging in einen @diktat(Zoo). Dort konnte sie auf einem @diktat(Lama) reiten.
**************
<span id="diktat-musterloesung">Diktat-Musterlösung</span>
**************

@orthography(\`<!-- data-solution-button="4" doublespacehelp="on" -->\`,\`Hallo mein Name ist Martinn.\`,\`Hallo, mein Name ist Martin.\`)
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
  await page.waitForSelector("ol.ortho-lines", {
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

async function assertLineNumbers(page) {
  const list = page.locator("ol.ortho-lines").first();
  const rows = list.locator(":scope > li");

  assert.equal(await list.getAttribute("data-authored-lines"), "4");
  assert.equal(await rows.count(), 4);
  assert.deepEqual(
    await rows.evaluateAll((items) => items.map((item) => item.value)),
    [1, 2, 3, 4],
  );
  assert.equal(await rows.nth(0).locator("strong").textContent(), "short");
  assert.equal(
    await rows.nth(1).locator('a[href="https://example.com/line"]').textContent(),
    "sample link",
  );
  assert.equal((await rows.nth(2).innerText()).trim(), "");
  assert.equal(await rows.nth(2).locator("br").count(), 1);
  assert.equal(await list.locator("pre, code").count(), 0);

  const markerStyles = await rows.evaluateAll((items) =>
    items.map((item) => {
      const style = getComputedStyle(item);
      return {
        display: style.display,
        listStyleType: style.listStyleType,
      };
    }),
  );
  assert.ok(markerStyles.every(({ display }) => display === "list-item"));
  assert.ok(markerStyles.every(({ listStyleType }) => listStyleType !== "none"));

  await list.evaluate((element) => {
    element.style.inlineSize = "240px";
    element.style.maxInlineSize = "240px";
  });
  const visualLines = await rows.nth(1).evaluate((row) => {
    const range = document.createRange();
    range.selectNodeContents(row);
    const tops = Array.from(range.getClientRects())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => Math.round(rect.top));
    return new Set(tops).size;
  });
  assert.ok(visualLines > 1, "the long author line wraps visually");
  assert.equal(await rows.count(), 4, "visual wrapping adds no list item");
}

async function assertPluginObserverSettles(page) {
  await page.waitForTimeout(150);
  const mutationCount = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let count = 0;
        const observer = new MutationObserver((records) => {
          for (const record of records) {
            const target = record.target;
            if (
              target instanceof Element &&
              target.matches(".ortho-reset-below, .lia-quiz__resolve")
            ) {
              count += 1;
            }
          }
        });
        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ["class", "aria-hidden", "tabindex"],
          subtree: true,
        });
        setTimeout(() => {
          observer.disconnect();
          resolve(count);
        }, 450);
      }),
  );

  assert.ok(
    mutationCount <= 6,
    `orthography observer did not settle (${mutationCount} mutations)`,
  );
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
    await assertLineNumbers(page);
    await assertPluginObserverSettles(page);
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

    const orthographyInput = page.locator('[id^="orthography-input-"]');
    const orthographyUid = await orthographyInput.getAttribute("data-ortho-uid");
    assert.ok(orthographyUid);

    await orthographyInput.fill("Hallo,mein Name ist Martin.");
    await quizzes.orthography.locator(".lia-quiz__check").click();
    await page.waitForFunction(
      (uid) => window.__ORTHOGRAPHY_EXPORT_V8__?.getAllStates?.()[uid]?.tries >= 1,
      orthographyUid,
    );
    assert.equal(await isVisible(page, "#orthography-musterloesung"), false);
    assert.equal(
      await quizzes.orthography.evaluate((quiz) => quiz.classList.contains("solved")),
      false,
    );

    await orthographyInput.fill("   Hallo,   mein  Name  ist Martin.  ");
    await quizzes.orthography.locator(".lia-quiz__check").click();
    await page.locator("#orthography-musterloesung").waitFor({ state: "visible" });
    await page.waitForFunction(() =>
      document.querySelector('.lia-quiz[data-ortho-uid]')?.classList.contains("solved"),
    );
    assert.equal(await orthographyInput.inputValue(), "Hallo, mein Name ist Martin.");
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

async function navigateRunnableTemplate(browser) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const failures = [];
  const pageErrors = [];
  let crashed = false;

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
  const candidateUrls = new Set([TEMPLATE_URL, BUNDLE_URL]);
  page.on("crash", () => {
    crashed = true;
  });
  page.on("pageerror", (error) => pageErrors.push(error.stack ?? error.message));
  page.on("requestfailed", (request) => {
    if (candidateUrls.has(request.url())) {
      failures.push(`${request.url()}: ${request.failure()?.errorText ?? "failed"}`);
    }
  });

  try {
    await page.goto(`${LIASCRIPT_URL}?${TEMPLATE_URL}#1`, {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await page.waitForFunction(
      () => window.__ORTHOGRAPHY_EXPORT_V8__?.getAllStates instanceof Function,
      undefined,
      { timeout: 60_000 },
    );

    const implementationLink = page
      .locator(".lia-toc__link")
      .filter({ hasText: "Implementation" })
      .first();
    const targetHash = await implementationLink.getAttribute("href");
    assert.ok(targetHash);
    await implementationLink.click({ timeout: 15_000 });
    await page.waitForFunction(
      (hash) => location.hash === hash,
      targetHash,
      { timeout: 15_000 },
    );
    await page
      .getByText("If you prefer not to use", { exact: false })
      .waitFor({ state: "visible", timeout: 15_000 });
    await page.waitForTimeout(500);

    assert.equal(crashed, false);
    assert.deepEqual(failures, [], failures.join("\n"));
    assert.deepEqual(pageErrors, [], pageErrors.join("\n\n"));
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
        if (name === "Firefox") {
          await navigateRunnableTemplate(browser);
        }
        await solveBoth(browser);
        await resolveBoth(browser);
      } finally {
        await browser.close();
      }
    },
  );
}
