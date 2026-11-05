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
            return event.isFirstTarget && player.countCards("h") > 0 && (get.name(event.card) == "sha" || get.type(event.card, "trick") && get.tag(event.card, "damage"))
        },
        logTarget: "targets",
        multitarget: true,
        async cost(event, trigger, player) {
            event.result = await player.chooseCard(get.prompt2(event.skill), 1, "h")
                .set("ai", (card) => {
                    let player = get.player(),
                        targets = get.event().getParent(4).targets,
                        sgn = get.sgn(targets.reduce((num, target) => num += get.damageEffect(target, player, player), 0)),
                        cards = player.getCards("h").filter(c => !player.getStorage("gbxiwei_compare").some(card => card.number == c.number))
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
                    let choiceList = ["与" + get.translation(player) + "拼点", "无法响应" + get.translation(event.card)]
                    let control = await target.chooseControl(list, true)
                        .set("prompt", "立袭：请选择一项")
                        .set('choiceList', choiceList)
                        .set("ai", () => {
                            let player = get.player(),
                                source = get.event().source,
                                cards = source.getStorage("gbxiwei_compare")
                            if (player.hasSkill("gbzhaying") && player.countCards("j")) {
                                if (player.countCards("j", c => get.value(c) < 6 && !cards.some(card => card.number > c.num))) return 0
                                return 1
                            }
                            if (player.hasSkill("gbxinshen") && player.hasExpansions("gbxinshen")) {
                                if (player.getExpansions("gbxinshen").filter(c => get.value(c) < 6 && !cards.some(card => card.number > c.num)).length) return 0
                                return 1
                            }
                            if (player.countCards("h", c => get.value(c) < 6 && !cards.some(card => card.number > c.num))) return 0
                            return 1
                        })
                        .set("source", player)
                        .forResult()
                    game.log(target, "选择了", "#g【立袭】", "的", "#y" + control.control)
                    switch (control.control) {
                        case "选项一":
                            await target.chooseToCompare(player)
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
        trigger: {
            player: "showCardsBegin",
        },
        forced: true,
        async content(event, trigger, player) {
            player.markAuto("gbxiwei_compare", trigger.cards)
            player.addTempSkill("gbxiwei_compare")
            player.draw()
        },
        group: ["gbxiwei_effect"],
        subSkill: {
            effect: {
                audio: "gbxiwei",
                trigger: {
                    target: "chooseToCompareBegin",
                },
                forced: true,
                async content(event, trigger, player) {
                    let result = await player.chooseCard("希威：展示一张手牌", 1, true, "h")
                        .set("ai", (card) => {
                            let player = get.player()
                            let cards = player.getStorage("gbxiwei_compare")
                            if (!cards.includes(card)) return get.number(card)
                            return true
                        })
                        .forResult()
                    player.showCards(result.cards).set("delay_time", 4)
                    player.markAuto("gbxiwei_compare", result.cards)
                    player.addTempSkill("gbxiwei_compare")
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
                forced: true,
                async content(event, trigger, player) {
                    const ori = trigger.filterCard;
                    trigger.filterCard = (card, player2, event) => {
                        if (!ori || ori.call(this, card, player2, event)) {
                            if (player == player2) return player.getStorage("gbxiwei_compare").includes(card)
                            return true
                        }
                        return false;
                    }
                }
            },
        }
    },
    // 素世
    gbsumou: {
        audio: "ext:GirlsBand/audio/skill:3",
        trigger: {
            player: "phaseZhunbeiBegin"
        },
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget([1, 3], `###${get.prompt(event.skill)}###选择至多三名角色，令未选择的角色进行议事`)
                .set("ai", (target) => {
                    let player = get.player()
                    if (ui.selected.targets.length >= game.countPlayer() - 1) return false
                    if (game.hasPlayer(p => p.isDamaged() && get.attitude(player, p) > 0)) return target.isDamaged() && get.attitude(player, target) > 0
                    return get.attitude(player, target) < 0
                })
                .forResult()
        },
        async content(event, trigger, player) {
            if (!event.targets?.length) return
            const excluded = event.targets.slice()
            const targets = game.filterPlayer(p => !excluded.includes(p))
            if (!targets.length) return
            await player.chooseToDebate(targets)
                .set("callback", () => {
                    const debate = get.event()
                    const result = debate.debateResult
                    const excluded = game.filterPlayer(p => !get.event().getParent("chooseToDebate", true)?.list?.includes(p))
                    if (!result?.bool) return
                    if (result.opinion == "red") {
                        for (const target of excluded) target.recover()
                    } else if (result.opinion == "black") {
                        for (const target of excluded) {
                            if (target != debate.player && target.countGainableCards(debate.player, "he")) debate.player.gainPlayerCard(target, "he", true)
                        }
                    }
                })
                .set("ai", (card) => {
                    let player = get.player()
                    let source = get.event().source
                    let targets = get.event().getParent(3).targets
                    if (get.attitude(player, source) > 0) {
                        if (targets.some(p => get.attitude(source, p) > 0)) return get.color(card) == "red"
                        else return get.color(card) == "black"
                    } else {
                        if (targets.some(p => get.attitude(player, p) > 0)) return get.color(card) == "red"
                        else return get.color(card) == "black"
                    }
                })
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
        logTarget: "targets",
        async cost(event, trigger, player) {
            if (!game.filterPlayer(p => !trigger.targets.includes(p).some(target => player.canCompare(target)))) {
                event.trigger("gbfuming_fail")
                return
            }
            event.result = await player.chooseTarget(`###${get.prompt(event.skill)}###与一名未参与议事的角色进行拼点`)
                .set("filterTarget", (card, player, target) => get.event().targets.includes(target))
                .set("ai", (target) => {
                    let player = get.player()
                    let cards = player.getCards("h")
                    if (target.hasSkill("gbzhaying") && target.countCards("j")) {
                        if (target.countCards("j", c => !cards.some(card => card.number > c.num))) return 0
                        return 1
                    }
                    if (target.hasSkill("gbxinshen") && target.hasExpansions("gbxinshen")) {
                        if (target.getExpansions("gbxinshen").filter(c => !cards.some(card => card.number > c.num)).length) return 0
                        return 1
                    }
                    if (get.attitude(player, target) < 0) return 10
                    else return 1
                })
                .set("targets", game.filterPlayer(p => !trigger.targets.includes(p) && player.canCompare(p)))
                .forResult()
            if (!event.result.bool) event.trigger("gbfuming_fail")
        },
        async content(event, trigger, player) {
            let result = await player.chooseToCompare(event.targets[0])
                .set("ai", (card) => {
                    let player = get.player()
                    let source = get.event().source
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
            player: "phaseUseBegin"
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
            return player.countExpansions("gbfuming") > 5
        },
        async content(event, trigger, player) {
            player.awakenSkill("gbfuming");
            game.log(player, "成功完成使命");
            player.popup("使命成功")
            let num = player.countExpansions("gbfuming")
            player.gainMaxHp(2)
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
                    player.discard(player.getExpansions("gbfuming"))
                    let num = game.filterPlayer().reduce((num, p) => num = Math.max(p.countCards("h"), num), 0)
                    player.awakenSkill("gbfuming");
                    player.recoverTo(player.maxHp)
                    if (player.countCards("h") <= num) await player.drawTo(num);
                    else await player.chooseToDiscard("h").set("forced", true).set("selectCard", player.countCards("h") - num);
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
        selectTarget: [1, Infinity],
        filterTarget: lib.filter.notMe,
        ai2(target) {
            let player = get.player()
            if (get.attitude(player, target) > 0) return 1
            return 10
        },
        allowChooseAll: true,
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
                player.draw((targets.length - same) * 2)
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
            global: "chooseToDebateBegin"
        },
        filter(event, player) {
            return event.list.includes(player)
        },
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget([1, player.maxHp], get.prompt2(event.skill))
                .set("filterTarget", (card, player, target) => {
                    return get.event().getTrigger().list.includes(target) && target != player && target.countCards("he") > 0
                })
                .set("ai", (target) => {
                    let player = get.player()
                    if (get.attitude(player, target) <= 0) return 10
                    return 1
                })
                .forResult();
        },
        locked: false,
        mod: {
            cardUsable(card, player) {
                if (card.hasGaintag("gblvefei_tag")) return true
            },
        },
        async content(event, trigger, player) {
            let cards = []
            for (const target of event.targets.sortBySeat()) {
                const result = await player.choosePlayerCard(target, "he", 1, true).set("prompt", "掠菲：请展示" + get.translation(target) + "的一张牌").forResult()
                if (!result.bool || !result.cards?.length) continue
                player.showCards(result.cards)
                cards.addArray(result.cards)
            }
            if (!cards.length) return
            const choice = await player.chooseButton(["掠菲：请选择一张视为你的议事牌", cards], true)
                .set("ai", () => Math.random())
                .forResult()
            if (!choice.bool) return
            if (!trigger.fixedResult) trigger.fixedResult = []
            trigger.fixedResult.push([player, choice.links[0]])
            player.when({ global: "chooseToDebateAfter" })
                .then(() => {
                    player.chooseBool("掠菲：是否失去1点体力上限并获得展示的牌？").set("ai", () => get.player().isDamaged())
                })
                .then(() => {
                    if (!result.bool) return
                    player.loseMaxHp()
                    game.addTempTag("gblvefei_tag", "掠菲")
                    player.gain(cards, "gain2").gaintag.add("gblvefei_tag")
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
        async cost(event, trigger, player) {
            event.result = await player
                .chooseButton([
                    `###${get.prompt(event.skill)}###请选择一项`,
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
                    let player = get.player()
                    var num = 0;
                    if (ui.selected.buttons.some(i => i.link == "judge")) num += 1;
                    if (ui.selected.buttons.some(i => i.link == "draw")) num += 1;
                    if (ui.selected.buttons.some(i => i.link == "other")) num += 2;
                    if (Math.random() < 0.05) return false;
                    num += player.skipList.length;
                    const priority = {
                        judge: () => {
                            if (player.countCards("j")) return 8
                            return 0
                        },
                        other: () => {
                            if (game.hasPlayer(c => get.attitude(player, c) > 0)) return 9
                            return 0
                        },
                        draw: () => {
                            if (game.hasPlayer(c => get.attitude(player, c) > 0)) return 10
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
                let result = await player.chooseTarget("逐翼：请选择一名拼点目标", lib.filter.notMe, true)
                    .set("ai", (target) => {
                        let player = get.player()
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
                let result = await player.chooseTarget("逐翼：请选择一名议事目标", lib.filter.notMe, true)
                    .set("ai", (target) => {
                        let player = get.player()
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
                let result = await player.chooseTarget("逐翼：请选择至多四名角色进行议事", [1, 4], true)
                    .set("ai", (target) => {
                        let player = get.player()
                        if (target == player) return false
                        if (get.attitude(player, target) > 0) return 10
                        else return 1
                    })
                    .forResult()
                if (result) await player.chooseToDebate(result.targets).set("ai", (card) => {
                    let player = get.player()
                    let source = get.event().source
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
        prompt2: "摸两张牌并交给一名其他参与角色一张牌",
        async content(event, trigger, player) {
            player.draw(2)
            let result = await player.chooseCardTarget()
                .set("prompt", "和弦：将一张牌交给一名其他参与角色")
                .set("ai1", (card) => {
                    if (trigger.type == "compare") {
                        if (get.event().targetx.some(t => get.attitude(player, t) < 0 && t != player)) {
                            return -get.number(card) - get.value(card)
                        } else {
                            return 1 / get.value(card)
                        }
                    }
                    if (get.event().targetx.some(t => get.attitude(player, t) > 0 && t != player)) {
                        if (get.color(card) == "red") return get.value(card)
                        else return get.value(card) - 3
                    } else {
                        if (get.color(card) == "red") return 6 - get.value(card)
                        else return 4 - get.value(card)
                    }
                })
                .set("ai2", (target) => {
                    if (trigger.type == "compare") {
                        if (get.event().targetx.some(t => get.attitude(player, t) < 0 && t != player)) return get.attitude(player, target) < 0
                        else return get.attitude(player, target) > 0
                    } else {
                        if (get.event().targetx.some(p => get.attitude(player, p) > 0 && p != player)) return get.attitude(player, target) > 0
                        else return -get.attitude(player, target) < 0
                    }
                })
                .set("targetx", trigger.list || trigger.targets || [trigger.target, trigger.player])
                .set("forced", true)
                .set("filterTarget", (card, player, target) => {
                    return get.event().targetx.includes(target) && target != player
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
                                if (opinion == "red") {
                                    player.when({ global: "phaseEnd" })
                                        .then(() => trigger.phaseList.splice(trigger.num, 0, "phaseUse|gbhexian"))
                                }
                                else {
                                    player.draw(3)
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
                    `转换技，出牌阶段限一次，你可以展示一名其他角色的一张牌，然后令其以此牌与你拼点：若你赢，你获得拼点的两张牌；若你没赢，此技能视为未发动过。` :
                    `转换技，出牌阶段限一次，你可以展示一名其他角色的一张牌，然后令其以此牌与你议事，若结果为：红色，你获得议事的两张牌；黑色，你摸两张牌；无结果：此技能视为未发动过。`;
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
            let result = await player.choosePlayerCard(target, "he", 1, true).set("prompt", "春影：请选择" + get.translation(target) + "的一张牌").forResult()
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
                                let source = get.event().source
                                var addi = get.value(card) >= 8 && get.type(card) != "equip" ? -3 : 0;
                                if (get.player() == source) return -get.number(card) - get.value(card) / 3 + addi
                                return get.number(card) - get.value(card) / 3 + addi
                            })
                            .forResult()
                        if (choice) {
                            if (choice.bool) player.gain([choice.player, choice.target].filterInD("od"), "giveAuto")
                            else delete player.getStat("skill").gbchunying
                        }
                    }
                } else {
                    player.chooseToDebate([target, player])
                        .set("ai", (card) => {
                            let player = get.player()
                            let source = get.event().source
                            let cardx = get.event().cardx
                            if (player == source) {
                                if (get.color(cardx) == "black") return get.color(card) == "black"
                                else return get.color(card) == "red"
                            } else {
                                return Math.random()
                            }
                        })
                        .set("source", player)
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
        forced: true,
        filter(event, player) {
            return !player.isMaxHandcard()
        },
        async content(event, trigger, player) {
            await player.draw()
            if (!game.hasPlayer(target => target != player && player.canCompare(target) && !player.getStorage("gbqilu_used").includes(target))) return
            let { targets: [target] } = await player.chooseTarget("歧路：请选择一名其他角色", true)
                .set("filterTarget", (card, player, target) => {
                    return target != player && player.canCompare(target) && !player.getStorage("gbqilu_used").includes(target)
                })
                .set("ai", (target) => {
                    if (target.hasSkill("gbxinshen") && get.attitude(player, target) < 0) return 0
                    return get.attitude(player, target) < 0
                })
                .forResult()
            let result = await player.chooseToCompare(target).forResult()
            if (result) {
                if (result.bool) player.draw()
                else target.draw()
            }
        },
        subSkill: {
            used: {
                onremove: true,
            }
        },
        ai: {
            threaten: 0.8,
            expose: 0.3
        }
    },
    gbmizi: {
        audio: "ext:GirlsBand/audio/skill:2",
        trigger: {
            player: "compare",
            target: "compare"
        },
        zhuSkill: true,
        async cost(event, trigger, player) {
            event.result = await player.chooseControl(["增加", "减少", "cancel2"], true)
                .set("prompt", `###${get.prompt(event.skill)}###令你的拼点牌点数增加或减少${game.countPlayer(p => p.group == player.group) + 3}`)
                .set("ai", (event) => {
                    if (trigger.small) return "减少"
                    return "增加"
                })
                .forResult()
            event.result.cost_data = event.result.control
        },
        async content(event, trigger, player) {
            game.log(player, "选择了", "#g【迷子】", "的", "#y" + event.cost_data)
            var num = game.countPlayer(p => p.group == player.group) + 3
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
        audio: "ext:GirlsBand/audio/skill:3",
        logAudio: index => ("ext:GirlsBand/audio/skill/gbwuwang" + index),
        popup: false,
        trigger: {
            global: "phaseBefore",
            player: "enterGame"
        },
        forced: true,
        filter(event, player) {
            return event.name != "phase" || game.phaseNumber == 0
        },
        async content(event, trigger, player) {
            player.logSkill(event.name, null, null, null, [3])
            await player.gain(lib.card.ying.getYing(5))
        },
        mod: {
            ignoredHandcard(card, player) {
                if (get.name(card) == "ying") return true
            },
            cardDiscardable(card, player, name) {
                if (name == "phaseDiscard" && get.name(card) == "ying") return false
            }
        },
        group: ["gbwuwang_lose", "gbwuwang_gain"],
        subSkill: {
            lose: {
                audio: [1, 2].map(i => "ext:GirlsBand/audio/skill/gbwuwang" + i),
                trigger: {
                    player: "loseAfter"
                },
                filter(event, player) {
                    return event.cards?.some(card => get.name(card) == "ying")
                },
                mod: {
                    aiValue(player, card, num) {
                        if (player.maxHp < 5 && get.name(card) == "ying") return num + 2
                    }
                },
                forced: true,
                async content(event, trigger, player) {
                    const cards = trigger.cards.filter(card => get.name(card) == "ying")
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
                audio: [1, 2].map(i => "ext:GirlsBand/audio/skill/gbwuwang" + i),
                trigger: {
                    player: "loseAfter"
                },
                filter(event, player) {
                    return event.cards?.length >= 2
                },
                forced: true,
                async content(event, trigger, player) {
                    await player.gain(lib.card.ying.getYing())
                }
            }
        }
    },
    gbheming: {
        audio: "ext:GirlsBand/audio/skill:10",
        logAudio: index => ("ext:GirlsBand/audio/skill/gbheming" + index),
        popup: false,
        trigger: {
            global: "roundStart"
        },
        forced: true,
        mod: {
            aiValue(player, card, num) {
                if (get.name(card) == "ying") return num + 3
            },
            aiUseful(player, card, num) {
                if (get.name(card) == "ying" && player.countCards("h", c => c.name == "ying") > 0) return num + player.countCards("h", c => c.name == "ying") + 1
            }
        },
        async content(event, trigger, player) {
            player.logSkill(event.name, null, null, null, [1])
            await player.showHandcards(`${get.translation(player)}发动了【貉鸣】`)
            const num = player.countCards("h", card => get.name(card) == "ying")
            if (num == 1) {
                player.logSkill(event.name, null, null, null, [get.rand(7, 8)])
                player.loseMaxHp()
            } else if (num == 2) {
                player.addTempSkill("gbheming_two", { global: "roundEnd" })
            } else if (num > 2) {
                player.markAuto("gbheming_effect", num, false)
                player.addTempSkill("gbheming_effect", { global: "roundEnd" })
            }
        }, ai: {
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
                    return player.countCards("hs", card => get.name(card) == "ying") && player.getStorage("gbheming_effect", 0) > 2 && list.some(name => event.filterCard({
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
                        return get.event().getParent().filterCard({
                            name: button.link[2]
                        }, player, get.event().getParent());
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
                            onuse(result, player) {
                                switch (result.card.name) {
                                    case "jiu":
                                        player.logSkill("gbheming", result.targets, null, null, [2])
                                        break
                                    case "sha":
                                        player.logSkill("gbheming", result.targets, null, null, [3])
                                        break
                                    case "shan":
                                        player.logSkill("gbheming", result.targets, null, null, [4])
                                        break
                                    case "tao":
                                        player.logSkill("gbheming", result.targets, null, null, [get.rand(5, 6)])
                                        break
                                    case "huogong":
                                        player.logSkill("gbheming", result.targets, null, null, [get.rand(9, 10)])
                                        break
                                }
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
        audio: "ext:GirlsBand/audio/skill:2",
        zhuSkill: true,
        trigger: {
            global: "phaseEnd"
        },
        filter(event, player) {
            return event.player.group == player.group && event.player != player && event.player.getHistory("lose", evt => evt.type == "discard").reduce((num, evt2) => num + evt2.cards.length, 0) >= 2
        },
        async content(event, trigger, player) {
            await player.gain(lib.card.ying.getYing(1))
        }
    },
    // 若叶睦
    gbmoying: {
        audio: "ext:GirlsBand/audio/skill:3",
        enable: "phaseUse",
        usable: 1,
        async content(event, trigger, player) {
            let result = await player.chooseTarget("墨影：选择至多三名其他角色", [1, 3], true)
                .set("filterTarget", lib.filter.notMe)
                .set("ai", (target) => {
                    let player = get.player()
                    if (get.attitude(player, target) < 0) {
                        if (target.getEquip("bagua")) return 0.25
                        if (target.getEquip("rewrite_bagua")) return 0.5
                        return target.countCards("hs") / 4
                    }
                })
                .forResult()
            if (result && result.bool) {
                for (let target of result.targets.sortBySeat()) {
                    let list = ["选项一"]
                    if (player.countCards("he")) list.push("选项二")
                    let choiceList = [`令${get.translation(player)}摸一张牌，然后本回合无法响应其使用的牌`, `令${get.translation(player)}弃置任意张牌，然后本回合不能使用或打出与以此法弃置牌花色相同的牌`]
                    let next = await target.chooseControl(list)
                        .set("prompt", "墨影：请选择一项")
                        .set("choiceList", choiceList)
                        .set("ai", () => {
                            let player = get.player()
                            let controls = get.event().controls
                            if (controls.length == 1) return controls[0]
                            if (player.countCards("he") > 2 && Math.random() < 0.3) return "选项二"
                            if ((player.getEquip("bagua") || player.getEquip("rewrite_bagua")) && Math.random() > 0.3) return "选项二"
                            return "选项一"
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
                            let next = await player.chooseToDiscard([1, Infinity], true).set("ai", (card) => {
                                let player = get.player()
                                let cards = player.getCards("he", card => get.value(card) <= 4).sort((a, b) => get.value(a) - get.value(b))
                                let suits = cards.filter(c => !player.getHistory("lose", evt => evt.getParent("gbmoying", true)).map(evt => evt.cards).flat().reduce((suit, card) => suit.add(get.suit(card)), []).includes(get.suit(c)))
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
                audio: "gbmoying",
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
        audio: "ext:GirlsBand/audio/skill:3",
        trigger: {
            player: "discardAfter"
        },
        filter(event, player) {
            return event.cards?.length && (event.cards.length >= 2 || event.cards.some(card => get.color(card) == "black" && card.original == "h"))
        },
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(get.prompt2(event.skill))
                .set("filterTarget", (card, player2, target) => lib.filter.targetEnabledx(get.autoViewAs({ name: "sha", nature: "thunder", isCard: true }), player2, target))
                .set("ai", (target) => get.attitude(player, target) < 0)
                .forResult()
        },
        async content(event, trigger, player) {
            const target = event.targets[0]
            const card = get.autoViewAs({ name: "sha", nature: "thunder", isCard: true })
            if (!player.canUse(card, target, false, false)) return
            const next = player.useCard(card, target, false)
            player.when({ source: "damageBegin2" })
                .filter(evt => evt.card == next.card && evt.player == target)
                .then(() => {
                    const event = get.event()
                    event.player.markAuto("gbfuxi_effect", event.target)
                    event.player.addTempSkill("gbfuxi_effect")
                })
                .set("target", target)
            await next
        },
        ai: {
            threaten: 1,
            expose: 0.3
        },
        subSkill: {
            effect: {
                audio: false,
                onremove: true,
                trigger: {
                    source: "damageBegin1"
                },
                forced: true,
                filter(event, player) {
                    return player.getStorage("gbfuxi_effect").includes(event.player)
                },
                async content(event, trigger, player) {
                    trigger.num++
                },
                mod: {
                    cardUsableTarget(card, player, target) {
                        if (player.getStorage("gbfuxi_effect").includes(target)) return true
                    }
                }
            }
        }
    },
    gbzicheng: {
        audio: "ext:GirlsBand/audio/skill:3",
        trigger: {
            player: "phaseDiscardEnd"
        },
        forced: true,
        async content(event, trigger, player) {
            player.gain(lib.card.ying.getYing((player.getHistory("sourceDamage")?.reduce((num, evt) => num += evt.num, 0) || 0) + 1))
        },
        group: 'gbzicheng_effect',
        subSkill: {
            effect: {
                audio: "gbzicheng",
                enable: ['chooseToUse', 'chooseToRespond'],
                filter(event, player) {
                    var list = ['sha', 'shan'];
                    return player.countCards("hs", card => get.name(card) == "ying") && list.some(name => event.filterCard({
                        name: name
                    }, player, event))
                },
                chooseButton: {
                    dialog(event, player) {
                        var list = ['sha', 'shan'];
                        return ui.create.dialog("自成", [list, "vcard"]);
                    },
                    filter(button, player) {
                        return get.event().getParent().filterCard({
                            name: button.link[2]
                        }, player, get.event().getParent());
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
            global: "gameDrawBegin",
        },
        logAudio(event, player, name) {
            if (name == "phaseZhunbeiBegin") return "ext:GirlsBand/audio/skill/gbbeihua" + get.rand(3, 5)
            return "ext:GirlsBand/audio/skill/gbbeihua" + get.rand(1, 2)
        },
        forced: true,
        mark: true,
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        async content(event, trigger, player) {
            const me = player;
            const numx = trigger.num;
            trigger.num = function (player) {
                if (player == me) return 5 + (typeof numx == "function" ? numx(player) : numx)
                return typeof numx == "function" ? numx(player) : numx
            };
        },
        group: "gbbeihua_ready",
        subSkill: {
            ready: {
                audio: false,
                trigger: {
                    player: "phaseZhunbeiBegin"
                },
                forced: true,
                async content(event, trigger, player) {
                    const cards = player.getCards("h")
                    if (cards.length) {
                        const next = player.addToExpansion(cards, "giveAuto").gaintag.add("gbbeihua")
                        await next
                    }
                    const num = player.countExpansions("gbbeihua")
                    if (num) await player.gain(lib.card.ying.getYing(num))
                }
            }
        }
    },
    gbxianzhong: {
        audio: "ext:GirlsBand/audio/skill:3",
        enable: "phaseUse",
        filterCard: true,
        selectCard: 2,
        position: "h",
        check(card) {
            let player = get.player()
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
                let target = await player.chooseTarget("献忠：视为对一名角色使用【火攻】", true)
                    .set("filterTarget", (card, player, target) => lib.filter.targetEnabledx({
                        name: "huogong"
                    }, player, target))
                    .set("ai", (target) => {
                        let player = get.player()
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
        audioname2: { "gb_sp_mortis": [6, 7, 8].map(i => "ext:GirlsBand/audio/skill/gbchenggu" + i) },
        logAudio: index => (typeof index === "number" ? "ext:GirlsBand/audio/skill/gbchenggu" + index : "ext:GirlsBand/audio/skill/gbchenggu1"),
        popup: false,
        trigger: {
            player: "phaseDiscardEnd",
            source: "damageBegin1"
        },
        mod: {
            aiUseful(player, card, num) {
                if (get.name(card) == "ying") return num + 4
            }
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseBool(get.prompt2(event.skill))
                .set("trigger", trigger)
                .set("ai", () => {
                    const event = get.event()
                    return event.player.hasCard("ying")
                })
                .forResult()
        },
        async content(event, trigger, player) {
            player.logSkill(event.name, null, null, null, [1])
            await player.showHandcards(`${get.translation(player)}发动了【成孤】`)
            const yings = player.getCards("h", card => get.name(card) == "ying")
            if (!yings.length) return
            const num = Math.min(5, yings.length)
            await player.discard(yings)
            const list = []
            const choiceList = ["令此次伤害+1", "获得所有的『华』", "令一名角色弃置" + get.cnNumber(num) + "张牌", "令一名角色摸" + get.cnNumber(num) + "张牌"]
            if (event.triggername == "damageBegin1") list.push("选项一")
            if (player.hasExpansions("gbbeihua")) list.push("选项二")
            list.push("选项三", "选项四")
            const choice = await player.chooseControl(list, true)
                .set("prompt", "成孤：请选择一项")
                .set("choiceList", choiceList)
                .set("trigger", trigger)
                .set("num", num)
                .set("ai", () => {
                    const event = get.event()
                    const player = event.player
                    const trigger = event.trigger
                    if (event.controls.includes("选项一") && trigger.player && get.attitude(player, trigger.player) < 0) return "选项一"
                    if (event.controls.includes("选项二") && player.countExpansions("gbbeihua") > 2) return "选项二"
                    if (event.controls.includes("选项四") && game.hasPlayer(target => get.attitude(player, target) > 0)) return "选项四"
                    return event.controls.find(control => control != "cancel2")
                })
                .forResult()
            if (!choice.control || choice.control == "cancel2") return
            game.log(player, "选择了", "#g【成孤】", "的", "#y" + choice.control)
            switch (choice.control) {
                case "选项一":
                    player.logSkill(event.name, null, null, null, [2])
                    trigger.num++
                    break
                case "选项二":
                    player.logSkill(event.name, null, null, null, [3])
                    await player.gain(player.getExpansions("gbbeihua"), "bySelf", "giveAuto", "log")
                    break
                case "选项三":
                    var result = await player.chooseTarget("成孤：请选择一名角色弃置" + get.cnNumber(num) + "张牌", true)
                        .set("ai", target => get.attitude(player, target) < 0)
                        .forResult()
                    if (result.bool) result.targets[0].chooseToDiscard("he", true, num)
                    break
                case "选项四":
                    var result = await player.chooseTarget("成孤：请选择一名角色摸" + get.cnNumber(num) + "张牌", true)
                        .set("ai", target => get.attitude(player, target) > 0)
                        .forResult()
                    if (result.bool) await result.targets[0].draw(num)
                    break
            }
        },
        ai: {
            threaten: 0.6
        }
    },
    // 喵梦
    gbmiaomeng: {
        audio: false,
        popup: false,
        trigger: {
            global: "phaseBefore",
            player: "enterGame"
        },
        forced: true,
        filter(event, player) {
            return event.name != "phase" || game.phaseNumber == 0
        },
        async content(event, trigger, player) {
            for (const target of game.filterPlayer().sortBySeat()) await target.draw()
            for (const target of game.filterPlayer().sortBySeat()) {
                if (!target.countCards("h")) continue
                const result = await target.chooseCard("喵梦：请选择一张手牌置于武将牌上", "h", true)
                    .set("ai", card => 6 - get.value(card))
                    .forResult()
                if (result.bool) {
                    const next = target.addToExpansion(result.cards, "giveAuto")
                    next.gaintag.add("gbmiaomeng_fire")
                    await next
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
                audio: [3, 4].map(i => "ext:GirlsBand/audio/skill/gbmiaomeng" + i),
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
                    name: "火"
                },
                async content(event, trigger, player) {
                    const target = trigger.player
                    const result = await target.chooseControl(["选项一", "选项二"])
                        .set("prompt", "喵梦：请选择一项")
                        .set("choiceList", ["失去1点体力", "令" + get.translation(player) + "获得『火』并摸一张牌"])
                        .set("source", player)
                        .set("ai", () => {
                            const event = get.event()
                            const target = event.player
                            if (target.hp <= 1) return "选项二"
                            if (get.attitude(target, event.source) > 0) return "选项二"
                            return "选项一"
                        })
                        .forResult()
                    game.log(target, "选择了", "#g【喵梦】", "的", "#y" + result.control)
                    if (result.control == "选项一") {
                        await target.loseHp()
                    } else if (result.control == "选项二") {
                        await player.gain(target.getExpansions("gbmiaomeng_fire"), "giveAuto")
                        await player.draw()
                    }
                    if (!target.hasExpansions("gbmiaomeng_fire")) target.unmarkSkill("gbmiaomeng_fire")
                }
            }
        }
    },
    gbchuanting: {
        audio: false,
        popup: false,
        enable: "phaseUse",
        usable: 2,
        filterTarget(card, player, target) {
            return target != player && !player.getStorage("gbchuanting_used").includes(target) && target.countCards("h") > 0
        },
        selectTarget: () => [1, get.player().hp],
        ai2: (target) => {
            if (ui.selected.targets.length >= Math.floor(game.countPlayer() / 2)) return 0
            if (get.attitude(get.player(), target) > 0) return 1
            return 10
        },
        filter(event, player) {
            return game.hasPlayer(target => target != player && !player.getStorage("gbchuanting_used").includes(target) && target.countCards("h") > 0)
        },
        multitarget: true,
        multiline: true,
        async content(event, trigger, player) {
            const targets = event.targets
            player.markAuto("gbchuanting_used", targets)
            player.addTempSkill("gbchuanting_used")
            await player.chooseToDebate([player, ...targets])
                .set("callback", async () => {
                    const debate = get.event()
                    const player = get.player()
                    const result = debate.debateResult
                    if (!result?.bool) return
                    if (result.opinion != "black") {
                        for (const target of result.targets.sortBySeat()) {
                            const { cards: [card] } = await target.draw().forResult()
                            if (card) {
                                const next = target.addToExpansion(card, "giveAuto")
                                next.gaintag.add("gbmiaomeng_fire")
                                await next
                            }
                        }
                    }
                    if (result.opinion != "red") {
                        await player.gain(lib.card.ying.getYing(player.hp))
                    }
                })
        },
        subSkill: {
            used: {
                onremove: true
            }
        },
        ai: {
            order: 8,
            result: {
                player: 1
            }
        }
    },
    gbruoye: {
        audio: "ext:GirlsBand/audio/skill:2",
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
            let player = get.player()
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
            let player = get.player()
            if (ui.selected.targets.length == 0) return get.effect(target, {
                name: "sha"
            }, player, player) > 0
            if (ui.selected.targets.length == 1) {
                if (player.hasCard("ying")) return 0
                return get.attitude(player, target) > 0 ? 10 : 1
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
        audio: "ext:GirlsBand/audio/skill:3",
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
        forced: true,
        filter(event, player, name) {
            return (name == "phaseBegin" && !player.hasExpansions("gbxinshen")) || game.phaseNumber == 0;
        },
        async content(event, trigger, player) {
            await player.draw(2)
            let result = await player.chooseCard("信身：请选择一张手牌", "h", true)
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
                locked: true,
                filter(event, player) {
                    if (event.name == "chooseToCompare") return player.hasExpansions("gbxinshen")
                    return event.list.includes(player) && player.hasExpansions("gbxinshen")
                },
                async cost(event, trigger, player) {
                    event.result = await player.chooseButton(["信身：请选择一张牌。", [player.getExpansions("gbxinshen"), "card"]], true)
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
        audio: "ext:GirlsBand/audio/skill:3",
        enable: "phaseUse",
        filter(event, player) {
            return game.hasPlayer(target => !player.getStorage("gbyongling_used").includes(target) && target != player && player.canCompare(target))
        },
        filterTarget(card, player, target) {
            return !player.getStorage("gbyongling_used").includes(target) && target != player && player.canCompare(target)
        },
        ai2(target) {
            let player = get.player()
            if (get.attitude(player, target) > 0) {
                if (target.getCards("j")) return 1
                else return 0
            }
            if (target.countCards("hej") > 2) {
                return get.attitude(player, target) < 0
            }
            return 0
        },
        async content(event, trigger, player) {
            const target = event.targets[0]
            player.markAuto("gbyongling_used", target)
            player.addTempSkill("gbyongling_used")
            let result = await player.chooseToCompare(target).forResult()
            if (result.bool) {
                let num = 0
                if (target.countCards("h")) num++;
                if (target.countCards("e")) num++;
                if (target.countCards("j")) num++;
                player.gainPlayerCard("hej", target, num, true)
                    .set("filterButton", (button) => {
                        for (let i = 0; i < ui.selected.buttons.length; i++) {
                            if (get.position(button.link) == get.position(ui.selected.buttons[i].link)) return false;
                        }
                        return true;
                    })
                    .set("complexCard", true);
            } else {
                target.gain(result.player, "log")
            }
        },
        ai: {
            threaten: 0.6,
            expose: 0.15,
            order: 8,
        },
        subSkill: {
            used: {
                onremove: true,
            }
        }
    },
    gbhaixi: {
        audio: "ext:GirlsBand/audio/skill:4",
        trigger: {
            player: "compare",
            target: "compare"
        },
        locked: true,
        filter(event, player) {
            return player.countCards('he') > 0
        },
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseCardTarget()
                .set("prompt", `###${get.prompt(event.skill)}###请选择一张牌并调整一名角色的拼点牌点数`)
                .set("position", "he")
                .set("target", [trigger.player, trigger.target])
                .set("filterTarget", (card, player, target) => get.event().target.includes(target))
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
            const target = event.targets[0]
            const result = await player.chooseControl(["选项一", "选项二"], true)
                .set("prompt", "海希：将" + get.translation(target) + "的拼点牌点数...")
                .set("choiceList", ["调整为8", "调整为9"])
                .set("trigger", trigger)
                .set("ai", () => {
                    const event = get.event()
                    const trigger = event.trigger
                    const player = event.player
                    const own = trigger.player == player ? trigger.num1 : trigger.num2
                    const other = trigger.player == player ? trigger.num2 : trigger.num1
                    return own < other ? "选项一" : "选项二"
                })
                .forResult()
            game.log(player, "选择了", "#g【海希】", "的", "#y" + result.control)
            await player.recast(event.cards)
            trigger[target == trigger.player ? "num1" : "num2"] = result.control == "选项一" ? 8 : 9
            game.log(target, "的拼点牌点数修改为", trigger[target == trigger.player ? "num1" : "num2"])
            await player.gain(lib.card.ying.getYing())
        },
    },
    // Morits
    gbmuling: {
        audio: "ext:GirlsBand/audio/skill:3",
        trigger: {
            global: "roundStart"
        },
        forced: true,
        locked: false,
        async content(event, trigger, player) {
            player.gain(lib.card.ying.getYing(2))
            let target = (await player.chooseTarget("睦灵：选择一名其他角色，然后获得其武将牌上的一个技能", true)
                .set("filterTarget", (card, player, target) => target != player)
                .set("ai", (target) => {
                    let player = get.player()
                    let list = game.filterPlayer().map(p => p.getGainableSkills((info, skill) => !player.hasSkill(skill) && !info.limited && !info.juexingji && !info.zhuSkill && !info.persevereSkill && !info.unique && !info.dutySkill && !info.hiddenSkill)).flat().sort((a, b) => {
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
                .forResult()).targets
            if (target) {
                let list = target[0].getGainableSkills((info, skill) => !player.hasSkill(skill) && !info.limited && !info.juexingji && !info.zhuSkill && !info.persevereSkill && !info.unique && !info.dutySkill && !info.hiddenSkill)
                const switchToAuto = () => {
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
                    const event = get.event();
                    event.switchToAuto = () => {
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
                    var clickItem = () => {
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
        audio: "ext:GirlsBand/audio/skill:3",
        locked: true,
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
            let result = await player.chooseCard(`###${get.prompt(event.skill)}###请弃置一张【影】并回复1点体力，或点取消获得对你造成伤害的牌并获得一张【影】`)
                .set("filterCard", (card) => get.name(card) == "ying")
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
                player.gain(trigger.cards, "gain2")
                player.gain(lib.card.ying.getYing(), "gain2")
            }
        }
    },
    // 后藤一里
    gbjuxiang: {
        audio: false,
        trigger: {
            player: "phaseDiscardEnd"
        },
        async content(event, trigger, player) {
            await player.draw(5)
            await player.chooseToDiscard(Math.min(game.countGroup(), 4), true, "he")
        },
        group: "gbjuxiang_use",
        subSkill: {
            use: {
                audio: false,
                enable: "phaseUse",
                usable: 1,
                async content(event, trigger, player) {
                    await lib.skill.gbjuxiang.content(event, trigger, player)
                },
                ai: {
                    order: 6,
                    result: {
                        player: 1
                    }
                }
            },
        },
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
                if (get.name(event.card) === "huogong") return event.player.countCards("h") > 4 - player.hp - player.hujia;
                if (get.name(event.card) === "shuiyanqijunx") return player.countCards("e") === 0;
                return true
            } else if (player.hp > 2) {
                if (get.name(event.card) === "shunshou") return true
            }
            return false
        },
        async content(event, trigger, player) {
            await player.loseHp()
            if (player.isDead()) return
            let result = await player.chooseButton([
                `###${get.prompt(event.name)}###请选择一项`,
                [
                    [
                        ["give", "交给一名其他角色一张牌，然后令此牌对你无效"],
                        ["use", "发动一次〖橘箱〗"],
                    ],
                    "textbutton",
                ],
            ])
                .set("filterButton", function (button) {
                    let player = get.player()
                    if (button.link == "give") return player.countCards("he")
                    return true
                })
                .set("ai", function (button) {
                    let player = get.player()
                    switch (button.link) {
                        case "give":
                            if (game.hasPlayer(p => get.attitude(player, p) > 0)) return Math.random() * 4
                            return 0
                        case "use":
                            return 5 - Math.min(game.countGroup(), 4)
                    }
                })
                .forResult()
            if (result.bool) {
                if (result.links[0] == "give") {
                    let choice = await player.chooseCardTarget()
                        .set("forced", true)
                        .set("prompt", "孤独：请选择并交给一名其他角色一张牌")
                        .set("filterTarget", (card, player, target) => {
                            return target != player
                        })
                        .set("position", "he")
                        .set("ai1", (card) => {
                            let player = get.player()
                            if (game.hasPlayer(p => get.attitude(player, p) > 0)) return 7 - get.value(card)
                            else return 4 - get.value(card)
                        })
                        .set("ai2", (target) => {
                            let player = get.player()
                            if (game.hasPlayer(p => get.attitude(player, p) > 0)) {
                                if (get.attitude(player, target) > 0) return true
                                else false
                            } else true
                        })
                        .forResult()
                    if (choice.bool) {
                        await player.give(choice.cards, choice.targets[0], "giveAuto")
                        trigger.getParent().excluded.add(player);
                    }
                } else {
                    await player.useSkill("gbjuxiang")
                }
            }
        }
    },
    gbyingxiong: {
        audio: false,
        trigger: {
            player: "dyingEnd"
        },
        filter(event, player) {
            return player.countCards("he") > 0
        },
        locked: true,
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseCardTarget()
                .set("position", "he")
                .set("prompt", `###${get.prompt(event.skill)}###请弃置一张牌，并对一名距离1以内的角色造成1点伤害`)
                .set("filterTarget", (card, player, target) => target != player && get.distance(player, target) <= 1 && !player.getStorage("gbyingxiong_used").includes(target))
                .set("ai1", (card) => 6 - get.value(card))
                .set("ai2", (target) => {
                    let player = get.player()
                    return get.attitude(player, target) < 0
                })
                .forResult()
        },
        async content(event, trigger, player) {
            await player.discard(event.cards)
            player.markAuto("gbyingxiong_used", event.targets[0])
            player.addTempSkill("gbyingxiong_used")
            await event.targets[0].damage()
        },
        subSkill: {
            used: { onremove: true }
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
            let { card: card, targets: [target] } = await player.chooseUseTarget({ name: "huogong" }, true)
                .set("ai", (target) => {
                    let player = get.player()
                    if (get.attitude(player, target) < 0) return get.effect(target, { name: "huogong" }, player, player)
                    return get.effect(target, { name: "draw" }, player, player) + get.effect(player, { name: "draw" }, player, player)
                })
                .set("filterTarget", (card, player, target) => target != player && player.canUse("huogong", target))
                .forResult()
            if (!player.hasHistory("sourceDamage", evt => evt.card == card)) {
                await player.draw()
                await target.draw()
            }
        },
        ai: {
            threaten: 0.4
        }
    },
    gbzhiwo: {
        audio: false,
        trigger: {
            player: "useCardAfter"
        },
        usable(skill, player) {
            if (player.isPhaseUsing()) return 3
            return 0
        },
        filter(event, player) {
            return event.targets.length == 1 && (get.name(event.card) == "sha" || get.type(event.card) == "trick")
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard(get.prompt2(event.skill))
                .set("ai", card => {
                    const event = get.event()
                    const player = event.player
                    const type = get.type2(card)
                    if (type == "basic") return 1
                    if (type == "equip") return (player.getUseValue({ name: "huogong" }) > 0 || game.hasPlayer(p => get.attitude(player, p) > 0 && p != player)) ? 1 : 0
                    if (type == "trick") return event.trigger.targets[0].isDamaged() ? 1 : 0
                    return 0
                })
                .forResult()
        },
        async content(event, trigger, player) {
            await player.showCards(event.cards)
            switch (get.type2(event.cards[0])) {
                case "basic":
                    await player.draw()
                    break
                case "trick":
                    await trigger.targets[0].recover()
                    break
                case "equip":
                    await player.useCard("gbnongchao")
                    break
            }
        }
    },
    gbsushi: {
        audio: false,
        enable: "phaseUse",
        usable: 3,
        filterCard: true,
        position: "h",
        check(card) {
            return 6 - get.value(card)
        },
        async content(event, trigger, player) {
            if (get.suit(event.cards[0]) == "club") {
                let result = await player.chooseTarget("素食：请选择并获得一名其他角色的一张手牌")
                    .set("filterTarget", (card, player, target) => target != player && player.inRange(target))
                    .set("ai", (target) => {
                        let player = get.player()
                        return get.attitude(player, target) < 0
                    })
                    .forResult()
                if (result.bool) {
                    player.gainPlayerCard("h", result.targets[0], true)
                }
            } else {
                let result = await player.chooseTarget(`素食：将${get.translation(event.cards[0])}交给一名其他角色`)
                    .set("ai", (target) => {
                        let player = get.player()
                        return get.attitude(player, target) < 0
                    })
                    .set("filterTarget", (card, player, target) => player != target)
                    .forResult()
                if (result.bool) {
                    await player.give(event.cards, result.targets[0], "giveAuto")
                    let card = (await result.targets[0].chooseCard(`素食：将一张牌交给${get.translation(player)}`, "he", true)
                        .set("ai", (card) => 6 - get.value(card))
                        .forResult()).cards
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
                let next = await trigger.player.chooseCard(`常栖：弃置一张牌`, "he", true)
                    .set("ai", (card) => 6 - get.value(card))
                    .forResult()
                if (next && next.bool) {
                    await trigger.player.discard(next.cards)
                    if (get.suit(next.cards[0]) == "club") await player.gain(next.cards[0], "giveAuto", "log")
                }
            } else {
                let next = await player.chooseCard(`常栖：重铸一张牌`, "he")
                    .set("ai", (card) => 6 - get.value(card))
                    .forResult()
                if (next && next.bool) {
                    if (get.suit(next.cards[0]) != "club") await player.draw()
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
            for (let current of game.filterPlayer().sortBySeat()) {
                if (current == player) continue
                if (!current.countCards("h")) continue
                let result = await current.chooseButton([
                    `###${get.prompt(event.name)}###请选择一项`,
                    [
                        [
                            ["give", `交给一名${get.translation(player)}一张手牌并摸一张牌，然后本回合所有非锁定技失效`],
                            ["discard", `弃置一张手牌，然后重铸${get.translation(player)}手牌区或判定区的一张牌`],
                        ],
                        "textbutton",
                    ]
                ], true)
                    .set("ai", function (button) {
                        let player = get.player()
                        switch (button.link) {
                            case "give":
                                if (get.attitude(player, current) > 0) return 1
                                return Math.max(0.01, (2 - current.getSkills(null, false, false).filter(skill => !get.is.locked(skill)).length) * Math.random(), 1)
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
                            var card = (await current.chooseCard(`先路：选择一张手牌交给${get.translation(player)}`, true)
                                .set("ai", (card) => get.value(card))
                                .forResult()).cards
                            await current.give(card, player, "giveAuto")
                            await current.draw()
                            current.addTempSkill("fengyin")
                            break
                        case "discard":
                            if (!current.countCards("h")) return
                            await current.chooseToDiscard(`先路：弃置一张手牌`, "h", true)
                                .set("ai", (card) => get.value(card))
                            let next = await current.choosePlayerCard(player, "hj", 1, true)
                                .set("prompt", `先路：请重铸${get.translation(player)}手牌区或判定区的一张牌`)
                                .set("ai", (button) => {
                                    let player = get.player()
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
        usable: 3,
        selectCard: [1, 2],
        position: "h",
        lose: false,
        filterCard: true,
        filterTarget: lib.filter.notMe,
        ai1(card) {
            return 6 - get.value(card)
        },
        ai2(target) {
            let player = get.player()
            if (get.attitude(player, target) > 0) {
                if (target.group != player.group) return 2
                return 1
            } else {
                return 0
            }
        },
        async content(event, trigger, player) {
            await player.give(event.cards, event.targets[0])
            let result = await event.targets[0].chooseCard(`赫戏：将两张牌交给${get.translation(player)}并获得〖求凰〗，或点击取消，令其回复1点体力，若其未受伤，则改为增加1点体力上限`, 2, "he")
                .set("ai", (card) => {
                    let source = get.event().source
                    let player = get.player()
                    if (get.attitude(player, source) > 0 && source.hp <= 2 && (player.group == source.group || player.hasSkill("gbqiuhuang"))) return 0
                    return 6 - get.value(card)
                })
                .set("source", player)
                .forResult()
            if (result.bool) {
                await event.targets[0].give(result.cards, player, "giveAuto")
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
            const targets = game.filterPlayer(target => target.hasSkill("gbqiuhuang") || target.group == player.group)
            return targets.some(target => !player.getStorage("gbqiuhuang_used").includes(target))
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(get.prompt2(event.skill))
                .set("filterTarget", (card, player, target) => {
                    if (player == target) return false
                    if (player.getStorage("gbqiuhuang_used").includes(target)) return false
                    return target.hasSkill("gbqiuhuang") || target.group == player.group
                })
                .set("ai", target => get.attitude(player, target) > 0)
                .forResult()
        },
        async content(event, trigger, player) {
            const target = event.targets[0]
            player.markAuto("gbqiuhuang_used", target)
            player.addTempSkill("gbqiuhuang_used")
            const result = await target.chooseBool("求凰：是否视为对" + get.translation(player) + "使用一张【桃】？")
                .set("source", player)
                .set("ai", () => {
                    const event = get.event()
                    return get.attitude(event.player, event.source) > 0
                })
                .forResult()
            if (!result.bool) return
            const next = target.useCard(get.autoViewAs({ name: "tao", isCard: true }), player)
            await next
            if (player.isDying()) return
            await target.chooseToDiscard("he", true, 2)
            await target.loseHp()
            const source = trigger.reason?.source
            if (source && source != target) await source.loseHp()
        },
        subSkill: {
            used: {
                onremove: true
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
                return get.event().getParent().filterCard({
                    name: button.link[2],
                    nature: button.link[3]
                }, player, get.event().getParent());
            },
            check(button) {
                var player = get.player();
                var card = {
                    name: button.link[2],
                    nature: button.link[3]
                };
                return get.event().getParent().type == "phase" ? player.getUseValue(card) : 1
            },
            backup(links, player) {
                return {
                    audio: false,
                    filterCard: true,
                    position: "hes",
                    selectCard() {
                        let player = get.player()
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
        usable: 3,
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
                let next = await player.chooseTarget("呐喊：请选择一名其他角色，令其选择是否交给你一张牌", true)
                    .set("filterTarget", (card, player, target) => target != player)
                    .set("ai", (target) => {
                        let player = get.player()
                        if (get.attitude(player, target) > 0 && target.isDamaged() && target.getEquips("baiyin")) return 10
                        if (get.attitude(player, target) > 0) return 5
                        return 1
                    })
                    .forResult()
                if (next && next.bool) {
                    let card = await next.targets[0]
                        .chooseCard(`呐喊：是否交给${get.translation(player)}一张牌`, "he")
                        .set("ai", (card) => {
                            let player = get.player()
                            let source = get.event().sourcex
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
                await player.chooseUseTarget({ name: "juedou" }, true)
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
            let next = await target.chooseCard("闺泣：是否交给" + get.translation(player) + "一张牌？")
                .set("ai", (card) => {
                    let player = get.player()
                    let target = get.event().target
                    if (get.attitude(player, target) > 0) return 6 - get.value(card)
                    return false
                })
                .set("target", player)
                .forResult()
            if (next && next.bool) {
                target.give(next.cards, player, "giveAuto")
                player.draw()
                target.draw()
            }
        }
    },
    // 桃香
    gbkongxiang: {
        audio: false,
        trigger: {
            player: "useCard",
            target: "useCardToTargeted"
        },
        mark: "auto",
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        filter(event, player, name) {
            if (!player.countCards("h")) return false
            return get.type(event.card) == "basic" || get.name(event.card) == "juedou"
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard(`###${get.prompt(event.skill)}###请选择任意张手牌置于武将牌上`, "h", [1, Infinity])
                .set("ai", (card) => {
                    let player = get.player()
                    if (get.tag(trigger.card, "respondSha")) {
                        if (player.countCards("h", {
                            name: "sha"
                        }) === 0) return 8 - get.value(card)
                        if (ui.selected.cards.filter(c => c.name == "sha").length >= player.countCards("h", card => get.name(card) == "sha")) return false
                    } else if (get.tag(trigger.card, "respondShan")) {
                        if (player.countCards("h", {
                            name: "shan"
                        }) === 0) return 8 - get.value(card)
                        if (ui.selected.cards.filter(c => c.name == "shan").length >= player.countCards("h", card => get.name(card) == "shan")) return false
                    } else if (get.tag(trigger.card, "damage") && player.hp < 2) {
                        if (get.name(card) == "tao") return false
                        if (get.name(card) == "jiu") return false
                    }
                    return 8 - get.value(card)
                })
                .forResult()
        },
        async content(event, trigger, player) {
            player.addToExpansion(event.cards, "giveAuto").gaintag.add("gbkongxiang")
            let result = await player.chooseBool("空箱：是否摸一张牌？")
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
                    if (get.name(card) == "juedou" && target.mayHaveSha(player)) return [1, -2]
                    if (get.name(card) == "sha" && target.mayHaveShan(player)) return [1, -2]
                    if (get.name(card) == "tao" || get.name(card) == "jiu") return [1, 1]
                }
            }
        }
    },
    gbxuanxie: {
        audio: false,
        trigger: {
            player: "loseAfter"
        },
        filter(event, player) {
            return !player.countCards("h") && event.hs?.length > 0
        },
        async cost(event, trigger, player) {
            const list = ["选项一", "选项二"]
            const choiceList = ["摸一张牌", "当前的回合结束时，对一名距离1以内的其他角色使用『空箱』中所有的【杀】", "本回合结束时，令一名角色获得『空箱』中的所有牌"]
            if (player.countExpansions("gbkongxiang").length > 0) {
                list.push("选项三")
            }
            list.push("cancel2")
            const result = await player.chooseControl(list)
                .set("prompt", `###${get.prompt(event.skill)}###请选择一项`)
                .set("choiceList", choiceList)
                .set("ai", () => {
                    const event = get.event()
                    const player = get.player()
                    if (game.hasPlayer(p => get.distance(player, p) <= 1 && get.effect(p, { name: "sha" }, player, player) > 0) && player.getExpansions("gbkongxiang").filter(card => get.name(card) == "sha")) return "选项二"
                    if (event.controls.includes("选项三") && player.countExpansions("gbkongxiang") > 3) return "选项三"
                    return "选项一"
                })
                .forResult()
            event.result = {
                bool: result.control != "cancel2",
                cost_data: result.control,
            }
        },
        async content(event, trigger, player) {
            game.log(player, "选择了", "#g【宣泄】", "的", "#y" + event.cost_data)
            if (event.cost_data == "选项一") {
                await player.draw()
            } else if (event.cost_data == "选项二") {
                player.when({ global: "phaseEnd" })
                    .then(async (event, trigger, player) => {
                        const { targets: [target] } = await player.chooseTarget("宣泄：对一名其他角色使用『空箱』中所有的【杀】", true)
                            .set("ai", target => {
                                const player = get.player()
                                return player.getExpansions("gbkongxiang").filter(card => get.name(card) == "sha").reduce((num, card) => num + get.effect(target, card, player, player))
                            })
                            .set("filterTarget", (card, player, target) => get.distance(player, target) >= 1)
                            .forResult()
                        const cards = player.getExpansions("gbkongxiang").filter(card => get.name(card) == "sha")
                        for (const card of cards) {
                            await player.useCard(card, target, false)
                        }
                    })
            } else if (event.cost_data == "选项三") {
                player.when({ global: "phaseEnd" })
                    .then(async (event, trigger, player) => {
                        const result = await player.chooseTarget("宣泄：请选择一名角色获得『空箱』中的所有牌", true)
                            .set("ai", target => get.attitude(get.player(), target))
                            .forResult()
                        if (result.bool) await player.give(player.getExpansions("gbkongxiang"), result.targets[0], "giveAuto")
                    })
            }
        },
        ai: {
            threaten: 1,
            combo: "gbkongxiang"
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
            await player.draw(3)
            const result = await player.chooseCard("嘘子：请选择任意张手牌置于武将牌上，称为『嘘』", true, [1, Infinity])
                .set("ai", card => {
                    const dis = player.needsToDiscard(0, (card2, player2) => !player2.canIgnoreHandcard(card2) && !player2.hasValueTarget(card2))
                    if (_status.currentPhase == player) return (dis ? 6 : 4) - get.value(card)
                    return -get.value(card)
                })
                .forResult()
            if (result.bool) {
                const next = player.addToExpansion(result.cards, "giveAuto")
                next.gaintag.add("gbxuzi")
                await next
            }
        },
        group: ["gbxuzi_lose", "gbxuzi_effect"],
        subSkill: {
            lose: {
                audio: false,
                forced: true,
                trigger: {
                    player: "loseBegin"
                },
                filter(event, player) {
                    return event.cards?.some(card => card.gaintag.includes("gbxuzi"))
                },
                async content(event, trigger, player) {
                    player.draw(trigger.cards.filter(card => card.gaintag.includes("gbxuzi")).length)
                }
            },
            effect: {
                audio: false,
                trigger: {
                    global: "phaseEnd"
                },
                filter(event, player) {
                    return event.player != player && !player.hasExpansions("gbxuzi")
                },
                async cost(event, trigger, player) {
                    event.result = await player.chooseBool("嘘子：是否失去1点体力并发动一次〖嘘子〗？")
                        .set("ai", () => player.hp > 1 || player.hasCard("tao") || player.hasCard("jiu"))
                        .forResult()
                },
                async content(event, trigger, player) {
                    await player.loseHp()
                    await lib.skill.gbxuzi.content(event, trigger, player)
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
        forced: true,
        async content(event, trigger, player) {
            const target = trigger.player
            const num = player.countExpansions("gbxuzi")
            const result = await target.chooseButton(["声无：请选择一项", [
                [
                    ["damage", "获得一张『嘘』，然后受到1点伤害"],
                    ["give", "将" + get.cnNumber(num) + "张牌置于" + get.translation(player) + "的武将牌上"]
                ],
                "textbutton"
            ]], true)
                .set("filterButton", button => button.link != "give" || target.countCards("he") >= get.event().num)
                .set("num", num)
                .set("ai", button => button.link == "give" ? target.countCards("he") - 3 > get.event().num : target.hp > 1)
                .forResult()
            if (!result.bool) return
            if (result.links[0] == "damage") {
                const next = await target.chooseButton(["声无：请选择并获得一张牌", player.getExpansions("gbxuzi")], true)
                    .set("ai", button => get.value(button.link))
                    .forResult()
                if (next.bool) await target.gain(next.links, "giveAuto", "log")
                await target.damage()
            } else {
                const next = await target.chooseCard("声无：请选择" + get.cnNumber(num) + "张牌置于" + get.translation(player) + "的武将牌上", "he", num, true)
                    .set("ai", card => 6 - get.value(card))
                    .forResult()
                if (!next.bool) return
                const put = player.addToExpansion(next.cards, "giveAuto")
                put.gaintag.add("gbxuzi")
                await put
                const gain = await player.chooseButton(["声无：是否获得" + get.cnNumber(num) + "张『嘘』？", player.getExpansions("gbxuzi")], num)
                    .set("ai", button => get.value(button.link))
                    .forResult()
                if (gain.bool) await player.gain(gain.links, "giveAuto")
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
            const result = await player.chooseControl(["红色", "黑色", "cancel2"])
                .set("prompt", get.prompt2(event.skill))
                .set("ai", () => {
                    const player = get.player()
                    const target = get.event().getTrigger().player
                    if (get.attitude(player, target) > 0) return get.rand(2)
                    return get.rand(3)
                })
                .forResult()
            event.result = {
                bool: result.control != "cancel2",
                cost_data: result.control == "红色" ? "red" : "black"
            }
        },
        async content(event, trigger, player) {
            game.log(player, "选择了", "#g【心象】", "的", "#y" + (event.cost_data == "red" ? "红色" : "黑色"))
            const result = await trigger.player.judge()
                .set("judge", (card) => {
                    if (get.color(card) == get.event().color) {
                        return 1;
                    }
                    return -1;
                })
                .set("color", event.cost_data)
                .forResult()
            if (result.color == event.cost_data) await player.draw(2)
            else await trigger.player.draw()
        },
        ai: {
            expose: 0.1
        }
    },
    gbfenxing: {
        audio: false,
        trigger: {
            global: "judge"
        },
        usable: 1,
        filter(event, player) {
            return !event.directresult && player.countCards("he") > 0
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard(get.prompt2(event.skill, trigger.player), "he")
                .set("ai", (card) => {
                    const trigger2 = get.event().getTrigger();
                    const { player: player2, judging } = get.event();
                    const result = trigger2.judge(card) - trigger2.judge(judging);
                    const attitude = get.attitude(player2, trigger2.player);
                    let val = get.value(card);
                    if (get.subtype(card) == "equip2") {
                        val /= 2;
                    } else {
                        val /= 4;
                    }
                    if (attitude == 0 || result == 0) {
                        return 0;
                    }
                    if (attitude > 0) {
                        return result - val;
                    }
                    return -result - val;
                })
                .set("judging", trigger.player.judging[0])
                .forResult()
        },
        async content(event, trigger, player) {
            await player.loseHp()
            if (!player.isAlive()) return
            const cards = event.cards
            player.$throw(cards)
            if (cards?.length) {
                if (trigger.player.judging[0].clone) {
                    trigger.player.judging[0].clone.classList.remove("thrownhighlight");
                    game.broadcast(function (card) {
                        if (card.clone) {
                            card.clone.classList.remove("thrownhighlight");
                        }
                    }, trigger.player.judging[0]);
                    game.addVideo("deletenode", player, get.cardsInfo([trigger.player.judging[0].clone]));
                }
                await game.cardsDiscard(trigger.player.judging[0]);
                trigger.player.judging[0] = cards[0];
                trigger.orderingCards.addArray(cards);
                game.log(trigger.player, "的判定牌改为", cards);
                await game.delay(2);
            }
            player.when({ global: "judgeAfter" })
                .filter((event, player) => event == trigger)
                .then(() => { if (player != trigger.player) player.swapHandcards(trigger.player) })
        },
    },
    gbchuideng: {
        audio: false,
        trigger: {
            player: "damageAfter",
            source: "damageSource"
        },
        usable: 3,
        async content(event, trigger, player) {
            for (const target of game.filterPlayer().sortBySeat()) {
                if (target.isDead()) continue
                const choiceList = ["重铸" + get.translation(player) + "的一张牌，若此牌不为基本牌，本回合结束时" + get.translation(player) + "摸一张牌", "明置" + get.translation(player) + "的一张手牌并判定，若判定结果与此牌花色相同，" + get.translation(player) + "可以重铸一张牌并令你失去1点体力"], list = []
                if (player.countCards("he")) {
                    list.push("选项一")
                }
                if (player.countCards("h")) {
                    list.push("选项二")
                }
                if (!list.length) continue
                const next = await target.chooseControl(list)
                    .set("prompt", "吹灯：请选择一项")
                    .set("choiceList", choiceList)
                    .set("source", player)
                    .set("ai", () => {
                        const event = get.event()
                        const source = event.source
                        if (get.attitude(event.player, source) > 0) return "选项一"
                        return event.controls.includes("选项二") ? "选项二" : "选项一"
                    })
                    .forResult()
                game.log(target, "选择了", "#g【吹灯】", "的", "#y" + next.control)
                if (next.control == "选项一") {
                    const next = await target.choosePlayerCard(player, "he", 1, true)
                        .set("prompt", "吹灯：请选择并重铸" + get.translation(player) + "的一张牌")
                        .forResult()
                    if (!next.bool) continue
                    const cards = next.cards
                    await player.recast(cards)
                    if (get.type(cards[0]) != "basic") {
                        player.when({ global: "phaseEnd" })
                            .then(() => {
                                player.draw()
                            })
                    }
                } else {
                    const next = await target.choosePlayerCard(player, "h", 1, true)
                        .set("prompt", "吹灯：请明置" + get.translation(player) + "的一张手牌")
                        .forResult()
                    if (!next.bool) continue
                    const cards = next.cards
                    await player.showCards(cards)
                    const result = await target.judge().forResult()
                    if (get.suit(result.card) == get.suit(cards[0])) {
                        const result = await player.chooseCard("吹灯：你可以重铸一张牌，然后令" + get.translation(target) + "失去1点体力", "he")
                            .set("ai", card => {
                                const player = get.player()
                                const target = get.event().target
                                if (get.attitude(player, target) < 0) return 6 - get.value(card)
                                return false
                            })
                            .set("target", target)
                            .forResult()
                        if (!result.bool) return
                        await player.recast(result.cards)
                        await target.loseHp()
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
            return player.countCards("h") > 0
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard(`###${get.prompt(event.skill)}###请打出一张手牌，将判定牌花色调整为此牌花色`, "h")
                .set("ai", card => {
                    const trigger = get.event().getTrigger();
                    const player = get.player();
                    const judging = get.event().judging
                    let newCard = get.copy(judging)
                    newCard.suit = get.suit(card)
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
            const cards = event.cards
            await player.respond(cards, "gbweizhi", "highlight", "noOrdering");
            if (cards?.length) {
                if (trigger.player.judging[0].clone) {
                    trigger.player.judging[0].clone.classList.remove("thrownhighlight");
                    game.broadcast(function (card) {
                        if (card.clone) {
                            card.clone.classList.remove("thrownhighlight");
                        }
                    }, trigger.player.judging[0]);
                    game.addVideo("deletenode", player, get.cardsInfo([trigger.player.judging[0].clone]));
                }
                await game.cardsDiscard(trigger.player.judging[0]);
                trigger.player.judging[0] = cards[0];
                trigger.orderingCards.addArray(cards);
                game.log(trigger.player, "的判定牌改为", cards);
                await game.delay(2);
            }
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
        locked: true,
        trigger: {
            player: "useCardAfter"
        },
        filter(event, player) {
            return player.isPhaseUsing()
        },
        check(event, player) {
            let types = player.getHistory("useCard").reduce((type, evt) => type.add(get.type2(evt.card)), [])
            types.add(get.type2(event.card))
            if (types.length == 3 && player.hasCard(card => player.hasUseTarget(card))) return false
            return true
        },
        async content(event, trigger, player) {
            await player.link()
            switch (player.getHistory("useCard").reduce((type, evt) => type.add(get.type2(evt.card)), []).length) {
                case 1:
                    await player.draw()
                    break
                case 2:
                    player.addTempSkill("gbdanhe_effect", { player: "useCard" })
                    break
                case 3:
                    player.skip("phaseDiscard")
                    get.event().getParent("phaseUse")?.finish()
                    if (!player.hasSkill("gbqingpiao")) player.addSkill("gbqingpiao")
                    break
            }
        },
        group: "gbdanhe_effect",
        subSkill: {
            effect: {
                audio: false,
                forced: true,
                trigger: {
                    player: "useCard"
                },
                filter(event, player) {
                    return event.card && ["equip", "delay"].includes(get.type(event.card))
                },
                async content(event, trigger, player) {
                    trigger.effectCount++
                    game.log(trigger.card, "额外结算一次")
                }
            }
        },
        ai: {
            threaten: 1.4,
            effect: {
                player(card, player, target, result) {
                    if (!card || get.itemtype(card) != "card") return
                    if (!player || !target) return
                    if (!player.isPhaseUsing()) return
                    const types = player.getHistory("useCard").reduce((type, evt) => type.add(get.type2(evt.card)), [])
                    const num = types.add(get.type2(card)).length
                    switch (types.length) {
                        case 0:
                            if (get.type(card, "trick") == "equip") return [1, 1]
                            if (player.countCards("hs", c => get.type(c, "trick") == "equip") > 0) {
                                return [1, 1, 1, 0]
                            } else {
                                if (player.getDamagedHp() > 1 && num > 1 && get.name(card) == "tao") return [1, -1, 1, 0]
                                if (get.name(card) == "wuzhong") return 0.75
                                if (get.name(card) == "tiesuo" && player.isZhu2() && !target.isLinked()) return [1, 0, 1, 1]
                                if (["shunshou", "guohe"].includes(get.name(card)) && target.countCards("he") > 1) return [1, 1, 1, 0]
                                if (["wugu", "taoyuan", "nanman", "wanjian", "jiu", "sha"].includes(get.name(card))) return [1, 1, 1, 0]
                                return [1, 1]
                            }
                        case 1:
                            if (types.includes(get.type2(card))) {
                                if (num > 1) {
                                    if (player.getDamagedHp() > 1 && num > 1 && get.name(card) == "tao") return [1, -2]
                                    if (get.name(card) == "wuzhong") return 0.75
                                    if (get.name(card) == "tiesuo" && player.isZhu2() && !target.isLinked()) return [1, 1, 1, 1]
                                    if (["shunshou", "guohe"].includes(get.name(card)) && target.countCards("he") > 1) return [0.5, 1]
                                    if (["wugu", "taoyuan", "nanman", "wanjian", "jiu", "sha"].includes(get.name(card))) return [0.5, 1]
                                    return [1, 1]
                                } else return [1, 1]
                            } else {
                                if (player.countCards("hs", c => player.hasUseTarget(c) && types.includes(get.type2(c))) > 0) return [1, -1]
                                return 1
                            }
                        case 2:
                            if (player.hp < 2) return [0, -1, 1, 0]
                            if (types.includes(get.type2(card))) {
                                if (player.countCards("hs", card => types.includes(get.type2(card)) && player.canUse(card, target))) return 1
                                return [2, -2, 2, 0]
                            }
                            if (get.name(card) == "wuzhong") return 2
                            if (get.name(card) == "huogong") return 1.4
                            if (get.name(card) == "tiesuo" && player.isZhu2()) return [0, 0, 0, 1]
                            if (["wugu", "taoyuan", "nanman", "wanjian", "jiu", "sha", "tao"].includes(get.name(card))) return 2
                            if (["shunshou", "guohe"].includes(get.name(card)) && target.countCards("he") > 1) return 2
                            if (["delay", "equip"].includes(get.type(card))) return 1
                            return 2
                        case 3:
                            return 1
                    }
                }
            }
        }
    },
    gbqingpiao: {
        audio: false,
        zhuSkill: true,
        trigger: {
            global: "linkBegin"
        },
        logTarget: "player",
        filter(event, player) {
            return event.player.group == player.group && _status.currentPhase == event.player
        },
        async cost(event, trigger, player) {
            const target = trigger.player
            if (target.isLinked()) {
                event.result = await target.chooseBool(`###${get.prompt(event.skill)}###是否视为使用一张【酒】？`)
                    .set("ai", () => true)
                    .forResult()
            } else {
                event.result = await target.chooseCard(`###${get.prompt(event.skill)}###是否重铸一张牌？`)
                    .set("ai", (card) => 6 - get.value(card))
                    .forResult()
            }
        },
        async content(event, trigger, player) {
            const target = trigger.player
            if (target.isLinked()) {
                await target.chooseUseTarget({ name: "jiu" }, true)
            } else {
                await target.recast(event.cards)
            }
        }
    },
    // 秋山澪
    gbdubai: {
        audio: false,
        zhuanhuanji: true,
        mark: true,
        marktext: "☯",
        intro: {
            content(storage, player) {
                if (!player.storage.gbdubai) return "转换技，出牌阶段限两次，你可以横置两名角色并重铸所有手牌。"
                return "转换技，出牌阶段限两次，你可以横置两名角色并视为使用一张【火攻】。"
            }
        },
        enable: "phaseUse",
        usable: 2,
        async content(event, trigger, player) {
            const result = await player.chooseTarget(2, "独白：请选择两名角色", true)
                .set("ai", target => get.attitude(player, target) < 0)
                .forResult()
            if (!result.bool) return
            for (const target of result.targets) await target.link(true)
            if (!player.storage.gbdubai) {
                await player.recast(player.getCards("h"))
            } else {
                await player.chooseUseTarget({ name: "huogong" }, true)
            }
            player.changeZhuanhuanji("gbdubai")
        },
        ai: {
            order: 8,
            result: {
                player: 1
            }
        }
    },
    gbcangkong: {
        audio: false,
        forced: true,
        trigger: {
            global: "linkAfter"
        },
        filter(event, player) {
            const used = player.getStorage("gbcangkong_used", { link: [], unlink: [] })
            return _status.currentPhase == player && (!used.link.includes(event.player) || !used.unlink.includes(event.player))
        },
        async content(event, trigger, player) {
            const target = trigger.player
            const used = player.getStorage("gbcangkong_used", { link: [], unlink: [] })
            if (target.isLinked()) {
                if (!(used.link || []).includes(target)) {
                    player.updateStorage("gbcangkong_used", (s) => {
                        if (!s || Array.isArray(s)) s = {};
                        s.link = s.link || [];
                        s.unlink = s.unlink || [];
                        s.link.push(target);
                        return s;
                    });
                    player.addTempSkill("gbcangkong_used");
                    await player.draw();
                }
            } else {
                if (!(used.unlink || []).includes(target)) {
                    player.updateStorage("gbcangkong_used", (s) => {
                        if (!s || Array.isArray(s)) s = {};
                        s.link = s.link || [];
                        s.unlink = s.unlink || [];
                        s.unlink.push(target);
                        return s;
                    });
                    player.addTempSkill("gbcangkong_used");
                    delete player.getStat("skill").gbdubai;
                }
            }
        },
        subSkill: {
            used: { onremove: true }
        }
    },
    // 田井中律
    gbricai: {
        audio: false,
        forced: true,
        trigger: {
            global: "roundStart"
        },
        async content(event, trigger, player) {
            await player.link(true)
            await player.draw(game.countPlayer(target => target.isLinked()))
            for (const target of game.filterPlayer(target => target != player && target.isLinked()).sortBySeat()) {
                if (target.countGainableCards(player, "he")) await player.gainPlayerCard(target, "he", true)
                await target.draw()
            }
        }
    },
    gbgufeng: {
        audio: false,
        trigger: {
            player: "damageAfter"
        },
        async content(event, trigger, player) {
            let { targets: [target] } = await player.chooseTarget("鼓风：请选择并横置一名角色", true)
                .set("ai", target => {
                    const val = 0
                    const player = get.player()
                    if (!target.isLinked()) val += 1
                    if (get.attitude(player, target) < 0) val += 1
                    if (target == player && !player.isLinked()) val += 5
                    return val
                })
                .forResult()
            target.link(true)
            if (player.isLinked()) {
                const result = await player.chooseBool("鼓风：是否重置自身并回复1点体力？")
                    .set("ai", () => player.isDamaged())
                    .forResult()
                if (result.bool) {
                    await player.link(false)
                    await player.recover()
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
            let cards = get.cards(game.countPlayer() * 2)
            await game.cardsGotoOrdering(cards)
            player.addToExpansion(cards, "giveAuto").gaintag.add("gbshancai")
        },
        group: "gbshancai_give",
        subSkill: {
            give: {
                audio: false,
                trigger: {
                    global: "phaseBegin"
                },
                filter(event, player) {
                    return player.hasExpansions("gbshancai")
                },
                logTarget: "targets",
                async cost(event, trigger, player) {
                    event.result = await player.chooseTarget(get.prompt2(event.skill), [1, Math.min(2, player.countExpansions("gbshancai"))])
                        .set("ai", (target) => {
                            let player = get.player()
                            if (get.attitude(player, target) > 0) Math.random()
                            return 0
                        })
                        .forResult()
                },
                async content(event, trigger, player) {
                    for (let target of event.targets.sortBySeat()) {
                        let next = await target.chooseButton(["山财：请选择并获得一张牌", player.getExpansions("gbshancai")], 1, true)
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
            global: "roundEnd"
        },
        forced: true,
        async content(event, trigger, player) {
            const choiceList = ["选择并使用『山财』中的任意装备牌", "获得『山财』中的所有基本牌"]
            const cards = player.getExpansions("gbshancai")
            const list = []
            if (cards.some(card => get.type2(card) == "equip")) list.push("选项一")
            if (cards.some(card => get.type2(card) == "basic")) list.push("选项二")
            if (!list.length) {
                await player.discard(player.getExpansions("gbshancai"))
                return
            }
            const result = await player.chooseControl(list)
                .set("prompt", "情热：请选择一项")
                .set("choiceList", choiceList)
                .set("ai", () => {
                    const player = get.player()
                    const cards = player.getExpansions("gbshancai")
                    const equip = cards.filter(card => get.type2(card) == "equip").reduce((num, card) => num += player.getUseValue(card), 0)
                    const basic = cards.filter(card => get.type2(card) == "basic").reduce((num, card) => num += get.value(card), 0)
                    return equip > basic ? "选项一" : "选项二"
                })
                .forResult()
            game.log(player, "选择了", "#g【情热】", "的", "#y" + result.control)
            if (result.control == "选项一") {
                while (true) {
                    const cards = player.getExpansions("gbshancai").filter(card => get.type2(card) == "equip")
                    if (!cards.length) break
                    const { bool, links: [card] } = await player.chooseButton(["情热：请选择并使用一张装备牌", cards])
                        .set("ai", button => get.value(button.link))
                        .forResult()
                    if (!bool) break
                    await player.chooseUseTarget(card, true)
                }
            } else if (result.control == "选项二") {
                const cards = player.getExpansions("gbshancai").filter(card => get.type2(card) == "basic")
                await player.gain(cards, "gain2")
            }
            await player.discard(player.getExpansions("gbshancai"))
        },
        ai: {
            combo: "gbshancai"
        }
    },
    // 中野梓
    gbmiaoqin: {
        audio: false,
        enable: "phaseUse",
        usable: 1,
        async content(event, trigger, player) {
            await player.link()
            const result = await player.chooseControl(["已横置角色", "未横置角色"])
                .set("prompt", "喵侵：视为使用一张以目标为...的【南蛮入侵】")
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
            game.log(player, "选择了", "#g【喵侵】", "的", "#y" + result.control)
            if (result.control == "已横置角色") var targets = game.filterPlayer(p => p.isLinked() && p != player)
            else var targets = game.filterPlayer(p => !p.isLinked() && p != player)
            let { card: card } = await player.chooseUseTarget({ name: "nanman" }, targets, true).forResult()
            if (!player.hasHistory("sourceDamage", evt => evt.card == card)) {
                player.draw(targets.length)
            }
        },
        ai: {
            order: 7,
            result: {
                player: 1
            }
        }
    },
    gbwolu: {
        audio: false,
        trigger: {
            player: "damageEnd",
            source: "damageEnd"
        },
        usable: 5,
        async cost(event, trigger, player) {
            if (player.isLinked()) {
                event.result = await player.chooseBool(`###${get.prompt(event.skill)}###是否摸两张牌并重置武将牌？`)
                    .set("ai", () => true)
                    .forResult()
            } else {
                event.result = await player.chooseCard(`###${get.prompt(event.skill)}###是否弃置一张牌并横置武将牌？`, "he")
                    .set("ai", card => 6 - get.value(card))
                    .forResult()
            }
        },
        async content(event, trigger, player) {
            if (player.isLinked()) {
                await player.draw(2)
                await player.link(false)
            } else {
                await player.discard(event.cards)
                await player.link(true)
            }
        }
    },
}
export default skills;
