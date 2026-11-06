import { lib, game, ui, get, ai, _status } from "../../../../noname.js";
/**
 * 自动注释功能
 *
 * 用法：
 * 1、确保有扩展调用 autoAddPoptip()；
 * 2、确保扩展设置存在 auto_poptip 项目，如下：
 *     auto_poptip: {
 *         name: "全扩自动注释",
 *         init: true,
 *         intro: "为全扩添加自动注释功能，此项关闭时将仅为持有本选项的扩展添加自动注释（此选项全局生效）",
 *         onclick(bool) {
 *             Object.keys(lib.extensionPack).filter(name => game.getExtensionConfig(name, "auto_poptip") !== undefined).forEach(name => game.saveExtensionConfig(name, "auto_poptip", bool))
 *         }
 *     },
 * 
 * 添加自定义注释：
 *   在 lib.extensionPack[扩展名].poptips 中注册，格式为对象（键为 id）：
 *     poptips: {
 *         id: { name, info, type?, dialog? }
 *     }
 *   字段：
 *      id 为对象的键；name 必填；
 *      info、dialog、type（rule / character / card / skill）可选
 *      type 省略时使用 `rule` 类型，指定自定义类型时自动注册。
 * 
 * 采用此代码请标注 —— 作者：Rin
 * 
 * @returns {void}
 */
function autoAddPoptip() {
    lib.arenaReady.push(() => {
        if (lib.name2IdMap) return;
        const { translate, dynamicTranslate = {} } = lib;
        const pairs = { "【": "】", "〖": "〗", "“": "”" };
        const wrapTypes = { "【": "card", "〖": "skill" };
        const skip = /(_info|_append|_config|_bg|_prefix|_suffix)$|#/;
        const exts = Object.keys(lib.extensionPack).filter(name => game.getExtensionConfig(name, "auto_poptip") !== undefined)
        if (!exts.length) return;
        let sourceT, sourceD;
        if (exts.every(name => game.getExtensionConfig(name, "auto_poptip") === true)) {
            sourceT = translate;
            sourceD = dynamicTranslate;
        } else {
            sourceT = {};
            sourceD = {};
            const collect = obj => {
                if (!obj || typeof obj !== "object") return;
                if (obj.translate && typeof obj.translate === "object") Object.assign(sourceT, obj.translate);
                if (obj.dynamicTranslate && typeof obj.dynamicTranslate === "object") Object.assign(sourceD, obj.dynamicTranslate);
            };
            for (const n of exts) {
                const pack = lib.extensionPack?.[n];
                if (!pack) continue;
                collect(pack);
                for (const k of Object.keys(pack)) {
                    if (k !== "translate" && k !== "dynamicTranslate") collect(pack[k]);
                }
            }
        }
        const name2ids = new Map();
        const addName = (name, id) => {
            if (!name || !id) return;
            let list = name2ids.get(name);
            if (list) { if (!list.includes(id)) list.push(id); }
            else name2ids.set(name, [id]);
        };

        for (const key of Object.keys(translate)) {
            if (skip.test(key)) continue;
            const name = translate[key];
            const info = translate[key + "_info"];
            if (typeof name !== "string" || !name) continue;
            if (typeof info !== "string" || !info) continue;
            addName(name, key);
        }
        for (const n of exts) {
            const poptips = lib.extensionPack?.[n]?.poptips;
            if (!poptips || typeof poptips !== "object") continue;
            for (const [id, val] of Object.entries(poptips)) {
                try {
                    if (!val || typeof val !== "object" || !val.name) continue;
                    const item = { ...val, id };
                    if (item.type) lib.poptip.addType?.(item.type);
                    lib.poptip.add(item);
                    addName(item.name, item.id);
                } catch { }
            }
        }
        const typeCache = new Map();
        const getType = id => {
            if (typeCache.has(id)) return typeCache.get(id);
            let t = lib.poptip.getType(id) || null;
            if (!t) {
                if (lib.card?.[id]) t = "card";
                else if (lib.skill?.[id]) t = "skill";
                else if (lib.character?.[id]) t = "character";
            }
            typeCache.set(id, t);
            return t;
        };
        const pick = (ids, type) => {
            for (const id of ids) if (getType(id) === type) return id;
            return null;
        };
        const regexCache = new Map();
        const search = (root, ids) => {
            if (!root) return null;
            const idSet = new Set(ids);
            const visited = new Set();
            const stack = [root];
            while (stack.length) {
                const o = stack.pop();
                if (!o) continue;
                if (typeof o === "string") {
                    if (idSet.has(o)) return o;
                    const sk = lib.skill?.[o];
                    if (sk && !visited.has(sk)) { visited.add(sk); stack.push(sk); }
                    continue;
                }
                if (typeof o === "function") {
                    let s; try { s = String(o); } catch { continue; }
                    for (const id of ids) {
                        if (!s.includes(id)) continue;
                        if (!/^[A-Za-z0-9_$]+$/.test(id)) return id;
                        let re = regexCache.get(id);
                        if (!re) {
                            re = new RegExp(`(?<![A-Za-z0-9_$])${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9_$])`);
                            regexCache.set(id, re);
                        }
                        if (re.test(s)) return id;
                    }
                    continue;
                }
                if (typeof o !== "object" || visited.has(o)) continue;
                visited.add(o);
                for (const k of Object.getOwnPropertyNames(o)) {
                    let v; try { v = o[k]; } catch { continue; }
                    stack.push(v);
                }
            }
            return null;
        };
        const replace = (key, str) => {
            if (!str) return str;
            const base = key.endsWith("_info") ? key.slice(0, -5) : key;
            const used = new Set();
            const cache = new Map();

            const handle = (name, mode) => {
                const ids = name2ids.get(name);
                if (!ids) return null;
                const find = () => {
                    if (!cache.has(name)) {
                        cache.set(name, search(lib.skill?.[base], ids) || search(lib.card?.[base], ids));
                    }
                    return cache.get(name);
                };
                let id;
                if (mode === "card" || mode === "skill") {
                    const k = mode + "\0" + name;
                    if (used.has(k)) return null;
                    id = find() || pick(ids, "rule")
                        || pick(ids, "card") || pick(ids, "skill") || pick(ids, "character");
                    if (id) used.add(k);
                } else {
                    id = pick(ids, "rule") || find()
                        || pick(ids, "card") || pick(ids, "skill") || pick(ids, "character");
                }
                if (!id) return null;
                const text = get.poptip(id);
                if (!text) return null;
                return text;
            };
            let out = "";
            for (let i = 0; i < str.length;) {
                const ch = str[i];
                const close = pairs[ch];
                if (!close) { out += ch; i++; continue; }
                const end = str.indexOf(close, i + 1);
                if (end < 0) { out += ch; i++; continue; }
                const inner = str.slice(i + 1, end);
                const r = name2ids.has(inner) ? handle(inner, wrapTypes[ch] || "quote") : null;
                out += r != null ? r : str.slice(i, end + 1);
                i = end + 1;
            }
            return out;
        };
        for (const key of Object.keys(sourceT)) {
            if (!key.endsWith("_info")) continue;
            const s = translate[key];
            if (typeof s === "string") {
                try { translate[key] = replace(key, s); } catch { }
            }
        }
        for (const key of Object.keys(sourceD)) {
            if (!key.endsWith("_info")) continue;
            const d = dynamicTranslate[key];
            if (typeof d === "string") {
                try { dynamicTranslate[key] = replace(key, d); } catch { }
            } else if (typeof d === "function") {
                dynamicTranslate[key] = new Proxy(d, {
                    apply(t, ctx, a) {
                        const r = Reflect.apply(t, ctx, a);
                        return typeof r === "string" ? replace(key, r) : r;
                    },
                    toString: () => replace(key, d.toString()),
                });
            }
        }
        lib.name2IdMap = name2ids;
    })
}
export default function () {
    autoAddPoptip()
}
