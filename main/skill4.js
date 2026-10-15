import { lib, game, ui, get, ai, _status } from "../../../noname.js";

/** @type { importCharacterConfig['skill'] } */
const skills = {
    // --- 仲町阿拉蕾 ---
    gbwaixuan: {
        audio: false,
        trigger: { player: "phaseJudgeBegin" },
        filter(event, player) {
            return player.canAddJudge("xumou_jsrg");
        },
        async content(event, trigger, player) {
            const cards = get.cards(5);
            await game.cardsGotoOrdering(cards)
            player.showCards(cards);
            let list = []
            while (list.length < 3) {
                let result = await player.chooseButton(["外炫：请选择要蓄谋的牌", cards])
                    .set("ai", button => {
                        let value = (card) => {
                            let player = get.player();
                            return Math.max(player.getUseValue(card), get.value(card) / 2);
                        };
                        return 1 / value(button.link)
                    })
                    .forResult();
                if (result?.bool && result.links?.length) {
                    list.addArray(result.links)
                    cards.removeArray(result.links)
                    player.$gain2(result.links, false);
                    await game.delayx();
                    await player.addJudge("xumou_jsrg", result.links);
                } else {
                    break
                }
            }
            const rest = cards.filter(card => !list.includes(card));
            if (rest.length) game.cardsGotoPile(rest, "bottom");
        },
        group: "gbwaixuan_effect",
        subSkill: {
            effect: {
                trigger: {
                    player: "useCardToPlayer"
                },
                prompt2: "你使用蓄谋牌指定其他角色为目标时，你可以获得目标的一张牌。",
                filter(event, player) {
                    if (!event.isFirstTarget) return false
                    if (!event.targets.some(target => target != player)) return false
                    return event?.card?.storage?.xumou_jsrg
                },
                async content(event, trigger, player) {
                    let targets = trigger.targets.filter(target => target != player)
                    for (let target of targets.sortBySeat()) {
                        player.gainPlayerCard(target, true, "he")
                    }
                }
            }
        }
    },
    gbneihu: {
        audio: false,
        trigger: { player: "useCardAfter" },
        filter(event, player) {
            return event?.card?.storage?.xumou_jsrg
        },
        direct: true,
        forced: true,
        firstDo: true,
        async content(event, trigger, player) {
            player.addTempSkill("gbneihu_effect", "phaseAfter");
            player.addMark("gbneihu_effect", 1, false);
            switch (player.countMark("gbneihu_effect")) {
                case 1:
                    player.addTempSkill(event.name + "_damage")
                    break
                case 2:
                    player.addTempSkill(event.name + "_gain")
                    break
                case 3:
                    player.skip("phaseDiscard")
                    break
                case 3:
                    player.when("phaseEnd")
                        .filter((event, player) => {
                            return !event.skill
                        })
                        .then(() => {
                            player.phaseJudge()
                        })
                    break
            }
        },
        group: ["gbneihu_xumou",],
        subSkill: {
            effect: {
                charlotte: true,
                onremove: true,
                mark: true,
                intro: {
                    markcount(storage, player) {
                        return player.countMark("gbneihu_effect");
                    },
                    content: "已使用#张蓄谋牌",
                },
            },
            xumou: {
                audio: false,
                trigger: { player: "chooseUseTargetAfter" },
                forced: true,
                filter(event, player) {
                    return event.getParent().name == "xumou_jsrg" && !event.result?.bool && event.cards.filterInD().length
                },
                async content(event, trigger, player) {
                    const cards = trigger.cards.filter(card => get.position(card, true) == "o");
                    await player.gain(cards, "gain2");
                },
            },
            gain: {
                audio: false,
                trigger: { player: ["loseAfter", "loseAsyncAfter"] },
                forced: true,
                filter(event, player) {
                    return event.getParent(evt => evt.name == "xumou_jsrg", true) && event.cards.filterInD("d").length
                },
                async content(event, trigger, player) {
                    const cards = trigger.cards.filterInD("d")
                    await player.gain(cards, "gain2");
                },
            },
            damage: {
                audio: false,
                usable: 1,
                trigger: { global: ["loseAfter", "loseAsyncAfter"] },
                filter(event, player) {
                    const cards = event.cards
                    if (!cards || cards.length !== 1) return false
                    if (!get.is.damageCard(cards[0])) return false
                    if (!player.canAddJudge("xumou_jsrg")) return false
                    return cards.filterInD("d").length

                },
                async cost(event, trigger, player) {
                    const result = await player.chooseBool("内狐：是否将" + get.translation(trigger.cards) + "蓄谋？")
                        .set("ai", () => {
                            let evt = get.event().getParent()
                            let card = evt.getTrigger().cards[0]
                            let player = get.player()
                            return player.hasValueTarget(card)
                        }).forResult()
                    if (!result.bool) return;
                },
                async content(event, trigger, player) {
                    player.$gain2(trigger.cards, false);
                    await game.delayx();
                    await player.addJudge("xumou_jsrg", trigger.cards);
                },
            },
        },
    },
    gbxushen: {
        audio: false,
        zhuSkill: true,
        trigger: { player: "useCard" },
        filter(event, player) {
            if (!event.card?.storage?.xumou_jsrg) return false;
            return game.hasPlayer(current => current != player && current.group == player.group);
        },
        check(event, player) {
            return game.filterPlayer(current => current != player && current.group == player.group).reduce((val, p) => val += get.effect(p, { name: "draw" }, player, player), 0) > 0
        },
        async content(event, trigger, player) {
            const targets = game.filterPlayer(current => current != player && current.group == player.group).sortBySeat(player);
            if (!targets.length) return;
            for (const target of targets.sortBySeat()) target.draw();
        },
    },

    // --- 宫永野乃花 ---
    gbshihou: {
        init(player, skill) {
            lib.skill.hschenzhi.init(player, skill)
        },
        initPile(nocardpile) {
            const suits = lib.suit.slice(),
                cards = [];
            if (nocardpile) {
                game.broadcastAll(() => {
                    _status.pokerPile ??= [];
                    _status.pokerDiscarded ??= [];
                });
            } else {
                for (let suit of suits) {
                    for (let i = 1; i < 14; i++) {
                        const card = lib.skill.hschenzhi.initPoker(suit, i);
                        cards.add(card);
                    }
                }
                cards.randomSort();
                _status.pokerPile ??= cards;
                _status.pokerDiscarded ??= [];
                game.cardsGotoSpecial(cards);
            }
            lib.skill.hschenzhi.update();
        },
        audio: false,
        trigger: {
            global: ["phaseBefore", "phaseEnd"],
            player: "enterGame",
        },
        filter(event, player, name) {
            if (player.countCards("h", card => card.name == "gb_bking")) return false
            return name != "phaseBefore" || game.phaseNumber == 0
        },
        forced: true,
        async content(event, trigger, player) {
            const cards = [
                get.cardPile(card => card.name == "gb_bking" || card.cards?.[0]?.name == "gb_bking", "field"),
                ...game.filterPlayer(p => p != player).flatMap(p => p.getCards('h')),
                ...(_status.pokerPile || []),
                ...(_status.pokerDiscarded || [])
            ].filter(c => c && (get.name(c) == 'gb_bking' || c.cards?.[0]?.name == "gb_bking"))
            if (!cards.length) {
                const card = game.createCard("gb_bking", "none", 0);
                lib.actualCardName.set("大王 ", "")
                player.gain(card)
            } else {
                player.gain(cards)
            }
        },
        group: "gbshihou_viewas",
        subSkill: {
            viewas: {
                charlotte: true,
                enable: ["chooseToUse"],
                filter(event, player) {
                    return player.getCards("hs").some(card => card.name == "gb_bking");
                },
                chooseButton: {
                    dialog(event, player) {
                        let cards = get.inpileVCardList(info => info[0] == "basic")
                        return ["食侯", [cards, "vcard"]]
                    },
                    filter(button, player) {
                        let event = get.event().getParent()
                        return event.filterCard ? event.filterCard(get.autoViewAs(button.link), player, event) : true
                    },
                    check(button) {
                        var player = _status.event.player;
                        var card = get.autoViewAs(button.link)
                        if (player.countCards("hs", cardx => cardx.name == card.name && cardx.nature == card.nature)) {
                            return 0;
                        }
                        return _status.event.getParent().type == "phase" ? player.getUseValue(card) : 1;
                    },
                    prompt(links) {
                        return "食侯：将一张【大王】当作" + "【" + get.translation(links[0][2]) + "】使用";
                    },
                    backup(links, player) {
                        return {
                            filterCard(card) {
                                return get.name(card) == "gb_bking"
                            },
                            selectCard: 1,
                            position: "hs",
                            check(card) {
                                return 1 / Math.max(1, get.value(card))
                            },
                            popname: true,
                            viewAs: { name: links[0][2], nature: links[0][3] },
                        };
                    },
                },
                hiddenCard(player, name) {
                    if (get.type(name) == "basic") return true
                },
                ai: {
                    order: 6,
                    threaten: 0.6,
                    result: {
                        player: 1,
                    },
                },
            },
        },
    },
    gbtuguo: {
        audio: false,
        trigger: { global: "phaseBegin" },
        filter(event, player) {
            return event.player != player
        },
        async cost(event, trigger, player) {
            const target = trigger.player;
            const choiceList = [];
            if (player.countCards("he") && !player.isDisabledJudge()) {
                choiceList.push(
                    `蓄谋一张牌，然后视为对${get.translation(target)}使用一张${get.poptip("zhujinqiyuan")}`,
                    `蓄谋一张牌，然后视为对${get.translation(target)}使用一张${get.poptip("dz_mantianguohai")}`
                );
            }
            if ((player.countCards("he") && !player.isDisabledJudge()) || (target.countCards("he") && !target.isDisabledJudge())) {
                choiceList.push(`你与${get.translation(target)}各蓄谋一张牌，然后交换判定区内的所有牌并获得之`);
            }
            if (!choiceList.length) {
                event.result = { bool: false };
                return;
            }
            let result = await player.chooseControl(choiceList.map((_, i) => "选项" + get.cnNumber(i + 1, true)).add("cancel2"))
                .set("prompt", get.prompt(event.skill))
                .set("choiceList", choiceList)
                .set("ai", () => {
                    const player = get.player();
                    const target = get.event().target;
                    const controls = get.event().controls
                    const att = get.attitude(player, target)
                    const list = [];
                    if (controls.includes("选项一")) {
                        list.push(["选项一", get.effect(target, { name: "zhujinqiyuan" }, player, player)]);
                    }
                    if (controls.includes("选项二")) {
                        list.push(["选项二", get.effect(target, { name: "dz_mantianguohai" }, player, player)]);
                    }
                    if (controls.includes("选项三")) {
                        const pOff = player.isDisabledJudge();
                        const tOff = target.isDisabledJudge();

                        const info = (holder, off) => {
                            if (off) return [0, 0];
                            let f = 0, v = 0;
                            for (const c of holder.getCards("j")) {
                                const r = get.info({ name: c.name, nature: c.nature })?.ai?.result;
                                let s = 1;
                                if (r) {
                                    const fun = r.target ?? r.player;
                                    const val = typeof fun === "function" ? fun(holder, holder, c) : fun;
                                    s = val < 0 ? -1 : val > 0 ? 1 : 0;
                                }
                                const cards = r ? [c] : (c.cards || []);
                                for (const x of cards) {
                                    f += s * get.value(x);
                                    v += get.value(x);
                                }
                            }
                            return [f, v];
                        };
                        const [pf, pv] = info(player, pOff);
                        const [tf, tv] = info(target, tOff);
                        const pc = player.countCards("he") ? player.getCards("he").reduce((min, card) => Math.min(min, get.value(card)), Infinity) : 0;
                        const tc = target.countCards("he") ? 3 : 0;
                        const sgn = Math.sign(att);

                        let gain;
                        if (pOff && tOff) {
                            gain = 0;
                        } else if (pOff) {
                            gain = sgn * (-tf - tc);
                        } else if (tOff) {
                            gain = -pf - pc;
                        } else {
                            gain = -pf + tv + sgn * (-tf) + sgn * pv;
                        }
                        list.push(["选项三", gain]);
                    }
                    list.sort((a, b) => b[1] - a[1]);
                    if (list[0][1] <= 0) return "cancel2";
                    return list[0][0]
                })
                .set("target", target)
                .forResult();
            if (result.control != "cancel2") {
                event.result = {
                    bool: true,
                    cost_data: result.control
                };
            } else {
                event.result = { bool: false };
            }
        },
        async content(event, trigger, player) {
            const target = trigger.player;
            const control = event.cost_data;
            const scheme = async p => {
                if (!p.countCards("he")) return [];
                const result = await p.chooseCard("兔国：请选择一张牌蓄谋", "he", true)
                    .set("ai", card => get.player().hasValueTarget(card) || -get.value(card))
                    .forResult();
                if (!result.bool || !result.cards?.length) return [];
                if (!p.canAddJudge("xumou_jsrg")) return
                await p.addJudge("xumou_jsrg", result.cards);
            };
            game.log(player, "选择了", "#g【兔国】", "的", "#y" + control);
            if (control == "选项一") {
                await scheme(player);
                if (player.canUse("zhujinqiyuan", target)) await player.useCard({ name: "zhujinqiyuan" }, target)
            } else if (control == "选项二") {
                await scheme(player);
                if (player.canUse("dz_mantianguohai", target)) await player.useCard({ name: "dz_mantianguohai" }, target)
            } else {
                let targets = [player, target].filter(p => !p.isDisabledJudge()).sortBySeat()
                let next = player.chooseCardOL("兔国：请选择一张手牌蓄谋", targets, true)
                    .set("ai", (card) => -get.value(card))
                next._args.remove("glow_result")
                next = await next.forResult()
                for (let idx in targets) {
                    let current = targets[idx]
                    let bool = next[idx].bool
                    let cards = next[idx].cards
                    if (bool && cards.length) {
                        if (current.canAddJudge("xumou_jsrg")) await current.addJudge("xumou_jsrg", cards)
                    }
                }
                let list1 = player.getCards("j")
                let list2 = target.getCards("j")
                if (!list1.length && !list2.length) return
                for (let [current, list] of [[player, list2], [target, list1]]) {
                    if (!list.length) continue
                    for (let card of list) {
                        if (current.canAddJudge(card)) {
                            current.$give(card, targets.find(t => t != current), false)
                            await current.addJudge(card)
                        }
                    }
                }
                game.log(player, "与", target, "交换了判定区内的牌");
                await player.gain(player.getCards("j"), "gain2")
                await target.gain(target.getCards("j"), "gain2")
            }
        },
    },
    gbgongyu: {
        audio: false,
        trigger: { player: "phaseJudgeBegin" },
        filter(event, player) {
            return player.countCards("j", card => card.name == "xumou_jsrg")
        },
        async cost(event, trigger, player) {
            const cards = player.getCards("j", card => card.name == "xumou_jsrg")
            event.result = await player.chooseButton([get.prompt2(event.skill), cards], [1, cards.length])
                .set("ai", button => !player.hasValueTarget(button.link))
                .forResult();
            event.result.cards = event.result.links || [];
        },
        async content(event, trigger, player) {
            const cards = event.cards;
            if (!cards.length) return;
            await player.gain(cards, "gain2");
        },
        group: "gbgongyu_effect",
        subSkill: {
            effect: {
                forced: true,
                locked: false,
                trigger: {
                    player: "useCard"
                },
                filter(event, player) {
                    return event.card?.storage?.xumou_jsrg
                },
                async content(event, trigger, player) {
                    trigger.directHit.addArray(trigger.targets)
                }
            }
        },
    },

    // --- 藤都子 ---
    gbtengshi: {
        audio: false,
        zhuanhuanji: true,
        mark: true,
        marktext: "☯",
        intro: {
            content(storage, player, skill) {
                if (!player.storage.gbtengshi) {
                    return "转换技，判定阶段开始时或你受到伤害后，你可摸一张牌并视为【草木皆兵】使用。";
                }
                return "转换技，判定阶段开始时或你受到伤害后，你可摸一张牌并视为【兵临城下】使用。";
            },
        },
        trigger: {
            player: ["phaseJudgeBegin", "damageEnd"],
        },
        check(event, player) {
            const name = player.storage.gbtengshi ? "binglinchengxiax" : "caomu";
            return game.hasPlayer(p => player.canUse(name, p) && get.effect(p, { name: name, isCard: true }, player, player))
        },
        async content(event, trigger, player) {
            const name = player.storage.gbtengshi ? "binglinchengxiax" : "caomu";
            let { cards } = await player.draw().forResult()
            player.changeZhuanhuanji("gbtengshi")
            await player.chooseUseTarget({ name: name, isCard: true }, cards, true)
        },
    },
    gbxuedu: {
        audio: false,
        trigger: { player: "useCardToPlayer" },
        forced: true,
        filter(event, player) {
            if (get.type(event.card, "trick") != "trick") return false;
            if (!event.isFirstTarget) return false
            const evt = event.getParent("useCard");
            return !player.hasHistory("useCard", current => current.card && current.card.name == event.card.name && current != evt)
        },
        async content(event, trigger, player) {
            const targets = trigger.targets.sortBySeat()
            let next = await player.chooseCardOL("学都：请选择一张手牌蓄谋", targets, true).set("ai", card => get.player().hasValueTarget(card) || -get.value(card)).forResult()
            for (let idx in targets) {
                let target = targets[idx]
                let cards = next[idx].cards
                if (!cards.length) return
                if (target.canAddJudge("xumou_jsrg")) target.addJudge("xumou_jsrg", cards)
            }
            if (targets.includes(player)) {
                await player.gainMaxHp();
                await player.recover();
            }
        },
        ai: {
            effect: {
                player(card, player, target) {
                    if (get.type(card, "trick") == "trick" && !player.hasHistory("useCard", evt => evt.card && evt.card.name == card.name)) {
                        if (target == player) return [1, 2]
                        return [1, -1]
                    }
                }
            }
        }
    },
    gbfengzi: {
        audio: false,
        trigger: { global: "phaseEnd" },
        filter(event, player) {
            return !event.skill
        },
        async cost(event, trigger, player) {
            const num = game.getRoundHistory("everything", evt => evt.name == "logSkill" && evt.skill == "gbfengzi").length + 1
            let { control } = await player.chooseControl(["选项一", "选项二", "cancel2"])
                .set("prompt", `###${get.prompt("gbfengzi")}###失去${get.cnNumber(get.event().num)}点体力上限并摸两张牌，然后...`)
                .set("choiceList", ["执行一个额外的判定阶段", "执行一个额外的出牌阶段"])
                .set("ai", () => {
                    const player = get.player();
                    const num = get.event().num
                    if (player.maxHp - num < 1) return "cancel2";
                    if (player.maxHp < 4 && !player.isDamaged()) return "cancel2";
                    if (num > player.getDamagedHp()) return "cancel2";
                    if (_status.currentPhase.next == player && num > 2) return "cancel2"
                    return player.countCards("h") > 5 ? "选项二" : "选项一";
                })
                .set("num", num)
                .forResult()
            if (control != "cancel2") {
                event.result = {
                    bool: true,
                    cost_data: control
                }
            }
        },
        async content(event, trigger, player) {
            const num = game.getRoundHistory("everything", evt => evt.name == "logSkill" && evt.skill == event.name).length + 1
            await player.loseMaxHp(num);
            await player.draw(2);
            const phase = event.cost_data == "选项一" ? "phaseJudge" : "phaseUse";
            const next = player[phase]()
            event.next.remove(next)
            trigger.next.push(next)
        },
    },

    // --- 千石由乃 ---
    gbqiusuo: {
        audio: false,
        trigger: {
            player: ["phaseJudgeBegin", "addJudgeAfter"],
        },
        filter(event, player) {
            if (event.name == "addJudge" && event.card?.name != "xumou_jsrg") return false;
            return player.countCards("j") > 0;
        },
        forced: true,
        async content(event, trigger, player) {
            const num = player.countCards("j");
            if (num == 1) {
                await player.chooseUseTarget({ name: "tiaojiyanmei", isCard: true }, true);
            } else if (num == 2) {
                await player.chooseUseTarget({ name: "zengbin", isCard: true }, true);
            } else {
                const cards = player.getCards("j");
                await player.loseToDiscardpile(cards);
                const count = game.countPlayer(current => current.countCards("h") == player.countCards("h"));
                if (count > 0) await player.draw(count);
            }
        },
        ai: { threaten: 1.5 },
    },
    gbqianyou: {
        audio: false,
        forced: true,
        popup: false,
        trigger: { global: "changeHpAfter" },
        filter(event, player) {
            if (event.num == 0) return false;
            if (event.player == player) return true
            return player.canAddJudge("xumou_jsrg") && player.countCards("h") > 0;
        },
        async content(event, trigger, player) {
            if (trigger.player != player) {
                player.logSkill(event.name)
                const result = await player.chooseCard("千由：请选择一张手牌蓄谋", "h", true)
                    .set("ai", card => -get.value(card))
                    .forResult();
                if (result.cards?.length) await player.addJudge("xumou_jsrg", result.cards)
            } else {
                if (!_status.currentPhase) return
                let next = await player.chooseButtonTarget()
                    .set("createDialog", [`###${get.prompt(event.name)}###你可以弃置场上的一张牌并视为对当前回合角色使用一张基本牌`, [get.inpileVCardList(info => get.type(info[2]) == "basic"), "vcard"]])
                    .set("filterTarget", (card, player, target) => {
                        return target.hasDiscardableCards(player, "ej")
                    })
                    .set("filterButton", button => {
                        let card = get.autoViewAs(button.link)
                        let player = get.player()
                        return player.canUse(card, _status.currentPhase, false)
                    })
                    .set("ai1", button => {
                        return get.effect(_status.currentPhase, { name: button.link[2], nature: button.link[3] }, get.player())
                    })
                    .set("ai2", target => {
                        const player = get.player();
                        return get.effect(target, { name: "guohe_copy", position: "ej" }, player, player);
                    })
                    .forResult()
                if (next.bool) {
                    player.logSkill(event.name)
                    await player.discardPlayerCard({ target: next.targets[0], position: "ej", forced: true });
                    let link = next.links[0]
                    await player.useCard(get.autoViewAs({ name: link[2], nature: link[3] }), _status.currentPhase);
                }
            }
        },
    },

    // --- 峰月律 ---
    gbfengrou: {
        audio: false,
        trigger: {
            player: ["phaseJudgeBegin"],
            target: ["useCardToTargeted"]
        },
        filter(event, player, name) {
            if (name == "useCardToTargeted") return get.is.damageCard(event.card) && event.player != player
            return true
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseButtonTarget()
                .set("createDialog", [
                    `###${get.prompt(event.skill)}###你可以...，然后使用其中的【酒】和【桃】，若你未因此使用牌，则你从牌堆底摸等量张牌。`,
                    [
                        [
                            ["cardPile", "展示牌堆顶的" + get.cnNumber(Math.min(Math.max(player.getDamagedHp(), 1), 5), true) + "张牌"],
                            ["other", "展示一名其他角色至多" + get.cnNumber(Math.min(Math.max(player.getDamagedHp(), 1), 5), true) + "张手牌"]
                        ],
                        "textbutton"
                    ]
                ])
                .set("filterTarget", (card, player, target) => target != player && target.countCards("h"))
                .set("selectTarget", () => {
                    return ui.selected?.buttons?.[0]?.link == "other" ? 1 : 0
                })
                .set("ai1", (button) => {
                    const player = get.player();
                    const num = Math.min(Math.max(player.getDamagedHp(), 1), 5)

                    if (button.link == "cardPile") return 1;

                    return game.hasPlayer(t => t != player && get.attitude(player, t) < 0 && t.countCards("h") > num / 2) ? 2 : 0
                })
                .set("ai2", (target) => {
                    const player = get.player();
                    const att = get.attitude(player, target);
                    return att < 0 ? target.countCards("h") : 0;
                })
                .set("complextSelect", true)
                .forResult()
            event.result.cost_data = event.result.links[0]
        },
        async content(event, trigger, player) {
            let control = event.cost_data
            let num = Math.max(player.getDamagedHp(), 1)
            let cards
            if (control === "cardPile") {
                cards = get.cards(num);
                game.cardsGotoOrdering(cards);
            } else {
                cards = (
                    await player
                        .choosePlayerCard(event.targets[0], "allowChooseAll", [1, num], true)
                        .forResult()
                ).cards;
            }
            if (cards.length) {
                let used
                await player.showCards(cards)
                for (const card of cards) {
                    if (!["jiu", "tao"].includes(card.name)) continue;
                    if (!player.canUse(card, player)) continue;
                    used = true
                    await player.chooseUseTarget(card, true)
                }
                if (!used) await player.draw(cards.length, "bottom");
            }
        },
    },
    gbgaoyue: {
        audio: false,
        locked: true,
        mod: {
            cardUsable(card) {
                if (card.name == "jiu") return Infinity;
            },
        },
        group: "gbgaoyue_use",
        subSkill: {
            use: {
                audio: false,
                trigger: { player: "useCardAfter" },
                forced: true,
                filter(event, player) {
                    if (get.type(event.card) != "basic") return false;
                    if (event.card.name == "jiu") return true
                },
                async content(event, trigger, player) {
                    await player.gainMaxHp();
                    const result = await player.chooseCard(`###${get.prompt(event.name)}###选择一张手牌蓄谋，然后视为使用一张【桃】`)
                        .set("ai", card => get.player().isDamaged() ? get.player().getUseValue(card) || -get.value(card) : 0)
                        .forResult();
                    if (!result.bool || !result.cards?.length) return;
                    await player.addJudge("xumou_jsrg", result.cards);
                    await player.chooseUseTarget({ name: "tao" }, true)
                },
            },
        },
    },

    // --- 薇欧拉 ---
    gbxiaoyuan: {
        audio: false,
        trigger: { player: "phaseJudgeBegin" },
        async cost(event, trigger, player) {
            event.result = await player.chooseButtonTarget()
                .set("createDialog", [
                    `###${get.prompt(event.skill)}###选择一名其他角色令其交给你一张花色相同的手牌`,
                    [lib.suit.map((i) => ["", "", "lukai_" + i]), "vcard"]
                ])
                .set("filterTarget", (_, player, target) => player != target && target.countCards("h"))
                .set("ai1", (button) => Math.random())
                .set("ai2", target => -target.getCards("hj").reduce((val, card) => val += Math.sign(get.attitude(get.player(), target)) * get.value(card), 0))
                .forResult();
            event.result.cost_data = event.result.links
        },
        async content(event, trigger, player) {
            const suit = event.cost_data[0][2].slice(6)
            const target = event.targets[0];
            game.log(player, "选择了花色", "#y" + get.translation(suit));
            if (target.countCards("h", card => get.suit(card) == suit)) {
                const { cards } = await target.chooseCard(`笑源：交给${get.translation(player)}一张${get.translation(suit)}牌`, "h", true)
                    .set("filterCard", card => get.suit(card) == suit)
                    .set("ai", card => -get.value(card))
                    .forResult();
                if (cards.length) await target.give(cards, player)
            }
            else {
                await target.damage(1, "fire", player)
                await target.discard(target.getCards("ej"))
            }
        },
    },
    gbjinchuan: {
        audio: false,
        trigger: { player: "gainAfter" },
        forced: true,
        filter(event, player) {
            if (!event.cards || !event.cards.length || !player.canAddJudge("xumou_jsrg") || !player.countCards("h")) return false;
            return !event.getParent(evt => evt.name == "gbjinchuan" || evt.name == "phaseDraw", true)
        },
        async content(event, trigger, player) {
            const result = await player.chooseCard("烬川：请选择一张牌蓄谋", "he", true)
                .set("ai", card => get.player().getUseValue(card) || -get.value(card))
                .forResult();
            if (result.bool && result.cards?.length) await player.addJudge("xumou_jsrg", result.cards);
            await player.draw();
        },
        group: "gbjinchuan_phase",
        subSkill: {
            phase: {
                audio: false,
                forced: true,
                trigger: { global: "phaseEnd" },
                filter(event, player) {
                    return player.countCards("j", card => card.name == "xumou_jsrg")
                },
                async content(event, trigger, player) {
                    const next = player.phaseJudge()
                    event.next.remove(next)
                    trigger.next.push(next)
                },
            },
        },
        ai: {
            threaten: 1.2,
            effect: {
                target(card, player, target) {
                    if (!get.tag(card, "gain")) return;
                    return [1, 1, 1, 0]
                },
            },
        },
    },
    gbnongsun: {
        audio: false,
        dutySkill: true,
        forced: true,
        trigger: { player: "useCard" },
        filter(event, player) {
            return event.card?.storage?.xumou_jsrg
        },
        async content(event, trigger, player) {
            await player.draw()
            await player.gainMaxHp()
        },
        group: ["gbnongsun_slient", "gbnongsun_success"],
        ai: {
            threaten: 1.8,
            effect: {
                player(card, player, target) {
                    if (card?.storage?.xumou_jsrg) return [1, 1.5];
                    if (!get.is.damageCard(card) || !target) return;

                    let missOdds = 0;
                    if (card.name === "sha") {
                        missOdds = target.mayHaveShan(player, "use", null, "odds") || 0;
                    } else if (card.name === "juedou") {
                        missOdds = target.mayHaveSha(player, "respond", null, "odds") || 0;
                    } else if (["nanman", "wanjian"].includes(card.name)) {
                        if (card.name === "nanman") {
                            missOdds = target.mayHaveSha(player, "respond", null, "odds") || 0;
                        } else {
                            missOdds = target.mayHaveShan(player, "respond", null, "odds") || 0;
                        }
                    }
                    const loss = missOdds * 2;
                    return [1, -loss];
                },
            },
        },
        subSkill: {
            slient: {
                audio: false,
                trigger: {
                    player: ["shaMiss", "useCardToExcluded", "useCardToEnd", "eventNeutralized", "useCardAfter", "shaCancelled", "useCardToCancelled", "useCardToOmitted"],
                    source: ["damage", "damageCancelled", "damageZero"]
                },
                forced: true,
                filter(event, player, name) {
                    if (event.type !== "card") {
                        return false;
                    }
                    if (event.target != event.targets.at(-1)) return false
                    return get.is.damageCard(event.card) && event.target && !player.hasHistory("sourceDamage", (evt) => {
                        return evt.card === event.card && evt.getParent() === event;
                    });
                },
                async content(event, trigger, player) {
                    await player.loseMaxHp();
                },
            },
            success: {
                trigger: { global: "dyingBegin" },
                forced: true,
                filter(event, player) {
                    return event.player != player;
                },
                async content(event, trigger, player) {
                    const target = trigger.player;
                    player.awakenSkill("gbnongsun");
                    const cards = target.getCards("hej");
                    if (cards.length) await player.gain(cards, "gain2");
                },
            },
        },
    },
};
export default skills;
