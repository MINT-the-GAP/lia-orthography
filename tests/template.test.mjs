import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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

function runValidator(body, { comment = "", input, solution }) {
  const match = body.match(/<script modify="false">\n([\s\S]*?)\n<\/script>/);
  assert.ok(match, "validator script exists");

  const uid = "whitespace-test";
  const escapedComment = JSON.stringify(comment).slice(1, -1);
  const script = match[1]
    .replaceAll("@0", uid)
    .replaceAll("@'1", escapedComment);
  const elements = new Map([
    [`orthography-input-${uid}`, { value: input }],
    [`orthography-solution-${uid}`, { textContent: solution }],
    [`orthographytext-input-${uid}`, { value: input }],
    [`orthographytext-solution-${uid}`, { textContent: solution }],
  ]);
  const document = {
    getElementById(id) {
      return elements.get(id) ?? null;
    },
  };

  return Function("document", `return ${script};`)(document);
}

test("orthography macros leave the native quiz at the expansion tail", () => {
  for (const name of ["orthography_", "orthographytext_"]) {
    const bodies = macroBodies(name);
    assert.equal(bodies.length, 2, `header and documentation copy of @${name}`);

    for (const body of bodies) {
      const quiz = body.indexOf("[[!]]");
      const lastUiClose = body.lastIndexOf("</div>");
      const validatorEnd = body.lastIndexOf("</script>");

      assert.ok(quiz >= 0, "the native quiz marker exists");
      assert.ok(lastUiClose >= 0 && lastUiClose < quiz, "the UI closes before the quiz");
      assert.ok(quiz >= 0 && quiz < validatorEnd, "the validator follows the quiz marker");
      assert.equal(body.slice(validatorEnd + "</script>".length).trim(), "");
      assert.match(body, /@1\n\[\[!\]\]\n<script modify="false">/);
      assert.match(`${body}\n**************`, /<\/script>\n\*{3,}$/);
    }
  }
});

test("dictation stays a native LiaScript gap-text quiz", () => {
  const bodies = macroBodies("diktat_");
  assert.equal(bodies.length, 2);
  bodies.forEach((body) => assert.match(body, /\[\[ @1 \]\]/));
});

test("doublespacehelp is opt-in and preserves required word spaces", () => {
  const solution = "Hallo, mein Name ist Martin.";
  const extraSpaces = "   Hallo,   mein  Name  ist Martin.  ";
  const missingSpace = "Hallo,mein Name ist Martin.";
  const enabled = '<!-- data-solution-button="2" doublespacehelp="on" -->';

  for (const name of ["orthography_", "orthographytext_"]) {
    const bodies = macroBodies(name);
    assert.equal(bodies.length, 2, `header and documentation copy of @${name}`);

    for (const body of bodies) {
      assert.equal(
        runValidator(body, { comment: enabled, input: extraSpaces, solution }),
        true,
      );
      assert.equal(
        runValidator(body, { comment: enabled, input: missingSpace, solution }),
        false,
      );
      assert.equal(
        runValidator(body, { input: extraSpaces, solution }),
        false,
      );
      assert.equal(
        runValidator(body, { input: solution, solution }),
        true,
      );
    }
  }

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

test("README contains both requested detailed-solution examples", () => {
  const solution = "**************\nMusterlösungstext\n**************";
  const examples = [
    "Anna ging in einen @diktat(Zoo). Dort konnte sie auf einem @diktat(Lama) reiten.",
    '@orthography(`<!-- data-solution-button="4" -->`,`Es ist jetze um sechse.`,`Es ist jetzt um sechs.`)',
  ];

  examples.forEach((example) => assert.ok(readme.includes(`${example}\n\n${solution}`)));
});
