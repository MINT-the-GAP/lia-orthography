<!--
author:   MINT-the-GAP
version:  0.0.1
language: en
edit: true
narrator: US English Female
comment:  Orthography exercises with gated resolve, sticky solutions, and reset.

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

  <div id="orthography-check-@0" class="orthography-check" data-ortho-uid="@0">
    @1
    [[!]]
    <script>
    (function(){
      const el  = document.getElementById("orthography-input-@0");
      const sol = document.getElementById("orthography-solution-@0");
      if(!el || !sol) return false;

      const norm = s => String(s || "").toLocaleLowerCase().replace(/\s+/g, "");
      return norm(el.value) === norm(sol.textContent);
    })()
    </script>
  </div>
</div>

<script type="text/plain" id="orthography-comment-@0">@1</script>

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

2. Use `@orthography` or `@diktat` in your document (see examples below)

3. Clone this repository on GitHub

## `@orthography`

          --{{0}}--
Creates an orthography exercise where students correct spelling or punctuation. The first parameter controls when the resolve button appears.

**Parameters:**
- `@0` — LiaScript comment options for the quiz block, e.g. `<!-- data-solution-button="2" -->`
- `@1` — Initial text (may contain errors)
- `@2` — Correct solution

``` markdown
@orthography(`<!-- data-solution-button="2" -->`,`The apel is red`,`The apple is red.`)
```

---

@orthography(`<!-- data-solution-button="2" -->`,`The apel is red`,`The apple is red.`)

## `@diktat`

          --{{0}}--
Creates a dictation gap where the word is read aloud by the narrator and students type the correct spelling.

**Parameters:**
- `@0` — The word or phrase to dictate

``` markdown
Anna went to the @diktat(zoo). There she could ride on a @diktat(llama).
```

---

Anna went to the @diktat(zoo). There she could ride on a @diktat(llama).

## Examples

          --{{0}}--
The following exercises combine dictation and orthography in a realistic classroom scenario.

**Example 1:** Listen to the sentence and write it correctly into the input field.


{{|> Deutsch Female}}
<!-- style="position: absolute; left: -9999px;" -->
Anna sitzt auf einem fliegenden Teppich.

[[    Anna sitzt auf einem fliegenden Teppich.    ]]


--- 


**Example 2:** Listen to the words that fill the gaps and write them into the gaps.

Anna ging in einen @diktat(Zoo). Dort konnte sie auf einem @diktat(Lama) reiten.


--- 


**Example 3:** Place the comma in the correct position. (Resolve button is disabled.)

@orthography(`<!-- data-solution-button="false" -->`,`Das ist der Tag an dem ich geblitzt wurde.`,`Das ist der Tag, an dem ich geblitzt wurde.`)


--- 


**Example 4:** Add the punctuation to form correct direct speech. (Resolve unlocks after 2 attempts.)

@orthography(`<!-- data-solution-button="2" -->`,`Der Apfel ist rot sagte Ben`,`"Der Apfel ist rot", sagte Ben.`)

--- 


**Example 5:** Correct the spelling mistakes in the sentence.

@orthography(`<!-- data-solution-button="4" -->`,`Es ist jetze um sechse.`,`Es ist jetzt um sechs.`)

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

  <div id="orthography-check-@0" class="orthography-check" data-ortho-uid="@0">
    @1
    [[!]]
    <script>
    (function(){
      const el  = document.getElementById("orthography-input-@0");
      const sol = document.getElementById("orthography-solution-@0");
      if(!el || !sol) return false;

      const norm = s => String(s || "").toLocaleLowerCase().replace(/\s+/g, "");
      return norm(el.value) === norm(sol.textContent);
    })()
    </script>
  </div>
</div>

<script type="text/plain" id="orthography-comment-@0">@1</script>

@end

@diktat: @diktat_(@uid,@0)

@diktat_
<span class="lia-diktat" id="lia-diktat-@0">{|>}{<span class="lia-diktat-measure" style="position:absolute;left:-10000px;top:auto;width:auto;height:auto;overflow:hidden;white-space:pre;">@1</span>}[[ @1 ]]</span>
@end
```
