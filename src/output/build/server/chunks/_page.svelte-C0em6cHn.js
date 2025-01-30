import { c as pop, e as ensure_array_like, p as push } from './index-oK0KtCKN.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';
const replacements = {
    translate: /* @__PURE__ */ new Map([
        [true, "yes"],
        [false, "no"]
    ])
};
function attr(name, value, is_boolean = false) {
    if (is_boolean || name === "class")
        return "";
    const normalized = name in replacements && replacements[name].get(value) || value;
    const assignment = is_boolean ? "" : `="${escape_html(normalized, true)}"`;
    return ` ${name}${assignment}`;
}
function formStep($$payload, { question, answer }) {
    $$payload.out += `<article><div class="svelte-29xzgu">${escape_html(question)}</div> <div class="svelte-29xzgu">${escape_html(answer)}</div></article>`;
}
function Header($$payload, $$props) {
    let formState = { error: "", name: "", step: 0 };
    const Questions = ["why", "when", "who"];
    const each_array = ensure_array_like(Questions);
    $$payload.out += `<!--[-->`;
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
        let question = each_array[index];
        formStep($$payload, { question, answer: "this" });
        $$payload.out += `<!----> ${escape_html(index)}`;
    }
    $$payload.out += `<!--]--> <p>You are on step ${escape_html(formState.step)}</p> `;
    {
        $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    {
        $$payload.out += "<!--[-->";
        $$payload.out += `<input id="name" type="text"${attr("value", formState.name)}> <br>`;
    }
    $$payload.out += `<!--]--> <button>Next</button> `;
    formStep($$payload, { question: "huh", answer: "this" });
    $$payload.out += `<!---->`;
}
function _page($$payload, $$props) {
    push();
    $$payload.out += `<div>non blue color</div> `;
    Header($$payload);
    $$payload.out += `<!---->`;
    pop();
}
export { _page as default };
//# sourceMappingURL=_page.svelte-C0em6cHn.js.map
//# sourceMappingURL=_page.svelte-C0em6cHn.js.map