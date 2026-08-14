import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { normalizeAnswer, parseDoubleSpaceHelp } from "../src/types.ts";

const readme = (await readFile(new URL("../README.md", import.meta.url), "utf8"))
  .replace(/\r\n/g, "\n");

function macroBodies(name) {
  const lines = readme.split("\n");
  const bodies = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index] !== `@${name}`) continue;

    const end = lines.indexOf("@end", index + 1);
    assert.notEqual(end, -1, `@${name} has no @end`);
    bodies.push(lines.slice(index + 1, end).join("\n"));
    index = end;
  }

  return bodies;
}

test("orthography macros leave the native quiz at the expansion tail", () => {
  for (const name of ["orthography_", "orthographytext_"]) {
    const bodies = macroBodies(name);
    assert.equal(bodies.length, 2, "header and documentation copy of @" + name);
    assert.equal(bodies[0], bodies[1], "both macro copies stay identical");

    for (const body of bodies) {
      const quiz = body.indexOf("[[orthography-check]]");
      const lastUiClose = body.lastIndexOf("</div>");

      assert.ok(quiz >= 0, "the native quiz marker exists");
      assert.ok(lastUiClose >= 0 && lastUiClose < quiz, "the UI closes before the quiz");
      assert.equal((body.match(/\[\[orthography-check\]\]/g) || []).length, 1);
      assert.match(
        body,
        /@1\n<span id="orthography-native-@0"[^\n]*>\[\[orthography-check\]\]<\/span>$/,
      );
      assert.doesNotMatch(body, /\[\[!\]\]/);
      assert.doesNotMatch(body, /<script\b/);
    }
  }
});

test("dictation stays a native LiaScript gap-text quiz", () => {
  const bodies = macroBodies("diktat_");
  assert.equal(bodies.length, 2);
  bodies.forEach((body) => assert.match(body, /\[\[ @1 \]\]/));
});

test("diktat re-quotes forwarded phrases so commas stay inside one argument", () => {
  const wrappers = readme
    .split("\n")
    .filter((line) => line.startsWith("@diktat:"));

  assert.equal(wrappers.length, 2);
  wrappers.forEach((wrapper) =>
    assert.equal(wrapper, "@diktat: @diktat_(@uid,`@0`)"),
  );
  assert.ok(readme.includes(
    "@diktat(`Mia weiß, dass zuverlässige Freundschaften gegenseitiges Vertrauen brauchen.`)",
  ));
});

test("doublespacehelp is opt-in and preserves required word spaces", () => {
  const solution = "Hallo, mein Name ist Martin.";
  const extraSpaces = "   Hallo,   mein  Name  ist Martin.  ";
  const missingSpace = "Hallo,mein Name ist Martin.";
  const enabled = '<!-- data-solution-button="2" doublespacehelp="on" -->';

  assert.equal(parseDoubleSpaceHelp(enabled), true);
  assert.equal(
    normalizeAnswer(extraSpaces, true),
    normalizeAnswer(solution, true),
  );
  assert.notEqual(
    normalizeAnswer(missingSpace, true),
    normalizeAnswer(solution, true),
  );
  assert.notEqual(
    normalizeAnswer(extraSpaces),
    normalizeAnswer(solution),
  );
  assert.equal(parseDoubleSpaceHelp(""), false);

  assert.ok(readme.includes(
    '@orthography(`<!-- data-solution-button="2" doublespacehelp="on" -->`,'
  ));
});

test("linenumbers keeps physical author lines in both template copies", () => {
  const bodies = macroBodies("linenumbers");
  assert.equal(bodies.length, 2, "header and documentation copy");
  assert.equal(bodies[0], bodies[1], "both macro copies stay identical");
  assert.equal(readme.includes("@linenumbers_"), false);

  for (const body of bodies) {
    assert.match(body, /LIASCRIPT:/);
    assert.match(body, /class="ortho-lines"/);
    assert.match(body, /data-authored-lines/);
    assert.match(body, /source\.split\("\\n"\)/);
    assert.match(body, /line \|\| "<br>"/);
    assert.ok(body.includes('.replace(/\\n$/u, "")'));
    assert.doesNotMatch(body, /\.trim\(/);
    assert.doesNotMatch(body, /\\n\+/);
  }

  assert.ok(readme.includes("```markdown @linenumbers\n"));
});

test("README contains the solution-only and exact hint-plus-solution examples", () => {
  const solution = "**************\nMusterlösungstext\n**************";
  const diktat =
    "Anna ging in einen @diktat(Zoo). Dort konnte sie auf einem @diktat(Lama) reiten.";
  const orthography =
    '@orthography(`<!-- data-solution-button="4" doublespacehelp="on" -->`,`Es ist jetze um sechse.`,`Es ist jetzt um sechs.`)';

  assert.ok(readme.includes(diktat + "\n" + solution));
  assert.ok(readme.includes(orthography + "\n[[?]] Hinweis\n" + solution));
});
