import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import update from "./update.js";
export default function () {
    /**
     * 合奏机制 - 让玩家选择展示手牌或从牌堆展示牌
     * @param {Array|Player} players - 参与玩家
     * @param {Function} [callback] - 回调函数
     * @param {Function} [filter] - 卡牌过滤函数
     * 
     * @example
     * // 令targets进行合奏，合奏结束后各摸一张牌
     * player.chooseToEnsemble(targets，()=>{
     * let {bool,targets}= _status.event.ensembleResult
     * if(bool) targets.forEach(target=>target.draw())
     * })
     * 
     */
    lib.element.player.chooseToEnsemble = function () {
        const next = game.createEvent("chooseToEnsemble");
        next.player = this;
        for (let arg of arguments) {
            const type = get.itemtype(arg);
            if (type === "players" || type === "player") {
                next.list = Array.isArray(arg) ? arg : [arg];
            } else if (typeof arg === 'function') {
                next.callback ? next.filterCard = arg : next.callback = arg;
            }
        }
        next.setContent("chooseToEnsemble");
        return next;
    }

    lib.element.content.chooseToEnsemble = async function () {
        const event = _status.event;
        if (!event.list) return event.result = { bool: false };

        const results = [], allCards = [];
        event.videoId = lib.status.videoId++;
        const targets = event.list.filter(target => !event.fixedResult?.[target.playerid]);
        if (targets.length) {
            var next = event.player
                .chooseCardOL(targets, `${get.translation(event.player)}发起了合奏，请选择展示的牌`)
                .set("type", "ensemble")
                .set("source", event.player)
                .set("targets", event.list)
                .set("filterCard", event.filterCard || (() => true))
                .set("ai", event.ai || (card => event.player.countCards("h") > 3 && (6 - get.value(card) ? Math.random() < 0.3 : false)))
                .set("selectCard", [1, Infinity])
            next._args.remove("glow_result");
            next = await next.forResult()
        }
        let idx = 0;
        for (var i = 0; i < event.list.length; i++) {
            let target = event.list[i]
            if (event.fixedResult?.[target.playerid]) {
                const cards = Array.isArray(event.fixedResult[target.playerid]) ? event.fixedResult[target.playerid] : [event.fixedResult[target.playerid]]
                game.log(target, "展示了", "#y", cards);
                results.push([target, cards]);
                allCards.push(cards);
                continue;
            }

            const result = next[idx++];
            if (result.bool) {
                game.log(target, "从", "#g手牌中", "展示了", "#y", result.cards);
                target.popup("手牌");
                results.push([target, result.cards]);
                allCards.push(result.cards);
            } else {
                const card = get.cards(1);
                game.cardsGotoOrdering(card);
                game.log(target, "从", "#g牌堆中", "展示了", "#y", card);
                target.popup("牌堆");
                results.push([target, card]);
                allCards.push(card);
            }
        }
        event.trigger("EnsembleShow");
        game.broadcastAll((player, id, results) => {
            game.pause();
            const dialog = ui.create.dialog(`${get.translation(player)}发起了合奏`, "hidden");
            dialog.videoId = id;

            const names = results.map(([target]) => ({ item: get.translation(target), ratio: results.length }));
            const cards = results.map(([_, cardList]) => ({ item: cardList, ratio: results.length }));

            if (results.length >= 4) {
                const half = Math.ceil(results.length / 2);
                dialog.addNewRow(...names.slice(0, half), ...names.slice(half));
                dialog.addNewRow(...cards.slice(0, half), ...cards.slice(half));
                dialog.css({ height: "60%" });
            } else {
                dialog.addNewRow(...names);
                dialog.addNewRow(...cards);
                dialog.css({ height: "30%" });
            }

            dialog.open();
            setTimeout(() => { game.resume(); dialog.close(); }, 2000);
        }, event.player, event.videoId, results);
        event.result = { bool: true, cards: allCards, targets: event.list, list: results, player: event.player };
        if (event.callback) {
            const cbEvent = game.createEvent("ensembleCallback");
            cbEvent.player = event.player;
            cbEvent.ensembleResult = get.copy(event.result);
            cbEvent.setContent(event.callback);
        }
    }

    // 特殊名词注释系统
    if (lib.config.extension_GirlsBand_poptip) {
        get.skillInfoTranslation = (skill, player) => {
            let str = player && lib.dynamicTranslate[skill] ? lib.dynamicTranslate[skill](player, skill) : lib.translate[skill + "_info"] || "";

            if (typeof str !== "string") {
                console.warn(`你${skill}的翻译传的是什么？！`);
                return "";
            }

            if (!window.name2KeywordMap || window.name2KeywordMap._lastUpdateLength !== Object.keys(lib.translate).length) {
                window.name2KeywordMap = new Map();
                window.name2KeywordMap._lastUpdateLength = Object.keys(lib.translate).length;
                const tempMap = new Map();

                for (const key in lib.translate) {
                    if (key.endsWith('_info')) continue;
                    const name = lib.translate[key];
                    if (!name) continue;
                    if (!tempMap.has(name)) tempMap.set(name, []);
                    tempMap.get(name).push(key);
                }

                for (const [name, keywords] of tempMap.entries()) {
                    if (!name) continue;
                    if (keywords.length === 1) {
                        window.name2KeywordMap.set(name, keywords);
                    } else {
                        const namePinyin = get.pinyin(name, false).join('');
                        const scored = [];

                        for (const keyword of keywords) {
                            let maxScore = 0;
                            for (const part of keyword.split('_')) {
                                let bestMatch = 0;
                                for (let start = 0; start <= part.length - namePinyin.length; start++) {
                                    let match = 0;
                                    for (let i = 0; i < namePinyin.length; i++) {
                                        if (part[start + i] === namePinyin[i]) match++;
                                        else break;
                                    }
                                    if (match > bestMatch) bestMatch = match;
                                }
                                const score = bestMatch / keyword.length;
                                if (score > maxScore) maxScore = score;
                            }
                            scored.push({ keyword, score: maxScore });
                        }

                        scored.sort((a, b) => b.score - a.score);
                        window.name2KeywordMap.set(name, scored.map(item => item.keyword));
                    }
                }
            }

            let firstKeywords = new Set();
            return str.replace(/“(.*?)”|【(.*?)】|〖(.*?)〗/g, (match, quoted, card, skillName) => {
                let keyword, type;
                if (quoted !== undefined) {
                    keyword = quoted;
                    type = 'quoted';
                } else if (card !== undefined) {
                    keyword = card;
                    type = 'card';
                } else if (skillName !== undefined) {
                    keyword = skillName;
                    type = 'skill';
                } else return match;
                let name = lib.translate[keyword];
                let info = lib.translate[keyword + "_info"];
                if (!name) {
                    const matched = window.name2KeywordMap.get(keyword);
                    if (matched && matched.length) {
                        if (type != 'card' && lib.skill[skill]) {
                            const obj = lib.skill[skill];
                            let found
                            if (matched.includes(skill)) {
                                found = skill
                            } else {
                                const matchSet = new Set(matched);
                                const stack = [obj];
                                while (stack.length > 0) {
                                    const item = stack.pop();
                                    if (typeof item === 'string' && matchSet.has(item)) {
                                        found = item;
                                        break;
                                    }
                                    if (typeof item === 'function') {
                                        const funcStr = item.toString();
                                        for (const match of matchSet) {
                                            const regex = new RegExp(`(^|[^a-zA-Z0-9_])${match}([^a-zA-Z0-9_]|$)`);
                                            if (regex.test(funcStr)) {
                                                found = match;
                                                break;
                                            }
                                        }
                                        if (found) break
                                    }

                                    if (item && typeof item === 'object') {
                                        if (Array.isArray(item)) {
                                            for (let i = item.length - 1; i >= 0; i--) {
                                                stack.push(item[i]);
                                            }
                                        } else {
                                            for (const key in item) {
                                                stack.push(item[key]);
                                            }
                                        }
                                    }
                                }
                            }
                            if (found) {
                                name = keyword;
                                keyword = found;
                                info = lib.translate[keyword + "_info"] || lib.translate[keyword];
                            }
                        }
                        if (!name) {
                            name = keyword;
                            keyword = matched[0];
                            info = lib.translate[keyword + "_info"] || lib.translate[keyword];
                        }
                    } else if (info) {
                        name = keyword;
                    } else return match;
                }

                if (!info) info = lib.translate[keyword] || name;
                if (info === name) return "“" + name + "”";
                const isCard = type === 'card' || !!lib.card[keyword];
                const isSkill = type === 'skill' || !!lib.skill[keyword];
                if (isCard && (lib.cardPack.extra.includes(keyword) || lib.cardPack.standard.includes(keyword) || !lib.card[keyword])) return match;
                if (isSkill && !lib.skill[keyword]) return match;
                if (isCard && !lib.card[keyword]) return match;

                const prefix = isCard ? '【' : isSkill ? '〖' : ''
                const suffix = isCard ? '】' : isSkill ? '〗' : ''

                if (!firstKeywords.has(keyword)) {
                    firstKeywords.add(keyword);
                    info = info.replace(/“(.*?)”|【(.*?)】|〖(.*?)〗/g, (m, q, c, s) => {
                        let kw = q ?? c ?? s;
                        if (!kw) return m;

                        let name = lib.translate[kw];
                        if (!name) {
                            const matched = window.name2KeywordMap.get(kw);
                            if (matched) {
                                name = kw;
                                kw = matched[0];
                            } else return m;
                        }

                        if (lib.card[kw]) return "【" + name + "】";
                        if (lib.skill[kw]) return "〖" + name + "〗";
                        return m;
                    });
                    if (isCard) {
                        const s = get.translation(get.subtype(keyword));
                        info = `<span style="display: block; text-align: center;">${get.translation(get.type(keyword))}牌${s ? '-' + s : ''}</span>${info}`;
                    }
                    return `<span class="keyword-poptip" style="text-decoration:underline;color:#FF6B00" data-keyword='${info}'>${prefix}${name}${suffix}</span>`;
                } else {
                    return prefix + name + suffix;
                }
            });
        };
        get.prompt2 = function (skill, target, player) {
            var str = get.prompt(skill, target, player);
            return "###" + str + "###" + get.skillInfoTranslation(skill, player);
        };
        ui.click.skill = (skill) => {
            var info = get.info(skill);
            var event = _status.event;
            event.backup(skill);
            if (info.filterCard && info.discard != false && info.lose != false && !info.viewAs) {
                var cards = event.player.getCards(event.position);
                for (var i = 0; i < cards.length; i++) {
                    if (!lib.filter.cardDiscardable(cards[i], event.player)) {
                        cards[i].uncheck("useSkill");
                    }
                }
            }
            if (typeof event.skillDialog == "object") {
                event.skillDialog.close();
            }
            if (event.isMine()) {
                event.skillDialog = true;
            }
            game.uncheck();
            game.check();
            if (event.skillDialog === true) {
                var str = get.translation(skill);
                if (info.prompt) {
                    var str2;
                    if (typeof info.prompt == "function") {
                        str2 = info.prompt(event);
                    } else {
                        str2 = info.prompt;
                    }
                    event.skillDialog = ui.create.dialog(str, '<div><div style="width:100%;text-align:center">' + str2 + "</div></div>");
                    if (info.longprompt) {
                        event.skillDialog.forcebutton = true;
                        ui.update();
                    }
                } else if (info.promptfunc) {
                    event.skillDialog = ui.create.dialog(str, '<div><div style="width:100%">' + info.promptfunc(event, event.player) + "</div></div>");
                } else {
                    event.skillDialog = ui.create.dialog(str, '<div><div style="width:100%">' + get.skillInfoTranslation(skill, event.player) + "</div></div>");
                }
            }
        }
        document.addEventListener(lib.config.touchscreen ? "touchstart" : "mouseover", e => {
            if (e.target.classList?.contains('keyword-poptip')) {
                ui.click.poptip(e.target, e.target.getAttribute('data-keyword'));
            }
        });
    }
    if (lib.config.extension_GirlsBand_auto_update && navigator.onLine) update(false);
};