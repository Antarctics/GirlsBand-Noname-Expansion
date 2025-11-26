import { lib, game, ui, get, ai, _status } from "../../../noname.js";
/** @type { importCharacterConfig['skill'] } */
const skills = {
    // 立希
    gblixi: {
        audio: "ext:GirlsBand/audio/skill:2",
        trigger: {
            player: "useCardToPlayer"
        },
        usable: 5,
        filter(event, player) {
            return event.isFirstTarget && player.countCards("h") > 0 && (event.card.name == "sha" || get.type(event.card, "trick") && get.tag(event.card, "damage"))
        },
        logTarget: "targets",
        multitarget: true,
        async cost(event, trigger, player) {
            event.result = await player.chooseCard("###立希###", "展示一张手牌令此牌伤害+1", 1, "h")
                .set("ai", (card) => {
                    let player = _status.event.player,
                        targets = _status.event.getParent(4).targets,
                        sgn = get.sgn(targets.reduce((num, target) => num += get.damageEffect(target, player, player), 0)),
                        cards = player.getCards("h").filter(c => !player.getStorage("gbxiwei_compare").some(card => card.numer == c.numer))
                    if (sgn > 0) {
                        if (cards.length) return cards.includes(card)
                        return true
                    }
                    return false
                })
                .forResult()
        },
        async content(event, trigger, player) {
            if (event.cards) {
                await player.showCards(event.cards).set("delay_time", 4)
                trigger.getParent().baseDamage++
                for (let target of trigger.targets.sortBySeat()) {
                    let list = []
                    if (target.canCompare(player)) list.push("选项一")
                    list.push("选项二")
                    let choiceList = ["与" + get.translation(player) + "拼点，若你赢，则你回复一点体力", "无法响应" + get.translation(event.card)]
                    let control = await target.chooseControl(list, true)
                        .set("prompt", "立袭")
                        .set('choiceList', choiceList)
                        .set("ai", () => {
                            let player = _status.event.player,
                                source = _status.event.source,
                                cards = source.getStorage("gbxiwei_compare")
                            if (player.hasSkill("gbzhaying") && player.countCards("j")) {
                                if (player.countCards("j", c => get.value(c) < 6 && !cards.some(card => card.numer > c.num))) return 0
                                return 1
                            }
                            if (player.hasSkill("gbxinshen") && player.hasExpansions("gbxinshen")) {
                                if (player.getExpansions("gbxinshen").filter(c => get.value(c) < 6 && !cards.some(card => card.numer > c.num)).length) return 0
                                return 1
                            }
                            if (player.countCards("h", c => get.value(c) < 6 && !cards.some(card => card.numer > c.num))) return 0
                            return 1
                        })
                        .set("source", player)
                        .forResult()
                    game.log(target, "选择了", "#g【立袭】", "的", "#y" + control.control)
                    switch (control.control) {
                        case "选项一":
                            let next = await target.chooseToCompare(player).forResult()
                            if (next && next.bool) {
                                await target.recover()
                            }
                            break
                        case "选项二":
                            trigger.directHit.add(target)
                            break
                    }
                }
            }
        },
        ai: {
            threaten: 1,
            expose: 0.2,
        }
    },
    gbxiwei: {
        audio: "ext:GirlsBand/audio/skill:3",
        charlotte: true,
        group: ["gbxiwei_draw", "gbxiwei_show"],
        subSkill: {
            draw: {
                audio: "gbxiwei",
                trigger: {
                    player: "showCardsBegin",
                },
                forced: true,
                async content(event, trigger, player) {
                    player.markAuto("gbxiwei_compare", trigger.cards)
                    player.addTempSkill("gbxiwei_compare")
                    player.draw()
                }
            },
            show: {
                audio: "gbxiwei",
                trigger: {
                    target: "chooseToCompareBegin",
                },
                forced: true,
                async content(event, trigger, player) {
                    let result = await player.chooseCard("希威", "展示一张手牌", 1, true, "h")
                        .set("ai", (card) => {
                            let player = _status.event.player
                            let cards = player.getStorage("gbxiwei_compare")
                            if (!cards.includes(card)) return get.number(card)
                            return true
                        })
                        .forResult()
                    player.showCards(result.cards).set("delay_time", 4)
                }
            },
            compare: {
                audio: "gbxiwei",
                trigger: {
                    target: "chooseToCompareBegin",
                },
                onremove: true,
                mark: true,
                lastDo: true,
                intro: {
                    mark: function (dialog, storage, player) {
                        let cards = player.getCards("h").filter(card => storage.includes(card))
                        if (cards.length > 0) {
                            dialog.addText('本回合已展示手牌');

                            dialog.add([cards, 'vcard']);
                        } else dialog.addText('未展示手牌');
                    }

                },
                charlotte: true,
                async cost(event, trigger, player) {
                    event.result = await player.chooseCard("希威", "选择一张牌作为拼点结果。", true)
                        .set("filterCard", (card, player) => {
                            return player.getStorage("gbxiwei_compare").includes(card) && _status.event.getTrigger()?.ai(card, player)
                        })
                        .forResult()
                },
                async content(event, trigger, player) {
                    if (!trigger.fixedResult) trigger.fixedResult = {};
                    trigger.fixedResult[player.playerid] = event.cards[0];
                }
            },
        }
    },
    // 素世
    gbsumou: {
        audio: "ext:GirlsBand/audio/skill:3",
        trigger: {
            player: "phaseZhunbei"
        },
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget([1, 3], "###素谋###", "选择至多三名角色，令未选择的角色角色进行议事")
                .set("ai", (target) => {
                    let player = _status.event.player
                    if (ui.selected.targets.length >= (game.countPlayer() - 1)) return false
                    if (game.hasPlayer(p => p.isDamaged() && get.attitude(player, p) > 0)) return target.isDamaged() && get.attitude(player, target) > 0
                    return get.attitude(player, target) < 0
                })
                .forResult()
        },
        async content(event, trigger, player) {
            if (event.targets) {
                let target = game.filterPlayer(i => !event.targets.includes(i))
                if (target.length > 0) {
                    player.chooseToDebate(target)
                        .set("callback", () => {
                            const {
                                bool,
                                opinion,
                            } = event.debateResult;
                            let player = _status.event.player
                            let exclusion = event.getParent(2).targets.sortBySeat()
                            if (bool && opinion) {
                                if (opinion && ["red", "black"].includes(opinion)) {
                                    if (opinion == "red") for (let target of exclusion) target.recover()
                                    else for (let target of exclusion) if (target != player) player.gainPlayerCard(target)
                                }
                            }
                        })
                        .set("ai", (card) => {
                            let player = _status.event.player
                            let source = get.event("source")
                            let targets = _status.event.getParent(3).targets
                            if (get.attitude(player, source) > 0) {
                                if (targets.some(p => get.attitude(source, p) > 0)) return get.color(card) == "red"
                                else return get.color(card) == "black"
                            } else {
                                if (targets.some(p => get.attitude(player, p) > 0)) return get.color(card) == "red"
                                else return get.color(card) == "black"
                            }
                        })
                }
            }
        },
        ai: {
            threaten: 0.3,
            expose: 0.1,
        }
    },
    gbyingxiang: {
        audio: "ext:GirlsBand/audio/skill:3",
        trigger: {
            global: "chooseToDebateEnd"
        },
        filter(event, player) {
            let targets = game.players.filter(p => !event.targets.includes(p))
            return targets.some(target => player.canCompare(target))
        },
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget("###迎祥###", "与一名未参与议事的角色进行拼点")
                .set("filterTarget", (card, player, target) => get.event("targets").includes(target))
                .set("ai", (target) => {
                    let player = _status.event.player
                    let cards = player.getCards("h")
                    if (target.hasSkill("gbzhaying") && target.countCards("j")) {
                        if (target.countCards("j", c => !cards.some(card => card.numer > c.num))) return 0
                        return 1
                    }
                    if (target.hasSkill("gbxinshen") && target.hasExpansions("gbxinshen")) {
                        if (target.getExpansions("gbxinshen").filter(c => !cards.some(card => card.numer > c.num)).length) return 0
                        return 1
                    }
                    if (get.attitude(player, target) < 0) return 10
                    else return 1
                })
                .set("targets", game.players.filter(p => !trigger.targets.includes(p) && player.canCompare(p)))
                .forResult()
            if (!event.result.bool) event.trigger("gbfuming_fail")
        },
        async content(event, trigger, player) {
            let result = await player.chooseToCompare(event.targets[0])
                .set("ai", (card) => {
                    let player = _status.event.player
                    let source = get.event("source")
                    var addi = get.value(card) >= 8 && get.type(card) != "equip" ? -3 : 0;
                    if (source == player) return get.number(card) - get.value(card) / 3 + addi
                    if (source.hp < 4 && get.attitude(player, source) > 0) return -get.number(card) - get.value(card) / 3 + addi
                    return get.number(card) - get.value(card) / 3 + addi
                })
                .forResult()
            if (result) {
                if (result.bool) player.gainPlayerCard(event.targets[0])
                else player.damage(event.targets[0])
            }
        },
        ai: {
            threaten: 0.6,
            expose: 0.1
        }

    },
    gbfuming: {
        audio: "ext:GirlsBand/audio/skill:1",
        trigger: {
            player: "phaseZhunbei"
        },
        dutySkill: true,
        forced: true,
        mark: true,
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        onremove: "discard",
        skillAnimation: true,
        animationColor: "gbmygo",
        filter(event, player) {
            return player.countExpansions("gbfuming") >= 6
        },
        async content(event, trigger, player) {
            player.awakenSkill("gbfuming");
            game.log(player, "成功完成使命");
            player.popup("使命成功")
            let num = player.countExpansions("gbfuming")
            player.gainMaxHp()
            player.draw(num)
            player.gain(player.getExpansions("gbfuming"), "bySelf", "gain2")
            player.awakenSkill("gbyingxiang");
        },
        group: ["gbfuming_fail", "gbfuming_silent"],
        subSkill: {
            fail: {
                audio: "ext:GirlsBand/audio/skill:1",
                trigger: {
                    player: ["dying", "gbfuming_fail"]
                },
                forced: true,
                async content(event, trigger, player) {
                    game.log(player, "使命失败");
                    player.popup("使命失败")
                    let num = player.countExpansions("gbfuming")
                    player.awakenSkill("gbfuming");
                    for (let i = 0; i < num; i++) {
                        player.chooseDrawRecover();
                    }
                }
            },
            silent: {
                audio: "ext:GirlsBand/audio/skill:2",
                trigger: {
                    player: "gainBegin"
                },
                filter(event, player) {
                    return event.source && event.source != player
                },
                forced: true,
                async content(event, trigger, player) {
                    trigger.cancel()
                    player.addToExpansion(trigger.cards, "giveAuto").gaintag.add("gbfuming")
                    player.draw()
                }
            }
        }
    },
    // 乐奈
    gbduzou: {
        audio: "ext:GirlsBand/audio/skill:2",
        enable: "phaseUse",
        usable: 1,
        filter(event, player) {
            return player.countCards("he") > 0
        },
        position: "he",
        filterCard: true,
        selectCard: [1, Infinity],
        selectTarget: [1, Infinity],
        filterOk() {
            return ui.selected.cards.length === ui.selected.targets.length;
        },
        filterTarget: lib.filter.notMe,
        check(card) {
            let player = _status.event.player
            if (ui.selected.cards.length >= game.countPlayer(p => p != player)) return 0
            return 1 / get.value(card)
        },
        ai2(target) {
            let player = _status.event.player
            if (get.attitude(player, target) > 0) return 1
            return 10
        },
        multitarget: true,
        multiline: true,
        async content(event, trigger, player) {
            player.chooseToDebate(event.targets.add(player)).set("callback", () => {
                const {
                    bool,
                    red,
                    black,
                    targets
                } = event.debateResult;
                let same = red.some(tar => tar[0] == player) ? red.length : black.some(tar => tar[0] == player) ? black.length : 0
                player.gainMaxHp(same - 1)
                player.draw(targets.length - same)
            })
        },
        ai: {
            order: 7,
            threaten: 0.3,
            expose: 0.05,
            result: {
                player: 1
            }
        }
    },
    gblvefei: {
        audio: "ext:GirlsBand/audio/skill:4",
        trigger: {
            global: "chooseToDebateBegin",
        },
        filter(event, player) {
            return event.list.includes(player)
        },
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget([1, player.maxHp], get.translation(trigger.source || trigger.player) + "发起了议事，是否发动掠菲")
                .set("filterTarget", (card, player, target) => {
                    return _status.event.getTrigger().list.includes(target) && target != player && target.countCards("h") > 0
                })
                .set("prompt2", "选择至多" + get.cnNumber(player.maxHp) + "名参与议事的其他角色，分别展示其一张手牌，然后选择一张视为你展示的议事牌")
                .set("ai", (target) => {
                    let player = _status.event.player
                    if (get.attitude(player, target) <= 0) return 10
                    return 1
                })
                .forResult();
        },
        async content(event, trigger, player) {
            let cards = []
            for (let target of event.targets.sortBySeat()) {
                let card = await player.choosePlayerCard("掠菲", "展示" + get.translation(target) + "的一张手牌", "h", target, true).forResultCards()
                target.showCards(card)
                cards.addArray(card)
            }
            let card = await player.chooseButton(["掠菲", "选择一张视为你展示的议事牌", cards], true)
                .set("ai", (button) => {
                    return Math.random()
                })
                .forResult()
            if (card) {
                if (!trigger.fixedResult) trigger.fixedResult = [];
                trigger.fixedResult.push([player, card.links]);
            }
            player.when({
                global: "chooseToDebateAfter"
            })
                .then(() => {
                    if (!trigger.list.includes(player)) return
                    player.chooseBool("掠菲", "是否失去一点体力上限并获得" + get.translation(cards)).set("ai", () => {
                        let player = _status.event.player
                        return player.isDamaged()
                    })
                })
                .then(() => {
                    if (result && result.bool) {
                        player.loseMaxHp()
                        cards = cards.filter(card => targets.includes(get.owner(card)))
                        player.gain(cards, "gain2")
                        if (cards.length < 3) {
                            player.chooseCard("h", "重铸至多" + get.cnNumber(cards.length) + "张手牌", cards.length)
                        }
                    }
                })
                .then(() => {
                    if (result && result.bool) {
                        player.recast(result.cards)
                    }
                })
                .vars({
                    targets: event.targets,
                    cards: cards
                })
        },
        ai: {
            threaten: 0.8,
            expose: 0.2
        }
    },
    // 阿诺
    gbzhuyi: {
        audio: "ext:GirlsBand/audio/skill:3",
        trigger: {
            player: "phaseBegin"
        },
        charlotte: true,
        async cost(event, trigger, player) {
            event.result = await player
                .chooseButton([
                    get.prompt("gbzhuyi"),
                    [
                        [
                            ["judge", "跳过判定阶段，然后与一名其他角色进行拼点"],
                            ["draw", "跳过摸牌阶段，然后与一名其他角色进行议事"],
                            ["other", "跳过出牌阶段与弃牌阶段，然后令X名角色进行议事（X为你本回合你跳过的阶段数）"],
                        ],
                        "textbutton",
                    ],
                ])
                .set("ai", function (button) {
                    let player = _status.event.player
                    var num = 0;
                    if (ui.selected.buttons.some(i => i.link == "judge")) num += 1;
                    if (ui.selected.buttons.some(i => i.link == "draw")) num += 1;
                    if (ui.selected.buttons.some(i => i.link == "other")) num += 2;
                    if (Math.random() < 0.05) return false;
                    num += player.skipList.length;
                    const priority = {
                        judge: () => {
                            if (num + 1 < game.countPlayer() && player.countCards("j")) return 8
                            return 0
                        },
                        other: () => {
                            if (num + 2 < game.countPlayer() && game.hasPlayer(c => get.attitude(player, c) > 0)) return 9
                            return 0
                        },
                        draw: () => {
                            if (num + 1 < game.countPlayer() && game.hasPlayer(c => get.attitude(player, c) > 0)) return 10
                            return 0
                        },
                    };
                    return priority[button.link]() || 0;
                })
                .set("selectButton", [1, 3])
                .forResult()
            event.result.cost_data = event.result.links
        },
        async content(event, trigger, player) {
            let links = event.cost_data
            if (links.includes("judge")) {
                player.skip("phaseJudge")
                player.popup("逐翼①")
                game.log(player, "选择了", "#g【逐翼】", "的", "#y选项一")
                let result = await player.chooseTarget("逐翼", "请选择一名拼点目标", lib.filter.notMe, true)
                    .set("ai", (target) => {
                        let player = _status.event.player
                        if (get.attitude(player, target) > 0) return 10
                        else return 1
                    })
                    .forResult()
                if (result && player.canCompare(result.targets[0])) await player.chooseToCompare(result.targets[0])
            }
            if (links.includes("draw")) {
                player.skip("phaseDraw")
                player.popup("逐翼②")
                game.log(player, "选择了", "#g【逐翼】", "的", "#y选项二")
                let result = await player.chooseTarget("逐翼", "请选择一名议事目标", lib.filter.notMe, true)
                    .set("ai", (target) => {
                        let player = _status.event.player
                        if (get.attitude(player, target) > 0) return 10
                        else return 1
                    })
                    .forResult()
                if (result) await player.chooseToDebate([result.targets[0], player])
            }
            if (links.includes("other")) {
                player.skip("phaseUse")
                player.skip("phaseDiscard")
                player.popup("逐翼③")
                game.log(player, "选择了", "#g【逐翼】", "的", "#y选项三")
                let result = await player.chooseTarget("逐翼", "请选择X名议事目标", Math.min(player.skipList.length, game.countPlayer()), true)
                    .set("ai", (target) => {
                        let player = _status.event.player
                        if (target == player) return false
                        if (get.attitude(player, target) > 0) return 10
                        else return 1
                    })
                    .forResult()
                if (result) await player.chooseToDebate(result.targets).set("ai", (card) => {
                    let player = _status.event.player
                    let source = get.event("source")
                    if (get.attitude(player, source) > 0) return get.color(card) == "red"
                    return get.color(card) == "black"
                })
            }
        },
        ai: {
            halfneg: true,
            combo: "gbhexian",
        }
    },
    gbhexian: {
        audio: "ext:GirlsBand/audio/skill:3",
        trigger: {
            player: "chooseToCompareBegin",
            target: "chooseToCompareBegin",
            global: "chooseToDebateBegin"
        },
        lastDo: true,
        filter(event, player) {
            if (event.name == "chooseToDebate") return event.list.includes(player)
            return true
        },
        prompt2: "摸两张牌并交给本次事件中的一名其他角色一张牌",
        async content(event, trigger, player) {
            player.draw(2)
            let result = await player.chooseCardTarget()
                .set("prompt", "和弦")
                .set("prompt2", "请选择一张牌交给参与本次事件的一名其他角色")
                .set("ai1", (card) => {
                    if (trigger.type == "compare") {
                        if (get.event("targetx").some(t => get.attitude(player, t) < 0 && t != player)) {
                            return -get.number(card) - get.value(card)
                        } else {
                            return 1 / get.value(card)
                        }
                    }
                    if (get.event("targetx").some(t => get.attitude(player, t) > 0 && t != player)) {
                        if (get.color(card) == "red") return get.value(card)
                        else return get.value(card) - 3
                    } else {
                        if (get.color(card) == "red") return 6 - get.value(card)
                        else return 4 - get.value(card)
                    }
                })
                .set("ai2", (target) => {
                    if (trigger.type == "compare") {
                        if (get.event("targetx").some(t => get.attitude(player, t) < 0 && t != player)) return get.attitude(player, target) < 0
                        else return get.attitude(player, target) > 0
                    } else {
                        if (get.event("targetx").some(p => get.attitude(player, p) > 0 && p != player)) return get.attitude(player, target) > 0
                        else return -get.attitude(player, target) < 0
                    }
                })
                .set("targetx", trigger.list || trigger.targets || [trigger.target, trigger.player])
                .set("forced", true)
                .set("filterTarget", (card, player, target) => {
                    return get.event("targetx").includes(target) && target != player
                })
                .forResult()
            if (result) {
                result.targets[0].gain(result.cards, "giveAuto")
                result.targets[0].showCards(result.cards)
                if (event.triggername != "chooseToDebateBegin") {
                    if (!trigger.fixedResult) trigger.fixedResult = {}
                    trigger.fixedResult[result.targets[0].playerid] = result.cards[0]
                } else {
                    if (!trigger.fixedResult) trigger.fixedResult = [];
                    trigger.fixedResult.push([result.targets[0], result.cards[0]]);
                }
            }
        },
        group: "gbhexian_debate",
        ai: {
            threaten: 0.2,
            expose: 0.1
        },
        subSkill: {
            debate: {
                audio: false,
                trigger: {
                    global: "chooseToDebateBegin"
                },
                filter(event, player) {
                    return !event.list.includes(player)
                },
                prompt2: "议事开始时，若议事角色中不包括你，则你可以参与议事",
                async content(event, trigger, player) {
                    trigger.list.add(player)
                    player.when({
                        global: "chooseToDebateAfter"
                    })
                        .then(() => {
                            const {
                                bool,
                                opinion,
                                targets
                            } = trigger.result;
                            if (bool && ["red", "black"].includes(opinion)) {
                                player.logSkill("gbhexian")
                                if (opinion == "red") player.when({
                                    global: "phaseEnd"
                                })
                                    .then(() => player.draw(1))
                                    .then(() => trigger.phaseList.splice(trigger.num, 0, "phaseUse|gbhexian"))
                                else {
                                    player.draw(2)
                                    player.loseHp()
                                }
                            }
                        })
                },
                ai: {
                    order: 6,
                    result: {
                        player: 1
                    }
                }
            }
        }
    },
    // 高松灯
    gbchunying: {
        audio: "ext:GirlsBand/audio/skill:3",
        enable: "phaseUse",
        zhuanhuanji: true,
        usable: 1,
        mark: true,
        marktext: "☯",
        intro: {
            content(storage, player, skill) {
                let str = !player.storage.gbchunying ?
                    `转换技，出牌阶段限一次，你可以展示一名其他角色的一张手牌，然后令其使用此牌与你拼点：若你赢，你获得所有拼点牌；若你没赢，此技能视为未使用过。` :
                    `转换技，出牌阶段限一次，你可以展示一名其他角色的一张手牌，然后令其使用此牌与你议事，若结果为：红色，你获得议事的牌；黑色，你摸两张牌；无结果：此技能视为未使用过。`;
                return str;
            },
        },
        filter(event, player) {
            return game.hasPlayer(p => p.countCards("h") > 0 && p != player)
        },
        filterTarget(card, player, target) {
            return target != player && target.countCards("h") > 0
        },
        async content(event, trigger, player) {
            let target = event.targets[0]
            let result = await player.choosePlayerCard("春影", "请选择" + get.translation(target) + "一张手牌", "h", target, true).forResult()
            if (result) {
                target.showCards(result.cards)
                target.when({
                    target: "chooseToCompareBegin",
                    global: "chooseToDebateBegin"
                })
                    .filter((event, player) => {
                        if (event.name == "chooseToDebate") return !event.directResult && player.getCards("h").includes(result.cards[0]) && event.list.includes(player)
                        return !event.directResult && player.getCards("h").includes(result.cards[0])
                    })
                    .then(() => {
                        if (event.triggername != "chooseToDebateBegin") {
                            if (!trigger.fixedResult) trigger.fixedResult = {}
                            trigger.fixedResult[player.playerid] = cardx[0]
                        } else {
                            if (!trigger.fixedResult) trigger.fixedResult = [];
                            trigger.fixedResult.push([player, cardx[0]]);
                        }
                    })
                    .vars({
                        cardx: result.cards
                    })
                if (!player.storage["gbchunying"]) {
                    if (player.canCompare(target)) {
                        let choice = await player.chooseToCompare(target)
                            .set("ai", (card) => {
                                let source = get.event("source")
                                var addi = get.value(card) >= 8 && get.type(card) != "equip" ? -3 : 0;
                                if (_status.event.player == source) return -get.number(card) - get.value(card) / 3 + addi
                                return get.number(card) - get.value(card) / 3 + addi
                            })
                            .forResult()
                        if (choice) {
                            if (choice.bool) player.gain([choice.player, choice.target].filterInD("d"), "giveAuto")
                            else delete player.getStat("skill").gbchunying
                        }
                    }
                } else {
                    player.chooseToDebate([target, player])
                        .set("ai", (card) => {
                            let player = _status.event.player
                            let source = get.event("player")
                            let cardx = get.event("cardx")
                            if (player == source) {
                                if (get.color(cardx) == "black") return get.color(card) == "black"
                                else return get.color(card) == "red"
                            } else {
                                return Math.random()
                            }
                        })
                        .set("cardx", result.cards[0])
                        .set("callback", () => {
                            const {
                                bool,
                                opinion,
                                red,
                                black
                            } = event.debateResult;
                            if (bool) {
                                if (opinion == "red") {
                                    let cards = []
                                    red.addArray(black).forEach(evt =>
                                        cards.add(evt[1])
                                    )
                                    player.gain(cards, "giveAuto", "log")
                                } else if (opinion == "black") {
                                    player.draw(2)
                                } else delete player.getStat("skill").gbchunying
                            }
                        })
                }
                player.changeZhuanhuanji("gbchunying")
            }
        },
        ai: {
            order: 7,
            expose: 0.25,
            threaten: 0.4,
            result: {
                player: 1,
                target(player, target) {
                    if (get.attitude(player, target) < 0) return 1 / -target.countCards("h")
                }
            }
        },
    },
    gbqilu: {
        audio: "ext:GirlsBand/audio/skill:2",
        trigger: {
            global: "phaseEnd"
        },
        filter(event, player) {
            return !player.isMaxHandcard()
        },
        logTarget: "targets",
        charlotte: true,
        async cost(event, trigger, player) {
            await player.draw()
            if (!game.hasPlayer(target => target != player && player.canCompare(target) && !player.getStorage("gbqilu_used").includes(target))) return
            event.result = await player.chooseTarget("歧路", "请选择一名其他角色进行拼点", true)
                .set("filterTarget", (card, player, target) => {
                    return target != player && player.canCompare(target) && !player.getStorage("gbqilu_used").includes(target)
                })
                .set("ai", (target) => {
                    let player = _status.event.player
                    if (target.hasSkill("gbxinshen") && get.attitude(player, target) < 0) return 0
                    return get.attitude(player, target) < 0
                })
                .forResult()
        },
        async content(event, trigger, player) {
            let target = event.targets[0]
            let result = await player.chooseToCompare(target).forResult()
            if (result) {
                if (result.bool) player.draw()
                else target.gainPlayerCard(player, true, "h")
            }
        },
        subSkill: {
            used: {
                onremove: true,
            }
        },
        ai: {
            threaten: 0.8,
            expose: 0.3,
        }
    },
    gbmizi: {
        audio: "ext:GirlsBand/audio/skill:2",
        trigger: {
            player: "compare",
            target: "compare",
        },
        zhuSkill: true,
        async cost(event, trigger, player) {
            event.result = await player.chooseControl(["增加", "减少", "cancel2"], true)
                .set("prompt", get.prompt("gbmizi"))
                .set("prompt2", "令当前点数增加或减少" + game.countPlayer(p => p.group == player.group))
                .set("ai", (event) => {
                    if (trigger.small) return "减少"
                    return "增加"
                })
                .forResult()
            event.result.cost_data = event.result.control
        },
        async content(event, trigger, player) {
            var num = game.countPlayer(p => p.group == player.group)
            if (event.cost_data != "cancel2") {
                if (event.cost_data == "减少") num = -num
                if (player == trigger.player) {
                    trigger.num1 = Math.min(Math.max(trigger.num1 + num, 1), 13)
                    game.log(player, "的拼点牌点数为" + trigger.num1);
                } else {
                    trigger.num2 = Math.min(Math.max(trigger.num2 + num, 1), 13)
                    game.log(player, "的拼点牌点数为" + trigger.num2);
                }
            } else {
                event.finish();
                return;
            }
        }
    },
    // 丰川祥子
    gbwuwang: {
        audio: false,
        trigger: {
            global: "phaseBefore",
            player: "enterGame",
        },
        filter(event, player) {
            return event.name != "phase" || game.phaseNumber == 0;
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard("勿忘", "请弃置3张手牌，然后获得5张【影】", "h", 3, true)
                .set("ai", (card) => 6 - get.value(card))
                .forResult()
        },
        async content(event, trigger, player) {
            await player.discard(event.cards)
            await player.gain(lib.card.ying.getYing(5))
        },
        mod: {
            ignoredHandcard(card, player) {
                if (card.name == "ying") return true
            },
            cardDiscardable(card, player, name) {
                if (name == "phaseDiscard" && card.name == "ying") {
                    return false;
                }
            },
        },
        group: ["gbwuwang_lose", "gbwuwang_gain"],
        subSkill: {
            lose: {
                audio: false,
                trigger: {
                    player: "loseAfter"
                },
                filter(event, player) {
                    return event.cards.some(card => card.name == "ying");
                },
                mod: {
                    aiValue(player, card, num) {
                        if (player.maxHp < 5 && card.name == "ying") return num + 2
                    }
                },
                forced: true,
                charlotte: true,
                async content(event, trigger, player) {
                    let cards = trigger.cards.filter(card => card.name == "ying")
                    for (let i = 0; i < cards.length; i++) {
                        await player.draw()
                        if (player.maxHp < 5) {
                            player.gainMaxHp()
                            player.recover()
                        }
                    }
                }
            },
            gain: {
                audio: false,
                trigger: {
                    player: "loseAfter"
                },
                filter(event, player) {
                    return event.cards.filter(card => card.name != "ying").length >= 2
                },
                forced: true,
                charlotte: true,
                async content(event, trigger, player) {
                    await player.gain(lib.card.ying.getYing())
                }
            }
        },
    },
    gbheming: {
        audio: false,
        trigger: {
            global: "roundStart"
        },
        forced: true,
        charlotte: true,
        mod: {
            aiValue(player, card, num) {
                if (card.name == "ying") return num + 3
            },
            aiUseful(player, card, num) {
                if (card.name == "ying" && player.countCards("h", c => c.name == "ying") > 0) return num + player.countCards("h", c => c.name == "ying") + 1
            }
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("貉鸣", "请展示至少一张【影】，或点取消展示所有手牌", [1, Infinity])
                .set("filterCard", (card) => card.name == "ying")
                .set("ai", (card) => {
                    let player = _status.event.player
                    let sel = ui.selected.cards.length
                    let num = Math.min(5, player.countCards("h", "ying"))
                    let priority = {
                        1: () => {
                            let val = 0
                            if (player.isDamaged()) val += 1
                            return val
                        },
                        2: () => {
                            let val = 0
                            if (!player.getEquip(3)) val += 2
                            return val
                        },
                        3: () => {
                            let val = 0
                            if (player.maxHp < 5) val += 1
                            if (player.hp <= 2) val += 1
                            return val
                        },
                        4: () => {
                            let val = 0
                            if (player.maxHp < 5) val += 1
                            if (player.hp <= 2) val += 2
                            val += 1
                            return val
                        },
                        5: () => {
                            let val = 0
                            if (player.maxHp < 5) val += 1
                            if (player.hp <= 2) val += 2
                            val += 2
                            return val
                        }
                    }
                    let max = 0
                    let seled = 0
                    for (let i = 1; i <= num; i++) {
                        if (priority[i]() > max) {
                            max = priority[i]()
                            seled = i
                        }
                    }
                    if (sel < seled) return true
                })
                .forResult()
            let num = 0
            if (result.bool) {
                await player.showCards(result.cards)
                num = result.cards.length
            } else {
                await player.showHandcards()
                num = player.countCards("h", card => card.name == "ying")
            }
            if (num == 1) player.loseMaxHp()
            if (num == 2) player.addTempSkill("gbheming_two", {
                global: "roundStart"
            })
            if (num > 2) {
                player.markAuto("gbheming_effect", num, false)
                player.addTempSkill("gbheming_effect", {
                    global: "roundStart"
                })
            }
        },
        ai: {
            threaten: 1,
        },
        subSkill: {
            two: {
                mod: {
                    globalTo(target, player, current) {
                        if (player.getEquip(3)) return current
                        else return current + 1
                    }
                },
                mark: "true",
                marktext: "貉",
                intro: {
                    name: "貉鸣",
                    markcount: () => 2,
                    content(storage, player, skill) {
                        let str = `你已展示2张【影】，视为拥有以下效果：`
                        str += "<br><li> 你视为装备+1马"
                        return str
                    }
                }
            },
            effect: {
                enable: ["chooseToUse", "chooseToRespond"],
                mark: "true",
                intro: {
                    markcount: (storage) => storage,
                    content(storage, player, skill) {
                        let num = storage
                        let str = `你已展示${num}张【影】，视为拥有以下效果：`
                        if (num > 4) {
                            str += "<br><li> 你可以将【影】当做任意基本牌或【火攻】使用或打出。"
                        } else if (num == 4) {
                            str += "<br><li> 你可以将【影】当做【杀】/【闪】/【酒】/【火攻】使用或打出"
                        } else if (num == 3) {
                            str += "<br><li> 你可以将【影】当做【酒】或【火攻】使用或打出"
                        }
                        return str
                    }
                },
                filter(event, player) {
                    var list = [];
                    let num = player.getStorage("gbheming_effect", 0)
                    for (var name of lib.inpile) {
                        if (num > 4) {
                            if (get.type(name) == "basic" || name == "huogong") list.push(name)
                        } else if (num == 4 && ["sha", "shan", "jiu", "huogong"].includes(name)) list.push(name)
                        else if (num == 3 && ["jiu", "huogong"].includes(name)) list.push(name)
                    }
                    return player.countCards("hs", card => card.name == "ying") && player.getStorage("gbheming_effect", 0) > 2 && list.some(name => _status.event.filterCard({
                        name: name
                    }, player, event))
                },
                hiddenCard(player, name) {
                    var list = [];
                    let num = player.getStorage("gbheming_effect", 0)
                    for (var name of lib.inpile) {
                        if (num > 4 && get.type(name) == "basic" || name == "huogong") list.push(name)
                        else if (num == 4 && ["sha", "shan", "jiu", "huogong"].includes(name)) list.push(name)
                        else if (num == 3 && ["jiu", "huogong"].includes(name)) list.push(name)
                    }
                    if (list.includes(name)) return player.countCards("h", "ying") > 0
                },
                onremove: true,
                chooseButton: {
                    dialog(event, player) {
                        var list = [];
                        let num = player.getStorage("gbheming_effect", 0)
                        for (var name of lib.inpile) {
                            if (num > 4 && get.type(name) == "basic" || name == "huogong") list.push(name)
                            else if (num == 4 && ["sha", "shan", "jiu", "huogong"].includes(name)) list.push(name)
                            else if (num == 3 && ["jiu", "huogong"].includes(name)) list.push(name)
                        }
                        return ui.create.dialog("貉鸣", [list, "vcard"]);
                    },
                    filter(button, player) {
                        return _status.event.getParent().filterCard({
                            name: button.link[2]
                        }, player, _status.event.getParent());
                    },
                    backup(links, player) {
                        return {
                            audio: false,
                            filterCard: {
                                name: "ying"
                            },
                            position: "hs",
                            viewAs: {
                                name: links[0][2]
                            },
                            ai1(card) {
                                if (player.countCards("hes", {
                                    name: links[0][2]
                                }) > 0) return false
                                if (links[0][2] == "huogong") return Math.random() * 20 - player.getUseValue({
                                    name: "huogong"
                                })
                                return true;
                            },
                        };
                    },
                    prompt(links, player) {
                        return "将一张【影】当做" + get.translation(links[0][2]) + "使用";
                    },
                },
                ai: {
                    save: true,
                    respondSha: true,
                    respondShan: true,
                    respondTao: true,
                    skillTagFilter(player, tag, arg) {
                        if (!player.countCards("h", "ying")) return false;
                        let num = player.getStorage("gbheming_effect", 0)
                        switch (tag) {
                            case "save":
                                return num > 2
                            case "respondTao":
                                return num > 4
                            case "respondShan":
                                return num > 4
                            case "respondSha":
                                return num > 3
                        }
                    },
                    order: 6,
                    result: {
                        player: 1
                    },
                },
            }
        }
    },
    gbsongyue: {
        audio: false,
        zhuSkill: true,
        trigger: {
            global: "phaseEnd"
        },
        filter(event, player) {
            return event.player.group == player.group && event.player != player && event.player.getHistory("lose", evt => evt.type == "discard").reduce((num, evt2) => num + evt2.cards.filter(card => card.name != "ying").length, 0) > 2
        },
        async content(event, trigger, player) {
            await player.gain(lib.card.ying.getYing(1))
        }
    },
    // 若叶睦
    gbmoying: {
        audio: false,
        enable: "phaseUse",
        usable: 1,
        async content(event, trigger, player) {
            let result = await player.chooseTarget("墨影", "选择至多三名其他角色", [1, 3], true)
                .set("filterTarget", lib.filter.notMe)
                .set("ai", (target) => {
                    let player = _status.event.player
                    if (get.attitude(player, target) < 0) {
                        if (target.getEquip("bagua")) return 0.25
                        if (target.getEquip("rewrite_bagua")) return 0.5
                        return target.countCards("hs") / 4
                    }
                })
                .forResult()
            if (result && result.bool) {
                for (let target of result.targets.sortBySeat()) {
                    let next = await target.chooseControlList("墨影", [`令${get.translation(player)}摸一张牌，然后本回合无法响应其使用的牌`, `令${get.translation(player)}弃置任意张牌，然后本回合不能使用或打出与以此法弃置牌花色相同的牌`], true)
                        .set("ai", () => {
                            let player = _status.event.player
                            if (player.countCards("hes") > 2 && Math.random() < 0.3) return 1
                            if ((player.getEquip("bagua") || player.getEquip("rewrite_bagua")) && Math.random() > 0.3) return 1
                            return 0
                        })
                        .forResult()
                    switch (next.control) {
                        case "选项一":
                            player.draw()
                            target.markAuto("gbmoying_effect", player)
                            target.addTempSkill("gbmoying_effect")
                            game.log(target, "选择了", "#g【墨影】", "的", "#y选项一")
                            break
                        case "选项二":
                            let next = await player.chooseToDiscard([1, Infinity]).set("ai", (card) => {
                                let player = _status.event.player
                                let cards = player.getCards("he", card => get.value(card) <= 4).sort((a, b) => get.value(a) - get.value(b))
                                let suits = cards.filter(c => !player.getHistory("lose", evt => evt.getParent(2).name == "gbmoying").map(evt => evt.cards).flat().reduce((suit, card) => suit.add(get.suit(card)), []).includes(get.suit(c)))
                                if (suits.length) {
                                    if ((player.hasSkill("gbfuxi") && player.countSkill("gbfuxi") < lib.skill.gbfuxi.usable) || (player.hasSkill("gbduoluo") && player.countSkill("gbduoluo") < lib.skill.gbduoluo.usable)) {
                                        if (suits.some(c => get.color(c) == "black")) return card == suits.filter(c => get.color(c) == "black")[0]
                                        return suits.slice(0, 2).includes(card)
                                    }
                                    return suits[0] == card
                                } else {
                                    if ((player.hasSkill("gbfuxi") && player.countSkill("gbfuxi") < lib.skill.gbfuxi.usable) || (player.hasSkill("gbduoluo") && player.countSkill("gbduoluo") < lib.skill.gbduoluo.usable)) {
                                        if (cards.some(c => get.color(c) == "black")) return card == suits.filter(c => get.color(c) == "black")[0]
                                        return cards.slice(0, 2).includes(card)
                                    }
                                    return cards[0] == card
                                }
                            }).forResult()
                            target.markAuto("gbmoying_discard", next.cards)
                            target.addTempSkill("gbmoying_discard")
                            game.log(target, "选择了", "#g【墨影】", "的", "#y选项二")
                            break
                    }
                }
            }

        },
        ai: {
            threaten: 1,
            expose: 0.3,
            order: 8,
            result: {
                player: 1
            }
        },
        subSkill: {
            effect: {
                audio: false,
                trigger: {
                    target: "useCardToTargeted"
                },
                forced: true,
                filter(event, player) {
                    return player.getStorage("gbmoying_effect").includes(event.player)
                },
                async content(event, trigger, player) {
                    trigger.directHit.add(player)
                }
            },
            discard: {
                onremove: true,
                mod: {
                    cardEnabled2(card, player) {
                        if (player.getStorage("gbmoying_discard").includes(get.suit(card))) return false;
                    },
                },
            }
        }
    },
    gbfuxi: {
        audio: false,
        trigger: {
            player: "discardAfter"
        },
        usable: 2,
        filter(event, player) {
            return event.cards.length >= 2 || event.cards.some(card => get.color(card) == "black" && card.original == "h")
        },
        locked: false,
        mod: {
            cardUsableTarget(card, player, target) {
                if (target.hasSkill("gbfuxi_effect")) return true;
            },
            targetInRange(card, player, target) {
                if (target.hasSkill("gbfuxi_effect")) return true;
            },
        },
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(get.prompt2("gbfuxi"), true)
                .set("filterTarget", (card, player, target) => {
                    return lib.filter.targetEnabledx({
                        name: "sha",
                        nature: "thunder"
                    }, player, target)
                })
                .set("ai", (target) => {
                    let player = _status.event.player
                    return get.attitude(player, target) < 0
                })
                .forResult()
        },
        async content(event, trigger, player) {
            if (player.canUse({
                name: "sha",
                nature: "thunder"
            }, event.targets[0], false, false)) {
                let next = player.useCard({
                    name: "sha",
                    nature: "thunder"
                }, event.targets[0], false)
                player.when({
                    source: "damageEnd"
                })
                    .filter((event, player) => {
                        return event.card == next.card
                    })
                    .then(() => {
                        trigger.player.addTempSkill("gbfuxi_effect")
                    })
            }
        },
        ai: {
            threaten: 1,
            expose: 0.3,
        },
        subSkill: {
            effect: {
                onremove: true,
                mark: true,
                intro: {}
            }
        }
    },
    gbzicheng: {
        audio: false,
        trigger: {
            player: "phaseDiscardEnd"
        },
        forced: true,
        async content(event, trigger, player) {
            player.gain(lib.card.ying.getYing(Math.min(player.getHistory("sourceDamage")?.reduce((num, evt) => num += evt.num, 0), 3)))
        },
        group: 'gbzicheng_effect',
        subSkill: {
            effect: {
                audio: false,
                enable: ['chooseToUse', 'chooseToRespond'],
                filter(event, player) {
                    var list = ['sha', 'shan'];
                    return player.countCards("hs", card => card.name == "ying") && list.some(name => event.filterCard({
                        name: name
                    }, player, event))
                },
                chooseButton: {
                    dialog(event, player) {
                        var list = ['sha', 'shan'];
                        return ui.create.dialog("自成", [list, "vcard"]);
                    },
                    filter(button, player) {
                        return _status.event.getParent().filterCard({
                            name: button.link[2]
                        }, player, _status.event.getParent());
                    },
                    backup(links, player) {
                        return {
                            audio: false,
                            filterCard: {
                                name: "ying"
                            },
                            position: "hs",
                            viewAs: {
                                name: links[0][2]
                            },
                            ai1(card) {
                                if (player.countCards("hes", {
                                    name: links[0][2]
                                }) > 0) return false
                                return true;
                            },
                        };
                    },
                    prompt(links, player) {
                        return "将一张【影】当做" + get.translation(links[0][2]) + "使用";
                    },
                },
                ai: {
                    respondSha: true,
                    respondShan: true,
                    skillTagFilter(player, tag, arg) {
                        if (!player.countCards("h", "ying")) return false;
                    },
                    order: 6,
                    result: {
                        player: 1
                    },
                },
            }
        }
    },
    // 三角初华
    gbbeihua: {
        audio: "ext:GirlsBand/audio/skill:5",
        trigger: {
            global: "phaseBefore",
            player: ["enterGame", "phaseZhunbeiBegin"]
        },
        logAudio(event, player, name) {
            if (name == "phaseZhunbeiBegin") return "ext:GirlsBand/audio/skill/gbbeihua" + get.rand(3, 5)
            return "ext:GirlsBand/audio/skill/gbbeihua" + get.rand(1, 2)
        },
        forced: true,
        mark: true,
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
        filter(event, player) {
            return event.name == "phaseZhunbei" || game.phaseNumber == 0;
        },
        async content(event, trigger, player) {
            if (event.triggername != "phaseZhunbeiBegin") {
                player.draw(6)
                event.finish()
            }
            let next = player.addToExpansion(player.getCards("h"), "giveAuto")
            next.gaintag.add("gbbeihua")
            await next
            player.gain(lib.card.ying.getYing(player.countCards("x")));
        },
    },
    gbxianzhong: {
        audio: "ext:GirlsBand/audio/skill:3",
        enable: "phaseUse",
        filterCard: true,
        selectCard: 2,
        position: "h",
        check(card) {
            let player = _status.event.player
            let h = player.getCards("h")
            if (h.removeArray(ui.selected.cards).filter(c => c.name == "ying").length < 1) return false
            return 3 - get.value(card)
        },
        filter(event, player) {
            return player.hasExpansions("gbbeihua")
        },
        async content(event, trigger, player) {
            let result = await player.chooseButton(["献忠", [player.getExpansions("gbbeihua"), "card"]], true)
                .set("ai", (button) => {
                    let val = player.hasUseTarget(button.link) ? get.value(button.link) : 1
                    if (!player.countCards("h", card => card.suit == button.link.suit)) val += 1
                    return val
                })
                .forResult()
            if (result.bool) {
                await player.gain(result.links[0], "bySelf", "giveAuto", "log")
                let target = await player.chooseTarget("献忠", "视为对一名角色使用【火攻】", true)
                    .set("filterTarget", (card, player, target) => lib.filter.targetEnabledx({
                        name: "huogong"
                    }, player, target))
                    .set("ai", (target) => {
                        let player = _status.event.player
                        return get.attitude(player, target) < 0
                    })
                    .forResult()
                if (target.bool) {
                    player.useCard({
                        name: "huogong"
                    }, target.targets[0])
                }
            }
        },
        ai: {
            order: 5,
            result: {
                player(player, target) {
                    if (player.countCards("h", card => get.value(card) < 3) > 1) return 1
                    return 0
                }
            },
            threaten: 0.5,
            expose: 0.15,
        },
    },
    gbchenggu: {
        audio: "ext:GirlsBand/audio/skill:5",
        logAudio: index => (typeof index === "number" ? "ext:GirlsBand/audio/skill/gbchenggu" + index : "ext:GirlsBand/audio/skill/gbchenggu1"),
        popup: false,
        trigger: {
            player: "phaseDiscardEnd",
            source: "damageBegin1",
        },
        mod: {
            aiUseful(player, card, num) {
                if (card.name == "ying") {
                    return num + 4
                }
            },
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseBool("成孤", "是否展示所有手牌")
                .set("ai", () => {
                    let player = _status.event.player
                    if (player.hasCard("ying")) {
                        if (event.triggername == "phaseDiscardEnd") return true
                        if (player.countCards("h", card => card.name == "ying") > 3) return false
                        return true
                    }
                })
                .forResult()
        },
        async content(event, trigger, player) {
            player.logSkill(event.name, null, null, null, [1])
            await player.showCards(player.getCards("h"))
            if (player.hasCard("ying")) {
                let result = await player.chooseBool("成孤", "是否弃置所有的【影】")
                    .set("ai", () => {
                        let player = _status.event.player
                        if (player.countCards("h", card => card.name == "ying") > 3) return false
                        return true
                    })
                    .forResult()
                if (result.bool) {
                    let yings = player.getCards("h", card => card.name == "ying")
                    let num = Math.min(3, yings.length)
                    await player.discard(yings)
                    let list = []
                    if (event.triggername == "damageBegin1") list.push("选项一")
                    if (player.hasExpansions("gbbeihua")) list.push("选项二")
                    list.push("选项三")
                    let choice = await player.chooseControl(list, true)
                        .set("prompt", "成孤")
                        .set("choiceList", ["令此次伤害+1", "获得所有的『悲华』", "令一名角色弃X张牌或摸X张牌"])
                        .set("ai", function () {
                            let player = _status.event.player
                            let sort = {
                                选项一: get.attitude(player, trigger.player) > 0 ? 0 : trigger.player.hasSkillTag("filterDamage", null, {
                                    player: player,
                                    card: trigger.card
                                }) ? 0 : trigger.player.hp <= trigger.num + 1 ? 2.1 : 1.1,
                                选项二: player.hasExpansions("gbbeihua") ? player.countExpansions("gbbeihua") / 3 : 0,
                                选项三: num
                            }
                            return _status.event.controls.sort((a, b) => sort[b] - sort[a])[0]
                        })
                        .forResult()
                    if (choice.control) {
                        game.log(player, "选择了", "#g【成孤】", "的", "#y" + choice.control)
                        switch (choice.control) {
                            case "选项一":
                                player.logSkill(event.name, null, null, null, [2])
                                trigger.num++
                                break
                            case "选项二":
                                player.logSkill(event.name, null, null, null, [3])
                                player.gain(player.getExpansions("gbbeihua"), "bySelf", "giveAuto", "log")
                                break
                            case "选项三":
                                let result = await player.chooseTarget(`成孤`, `令一名角色摸${num}张牌或弃置${num}张牌`, true)
                                    .set("ai", function (target) {
                                        let player = _status.event.player
                                        var att = get.attitude(player, target);
                                        if (att > 0 || target.countCards("he") == 0) return get.effect(target, {
                                            name: "draw"
                                        }, player, player);
                                        return get.effect(target, {
                                            name: "guohe_copy2"
                                        }, target, player);
                                    })
                                    .forResult()
                                if (result.bool) {
                                    if (!result.targets[0].countCards("he")) result.targets[0].draw(num)
                                    let choice = await player
                                        .chooseControl("摸牌", "弃牌")
                                        .set("prompt", "###成孤###")
                                        .set("prompt2", "令" + get.translation(result.targets[0]) + "…")
                                        .set("ai", function (event, player) {
                                            return get.attitude(player, result.targets[0]) > 0 ? 0 : 1;
                                        })
                                        .forResult()
                                    if (choice.control == "摸牌") {
                                        player.logSkill(event.name, null, null, null, [4])
                                        result.targets[0].draw(num)
                                    }
                                    else {
                                        player.logSkill(event.name, null, null, null, [5])
                                        result.targets[0].chooseToDiscard("he", true, num)
                                    }
                                }
                                break
                        }
                    }
                }
            }
        },
        ai: {
            threaten: 0.6,
        },
    },
    // 喵梦
    gbmiaomeng: {
        audio: false,
        trigger: {
            global: "phaseBefore",
            player: "enterGame"
        },
        forced: true,
        locked: false,
        filter(event, player) {
            return event.name != "phase" || game.phaseNumber == 0;
        },
        async content(event, trigger, player) {
            player.draw(3)
            let result = await player.chooseCardTarget()
                .set("selectCard", [1, 3])
                .set("selectTarget", () => ui.selected.cards.length)
                .set("filterTarget", (card, player, target) => !target.hasExpansions("gbmiaomeng_fire"))
                .set("prompt", "喵梦")
                .set("prompt2", "将至多三张牌置于等量名角色的武将牌上，称为『火』")
                .set("forced", true)
                .set("ai1", (card) => {
                    let player = _status.event.player
                    if (ui.selected.cards.length > game.countPlayer(p => get.attitude(player, p) <= 0)) return 0
                    return 6 - get.value(card)
                })
                .set("ai2", (target) => {
                    let player = _status.event.player
                    if (get.attitude(player, target) <= 0) return 10
                    return 1
                })
                .forResult()
            if (result.bool) {
                for (let i = 0; i < result.cards.length; i++) {
                    result.targets[i].addToExpansion(result.cards[i], "giveAuto").gaintag.add("gbmiaomeng_fire")
                }
            }
        },
        ai: {
            threaten: 0.6,
            expose: 0.3
        },
        group: "gbmiaomeng_fire",
        subSkill: {
            fire: {
                audio: false,
                trigger: {
                    global: "phaseBegin"
                },
                filter(event, player) {
                    return event.player.hasExpansions("gbmiaomeng_fire")
                },
                forced: true,
                mark: "auto",
                marktext: "火",
                intro: {
                    markcount: "expansion",
                    content: "expansion",
                    name: "火",
                },
                async content(event, trigger, player) {
                    let list = []
                    list.push("获得『火』并失去一点体力")
                    list.push(`令${get.translation(player)}获得『火』并摸一张牌。`)
                    let result = await trigger.player.chooseControlList("###喵梦###", list, true)
                        .set("ai", (event, player) => {
                            if (get.effect(player, {
                                name: "losehp"
                            }, player, player) > 0) return 0
                            if (_status.event.getParent().player == player) return 1
                            if (player.hp + player.num("h", "tao") > 3) return player.getExpansions("gbmiaomeng_fire").reduce((num, card) => num + get.value(card), 0) > 6
                            else return 1
                        })
                        .forResult()
                    if (result) {
                        game.log(trigger.player, "选择了", "#g【喵梦】", "的", "#y" + result.control)
                        if (result.control == "选项一") {
                            await trigger.player.gain(trigger.player.getExpansions("gbmiaomeng_fire"), "log")
                            trigger.player.loseHp()
                            if (!trigger.player.hasExpansions("gbmiaomeng_fire")) trigger.player.unmarkSkill("gbmiaomeng_fire")
                        } else {
                            await player.gain(trigger.player.getExpansions("gbmiaomeng_fire"), "giveAuto")
                            if (!trigger.player.hasExpansions("gbmiaomeng_fire")) trigger.player.unmarkSkill("gbmiaomeng_fire")
                            player.draw()
                        }
                    }
                }
            }
        }
    },
    gbchuanting: {
        audio: false,
        enable: "phaseUse",
        usable: 1,
        filterCard: true,
        filterTarget: true,
        selectTarget() {
            return ui.selected.cards.length
        },
        selectCard: [1, Infinity],
        filterOk() {
            return ui.selected.cards.length == ui.selected.targets.length
        },
        position: "he",
        lose: false,
        check(card) {
            var player = _status.event.player;
            if (ui.selected.cards.length < game.countPlayer(target => (get.attitude(player, target) < 0 && !target.hasExpansions("gbmiaomeng_fire")) || (get.attitude(player, target) > 0 && target.hasExpansions("gbmiaomeng_fire")))) return 1
            return 0
        },
        ai2(target) {
            var player = _status.event.player;
            return (get.attitude(player, target) < 0 && !target.hasExpansions("gbmiaomeng_fire")) || (get.attitude(player, target) > 0 && target.hasExpansions("gbmiaomeng_fire")) || target == player
        },
        multitarget: true,
        multiline: true,
        async content(event, trigger, player) {
            await player.chooseToDebate(event.targets)
                .set("callback", async (event, trigger, player) => {
                    const {
                        bool,
                        opinion,
                        targets
                    } = event.debateResult;
                    if (opinion != "black") {
                        for (let target of targets.sortBySeat()) {
                            target.draw()
                            if (!target.hasExpansions("gbmiaomeng_fire")) {
                                let card = await target.chooseCard("传庭", "选择一张牌置于武将牌上，称为『火』", 1, "he", true)
                                    .set("ai", (card) => {
                                        return 6 - get.value(card)
                                    })
                                    .forResultCards()
                                if (card.length) target.addToExpansion(card[0]).gaintag.add("gbmiaomeng_fire")
                            }
                        }
                    }
                    if (opinion != "red") {
                        player.gain(lib.card.ying.getYing(player.hp))
                    }
                })
                .set("ai", (card) => {
                    let player = _status.event.player
                    if (player.hasExpansions("gbmiaomeng_fire")) return get.color(card) == "red"
                    return get.color(card) == "black"
                })
        },
        ai: {
            order: 6,
            result: {
                player: 1
            }
        }
    },
    gbruoye: {
        audio: false,
        enable: "phaseUse",
        usable: 2,
        filterCard: {
            name: "ying"
        },
        filterTarget(card, player, target) {
            if (ui.selected.targets.length == 1) return target.hasExpansions("gbmiaomeng_fire")
            return player.canUse({
                name: "sha"
            }, target, true, false)
        },
        selectCard() {
            let player = _status.event.player
            if (ui.selected.targets.length < 2 && player.hasSkill("gbruoye_1")) return 1
            if (ui.selected.targets.length < 2 && player.hasSkill("gbruoye_2")) return 0
            if (ui.selected.targets.length > 1) return 0
            return [0, 1]
        },
        selectTarget() {
            if (ui.selected.cards.length > 0) return 1
            if (ui.selected.targets.length == 1 && ui.selected.targets[0].hasExpansions("gbmiaomeng_fire")) return [1, 2]
            return 2
        },
        targetprompt() {
            if (ui.selected.targets.length == 1 && ui.selected.cards.length > 0) return "出杀目标"
            if (ui.selected.targets.length == 1 && ui.selected.targets[0].hasExpansions("gbmiaomeng_fire")) return "出杀目标<br>弃『火』"
            if (ui.selected.targets.length == 1 && !ui.selected.targets[0].hasExpansions("gbmiaomeng_fire")) return "出杀目标"
            return "弃『火』"
        },
        complexTarget: true,
        complexCard: true,
        complexSelect: true,
        ai1() {
            return true
        },
        ai2(target) {
            let player = _status.event.player
            if (ui.selected.targets.length == 0) return get.effect(target, {
                name: "sha"
            }, player, player) > 0
            if (ui.selected.targets.length == 1) {
                if (get.effect(ui.selected.targets[0], {
                    name: "sha"
                }, player, player) > get.effect(target, {
                    name: "losehp"
                }, player, player)) return true
                if (get.effect(ui.selected.targets[0], {
                    name: "sha"
                }, player, player) > get.effect(ui.selected.targets[0], {
                    name: "losehp"
                }, player, player)) return false
            }
        },
        multitarget: true,
        multiline: true,
        async content(event, trigger, player) {
            if (event.targets.length > 1) {
                let result = await player.chooseButton(["若叶", "移去一张火", [event.targets[1].getExpansions("gbmiaomeng_fire"), "card"]], true)
                    .set("ai", (button) => get.value(button.link))
                    .forResult()
                if (result.bool) {
                    await event.targets[1].discard(result.links[0], player, "giveAuto")
                    if (!event.targets[1].hasExpansions("gbmiaomeng_fire")) event.targets[1].unmarkSkill("gbmiaomeng_fire")
                    player.addTempSkill("gbruoye_1")
                }
            } else if (event.targets.length == 1 && event.cards.length == 0) {
                let result = await player.chooseButton(["若叶", "移去一张火", [event.targets[0].getExpansions("gbmiaomeng_fire"), "card"]], true)
                    .set("ai", (button) => get.value(button.link))
                    .forResult()
                if (result.bool) {
                    await event.targets[0].discard(result.links[0], player, "giveAuto")
                    if (!event.targets[0].hasExpansions("gbmiaomeng_fire")) event.targets[0].unmarkSkill("gbmiaomeng_fire")
                    player.addTempSkill("gbruoye_1")
                }
            } else {
                player.addTempSkill("gbruoye_2")
            }
            if (player.canUse({
                name: "sha"
            }, event.targets[0], true, false)) {
                player.useCard({
                    name: "sha"
                }, event.targets[0], false)
            }
        },
        subSkill: {
            1: {},
            2: {}
        },
        ai: {
            threaten: 0.8,
            expose: 0.3,
            order: 7,
            result: {
                player: 1
            }
        }
    },
    // 海玲
    gbxinshen: {
        audio: false,
        trigger: {
            global: ["phaseBefore", "phaseBegin"],
            player: "enterGame"
        },
        mark: "auto",
        marktext: "信",
        intro: {
            markcount: "expansion",
            content: "expansion"
        },
        charlotte: true,
        filter(event, player) {
            return (event.name == "phase" && !player.hasExpansions("gbxinshen")) || game.phaseNumber == 0;
        },
        prompt2: "你可以摸一张牌，然后将一张牌置于武将牌上，称为『信』",
        async content(event, trigger, player) {
            player.draw()
            let result = await player.chooseCard("信身", "将一张牌置于武将牌上，称为『信』", "he", true)
                .set("ai", card => 6 - get.value(card))
                .forResult()
            if (result.bool) {
                player.addToExpansion(result.cards, "giveAuto", "bySelf").gaintag.add("gbxinshen")
            }
        },
        group: "gbxinshen_debate",
        subSkill: {
            debate: {
                audio: false,
                trigger: {
                    global: ["chooseToDebateBegin", "chooseToEnsembleBegin"],
                    player: "chooseToCompareBegin",
                    target: "chooseToCompareBegin"
                },
                charlotte: true,
                filter(event, player) {
                    if (event.name == "chooseToCompare") return player.hasExpansions("gbxinshen")
                    return event.list.includes(player) && player.hasExpansions("gbxinshen")
                },
                async cost(event, trigger, player) {
                    event.result = await player.chooseButton(["信身", "选择一张『信』作为结果。", [player.getExpansions("gbxinshen"), "card"]], true)
                        .set("ai", (button) => get.number(button.link))
                        .forResult()
                    event.result.cost_data = event.result.links
                },
                async content(event, trigger, player) {
                    if (event.triggername != "chooseToDebateBegin") {
                        if (!trigger.fixedResult) trigger.fixedResult = {}
                        trigger.fixedResult[player.playerid] = event.triggername == "chooseToEnsembleBegin" ? event.cost_data : event.cost_data[0]
                    } else {
                        if (!trigger.fixedResult) trigger.fixedResult = [];
                        trigger.fixedResult.push([player, event.cost_data[0]]);
                    }
                }
            }
        }
    },
    gbyongling: {
        audio: false,
        enable: "phaseUse",
        filter(event, player) {
            return !player.hasSkill("gbyongling_used")
        },
        filterTarget(card, player, target) {
            return player.canCompare(target)
        },
        ai2(target) {
            let player = _status.event.player
            if (player.countCards("h") <= 1) return 0;
            if (get.attitude(player, target) > 0) {
                if (target.getCards("j")) return 1
                else return 0
            }
            if (target.countCards("hej") > 2) {
                return get.attitude(player, target) < 0
            }
            return 0;
        },
        async content(event, trigger, player) {
            player.addTempSkill("gbyongling_used")
            let result = await player.chooseToCompare(event.targets[0]).forResult()
            if (result.bool) {
                let num = 0
                if (event.targets[0].countCards("h")) num++;
                if (event.targets[0].countCards("e")) num++;
                if (event.targets[0].countCards("j")) num++;
                player.gainPlayerCard("hej", event.targets[0], num, true)
                    .set("filterButton", (button) => {
                        for (let i = 0; i < ui.selected.buttons.length; i++) {
                            if (get.position(button.link) == get.position(ui.selected.buttons[i].link)) return false;
                        }
                        return true;
                    })
                    .set("complexCard", true);
            } else {
                event.targets[0].gain(result.player, "log")
                event.targets[0].$gain2(result.player, "log")
            }
        },
        ai: {
            threaten: 0.6,
            expose: 0.15,
            order: 8,
        },
        subSkill: {
            used: {
                audio: false,
                onremove: true,
            }
        }
    },
    gbhaixi: {
        audio: false,
        trigger: {
            player: "compare",
            target: "compare"
        },
        charlotte: true,
        filter(event, player) {
            return player.countCards('he') > 0
        },
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseCardTarget()
                .set("prompt", "海希")
                .set("prompt2", "你可以弃置一张牌，将你或另一名目标角色的点数修改为8或9。")
                .set("position", "he")
                .set("target", [trigger.player, trigger.target])
                .set("filterTarget", (card, player, target) => _status.event.target.includes(target))
                .set("ai1", (card) => {
                    if (trigger.small) {
                        if (trigger.player == player) {
                            if (trigger.num1 < trigger.num2) return 0
                            if (trigger.num1 < 10) return 6 - get.value(card)
                            return 0
                        } else {
                            if (trigger.num1 > trigger.num2) return 0
                            if (trigger.num2 < 10) return 6 - get.value(card)
                            return 0
                        }
                    } else {
                        if (trigger.player == player) {
                            if (trigger.num1 > trigger.num2) return 0
                            if (trigger.num2 < 10) return 6 - get.value(card)
                            return 0
                        } else {
                            if (trigger.num1 < trigger.num2) return 0
                            if (trigger.num1 < 10) return 6 - get.value(card)
                            return 0
                        }
                    }
                })
                .set("ai2", (target) => {
                    if (trigger.small) {
                        if (trigger.player == player) {
                            if (trigger.num1 < 10) return target != player
                        } else {
                            if (trigger.num2 < 10) return target == player
                        }
                    } else {
                        if (trigger.player == player) {
                            if (trigger.num2 < 10) return target == player
                        } else {
                            if (trigger.num1 < 10) return target != player
                        }
                    }
                })
                .forResult()
        },
        async content(event, trigger, player) {
            let result = await player.chooseControl("8", "9", true)
                .set("prompt", "海希")
                .set("prompt2", `将${get.translation(event.targets[0])}的拼点牌点数修改为...`)
                .set("ai", (event) => {
                    let player = _status.event.player
                    if (trigger.small) {
                        if (trigger.player == player) {
                            if (trigger.num1 < 10) return "9"
                        } else {
                            if (trigger.num2 < 10) return "9"
                        }
                    } else {
                        if (trigger.player == player) {
                            if (trigger.num2 < 10) return "9"
                        } else {
                            if (trigger.num1 < 10) return "9"
                        }
                    }
                })
                .forResult()
            if (result) {
                player.discard(event.cards)
                trigger[event.targets[0] == trigger.player ? "num1" : "num2"] = Number(result.control)
                game.log(event.targets[0], "的拼点牌点数修改为", result.control);
                player.gain(lib.card.ying.getYing())
            }
        },
        group: "gbhaixi_ying",
        subSkill: {
            ying: {
                audio: false,
                charlotte: true,
                trigger: {
                    player: "compare",
                    target: "compare"
                },
                filter(event, player) {
                    return event.lose_list.some(i => i[0] == player && i[1][0].name == "ying")
                },
                async cost(event, trigger, player) {
                    event.result = await player.chooseToDiscard(get.prompt("gbhaixi"), "弃置" + get.cnNumber(player.countSkill("gbyongling") + 1) + "张牌令〖佣铃〗视为未发动过", player.countSkill("gbyongling") + 1, "he").set("ai", (card) => game.hasPlayer(p => _status.event.player.canCompare(p) && get.value(card) < 4)).forResult()
                },
                async content(event, trigger, player) {
                    player.removeSkill("gbyongling_used")
                },
                lastDo: true,
            }
        }
    },
    // Morits
    gbmuling: {
        audio: false,
        trigger: {
            global: "roundStart"
        },
        forced: true,
        locked: false,
        async content(event, trigger, player) {
            player.gain(lib.card.ying.getYing(2))
            let target = await player.chooseTarget("睦灵", "选择一名其他角色，然后获得其武将牌上的一个技能", true)
                .set("filterTarget", (card, player, target) => target != player)
                .set("ai", (target) => {
                    let player = _status.event.player
                    let list = game.players.map(p => p.getGainableSkills((info, skill) => !player.hasSkill(skill) && !info.limited && !info.juexingji && !info.zhuSkill && !info.persevereSkill && !info.unique && !info.dutySkill && !info.hiddenSkill)).flat().sort((a, b) => {
                        if (player.maxHp < 5) {
                            if (a === "gbwuwang" && b !== "gbwuwang") return -1;
                            if (b === "gbwuwang" && a !== "gbwuwang") return 1;
                        }
                        if (!player.hasShan()) {
                            if (a === "gbzicheng" && b !== "gbzicheng") return -1;
                            if (b === "gbzicheng" && a !== "gbzicheng") return 1;
                        }
                        if (!(player.countCards("h", c => c.name === "ying") > 3)) {
                            if (a === "gbheming" && b !== "gbheming") return -1;
                            if (b === "gbheming" && a !== "gbheming") return 1;
                        }
                        const order = ["gbfuxi", "gbruoye", "gbduzou", "gbyongling"];
                        const ia = order.indexOf(a);
                        const ib = order.indexOf(b);
                        if (ia !== -1 && ib !== -1) return ia - ib;
                        if (ia !== -1) return -1;
                        if (ib !== -1) return 1;
                        if (lib.translate[`${a}_info`].includes("【影】") && !lib.translate[`${b}_info`].includes("【影】")) return -1
                        if (lib.translate[`${b}_info`].includes("【影】") && !lib.translate[`${a}_info`].includes("【影】")) return 1
                        return get.skillRank(b, ["in", "out"]) - get.skillRank(a, ["in", "out"]);
                    })
                    return target == game.filterPlayer(p => p.hasSkill(list[0]))[0]
                })
                .forResultTargets()
            if (target) {
                let list = target[0].getGainableSkills((info, skill) => !player.hasSkill(skill) && !info.limited && !info.juexingji && !info.zhuSkill && !info.persevereSkill && !info.unique && !info.dutySkill && !info.hiddenSkill)
                const switchToAuto = function () {
                    _status.imchoosing = false;
                    if (event.dialog) event.dialog.close();
                    game.resume();
                    if (list.length == 0) {
                        event._result = {
                            bool: false
                        }
                    } else
                        event._result = {
                            bool: true,
                            skill: list.sort((a, b) => {
                                if (player.maxHp < 5) {
                                    if (a === "gbwuwang" && b !== "gbwuwang") return -1;
                                    if (b === "gbwuwang" && a !== "gbwuwang") return 1;
                                }
                                if (!player.hasShan()) {
                                    if (a === "gbzicheng" && b !== "gbzicheng") return -1;
                                    if (b === "gbzicheng" && a !== "gbzicheng") return 1;
                                }
                                if (!(player.countCards("h", c => c.name === "ying") > 3)) {
                                    if (a === "gbheming" && b !== "gbheming") return -1;
                                    if (b === "gbheming" && a !== "gbheming") return 1;
                                }
                                const order = ["gbfuxi", "gbruoye", "gbduzou", "gbyongling"];
                                const ia = order.indexOf(a);
                                const ib = order.indexOf(b);
                                if (ia !== -1 && ib !== -1) return ia - ib;
                                if (ia !== -1) return -1;
                                if (ib !== -1) return 1;
                                if (lib.translate[`${a}_info`].includes("【影】") && !lib.translate[`${b}_info`].includes("【影】")) return -1
                                if (lib.translate[`${b}_info`].includes("【影】") && !lib.translate[`${a}_info`].includes("【影】")) return 1
                                return get.skillRank(b, ["in", "out"]) - get.skillRank(a, ["in", "out"])
                            })[0]
                        }
                    return Promise.resolve(event._result);
                }
                const chooseSkill = function (list, player) {
                    const {
                        promise,
                        resolve
                    } = Promise.withResolvers();
                    const event = _status.event;
                    event.switchToAuto = function () {
                        _status.imchoosing = false;
                        if (event.dialog) event.dialog.close();
                        game.resume();
                        event._result = {
                            bool: true,
                            skill: list.sort((a, b) => {
                                if (player.maxHp < 5) {
                                    if (a === "gbwuwang" && b !== "gbwuwang") return -1;
                                    if (b === "gbwuwang" && a !== "gbwuwang") return 1;
                                }
                                if (!player.hasShan()) {
                                    if (a === "gbzicheng" && b !== "gbzicheng") return -1;
                                    if (b === "gbzicheng" && a !== "gbzicheng") return 1;
                                }
                                if (!(player.countCards("h", c => c.name === "ying") > 3)) {
                                    if (a === "gbheming" && b !== "gbheming") return -1;
                                    if (b === "gbheming" && a !== "gbheming") return 1;
                                }
                                const order = ["gbfuxi", "gbruoye", "gbduzou", "gbyongling"];
                                const ia = order.indexOf(a);
                                const ib = order.indexOf(b);
                                if (ia !== -1 && ib !== -1) return ia - ib;
                                if (ia !== -1) return -1;
                                if (ib !== -1) return 1;
                                if (lib.translate[`${a}_info`].includes("【影】") && !lib.translate[`${b}_info`].includes("【影】")) return -1
                                if (lib.translate[`${b}_info`].includes("【影】") && !lib.translate[`${a}_info`].includes("【影】")) return 1
                                return get.skillRank(b, ["in", "out"]) - get.skillRank(a, ["in", "out"])
                            })[0]
                        }
                        resolve(event._result);
                    }
                    var dialog = ui.create.dialog("forcebutton");
                    dialog.add("睦灵", "选择获得一项技能");
                    var clickItem = function () {
                        event._result = {
                            bool: true,
                            skill: this.link
                        };
                        game.resume();
                        if (event.dialog) event.dialog.close();
                        resolve(event._result);
                    };
                    for (let i = 0; i < list.length; i++) {
                        if (lib.translate[list[i] + "_info"]) {
                            var translation = get.translation(list[i]);
                            if (translation[0] == "新" && translation.length == 3) {
                                translation = translation.slice(1, 3);
                            } else {
                                translation = translation.slice(0, 2);
                            }
                            let item = dialog.add('<div class="popup pointerdiv" style="width:80%;display:inline-block"><div class="skill">【' + translation + "】</div><div>" + lib.translate[list[i] + "_info"] + "</div></div>")
                            item.firstChild.addEventListener("click", clickItem);
                            item.firstChild.link = list[i];
                        }
                    }
                    event.dialog = dialog
                    _status.imchoosing = true;
                    game.pause();
                    game.countChoose();
                    return promise;
                }
                let next
                if (!list.length) {
                    event.finish()
                    player.popup("无可选技能")
                    return
                } else if (list.length == 1) {
                    next = {
                        bool: true,
                        skill: list[0]
                    }
                } else if (event.isMine()) {
                    next = chooseSkill(list)
                } else if (event.isOnline()) {
                    const {
                        promise,
                        resolve
                    } = Promise.withResolvers();
                    event.player.send(chooseSkill, list, player);
                    event.player.wait(async result => resolve(result));
                    game.pause();
                    next = promise;
                } else {
                    next = switchToAuto();
                }
                let result = await next
                if (result.bool) {
                    game.broadcastAll(
                        function (player, result) {
                            player.addTempSkill(result.skill, {
                                global: "roundStart"
                            })
                        }, event.player, result)
                }
            }
        }
    },
    gbqiucun: {
        audio: false,
        charlotte: true,
        mod: {
            maxHandcard(player, num) {
                return player.maxHp
            },
            aiValue(player, card, num) {
                if (card == "ying") return num + 6
            },
            aiUseful(player, card, num) {
                if (card == "ying") return num + 6
            }
        },
        trigger: {
            player: "damageBegin4"
        },
        async cost(event, trigger, player) {
            let result = await player.chooseCard("求存")
                .set("prompt2", "弃置一张【影】并恢复一点体力，或点取消获得一张【影】并获得对你造成伤害的牌")
                .set("filterCard", (card) => card.name == "ying")
                .set("ai1", (card) => {
                    if (player.hp <= 2) return 6 - get.value(card)
                    else return 0
                })
                .forResult()
            if (result.bool) {
                event.result = {
                    bool: true,
                    cards: result.cards
                }
            } else {
                event.result = {
                    bool: true,
                }
            }
        },
        async content(event, trigger, player) {
            if (event.cards) {
                player.discard(event.cards)
                await player.recover()
            } else {
                player.gain(lib.card.ying.getYing(), "gain2")
                player.gain(trigger.cards, "gain2")
            }
        }
    },
    // 后藤一里
    gbjuxiang: {
        audio: false,
        trigger: {
            player: "phaseDiscardEnd"
        },
        filter(event, player) {
            return !player.hasSkill("gbjuxiang_count")
        },
        async content(event, trigger, player) {
            await player.draw(5)
            await player.chooseToDiscard(Math.min(game.countGroup(), 3), true, "he")
            player.addTempSkill("gbjuxiang_count")
        },
        group: "gbjuxiang_use",
        subSkill: {
            use: {
                audio: false,
                enable: "phaseUse",
                filter(event, player) {
                    return !player.hasSkill("gbjuxiang_count")
                },
                prompt: "你可以摸5张牌，然后弃置X张牌（X为场上的势力数且至多为3）。",
                async content(event, trigger, player) {
                    await player.draw(5)
                    await player.chooseToDiscard(Math.min(game.countGroup(), 3), true, "he")
                    player.addTempSkill("gbjuxiang_count")
                },
                ai: {
                    order: 6,
                    result: {
                        player(player, trigger, card) {
                            if (player.countCards("h") < 3) return 1
                            return 0
                        }
                    }
                }
            },
            count: {
                onremove: true,
            }
        },
        ai: {
            order: 6,
            result: {
                player: 1
            },
            effect: {
                target(card, player, target) {
                    if (target.hp > 1) return [1, -1]
                }
            }
        }
    },
    gbgudu: {
        audio: false,
        trigger: {
            target: "useCardToTarget"
        },
        filter(event, player) {
            return event.player != player
        },
        check(event, player) {
            if (get.attitude(player, event.player) > 0 || (player.hp < 2 && !get.tag(event.card, "damage"))) return false
            let evt = event.getParent(),
                directHit = (evt.nowuxie && get.type(event.card, "trick") === "trick") || (evt.directHit && evt.directHit.includes(player)) || (evt.customArgs && evt.customArgs.default && evt.customArgs.default.directHit2);
            if (get.tag(event.card, "respondSha")) {
                if (directHit || player.countCards("h", {
                    name: "sha"
                }) === 0) return true
            } else if (get.tag(event.card, "respondShan")) {
                if (directHit || player.countCards("h", {
                    name: "shan"
                }) === 0) return true
            } else if (get.tag(event.card, "damage")) {
                if (event.card.name === "huogong") return event.player.countCards("h") > 4 - player.hp - player.hujia;
                if (event.card.name === "shuiyanqijunx") return player.countCards("e") === 0;
                return true
            } else if (player.hp > 2) {
                if (event.card.name === "shunshou") return true
            }
            return false
        },
        async content(event, trigger, player) {
            await player.loseHp()
            if (player.isDead()) return
            let result = await player.chooseButton([
                get.prompt("gbgudu"),
                [
                    [
                        ["give", "交给一名其他角色一张牌并摸一张牌，然后令此牌对你无效"],
                        ["use", "发动一次〖橘箱〗"],
                    ],
                    "textbutton",
                ],
            ])
                .set("filterButton", function (button) {
                    let player = _status.event.player
                    if (button.link == "give") return player.countCards("he")
                    return true
                })
                .set("ai", function (button) {
                    let player = _status.event.player
                    switch (button.link) {
                        case "give":
                            if (game.hasPlayer(p => get.attitude(player, p) > 0)) return Math.random() * 4
                            return 0
                        case "use":
                            return 5 - Math.min(game.countGroup(), 3)
                    }
                })
                .forResult()
            if (result.bool) {
                if (result.links[0] == "give") {
                    let choice = await player.chooseCardTarget()
                        .set("forced", true)
                        .set("prompt", "孤独")
                        .set("prompt2", "请选择一张牌并交给一名其他角色")
                        .set("filterTarget", (card, player, target) => {
                            return target != player
                        })
                        .set("position", "he")
                        .set("ai1", (card) => {
                            let player = _status.event.player
                            if (game.hasPlayer(p => get.attitude(player, p) > 0)) return 7 - get.value(card)
                            else return 4 - get.value(card)
                        })
                        .set("ai2", (target) => {
                            let player = _status.event.player
                            if (game.hasPlayer(p => get.attitude(player, p) > 0)) {
                                if (get.attitude(player, target) > 0) return true
                                else false
                            } else true
                        })
                        .forResult()
                    if (choice.bool) {
                        await player.give(choice.cards, choice.targets[0], "giveAuto")
                        player.draw()
                        trigger.getParent().excluded.add(player);
                    }
                } else {
                    player.logSkill("gbjuxiang")
                    await player.draw(4)
                    await player.chooseToDiscard(Math.min(game.countGroup(), 3), true, "he")
                }
            }
        }
    },
    gbyingxiong: {
        audio: false,
        charlotte: true,
        trigger: {
            player: "dyingEnd"
        },
        usable: 1,
        filter(event, player) {
            return player.countCards("he") > 0
        },
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseCardTarget()
                .set("position", "he")
                .set("prompt", get.prompt2("gbyingxiong"))
                .set("ai1", (card) => 6 - get.value(card))
                .set("ai2", (target) => {
                    let player = _status.event.player
                    return get.attitude(player, target) < 0
                })
                .forResult()
        },
        async content(event, trigger, player) {
            await player.discard(event.cards)
            await event.targets[0].damage()
        },
        ai: {
            threaten: 0.4,
            expose: 0.3,
        }
    },
    // 喜多郁代
    gbnongchao: {
        audio: false,
        trigger: {
            player: "phaseUseBegin"
        },
        async content(event, trigger, player) {
            let result = await player.chooseTarget("弄潮", "视为对一名其他角色使用【火攻】", true)
                .set("ai", (target) => {
                    let player = _status.event.player
                    if (game.hasPlayer(p => get.attitude(player, p) < 0 && target.hp < 3 && get.effect(p, {
                        name: "huogong"
                    }, player, player) > 0)) return player.getCards("h").reduce((suit, card) => suit.includes(get.suit(card)) ? suit : [suit, get.suit(card)].flat(), []).length >= 3
                    else if (get.attitude(player, target) > 0) return true
                    else return false
                })
                .set("filterTarget", (card, player, target) => target != player && player.canUse("huogong", target))
                .forResult()
            if (!player.canUse({
                name: "huogong"
            }, result.targets[0])) return
            let next = player.useCard({
                name: "huogong"
            }, result.targets[0])
            player.when("useCardAfter")
                .filter((event, player) => {
                    return event.card == next.card
                })
                .then(() => {
                    if (!player.hasHistory("sourceDamage", evt => evt.card == trigger.card)) {
                        player.draw()
                        trigger.targets[0].draw()
                    }
                })
        },
        ai: {
            threaten: 0.4,
        }
    },
    gbzhiwo: {
        audio: false,
        trigger: {
            player: "useCardAfter"
        },
        usable(skill, player) {
            if (player.isPhaseUsing()) return 2
            return 0
        },
        filter(event, player) {
            return event.card.name == "sha" || (event.targets.length == 1 && get.type(event.card) == "trick")
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard(get.prompt2("gbzhiwo"), 1, "h")
                .set("ai", (card) => {
                    let player = _status.event.player
                    let type = get.type2(card)
                    switch (type) {
                        case "basic":
                            return 1
                        case "trick":
                            if (get.attitude(player, get.event("target")) > 0 && get.event("target").isDamaged()) return 1
                            return 0
                        case "equip":
                            return 2
                    }
                })
                .set("target", trigger.targets[0])
                .forResult()
        },
        async content(event, trigger, player) {
            await player.showCards(event.cards)
            switch (get.type2(event.cards[0])) {
                case "basic":
                    player.draw()
                    break
                case "trick":
                    trigger.targets[0].recover()
                    break
                case "equip":
                    player.useSkill("gbnongchao")
                    break
            }
        }
    },
    gbsushi: {
        audio: false,
        enable: "phaseUse",
        usable: 2,
        filterCard: true,
        position: "h",
        check(card) {
            return 6 - get.value(card)
        },
        async content(event, trigger, player) {
            if (get.suit(event.cards[0]) == "club") {
                let result = await player.chooseTarget("素食", "获得攻击范围内一名其他角色的一张手牌")
                    .set("filterTarget", (card, player, target) => player.inRange(target))
                    .set("ai", (target) => {
                        let player = _status.event.player
                        return get.attitude(player, target) < 0
                    })
                    .forResult()
                if (result.bool) {
                    player.gainPlayerCard("h", result.targets[0], true)
                }
            } else {
                let result = await player.chooseTarget(`素食`, `将${get.translation(event.cards[0])}交给一名其他角色`)
                    .set("ai", (target) => {
                        let player = _status.event.player
                        return get.attitude(player, target) < 0
                    })
                    .set("filterTarget", (card, player, target) => player != target)
                    .forResult()
                if (result.bool) {
                    await player.give(event.cards, result.targets[0], "giveAuto")
                    let card = await result.targets[0].chooseCard(`素食`, `将一张牌交给${get.translation(player)}`, "he", true)
                        .set("ai", (card) => 6 - get.value(card))
                        .forResultCards()
                    await result.targets[0].give(card, player)
                }
            }
        },
        ai: {
            order: 7,
            threaten: 0.4,
            expose: 0.15,
            result: {
                player: 1
            }
        }
    },
    gbchangqi: {
        audio: false,
        trigger: {
            global: "gainAfter"
        },
        filter(event, player) {
            return (event.player == player && event.source) || (event.source == player && event.player)
        },
        check(event, player) {
            return get.attitude(player, event.player == player ? event.source : event.player) < 0;
        },
        async content(event, trigger, player) {
            if (trigger.source == player) {
                let next = await trigger.player.chooseCard(`素食`, `弃置一张牌`, "he", true)
                    .set("ai", (card) => 6 - get.value(card))
                    .forResult()
                if (next && next.bool) {
                    trigger.player.discard(next.cards)
                    if (get.suit(next.cards[0]) == "club") player.gain(next.cards[0], "giveAuto", "log")
                }
            } else {
                let next = await player.chooseCard(`常栖`, `重铸一张牌`, "he")
                    .set("ai", (card) => 6 - get.value(card))
                    .forResult()
                if (next && next.bool) {
                    if (get.suit(next.cards[0]) != "club") player.draw()
                    await player.recast(next.cards)
                }
            }
        },
    },
    // 虹夏
    gbxianlu: {
        audio: false,
        trigger: {
            player: "phaseZhunbeiBegin"
        },
        check(event, player) {
            return true
        },
        async content(event, trigger, player) {
            for (let current of game.players) {
                if (current == player) continue
                if (!current.countCards("h")) continue
                let result = await current.chooseButton([
                    "###先路###",
                    [
                        [
                            ["give", `交给一名${get.translation(player)}一张手牌并摸一张牌，然后本回合所有非锁定技失效`],
                            ["discard", `弃置一张手牌，然后重铸${get.translation(player)}手牌区或判定区的一张牌`],
                        ],
                        "textbutton",
                    ]
                ], true)
                    .set("ai", function (button) {
                        let player = _status.event.player
                        switch (button.link) {
                            case "give":
                                if (get.attitude(player, current) > 0) return 1
                                return (2 - current.getSkills(null, false, false).filter(skill => !get.is.locked(skill)).length) * Math.random()
                            case "discard":
                                if (get.attitude(player, current) > 0 && player.countCards("j")) return 1
                                if (get.attitude(player, current) < 0 && !player.countCards("e") && !player.countCards("h")) return 0
                                return Math.random()
                        }
                    })
                    .forResult()
                if (result.bool) {
                    switch (result.links[0]) {
                        case "give":
                            if (!current.countCards("h")) return
                            var card = await current.chooseCard(`先路`, `选择一张手牌交给${get.translation(player)}`, true)
                                .set("ai", (card) => get.value(card))
                                .forResultCards()
                            await current.give(card, player, "giveAuto")
                            await current.draw()
                            current.addTempSkill("fengyin")
                            break
                        case "discard":
                            if (!current.countCards("h")) return
                            current.chooseToDiscard(`先路`, `弃置一张手牌`, "h", true)
                                .set("ai", (card) => get.value(card))
                            let next = await current.choosePlayerCard(player, `先路`, `重铸${get.translation(player)}手牌区或判定区的一张牌`, "hj", true)
                                .set("ai", (button) => {
                                    let player = _status.event.player
                                    if (get.attitude(current, player) > 0) {
                                        if (player.countCards("j")) return get.position(button.link) == "j"
                                        return get.position(button.link) == "h"
                                    } else {
                                        return get.position(button.link) == "h"
                                    }
                                })
                                .set("visible", false)
                                .forResult()
                            if (next && next.bool) await player.recast(next.cards)
                            break
                    }
                }
            }
        },
        ai: {
            threaten: 0.6,
        }
    },
    gbhexi: {
        audio: false,
        enable: "phaseUse",
        usable: 2,
        selectCard: [1, 2],
        position: "h",
        lose: false,
        filterCard: true,
        filterTarget: lib.filter.notMe,
        ai1(card) {
            return 6 - get.value(card)
        },
        ai2(target) {
            let player = _status.event.player
            if (get.attitude(player, target) > 0) {
                if (target.group != player.group) return 2
                return 1
            } else {
                return 0
            }
        },
        async content(event, trigger, player) {
            await player.give(event.cards, event.targets[0])
            let result = await event.targets[0].chooseCard(`赫戏`, `将两张牌交给${get.translation(player)}并获得〖求凰〗，或点击取消，若其已受伤，令其回复1点体力，否则其增加1点体力上限`, 2, "he")
                .set("ai", (card) => {
                    let source = get.event("source")
                    let player = _status.event.player
                    if (get.attitude(player.source) > 0 && source.hp <= 2 && (player.group == source.group || player.hasSkill("gbqiuhuang"))) return 0
                    return 6 - get.value(card)
                })
                .set("source", player)
                .forResult()
            if (result.bool) {
                await event.targets[0].give(result.cards, player, "giveAuton")
                event.targets[0].addSkill("gbqiuhuang")
            } else {
                if (player.isDamaged()) player.recover()
                else player.gainMaxHp()
            }
        },
        ai: {
            order: 4,
            result: {
                player: 1
            },
            expose: 0.2,
        }
    },
    gbqiuhuang: {
        audio: false,
        trigger: {
            player: "dyingBegin"
        },
        zhuSkill: true,
        filter(event, player) {
            let targets = game.players.filter(target => target.hasSkill("gbqiuhuang") || target.group == player.group)
            if (!player.storage["gbqiuhuang_used"]) player.storage["gbqiuhuang_used"] = []
            return targets.some(target => !player.storage["gbqiuhuang_used"].includes(targets))
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(get.prompt2("gbqiuhuang"))
                .set("filterTarget", (card, player, target) => {
                    if (player == target) return false
                    if (player.storage["gbqiuhuang_used"].includes(target)) return false
                    return target.hasSkill("gbqiuhuang") || target.group == player.group
                })
                .set("ai", (target) => {
                    let player = _status.event.player
                    if (player.canSave(player)) return 0
                    if (get.attitude(player, target) > 0) return 1
                    return Math.random()
                })
                .forResult()
        },
        async content(event, trigger, player) {
            player.markAuto("gbqiuhuang_used", event.targets[0])
            player.addTempSkill("gbqiuhuang_used")
            let result = await event.targets[0].chooseBool(`求凰`, `是否视为对${get.translation(player)}使用【桃】。`)
                .set("prompt2", "若其脱离濒死状态，你弃置两张手牌并失去一点体力")
                .set("ai", () => {
                    let player = _status.event.player
                    if (get.attitude(event.targets[0], player) > 0 && !event.targets[0].canSave(player)) return true
                    return false
                })
                .forResult()
            if (result.bool) {
                let next = event.targets[0].useCard({
                    name: "tao"
                }, player)
                event.targets[0].when("useCardAfter")
                    .filter((event, player) => {
                        return event.card == next.card
                    })
                    .then(() => {
                        if (player.isDying()) return
                        player.chooseToDiscard(`弃置两张牌`, "he", 2, true)
                            .set("ai", (card) => {
                                return 6 - get.value(card)
                            })
                            .forResult()
                    })
                    .then(() => {
                        player.loseHp()
                        if (source) source.loseHp()
                    })
                    .vars({
                        source: trigger.reason.source
                    })
            }
        },
        subSkill: {
            used: {
                onremove: true,
            }
        }
    },
    // nina
    gbfanghuang: {
        audio: false,
        enable: ["chooseToUse", "chooseToRespond"],
        usable: 3,
        filter(event, player) {
            var list = [];
            for (var name of lib.inpile) {
                if (get.type(name) == "basic") list.push(name)
            }
            return player.countCards("hes") && list.some(name => event.filterCard({
                name: name
            }, player, event))
        },
        hiddenCard(player, name) {
            if (get.type(name) != "basic") return false
            return player.countCards("hes") < player.countSkill("gbfanghuang") + 1
        },
        chooseButton: {
            dialog(event, player) {
                var list = [];
                for (var name of lib.inpile) {
                    if (name == "sha") {
                        list.push(["基本", "", "sha"]);
                        for (let j of lib.inpile_nature) list.push(["基本", "", "sha", j])
                    } else if (get.type(name) == "basic") list.push(name)
                }
                return ui.create.dialog("彷徨", [list, "vcard"]);
            },
            filter(button, player) {
                return _status.event.getParent().filterCard({
                    name: button.link[2],
                    nature: button.link[3]
                }, player, _status.event.getParent());
            },
            check(button) {
                var player = _status.event.player;
                var card = {
                    name: button.link[2],
                    nature: button.link[3]
                };
                return _status.event.getParent().type == "phase" ? player.getUseValue(card) : 1
            },
            backup(links, player) {
                return {
                    audio: false,
                    filterCard: true,
                    position: "hes",
                    selectCard() {
                        let player = _status.event.player
                        let num = player.countSkill("gbfanghuang") + 1
                        return num
                    },
                    viewAs: {
                        name: links[0][2],
                        nature: links[0][3]
                    },
                    check(card) {
                        return 4 - get.value(card)
                    },
                    onuse(result, player) {
                        player.logSkill("gbfanghuang")
                        if (result.targets.some(p => p != player)) player.draw()
                    }
                };
            },
            prompt(links, player) {
                return "将" + get.cnNumber(player.countSkill("gbfanghuang") + 1) + "张牌当做" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]) + "使用";
            },
        },
        ai: {
            save: true,
            respondSha: true,
            respondShan: true,
            respondTao: true,
            skillTagFilter(player, tag, arg) {
                if (!player.countCards("hes")) return false
            },
            order: 7,
            threaten: 0.8,
            result: {
                player: 1
            }
        }
    },
    gbnahan: {
        audio: false,
        trigger: {
            player: "useCardAfter"
        },
        usable: 1,
        check(event, player) {
            if (game.hasPlayer(target => get.effect(target, {
                name: "juedou"
            }, player, player) > 0 && player.canUse({
                name: "juedou"
            }, target))) return get.color(event.card) == "black"
            return get.color(event.card) == "red"
        },
        async content(event, trigger, player) {
            if (get.color(trigger.card) == "red") {
                let next = await player.chooseTarget("呐喊", "令一名其他角色选择是否交给你一张牌", true)
                    .set("filterTarget", (card, player, target) => target != player)
                    .set("ai", (target) => {
                        let player = _status.event.player
                        if (get.attitude(player, target) > 0 && target.isDamaged() && target.getEquips("baiyin")) return 10
                        if (get.attitude(player, target) > 0) return 5
                        return 1
                    })
                    .forResult()
                if (next && next.bool) {
                    let card = await next.targets[0]
                        .chooseCard(`是否交给${get.translation(player)}一张牌`, "he")
                        .set("ai", (card) => {
                            let player = _status.event.player
                            let source = get.event("sourcex")
                            if (get.attitude(player, source) < 0) return false
                            return 6 - get.value(card)
                        })
                        .set("sourcex", player)
                        .forResult()
                    if (card && card.bool) {
                        next.targets[0].give(card.cards, player, "giveAuto")
                    }
                }
            } else if (get.color(trigger.card) == "black") {
                let next = await player.chooseTarget("呐喊", "视为使用一张【决斗】", true)
                    .set("filterTarget", (card, player, target) => player.canUse({
                        name: "juedou"
                    }, target))
                    .set("ai", (target) => {
                        let player = _status.event.player
                        return get.attitude(player, target) < 0
                    })
                    .forResult()
                if (next && next.bool) {
                    player.useCard({
                        name: "juedou"
                    }, next.targets[0])
                }
            } else player.draw()
        },
        ai: {
            threaten: 1,
            expose: 0.25,
        }
    },
    gbguiqi: {
        audio: false,
        zhuSkill: true,
        trigger: {
            player: "damageEnd",
            source: "damageEnd"
        },
        filter(event, player) {
            return (event.player === player && event.source?.group === player.group) ||
                (event.source === player && event.player.group === player.group)
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard(get.prompt2("gbguiqi"), "he")
                .set("ai", (card) => 6 - get.value(card))
                .forResult()
        },
        async content(event, trigger, player) {
            let target = trigger.source == player ? trigger.player : trigger.source
            player.give(event.cards, target, "giveAuto")
            let next = await target.chooseCard("闺泣", "是否交给" + get.translation(player) + "一张牌。")
                .set("ai", (card) => {
                    let player = _status.event.player
                    let target = get.event("target")
                    if (get.attitude(player, target) > 0) return 6 - get.value(card)
                    return false
                })
                .forResult()
            if (next && next.bool) {
                target.give(next.cards, player, "giveAuto")
            }
            player.draw()
            target.draw()
        }
    },
    // 桃香
    gbkongxiang: {
        audio: false,
        trigger: {
            target: "useCardToTargeted"
        },
        mark: "auto",
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        filter(event, player, name) {
            if (!player.countCards("h")) return false
            return get.type(event.card) == "basic" || event.card.name == "juedou"
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard("空箱", "选择任意张手牌置于武将牌上", "h", [1, Infinity])
                .set("ai", (card) => {
                    let player = _status.event.player
                    if (get.tag(trigger.card, "respondSha")) {
                        if (player.countCards("h", {
                            name: "sha"
                        }) === 0) return 8 - get.value(card)
                        if (ui.selected.cards.filter(c => c.name == "sha").length >= player.countCards("h", card => card.name == "sha")) return false
                    } else if (get.tag(trigger.card, "respondShan")) {
                        if (player.countCards("h", {
                            name: "shan"
                        }) === 0) return 8 - get.value(card)
                        if (ui.selected.cards.filter(c => c.name == "shan").length >= player.countCards("h", card => card.name == "shan")) return false
                    } else if (get.tag(trigger.card, "damage") && player.hp < 2) {
                        if (card.name == "tao") return false
                        if (card.name == "jiu") return false
                    }
                    return 8 - get.value(card)
                })
                .forResult()
        },
        async content(event, trigger, player) {
            player.addToExpansion(event.cards, "giveAuto").gaintag.add("gbkongxiang")
            let result = await player.chooseBool("空箱", "是否摸一张牌")
                .set("ai", () => {
                    return true
                })
                .forResult()
            if (result && result.bool) {
                player.draw()
            }
        },
        ai: {
            effect: {
                target(card, player, target) {
                    if (card.name == "juedou" && target.mayHaveSha(player)) return [1, -2]
                    if (card.name == "sha" && target.mayHaveShan(player)) return [1, -2]
                    if (card.name == "tao" || card.name == "jiu") return [1, 1]
                }
            }
        }
    },
    gbxuanxie: {
        trigger: {
            player: "loseAfter"
        },
        filter(event, player) {
            if (player.countCards("h")) return false;
            return event.hs && event.hs.length
        },
        async cost(event, trigger, player) {
            let {
                result
            } = await player.chooseControlList("###宣泄###", ["摸一张牌", "本回合结束时，对当前回合的角色使用『空箱』中所有的【杀】", "本回合结束时，令一名角色获得『空箱』中的所有牌。"])
                .set("ai", () => {
                    let player = _status.event.player
                    let target = _status.currentPhase
                    let num = player.countExpansions("gbkongxiang")
                    let selected = game.getGlobalHistory("everything", evt => evt.skill == "gbxuanxie_cost").map(evt => evt.result.control)
                    if (get.attitude(player, target) < 0 && player.countCards("x", card => card.gaintag.includes("gbkongxiang") && card.name == "sha") > 1 && !selected.includes("选项二")) return 1
                    if (num > 2 && !selected.includes("选项三")) return 2
                    return 0
                })
                .set("skill", event.name)
            if (result.control != "cancel2") {
                event.result = {
                    bool: true,
                    cost_data: result.control
                }
            }
        },
        async content(event, trigger, player) {
            game.log(player, "选择了", "#g【宣泄】", "的", "#y" + event.cost_data)
            switch (event.cost_data) {
                case "选项一":
                    player.draw()
                    break
                case "选项二":
                    player.when({
                        global: "phaseEnd"
                    })
                        .then(() => {
                            if (!_status.currentPhase) event.finish()
                            if (!player.canUse({
                                name: "sha"
                            }, _status.currentPhase, false, false)) event.finish()
                            if (!player.countCards("x", card => card.gaintag.includes("gbkongxiang") && card.name == "sha")) event.finish()
                        })
                        .then(() => {
                            player.useCard(player.getCards("x", card => card.gaintag.includes("gbkongxiang") && card.name == "sha")[0], _status.currentPhase, false)
                        })
                        .then(() => {
                            if (player.countCards("x", card => card.gaintag.includes("gbkongxiang") && card.name == "sha")) event.goto(0)
                        })
                    break
                case "选项三":
                    player.when({
                        global: "phaseEnd"
                    })
                        .then(() => {
                            player.give(player.getExpansions("gbkongxiang"), _status.currentPhase, "giveAuto")
                        })
                    break
            }
        },
        ai: {
            threaten: 1,
            combo: "gbkongxiang",
        }
    },
    gbxuzi: {
        audio: false,
        enable: "phaseUse",
        usable: 1,
        mark: "auto",
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        async content(event, trigger, player) {
            player.draw(2)
            let result = await player.chooseCard("嘘子", "选择任意张手牌", true, [1, Infinity])
                .set("ai", card => {
                    let player = _status.event.player,
                        dis = player.needsToDiscard(0, (i, player) => !player.canIgnoreHandcard(i) && !player.hasValueTarget(i))
                    if (_status.currentPhase == player) return (dis ? 6 : 4) - get.value(card)
                    return -get.value(card)
                })
                .forResult()
            if (result && result.bool) {
                player.addToExpansion(result.cards, "giveAuto").gaintag.add("gbxuzi")
            }
        },
        group: "gbxuzi_lose",
        subSkill: {
            lose: {
                audio: false,
                forced: true,
                trigger: {
                    player: "loseBegin"
                },
                filter(event, player) {
                    return event.cards.some(card => card.gaintag.includes("gbxuzi"))
                },
                async content(event, trigger, player) {
                    player.draw(trigger.cards.filter(card => card.gaintag.includes("gbxuzi")).length)
                }
            }
        },
        ai: {
            order: 8,
            result: {
                player: 1
            }
        }
    },
    gbshengwu: {
        audio: false,
        trigger: {
            global: "phaseEnd"
        },
        filter(event, player) {
            return player.hasExpansions("gbxuzi")
        },
        check(event, player) {
            if (get.attitude(player, event.player) < 0) return 1
            if (player == event.player) return 0
        },
        async content(event, trigger, player) {
            let target = trigger.player
            let result = await target.chooseButton(["声无",
                [
                    [
                        ["damage", "受到1点伤害并获得一张『嘘』"],
                        ["give", `将${get.cnNumber(Math.min(player.countExpansions("gbxuzi"), 3))}张牌置于${get.translation(player)}的武将牌上`]
                    ],
                    "textbutton"
                ]
            ], true)
                .set("filterButton", button => {
                    let player = _status.event.player
                    if (button.link == "give") return player.countCards("he")
                    return true
                })
                .set("ai", (button) => {
                    let player = _status.event.player
                    if (player.countCards("he") > 4) return button.link == "give"
                    return button.link == "damage"

                })
                .forResult()
            if (result && result.bool) {
                if (result.links[0] == "damage") {
                    target.damage()
                    let next = await target.chooseButton(["声无", "获得一张『嘘』", player.getExpansions("gbxuzi")], 1, true)
                        .set("ai", button => get.value(button.link))
                        .forResult()
                    if (next && next.bool) {
                        target.gain(next.links, "giveAuto", "log")
                    }
                } else {
                    let next = await target.chooseCard(`声无`, `选择${get.cnNumber(Math.min(player.countExpansions("gbxuzi"), 3))}张牌`, "he", true, Math.min(player.countExpansions("gbxuzi"), 3)).forResult()
                    if (next && next.bool) {
                        let bool = false
                        if (!target.countCards("h", card => !next.cards.includes(card))) bool = true
                        let next1 = player.addToExpansion(next.cards, "giveAuto")
                        next1.gaintag.add("gbxuzi")
                        await next1
                        let card = await player.chooseButton(["获得一张『嘘』", player.getExpansions("gbxuzi")], 1, true)
                            .set("ai", button => get.value(button.link))
                            .forResult()
                        player.gain(card.links, "giveAuto")
                        if (bool) {
                            let damage = await player.chooseBool("是否对" + get.translation(target) + "造成一点伤害")
                                .set("ai", () => {
                                    let player = _status.event.player
                                    let target = _status.event.target
                                    return get.attitude(player, target) < 0
                                })
                                .set("target", target)
                                .forResult()
                            if (damage && damage.bool) target.damage()
                        }
                    }
                }
            }
        },
        ai: {
            threaten: 0.7,
            expose: 0.15
        }
    },
    gbxinxiang: {
        audio: false,
        trigger: {
            global: "phaseBegin"
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard(get.prompt2("gbxinxiang"), "he")
                .set("ai", card => {
                    if (get.value(card) < 7) return false
                    let player = _status.event.player
                    let target = _status.currentPhase
                    if (get.attitude(player, target) > 0) return Math.random() < 0.8
                    return Math.random() > 0.6

                })
                .forResult()
        },
        async content(event, trigger, player) {
            let target = trigger.player
            let card = event.cards[0]
            player.discard(card)
            let result = await target.judge().forResult()
            if (result) {
                if (result.color == get.color(card)) {
                    await player.draw(2)
                    let next = await player.chooseCard(`心象`, `交给${get.translation(target)}一张牌`, "he", true)
                        .set("ai", card => {
                            let player = _status.event.player
                            let target = _status.currentPhase
                            if (get.attitude(player, target) > 0) return get.value(card)
                            return 6 - get.value(card)

                        })
                        .forResult()
                    if (next && next.bool) {
                        player.give(next.cards, target, "giveAuto")
                    }
                } else target.draw()
                if (result.number == card.number) target.damage()
                else target.gain(result.card, "gain")
            }
        }
    },
    gbfenxing: {
        audio: false,
        trigger: {
            player: "loseAfter"
        },
        usable: 2,
        filter(event, player) {
            if (event.type != "discard") return false;
            return event.cards.some(card => get.position(card, true) == "d")
        },
        check(event, player) {
            if (game.hasPlayer(p => get.attitude(player, p) > 0)) return true
            return event.cards.filter(card => get.position(card, true) == "d" && get.value(card) < 6)
        },
        async content(event, trigger, player) {
            let cards = trigger.cards.filter(card => get.position(card, true) == "d")
            let result = await player.chooseCardButton(cards, '分形', '选择一张牌给予其他角色')
                .set('ai', (button) => {
                    if (game.hasPlayer(p => get.attitude(player, p) > 0)) return get.value(button.link)
                    return -get.value(button.link)
                })
                .forResult()
            if (result.bool) {
                let next = await player.chooseTarget('分形', '选择一名角色获得此牌', true, (card, player, target) => {
                    return target != player;
                }).set('ai', (target) => {
                    let player = _status.event.player
                    return get.attitude(player, target) > 0
                })
                    .forResult()
                if (next && next.bool) {
                    player.give(result.links, next.targets[0], "giveAuto");
                    if (next.targets[0].countCards("he", card => get.type(card) != get.type(result.links[0]))) {
                        let cards = await next.targets[0].chooseCard(`分形`, `选择一张不同类型的牌交给${get.translation(player)}`, "he", true)
                            .set("filterCard", card => get.type(card, "trick") != get.type(get.event("cardx"), "trick"))
                            .set("ai", (card) => {
                                let player = _status.event.player
                                let target = get.event("target")
                                if (get.attitude(player, target) > 0) return get.value(card)
                                return 6 - get.value(card)
                            })
                            .set("cardx", result.links[0])
                            .set("target", player)
                            .forResult()
                        if (cards.bool) {
                            next.targets[0].give(cards.cards, player, "giveAuto")
                        }
                    }
                }
            }
        }
    },
    gbchuideng: {
        audio: false,
        trigger: {
            player: "damageBegin4",
            source: "damageBegin2"
        },
        usable: 3,
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget("吹灯", "请选择至多X名角色", [1, player.hp])
                .set("ai", (target) => true)
                .forResult()
        },
        async content(event, trigger, player) {
            for (let target of event.targets) {
                let next = await target.chooseControlList("吹灯", [`重铸${get.translation(player)}区域内的一张牌，若此牌不为基本牌，本回合结束时其摸一张牌`, `重铸${get.translation(player)}的一张手牌，然后进行判定，若判定牌与此牌点数相同，你受到1点伤害`], true)
                    .set("ai", () => {
                        let player = _status.event.player
                        let target = get.event("target")
                        if (get.attitude(player, target) > 0) return 0
                        else {
                            if (target.countCards("e")) return 0
                            return 1
                        }
                    })
                    .set("target", player)
                    .forResult()
                if (next.control == "选项一") {
                    if (player.countCards("hej")) {
                        let next = await target.choosePlayerCard(player, `吹灯`, `重铸${get.translation(player)}的一张牌`, "hej", true)
                            .set("ai", (button) => {
                                let player = _status.event.target
                                let target = _status.event.player
                                if (get.attitude(target, player) > 0) {
                                    if (player.countCards("j")) return get.position(button.link) == "j"
                                    if (player.isDamaged() && player.getEquips("baiyin")) return button.link == "baiyin"
                                    return get.position(button.link) == "h"
                                } else {
                                    if (player.countCards("e")) return get.position(button.link) == "e"
                                    return get.position(button.link) == "h"
                                }
                            })
                            .set("visible", false)
                            .forResult()
                        if (next && next.bool) {
                            await player.recast(next.cards)
                            if (get.type(next.cards[0]) != "basic") {
                                player.when({
                                    global: "phaseEnd"
                                })
                                    .then(() => {
                                        player.draw()
                                    })
                            }
                        }
                    }
                } else {
                    if (player.countCards("h")) {
                        let next = await target.choosePlayerCard(player, `吹灯`, `重铸${get.translation(player)}的一张手牌`, "h", true)
                            .set("visible", false)
                            .forResult()
                        if (next && next.bool) {
                            player.recast(next.cards)
                            let result = await target.judge()
                                .set("judge", (card) => {
                                    if (card.number == next.cards[0].number) return 1
                                    return -1
                                })
                            if (result.number == next.cards[0].number) target.damage()
                        }
                    }
                }
            }
        }
    },
    gbweizhi: {
        trigger: {
            global: "judge"
        },
        filter(event, player) {
            return player.countCards("hes")
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard(get.prompt2("gbweizhi"), "hes")
                .set("ai", card => {
                    const trigger = _status.event.getTrigger();
                    const player = _status.event.player;
                    const judging = _status.event.judging
                    let newCard = get.copy(judging)
                    newCard.numer = card.numer
                    const result = trigger.judge(newCard) - trigger.judge(judging);
                    const attitude = get.attitude(player, trigger.player);
                    let val = get.value(card);
                    if (get.subtype(card) == "equip2") val /= 2;
                    else val /= 4;
                    if (attitude == 0 || result == 0) return 0;
                    if (attitude > 0) {
                        return result - val;
                    }
                    return -result - val;
                })
                .set("judging", trigger.player.judging[0])
                .forResult()
        },
        async content(event, trigger, player) {
            await player.respond(event.cards, "gbweizhi", "highlight", "noOrdering");
            trigger.player.judging[0].number = event.cards[0].number
            game.log(trigger.player, "的判定牌点数改为", event.cards[0].number);
        },
        ai: {
            rejudge: true,
            tag: {
                rejudge: 1,
            },
        },
    },
    // 平泽唯
    gbdanhe: {
        audio: false,
        charlotte: true,
        forced: true,
        trigger: {
            player: "useCardAfter"
        },
        filter(event, player) {
            return player.isPhaseUsing()
        },
        async content(event, trigger, player) {
            if (!player.storage["gbdanhe_count"]) player.storage["gbdanhe_count"] = []
            if (!player.storage["gbdanhe_count"].includes(get.type(trigger.card, "trick"))) {
                player.markAuto("gbdanhe_count", get.type(trigger.card, "trick"))
                player.addTempSkill("gbdanhe_count")
            }
            switch (player.storage["gbdanhe_count"].length) {
                case 3:
                    player.loseHp()
                    _status.event.getParent("phaseUse").finish()
                    break
                case 2:
                    player.when(["useCard", "phaseAfter"])
                        .then(() => {
                            if (event.triggername == "useCard") {
                                trigger.effectCount++;
                            } else {
                                event.finish()
                            }
                        })
                    break
                case 1:
                    player.draw()
                    player.link(true)
                    break
            }
        },
        ai: {
            threaten: 1.4,
            effect: {
                player(card, player, target, result) {
                    if (!player.isPhaseUsing()) return result
                    if (!player.storage["gbdanhe_count"]) player.storage["gbdanhe_count"] = []
                    let num = player.countCards("hs", c => player.hasUseTarget(c) && !player.storage["gbdanhe_count"].includes(get.type(c, "trick")))
                    switch (player.storage["gbdanhe_count"].length) {
                        case 0:
                            if (get.type(card, "trick") == "equip") return [1, 1]
                            if (player.countCards("hs", c => get.type(c, "trick") == "equip") > 0) {
                                return [1, 1, 1, 0]
                            } else {
                                if (player.getDamagedHp() > 1 && num > 1 && card.name == "tao") return [1, -1, 1, 0]
                                if (card.name == "wuzhong") return 0.75
                                if (card.name == "tiesuo" && player.isZhu2() && !target.isLinked()) return [1, 0, 1, 1]
                                if (["shunshou", "guohe"].includes(card.name) && target.countCards("he") > 1) return [1, 1, 1, 0]
                                if (["wugu", "taoyuan", "nanman", "wanjian", "jiu", "sha"].includes(card.name)) return [1, 1, 1, 0]
                                return [1, 1]
                            }
                        case 1:
                            if (player.storage["gbdanhe_count"].includes(get.type(card, "trick"))) {
                                if (num > 1) {
                                    if (player.getDamagedHp() > 1 && num > 1 && card.name == "tao") return [1, -2]
                                    if (card.name == "wuzhong") return 0.75
                                    if (card.name == "tiesuo" && player.isZhu2() && !target.isLinked()) return [1, 1, 1, 1]
                                    if (["shunshou", "guohe"].includes(card.name) && target.countCards("he") > 1) return [0.5, 1]
                                    if (["wugu", "taoyuan", "nanman", "wanjian", "jiu", "sha"].includes(card.name)) return [0.5, 1]
                                    return [1, 1]
                                } else return [1, 1]
                            } else {
                                if (player.countCards("hs", c => player.hasUseTarget(c) && player.storage["gbdanhe_count"].includes(get.type(c, "trick"))) > 0) return [1, -1]
                                return 1
                            }
                        case 2:
                            if (player.hp < 2) return [0, -1, 1, 0]
                            if (!player.storage["gbdanhe_count"].includes(get.type(card, "trick"))) {
                                if (player.countCards("hs", card => player.storage["gbdanhe_count"].includes(get.type(card)) && player.canUse(card, target))) return 1
                                return [2, -2, 2, 0]
                            }
                            if (card.name == "wuzhong") return 2
                            if (card.name == "huogong") return 1.4
                            if (card.name == "tiesuo" && player.isZhu2()) return [0, 0, 0, 1]
                            if (["wugu", "taoyuan", "nanman", "wanjian", "jiu", "sha", "tao"].includes(card.name)) return 2
                            if (["shunshou", "guohe"].includes(card.name) && target.countCards("he") > 1) return 2
                            if (["delay", "equip"].includes(get.type(card))) return 1
                            return 2
                    }
                }
            }
        },
        subSkill: {
            count: {
                onremove: true,
            }
        }
    },
    gbqingpiao: {
        audio: false,
        charlotte: true,
        zhuSkill: true,
        forced: true,
        trigger: {
            global: ["linkAfter", "phaseEnd"]
        },
        logTarget: "player",
        filter(event, player) {
            return event.player.isLinked()
        },
        async content(event, trigger, player) {
            trigger.player.draw()
            if (event.triggername == "phaseEnd") {
                if (trigger.player == player) return
                let result = await trigger.player.chooseCard("轻飘", "是否将一张牌交给" + get.translation(player))
                    .set("ai", (card) => {
                        let player = _status.event.player
                        let source = get.event("source")
                        if (get.attitude(player, source) > 0) return 6 - get.value(card)
                        return 0
                    })
                    .set("source", player)
                    .forResult()
                if (result && result.bool) {
                    trigger.player.give(result.cards, player, "giveAuto")
                }
            }
        },
    },
    // 秋山澪
    gbdubai: {
        audio: false,
        zhuanhuanji: true,
        mark: true,
        marktext: "☯",
        intro: {
            content(storage, player, skill) {
                if (!player.storage[skill]) {
                    return "出牌阶段限三次，你可以展示一张手牌，横置自身武将牌，然后横置一名其他角色。"
                } else {
                    return "出牌阶段限三次，你可以展示一张手牌，令一名未横置的其他角色选择一项：①令你摸一张牌，然后横置武将牌；②视为对你使用一张雷【杀】，若未造成伤害，你摸一张牌并弃置其一张牌。"
                }
            }
        },
        enable: "phaseUse",
        usable: 3,
        filter(event, player) {
            return player.countCards("h")
        },
        filterCard: true,
        lose: false,
        position: "h",
        check(card) {
            return 6 - get.value(card)
        },
        async content(event, trigger, player) {
            await player.showCards(event.cards)
            if (!player.storage.gbdubai) {
                player.link()
                let result = await player.chooseTarget("独白", "横置一名其他角色", true)
                    .set("filterTarget", lib.filter.notMe)
                    .set("ai", (target) => {
                        let player = _status.event.player
                        return get.attitude(player, target) < 0
                    })
                    .forResult()
                if (result && result.bool) {
                    result.targets[0].link(true)
                }
            } else {
                if (!game.hasPlayer(p => !p.isLinked())) return
                let result = await player.chooseTarget("独白", "选择一名未横置的其他角色", true)
                    .set("filterTarget", (card, player, target) => {
                        return !target.isLinked()
                    })
                    .set("ai", (target) => {
                        return Math.random()
                    })
                    .forResult()
                if (result && result.bool) {
                    let next = await result.targets[0].chooseControlList("独白", ["令" + get.translation(player) + "摸一张牌，然后横置自身武将牌", "视为对" + get.translation(player) + "使用一张雷【杀】"], true)
                        .set("ai", () => {
                            let player = _status.event.player
                            let source = _status.currentPhase
                            if (get.attitude(player, source) > 0) return 0
                            else return 1
                        })
                        .forResult()
                    if (next) {
                        switch (next.control) {
                            case "选项一":
                                player.draw()
                                result.targets[0].link(true)
                                break
                            case "选项二":
                                if (result.targets[0].canUse({
                                    name: "sha",
                                    nature: "thunder"
                                }, player, false, false)) {
                                    let card = result.targets[0].useCard({
                                        name: "sha",
                                        nature: "thunder"
                                    }, player, false)
                                    result.targets[0].when("useCardAfter")
                                        .filter((event, player) => {
                                            return event.card == card.card
                                        })
                                        .then(() => {
                                            if (!player.hasHistory("sourceDamage", evt => evt.card == trigger.card)) {
                                                source.draw()
                                                source.discardPlayerCard(player, "he", true)
                                            }
                                        })
                                        .vars({
                                            source: player
                                        })
                                }
                                break
                        }
                    }
                }
            }
            player.changeZhuanhuanji("gbdubai")
        },
        ai: {
            order: 8,
            result: {
                player: 1
            },
        }
    },
    gbcangkong: {
        audio: false,
        trigger: {
            player: "phaseDiscardEnd"
        },
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget("苍空", "选择至多两名已横置的角色", [1, 2])
                .set("filterTarget", (card, player, target) => target.isLinked())
                .set("ai", (target) => {
                    let player = _status.event.player
                    return get.attitude(player, target) < 0
                })
                .forResult()
        },
        async content(event, trigger, player) {
            for (let target of event.targets) {
                let list = []
                list.push("受到1点雷属性伤害")
                if (target.countCards("he")) list.push("交给" + get.translation(player) + "一张牌，然后重置自身武将牌")
                let next = await target.chooseControlList("苍空", list, true)
                    .set("ai", () => {
                        let player = _status.event.player
                        if (get.attitude(player, get.event("source")) > 0) return 1
                        else if (player.hasSkillTag("maixie") && player.hp > 1) return 0
                        else if (player.hp > 2) return 0
                        else if (player.countCards("he")) return 1
                        return 0
                    })
                    .set("source", player)
                    .forResult()
                if (next) {
                    switch (next.control) {
                        case "选项一":
                            target.damage("thunder")
                            break
                        case "选项二":
                            let result = await target.chooseCard("选择一张牌", true, "h").forResult()
                            if (result && result.bool) {
                                target.give(result.cards, player, "giveAuto")
                                target.link(false)
                            }
                            break
                    }
                }
            }
        },
        group: "gbcangkong_1",
        subSkill: {
            1: {
                audio: false,
                enable: "phaseUse",
                usable: 2,
                filterTarget(card, player, target) {
                    return target.isLinked()
                },
                selectTarget: [1, 2],
                async content(event, trigger, player) {
                    await lib.skill["gbcangkong"].content(event, trigger, player)
                },
                ai2(target) {
                    let player = _status.event.player
                    if (player == target && player.isLinked()) return true
                    return get.attitude(player, target) < 0
                },
                multitarget: true,
                ai: {
                    order: 7,
                    result: {
                        player: 1,
                    },
                },
            }
        }
    },
    // 田井中律
    gbricai: {
        audio: false,
        charlotte: true,
        forced: true,
        trigger: {
            global: "roundStart",
            player: "phaseZhunbei"
        },
        async content(event, trigger, player) {
            if (player.isLinked()) player.draw(game.countPlayer(p => p.isLinked()))
            else player.link()
        }
    },
    gbgufeng: {
        audio: false,
        trigger: {
            player: ["damageBegin4", "useCardToPlayered"]
        },
        filter(event, player) {
            if (event.name == "damage") return player.isLinked()
            return event.targets && event.targets.length == 1 && event.targets[0] != player
        },
        forced: true,
        locked: false,
        async content(event, trigger, player) {
            if (event.triggername == "damageBegin4") {
                let {
                    result
                } = await player.chooseBool("鼓风", "是否重置武将牌并回复1点体力").set("ai", () => {
                    let player = _status.event.player
                    return player.hp < 3 || trigger.nature
                })
                if (result && result.bool) {
                    player.link(false)
                    player.recover()
                }
            } else {
                if (player.isLinked()) {
                    if (trigger.targets[0].isLinked()) return
                    let {
                        result
                    } = await player.chooseBool("鼓风", "是否横置" + get.translation(trigger.targets)).set("ai", () => {
                        let player = _status.event.player
                        return player.hp < 3 || trigger.nature
                    })
                    if (result && result.bool) {
                        trigger.targets[0].link(true)
                    }
                } else {
                    player.link(true)
                    player.draw()
                }
            }
        }
    },
    // 琴吹䌷
    gbshancai: {
        audio: false,
        trigger: {
            global: ["phaseBefore", "roundStart"],
            player: "enterGame"
        },
        mark: true,
        intro: {
            markcount: "expansion",
            content: "expansion"
        },
        filter(event, player, name) {
            return name != "phaseBefore" || game.phaseNumber == 0;
        },
        forced: true,
        locked: false,
        async content(event, trigger, player) {
            let cards = get.cards(game.countPlayer())
            player.addToExpansion(cards, "giveAuto").gaintag.add("gbshancai")
        },
        group: "gbshancai_give",
        subSkill: {
            give: {
                audio: false,
                trigger: {
                    global: "phaseEnd"
                },
                filter(event, player) {
                    return player.hasExpansions("gbshancai")
                },
                logTarget: "targets",
                async cost(event, trigger, player) {
                    event.result = await player.chooseTarget("山财", "选择至多两名角色分别获得一张『山财』", [1, Math.min(2, player.countExpansions("gbshancai"))])
                        .set("ai", (target) => {
                            let player = _status.event.player
                            if (get.attitude(player, target) > 0) return target.isLinked() ? 1 : get.attitude(player, target)
                            return 0
                        })
                        .forResult()
                },
                async content(event, trigger, player) {
                    for (let target of event.targets) {
                        let next = await target.chooseButton(["获得一张『山财』", player.getExpansions("gbshancai")], 1, true)
                            .set("ai", button => get.value(button.link))
                            .forResult()
                        if (next && next.bool) {
                            await target.gain(next.links, "giveAuto")
                        }
                    }
                }
            }
        }
    },
    gbqingre: {
        audio: false,
        trigger: {
            global: "gainBegin"
        },
        filter(event, player) {
            return event.cards && event.cards.some(c => c.gaintag.includes("gbshancai")) && event.player != player
        },
        forced: true,
        locked: false,
        async content(event, trigger, player) {
            if (!trigger.player.isLinked()) {
                trigger.player.link()
            } else {
                if (!trigger.player.countCards("h")) return
                if (!game.hasPlayer(p => p.isLinked() && p != trigger.player)) return
                let result = await trigger.player.chooseCardTarget()
                    .set("position", "h")
                    .set("filterTarget", (card, player, target) => target.isLinked() && target != player)
                    .set("forced", true)
                    .set("prompt", "将一张手牌交给一名已横置的其他角色。")
                    .set("ai1", (card) => 6 - get.value(card))
                    .set("ai2", (target) => {
                        let player = _status.event.player
                        if (get.attitude(player, target) > 0) return 1
                        return Math.random()
                    })
                    .forResult()
                if (result && result.bool) {
                    trigger.player.give(result.cards, result.targets[0], "giveAuto")
                }
            }
        },
        ai: {
            combo: "gbshancai"
        },
    },
    // 中野梓
    gbmiaoqin: {
        audio: false,
        enable: "phaseUse",
        usable: 1,
        filter(event, player) {
            return !player.isLinked()
        },
        async content(event, trigger, player) {
            let list = []
            if (game.hasPlayer(p => p.isLinked())) list.push("已横置角色")
            if (game.hasPlayer(p => !p.isLinked())) list.push("未横置角色")
            list.push("cancel2")
            let result = await player.chooseControl(list)
                .set("prompt", "喵侵")
                .set("prompt2", "以...为目标")
                .set("ai", () => {
                    let player = _status.event.player
                    let is = game.filterPlayer(p => player.canUse({
                        name: "nanman"
                    }, p) && p.isLinked()).reduce((num, p) => num += get.effect(p, {
                        name: "nanman"
                    }, player), 0)
                    let not = game.filterPlayer(p => player.canUse({
                        name: "nanman"
                    }, p) && !p.isLinked()).reduce((num, p) => num += get.effect(p, {
                        name: "nanman"
                    }, player), 0)
                    if (is >= not) return "已横置角色"
                    return "未横置角色"
                })
                .forResult()
            if (result.control != "cancel2") {
                player.link(true)
                if (result.control == "已横置角色") var target = game.filterPlayer(p => p.isLinked() && p != player)
                else var target = game.filterPlayer(p => !p.isLinked() && p != player)
                if (target.some(t => player.canUse({
                    name: "nanman"
                }, t))) {
                    let next = player.useCard({
                        name: "nanman"
                    }, target)
                    player.when("useCardAfter")
                        .filter((event, player) => {
                            return event.card == next.card
                        })
                        .then(() => {
                            if (!player.hasHistory("sourceDamage", evt => evt.card == trigger.card)) {
                                player.draw(trigger.targets.length)
                            }
                        })
                }
            } else {
                delete player.getStat("skill").gbmiaoqin
            }
        },
        ai: {
            order: 7,
            result: {
                player(player, target) {
                    return game.filterPlayer(p => player.canUse({
                        name: "nanman"
                    }, p)).reduce((num, p) => num += get.effect(p, {
                        name: "nanman"
                    }, player, player), 0) > 0 ? 1 : 0
                }
            }
        }
    },
    gbwolu: {
        audio: false,
        trigger: {
            player: "damageBegin4",
            source: "damageBegin2",
        },
        usable: 3,
        async cost(event, trigger, player) {
            if (!player.isLinked()) {
                event.result = await player.chooseCard("我路", "弃置一张手牌并横置自身武将牌")
                    .set("ai", (card) => 6 - get.value(card))
                    .forResult()
            } else {
                event.result = await player.chooseBool(get.prompt2("gbwolu"))
                    .set("ai", () => true)
                    .forResult()
            }
        },
        async content(event, trigger, player) {
            if (!player.isLinked()) {
                player.discard(event.cards)
                player.link(true)
            } else {
                player.draw(2)
                player.link(false)
            }
        }
    },
}
export default skills;