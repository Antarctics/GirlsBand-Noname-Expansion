import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import translates, { poptips } from "./translate.js";
import dynamicTranslates from "./dynamicTranslate.js"
export default function () {
    // 自动匹配注释
    // 自动识别文本中以特定符号包裹的内容（“ ”、【 】、〖 〗），并替换为对应的提示信息（poptips）

    // 使用步骤：
    // 1. 创建 poptips 对象（格式：key: [名称, 类型, 信息] 或 key: [名称, 信息]）
    // 2. 调用以下代码初始化系统

    // 采用此代码请标注——作者：Rin

    /// poptips 对象格式说明：
    /// key: 唯一标识符 (例如: 'skill_id', 'card_name')
    /// val[0]: 显示名称
    /// val[1]: 类型（可选） - 当有3个元素时，val[1]为类型 (例如: 'card', 'skill'，留空默认为'rule')
    /// val[2]: 详细信息 - 当只有2个元素时，val[1]为信息，当有3个元素时，val[2]为信息
    const t = lib.translate;
    const dt = lib.dynamicTranslate
    const map = new Map()
    const regex = /#|^.*(_info|_append|_config|_bg|_prefix|_suffix)$/;
    const r = /(?:“(.*?)”)|(?:【(.*?)】)|(?:〖(.*?)〗)/g
    // 初始化 poptip
    // 遍历 poptips 对象，将其内容添加到 lib.poptip 中
    for (let k in poptips) {
        let v = poptips[k];
        lib.poptip.add({
            id: k,
            name: v[0],
            info: v[2] || v[1],
            ...(v[2] && { type: v[1] })
        });
    }
    // window.name2KeywordMap (关键字与其ID的映射字典)
    for (let k in t) {
        let v = t[k];
        if (!v || regex.test(k)) continue;
        (map.get(v) || map.set(v, []).get(v)).push(k);
    }
    map.forEach(v => v.sort((a, b) => a.length - b.length));
    window.name2KeywordMap = map;
    const rep = (key, str) => {
        const cache = new Map();
        return str.replace(r, (_, ...args) => {
            let txt = args[0] || args[1] || args[2];
            if (cache.has(txt)) {
                let c = cache.get(txt);
                return c[1] === 'card' ? `【${c[0]}】` : c[1] === 'skill' ? `〖${c[0]}〗` : c[0];
            }
            let list = window.name2KeywordMap.get(txt),
                hit;
            if (!list) return _;

            if (list.length > 1) {
                let stack = [lib.skill[key.slice(0, -5)]],
                    visited = new Set();
                while (stack.length && !hit) {
                    let o = stack.pop();
                    if (!o || visited.has(o)) continue;
                    visited.add(o)
                    if (typeof o === 'string' && list.includes(o)) hit = o;
                    else if (typeof o === 'function') {
                        let s = o.toString();
                        hit = list.find(x => s.includes(x));
                    }
                    else if (typeof o === 'object') stack.push(...Object.values(o));
                }
            }
            hit = hit || list[0];
            cache.set(txt, [lib.poptip.getName(hit), lib.poptip.getType(hit)]);
            if (txt != hit) {
                cache.set(hit, [lib.poptip.getName(hit), lib.poptip.getType(hit)]);
            }
            return get.poptip(hit);
        });
    }
    for (let k in translates) {
        t[k] = rep(k, translates[k]);
    }
    for (let k in dynamicTranslates) {
        let v = dynamicTranslates[k];
        if (typeof v === 'string') dt[k] = rep(k, v);
        else if (typeof v === 'function') {
            let s = rep(k, v.toString());
            let body = s.match(/\{([\s\S]*)\}/)?.[1];
            if (body) {
                let args = s.match(/\((.*?)\)/)?.[1]?.split(',').map(a => a.trim()).filter(Boolean) || [];
                dt[k] = new Function(...args, body);
            }
        }
    }
    lib.translate = t
    lib.dynamicTranslate = dt
}