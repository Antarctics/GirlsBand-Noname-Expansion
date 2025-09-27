import skills1 from "./skill1.js";
import skills2 from "./skill2.js";
import translates, { pinyins } from "./translate.js";
import dynamicTranslates from "./dynamicTranslate.js";
import characters, { characterSubstitutes, characterTitles, characterIntros, characterReplaces, characterSort } from "./character.js"
export default function (version) {
    return {
        intro: `
            <span style="color:#FF6B00;font-size:1.1em">版本号：v${version}</span><br>
            <span style="color:#FF6B00;font-size:1.1em">测试环境：</span><br>
            <span style="color:#FF6B00;font-size:0.8em">• 本体：1.10.17.4</span><br>
            <span style="color:#FF6B00;font-size:0.8em">• 十周年UI：0.4.3</span><br>
            <span style="color:#FF6B00;font-size:1.1em">问题反馈：</span><br>
            <a style="color:#FF6B00" href="#"  onclick="event.preventDefault();navigator.clipboard.writeText('1001742343');alert('QQ群号已复制到剪贴板');">• QQ群：1001742343（点击复制）</a><br>
            <span style="color:#FF6B00;font-size:1.2em">角色设计：</span><br>
            <span style="color:#FF6B00">• 文茄</span><br>
            `,
        author: "Rin",
        diskURL: "",
        forumURL: "",
        version: version,
        character: {
            connect: true,
            character: { ...characters },
            characterIntro: {
                ...characterIntros
            },
            characterSort: {
                GirlsBand: {
                    ...characterSort
                }
            },
            characterTitle: {
                ...characterTitles
            },
            characterReplace: {
                ...characterReplaces
            },
            dynamicTranslate: {
                ...dynamicTranslates
            },
            characterSubstitute: {
                ...characterSubstitutes
            },
            skill: {
                ...skills1,
                ...skills2,
            },
            translate: {
                ...translates
            },
            pinyins: {
                ...pinyins
            }

        },
    }
}