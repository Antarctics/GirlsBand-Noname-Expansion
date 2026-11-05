import { lib, game, ui, get, ai, _status } from "../../../../noname.js";
import translates, { poptips, dynamicTranslates } from "./translate.js";
/**
 * 自动匹配注释
 * 识别翻译文本中被 “ ”、【 】、〖 〗 包裹的内容，
 * 通过 name2KeywordMap 找到 id，按 id 的实际类型（rule / character / card / skill）渲染。
 * poptips 格式：数组，元素为 { id, name, info, type?, dialog? } 或 [id, { name, info, type?, dialog? }]
 * 采用此代码请标注 —— 作者：Rin
 */
export default function () {
    const translate = lib.translate;
    const dynamicTranslate = lib.dynamicTranslate;
    const map = new Map();

    const skipRegex = /#|^.*(_info|_append|_config|_bg|_prefix|_suffix)$/;
    const markRegex = /“(.*?)”|【(.*?)】|〖(.*?)〗/g;
    const wrapper = {
        card: name => `【${name}】`,
        skill: name => `〖${name}〗`,
        character: name => `“${name}”`,
        rule: name => name,
    };
    const wrap = (type, name) => (wrapper[type] || wrapper.rule)(name);

    const addMap = (name, id) => {
        if (!name || !id) return;
        let list = map.get(name);
        if (!list) map.set(name, list = []);
        if (!list.includes(id)) list.push(id);
    };

    for (const item of poptips) {
        lib.poptip.add(item);
        const id = Array.isArray(item) ? item[0] : item.id;
        const val = Array.isArray(item) ? item[1] : item;
        if (val && val.name) addMap(val.name, id);
    }

    for (const k of Object.keys(translate)) {
        const v = translate[k];
        if (!v || skipRegex.test(k)) continue;
        addMap(v, k);
    }

    map.forEach(list => list.sort((a, b) => a.length - b.length));
    lib.name2KeywordMap = map;

    const markType = match => {
        const c = match[0];
        if (c === "【") return "card";
        if (c === "〖") return "skill";
        if (c === "“") return "character";
        return "rule";
    };

    const rep = (key, str) => {
        const cache = new Map();
        const skillId = key.endsWith("_info") ? key.slice(0, -5) : null;

        return str.replace(markRegex, (match, ...groups) => {
            const txt = groups.find(g => typeof g === "string");
            if (!txt) return match;

            if (cache.has(txt)) {
                const { name, type } = cache.get(txt);
                return wrap(type, name);
            }

            const list = map.get(txt);
            if (!list) return match;

            const wantType = markType(match);

            let hit;
            if (list.length > 1 && skillId) {
                const stack = [lib.skill[skillId]];
                const visited = new Set();
                while (stack.length && !hit) {
                    const o = stack.pop();
                    if (!o || visited.has(o)) continue;
                    visited.add(o);
                    if (typeof o === "string" && list.includes(o)) {
                        hit = o;
                    } else if (typeof o === "function") {
                        const s = o.toString();
                        hit = list.find(x => s.includes(x));
                    } else if (typeof o === "object") {
                        stack.push(...Object.values(o));
                    }
                }
            }

            if (!hit) {
                hit = list.find(id => lib.poptip.getType(id) === wantType);
            }
            if (!hit) {
                hit = list.find(id => lib.poptip.getType(id) === "rule") || list[0];
            }

            const name = lib.poptip.getName(hit);
            const type = lib.poptip.getType(hit) || "rule";
            cache.set(txt, { name, type });
            if (txt !== hit) cache.set(hit, { name, type });

            return get.poptip(hit);
        });
    };

    for (const k of Object.keys(translates)) {
        translate[k] = rep(k, translates[k]);
    }

    for (const k of Object.keys(dynamicTranslates)) {
        const v = dynamicTranslates[k];
        if (typeof v === "string") {
            dynamicTranslate[k] = rep(k, v);
        } else if (typeof v === "function") {
            dynamicTranslate[k] = new Proxy(v, {
                apply(target, thisArg, args) {
                    const r = Reflect.apply(target, thisArg, args);
                    return typeof r === "string" ? rep(k, r) : r;
                },
                toString: () => rep(k, v.toString()),
            });
        }
    }
}