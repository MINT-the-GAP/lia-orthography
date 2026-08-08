<!--
author:   MINT-the-GAP, Martin Lommatzsch, Jihad Hyadi
version:  1.2.0
language: en
edit: true
narrator: US English Female
comment:  Orthography exercises and line-numbered reading texts.

script:   ./dist/index.js

@orthography: @orthography_(@uid,`@0`,`@1`,`@2`)

@orthography_
<div id="orthography-ui-@0" class="orthography-ui" data-ortho-uid="@0">
  <div id="orthography-task-@0" class="orthography-task">
    <div class="orthography-wrap" id="orthography-wrap-@0" data-ortho-uid="@0">
      <span id="orthography-start-@0" style="display:none">@2</span>
      <span id="orthography-solution-@0" style="display:none">@3</span>

      <input id="orthography-input-@0" data-ortho-uid="@0" data-id="lia-quiz-@0" class="lia-input lia-quiz__input" style="margin-bottom:.5rem" value="@2">

      <button type="button" class="lia-btn lia-btn--outline ortho-reset-inline" id="orthography-reset-@0" data-ortho-uid="@0">Reset</button>
    </div>
  </div>

  <div id="orthography-check-@0" class="orthography-check" data-ortho-uid="@0" style="display:none"></div>
</div>

@1
[[!]]
<script modify="false">
(function(){
  const el  = document.getElementById("orthography-input-@0");
  const sol = document.getElementById("orthography-solution-@0");
  if(!el || !sol) return false;

  const doubleSpaceHelp = /\bdoublespacehelp\b\s*=\s*["']?(?:on|true|1|yes)(?=["'\s>]|$)/i.test("@'1");
  const norm = s => {
    const value = String(s || "").normalize("NFKC").replace(/[\u201E\u201C\u201D\u201F\u00AB\u00BB\u2039\u203A\u0022]/g, '"').replace(/[\u201A\u2018\u2019\u201B]/g, "'").replace(/\u00A0/g, " ").toLocaleLowerCase();
    return doubleSpaceHelp ? value.trim().replace(/\s+/g, " ") : value;
  };
  return norm(el.value) === norm(sol.textContent);
})()
</script>
@end

@orthographytext: @orthographytext_(@uid,`@0`,`@1`,`@2`)

@orthographytext_
<div id="orthographytext-ui-@0" class="orthography-ui" data-ortho-uid="@0">
  <div id="orthographytext-task-@0" class="orthography-task">
    <div class="orthography-wrap" id="orthographytext-wrap-@0" data-ortho-uid="@0">
      <span id="orthographytext-start-@0" style="display:none">@2</span>
      <span id="orthographytext-solution-@0" style="display:none">@3</span>

      <textarea id="orthographytext-input-@0" data-ortho-uid="@0" data-id="lia-quiz-@0" class="lia-input lia-quiz__input" style="margin-bottom:.5rem; resize:vertical" rows="4">@2</textarea>

      <button type="button" class="lia-btn lia-btn--outline ortho-reset-inline" id="orthographytext-reset-@0" data-ortho-uid="@0">Reset</button>
    </div>
  </div>

  <div id="orthographytext-check-@0" class="orthography-check" data-ortho-uid="@0" style="display:none"></div>
</div>

@1
[[!]]
<script modify="false">
(function(){
  const el  = document.getElementById("orthographytext-input-@0");
  const sol = document.getElementById("orthographytext-solution-@0");
  if(!el || !sol) return false;

  const doubleSpaceHelp = /\bdoublespacehelp\b\s*=\s*["']?(?:on|true|1|yes)(?=["'\s>]|$)/i.test("@'1");
  const norm = s => {
    const value = String(s || "").normalize("NFKC").replace(/[\u201E\u201C\u201D\u201F\u00AB\u00BB\u2039\u203A\u0022]/g, '"').replace(/[\u201A\u2018\u2019\u201B]/g, "'").replace(/\u00A0/g, " ").toLocaleLowerCase();
    return doubleSpaceHelp ? value.trim().replace(/\s+/g, " ") : value;
  };
  return norm(el.value) === norm(sol.textContent);
})()
</script>
@end

@linenumbers
<script run-once="true" modify="false" style="display:block; width:100%">
(function(){
  const source = `@'0`
    .replace(/[\u2028\u2029]/gu, "\n")
    .replace(/\r\n?/gu, "\n")
    .replace(/\n$/u, "");
  const lines = source.split("\n");
  const numbered = lines
    .map((line, index) => `${index + 1}. ${line || "<br>"}`)
    .join("\n");

  return `LIASCRIPT:
<!-- class="ortho-lines" data-authored-lines="${lines.length}" -->
${numbered}`;
})()
</script>
@end

@diktat: @diktat_(@uid,@0)

@diktat_
<span class="lia-diktat" id="lia-diktat-@0">{|>}{<span class="lia-diktat-measure" style="position:absolute;left:-10000px;top:auto;width:auto;height:auto;overflow:hidden;white-space:pre;">@1</span>}[[ @1 ]]</span>
@end

-->

# LiaScript Orthography Plugin

          --{{0}}--
This plugin provides interactive orthography and dictation exercises. Students correct text in an input field and can optionally reveal the solution after a configurable number of attempts.

__Try it on LiaScript:__
https://liascript.github.io/course/?https://raw.githubusercontent.com/MINT-the-GAP/lia-orthography/main/README.md

__See the project on GitHub:__
https://github.com/MINT-the-GAP/lia-orthography

           {{1}}
1. Load the plugin via

   `import: https://raw.githubusercontent.com/MINT-the-GAP/lia-orthography/main/README.md`

   or pin to a specific version:

   `import: https://raw.githubusercontent.com/MINT-the-GAP/lia-orthography/0.0.1/README.md`

2. Use `@orthography`, `@orthographytext`, `@linenumbers`, or `@diktat` in your document (see examples below)

3. Clone this repository on GitHub

## `@orthography`

          --{{0}}--
Creates an orthography exercise where students correct spelling or punctuation. The first parameter controls when the resolve button appears.

**Parameters:**
- `@0` — LiaScript comment options for the quiz block, e.g. `<!-- data-solution-button="2" -->`
- `@1` — Initial text (may contain errors)
- `@2` — Correct solution

Add `doublespacehelp="on"` to `@0` to trim surrounding whitespace and collapse every whitespace run to one space before grading. Without it, whitespace remains significant.

A native LiaScript detailed-solution block can follow the macro call. It stays hidden until the quiz is solved or resolved.

``` markdown
@orthography(`<!-- data-solution-button="2" doublespacehelp="on" -->`,`Es ist jetze um sechse.`,`Es ist jetzt um sechs.`)
```

With that option, `   Hallo,   mein  Name  ist Martin.  ` is accepted for the solution `Hallo, mein Name ist Martin.`. Missing word spaces remain errors.

---

@orthography(`<!-- data-solution-button="2" doublespacehelp="on" -->`,`Es ist jetze um sechse.`,`Es ist jetzt um sechs.`)

## `@orthographytext`

          --{{0}}--
Creates a multiline orthography exercise with a textarea. The first parameter controls when the resolve button appears.

**Parameters:**
- `@0` — LiaScript comment options for the quiz block, e.g. `<!-- data-solution-button="2" -->`
- `@1` — Initial text (may contain errors)
- `@2` — Correct solution

The optional `doublespacehelp="on"` attribute uses the same whitespace normalization as `@orthography`, including for pasted tabs or line breaks.

``` markdown
@orthographytext(`<!-- data-solution-button="2" -->`,`A student could read This text, copy parts of it, or correct small spelling mistakes inside it. The important point is that the text is long enough to wrap naturally and still remain clear, readable, and useful for a simple classroom exercise.`,`A student could read this text, copy parts of it, or correct small spelling mistakes inside it. The important point is that the text is long enough to wrap naturally and still remain clear, readable, and useful for a simple classroom exercise.`)
```

---

@orthographytext(`<!-- data-solution-button="2" -->`,`A student could read This text, copy parts of it, or correct small spelling mistakes inside it. The important point is that the text is long enough to wrap naturally and still remain clear, readable, and useful for a simple classroom exercise.`,`A student could read this text, copy parts of it, or correct small spelling mistakes inside it. The important point is that the text is long enough to wrap naturally and still remain clear, readable, and useful for a simple classroom exercise.`)

## `@linenumbers`

          --{{0}}--
Displays ordinary inline LiaScript text with one line number for every physical line written by the author. A long line may wrap visually on a narrow screen, but all of its wrapped text keeps the same number. Intentionally empty lines are preserved and numbered as well.

Use a fenced block so that LiaScript passes the authored line breaks to the macro:

```` markdown
```markdown @linenumbers
The **first** authored line.
A deliberately long second line can wrap automatically without receiving another number.
The third line contains a [link](https://example.org).
```
````

Inline LiaScript such as emphasis, links, formulas, and inline HTML is rendered normally. Multiline block structures such as tables, nested lists, or additional fenced blocks are outside this environment's scope because each physical source line is deliberately treated as a separate numbered line.

---

```markdown @linenumbers
The **first** authored line.
A deliberately long second line can wrap automatically without receiving another number.
The third line contains a [link](https://example.org).
```

## `@diktat`

          --{{0}}--
Creates a dictation gap where the word is read aloud by the narrator and students type the correct spelling.

**Parameters:**
- `@0` — The word or phrase to dictate

All `@diktat` gaps in one paragraph form one LiaScript multi-quiz. A native detailed-solution block placed directly after that paragraph belongs to the complete dictation and stays hidden until it is solved or resolved.

``` markdown
Anna went to the @diktat(zoo). There she could ride on a @diktat(lama).
```

---

Anna went to the  @diktat(zoo). There she could ride on a @diktat(lama).

## Examples

          --{{0}}--
The following exercises combine dictation and orthography in a realistic classroom scenario.

**Example 1:** Listen to the sentence and write it correctly into the input field.


@diktat(Anna sitzt auf einem fliegenden Teppich.)



--- 


**Example 2:** Listen to the words that fill the gaps and write them into the gaps.

Anna ging in einen @diktat(Zoo). Dort konnte sie auf einem @diktat(Lama) reiten.

**************
Musterlösungstext
**************

--- 


**Example 3:** Place the comma in the correct position. (Resolve button is disabled.)

@orthography(`<!-- data-solution-button="false" -->`,`Das ist der Tag an dem ich geblitzt wurde.`,`Das ist der Tag, an dem ich geblitzt wurde.`)


--- 


**Example 4:** Add the punctuation to form correct direct speech. (Resolve unlocks after 2 attempts.)

@orthography(`<!-- data-solution-button="2" -->`,`Der Apfel ist rot sagte Ben`,`„Der Apfel ist rot“, sagte Ben.`)

--- 


**Example 5:** Correct the spelling mistakes in the sentence.

@orthography(`<!-- data-solution-button="4" doublespacehelp="on" -->`,`Es ist jetze um sechse.`,`Es ist jetzt um sechs.`)

**************
Musterlösungstext
**************

---

**Example 6:** Correct the longer text in the textarea.

@orthographytext(`<!-- data-solution-button="4" -->`,`This ist a deliberately long English text for testing a spelling quiz. Its main purpose is to continue over several lines, so that the quiz can show whether longer text passages are displayed correctly. A student could read this text, copy parts of it, or correct small spelling mistakes inside it. The important point is that the text is long enough to wrap naturally and still remain clear, readable, and useful for a simple classroom exercise.`,`This is a deliberately long English text for testing a spelling quiz. Its main purpose is to continue over several lines, so that the quiz can show whether longer text passages are displayed correctly. A student could read this text, copy parts of it, or correct small spelling mistakes inside it. The important point is that the text is long enough to wrap naturally and still remain clear, readable, and useful for a simple classroom exercise.`)

## Implementation

          --{{0}}--
If you prefer not to use `import:`, copy the following block directly into the header of your LiaScript document.

``` markdown
script:   https://cdn.jsdelivr.net/gh/MINT-the-GAP/lia-orthography@0.0.1/dist/index.js

@orthography: @orthography_(@uid,`@0`,`@1`,`@2`)

@orthography_
<div id="orthography-ui-@0" class="orthography-ui" data-ortho-uid="@0">
  <div id="orthography-task-@0" class="orthography-task">
    <div class="orthography-wrap" id="orthography-wrap-@0" data-ortho-uid="@0">
      <span id="orthography-start-@0" style="display:none">@2</span>
      <span id="orthography-solution-@0" style="display:none">@3</span>

      <input id="orthography-input-@0" data-ortho-uid="@0" data-id="lia-quiz-@0" class="lia-input lia-quiz__input" style="margin-bottom:.5rem" value="@2">

      <button type="button" class="lia-btn lia-btn--outline ortho-reset-inline" id="orthography-reset-@0" data-ortho-uid="@0">Reset</button>
    </div>
  </div>

  <div id="orthography-check-@0" class="orthography-check" data-ortho-uid="@0" style="display:none"></div>
</div>

@1
[[!]]
<script modify="false">
(function(){
  const el  = document.getElementById("orthography-input-@0");
  const sol = document.getElementById("orthography-solution-@0");
  if(!el || !sol) return false;

  const doubleSpaceHelp = /\bdoublespacehelp\b\s*=\s*["']?(?:on|true|1|yes)(?=["'\s>]|$)/i.test("@'1");
  const norm = s => {
    const value = String(s || "").normalize("NFKC").replace(/[\u201E\u201C\u201D\u201F\u00AB\u00BB\u2039\u203A\u0022]/g, '"').replace(/[\u201A\u2018\u2019\u201B]/g, "'").replace(/\u00A0/g, " ").toLocaleLowerCase();
    return doubleSpaceHelp ? value.trim().replace(/\s+/g, " ") : value;
  };
  return norm(el.value) === norm(sol.textContent);
})()
</script>
@end

@orthographytext: @orthographytext_(@uid,`@0`,`@1`,`@2`)

@orthographytext_
<div id="orthographytext-ui-@0" class="orthography-ui" data-ortho-uid="@0">
  <div id="orthographytext-task-@0" class="orthography-task">
    <div class="orthography-wrap" id="orthographytext-wrap-@0" data-ortho-uid="@0">
      <span id="orthographytext-start-@0" style="display:none">@2</span>
      <span id="orthographytext-solution-@0" style="display:none">@3</span>

      <textarea id="orthographytext-input-@0" data-ortho-uid="@0" data-id="lia-quiz-@0" class="lia-input lia-quiz__input" style="margin-bottom:.5rem; resize:vertical" rows="4">@2</textarea>

      <button type="button" class="lia-btn lia-btn--outline ortho-reset-inline" id="orthographytext-reset-@0" data-ortho-uid="@0">Reset</button>
    </div>
  </div>

  <div id="orthographytext-check-@0" class="orthography-check" data-ortho-uid="@0" style="display:none"></div>
</div>

@1
[[!]]
<script modify="false">
(function(){
  const el  = document.getElementById("orthographytext-input-@0");
  const sol = document.getElementById("orthographytext-solution-@0");
  if(!el || !sol) return false;

  const doubleSpaceHelp = /\bdoublespacehelp\b\s*=\s*["']?(?:on|true|1|yes)(?=["'\s>]|$)/i.test("@'1");
  const norm = s => {
    const value = String(s || "").normalize("NFKC").replace(/[\u201E\u201C\u201D\u201F\u00AB\u00BB\u2039\u203A\u0022]/g, '"').replace(/[\u201A\u2018\u2019\u201B]/g, "'").replace(/\u00A0/g, " ").toLocaleLowerCase();
    return doubleSpaceHelp ? value.trim().replace(/\s+/g, " ") : value;
  };
  return norm(el.value) === norm(sol.textContent);
})()
</script>
@end

@linenumbers
<script run-once="true" modify="false" style="display:block; width:100%">
(function(){
  const source = `@'0`
    .replace(/[\u2028\u2029]/gu, "\n")
    .replace(/\r\n?/gu, "\n")
    .replace(/\n$/u, "");
  const lines = source.split("\n");
  const numbered = lines
    .map((line, index) => `${index + 1}. ${line || "<br>"}`)
    .join("\n");

  return `LIASCRIPT:
<!-- class="ortho-lines" data-authored-lines="${lines.length}" -->
${numbered}`;
})()
</script>
@end

@diktat: @diktat_(@uid,@0)

@diktat_
<span class="lia-diktat" id="lia-diktat-@0">{|>}{<span class="lia-diktat-measure" style="position:absolute;left:-10000px;top:auto;width:auto;height:auto;overflow:hidden;white-space:pre;">@1</span>}[[ @1 ]]</span>
@end
```
