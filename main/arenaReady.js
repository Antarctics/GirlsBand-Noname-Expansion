import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import translates, { poptips } from "./translate.js";
export default function () {
    // 自动注释
    if (lib.config.extension_GirlsBand_poptip) {
        Object.entries(poptips).forEach(([key, val]) => { lib.poptip.add({ id: key, name: val[0], ...(val.length >= 3 ? { type: val[1], info: val[2] } : { info: val[1] }) }) })
        const patterns = /(?:“(.*?)”)|(?:【(.*?)】)|(?:〖(.*?)〗)/g
        const translate = lib.translate;
        window.name2KeywordMap = new Proxy(new Map(), {
            get(target, prop) {
                const len = Object.keys(translate).length;
                if (target._len !== len) {
                    const temp = new Map();
                    for (const k in translate) {
                        const v = translate[k];
                        if (!v || k[0] === '#' || /_info|_append|_config|_bg/.test(k)) continue;
                        if (!temp.has(v)) temp.set(v, []);
                        temp.get(v).push(k);
                    }
                    target.clear();
                    for (const [n, keywords] of temp) {
                        if (keywords.length > 1) keywords.sort((a, b) => a.length - b.length);
                        target.set(n, keywords);
                    }
                    target._len = len;
                }
                const val = target[prop];
                return typeof val === 'function' ? val.bind(target) : val;
            }
        });
        for (const key in translates) {
            const value = translate[key];
            if (typeof key == 'string' && value) {
                let firstKeywords = new Set();
                const newValue = value.replace(patterns, (match, aKey, cKey, sKey) => {
                    if (firstKeywords.has(match)) return match;
                    firstKeywords.add(match);
                    const keyName = aKey || cKey || sKey;
                    const list = window.name2KeywordMap.get(keyName);
                    if (list?.length) {
                        let found;
                        if (list.length === 1) {
                            found = list[0];
                        } else {
                            const obj = lib.skill[key.slice(0, -5)];
                            const matchSet = new Set(list);

                            if (typeof obj === 'string') {
                                if (matchSet.has(obj)) found = obj;
                            } else if (typeof obj === 'function') {
                                const str = obj.toString();
                                for (const m of matchSet) {
                                    if (str.includes(m)) found = m;
                                    if (found) break;
                                }
                            } else if (obj && typeof obj === 'object') {
                                const stack = [obj];
                                while (stack.length && !found) {
                                    const item = stack.pop();
                                    if (typeof item === 'string') {
                                        if (matchSet.has(item)) found = item;
                                    } else if (item && typeof item === 'object') {
                                        const vals = Object.values(item);
                                        for (let i = vals.length - 1; i >= 0; i--) {
                                            stack.push(vals[i]);
                                        }
                                    }
                                }
                            }
                        }
                        if (found) {
                            return get.poptip(found);
                        }
                    }
                    return match;
                });
                translate[key] = newValue
            }
        }
        lib.translate = translate
    }
}