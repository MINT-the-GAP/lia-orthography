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

test("README contains both requested detailed-solution examples", () => {
  const solution = "**************\nMusterlösungstext\n**************";
  const examples = [
    "Anna ging in einen @diktat(Zoo). Dort konnte sie auf einem @diktat(Lama) reiten.",
    '@orthography(`<!-- data-solution-button="4" -->`,`Es ist jetze um sechse.`,`Es ist jetzt um sechs.`)',
  ];

  examples.forEach((example) => assert.ok(readme.includes(`${example}\n\n${solution}`)));
});
