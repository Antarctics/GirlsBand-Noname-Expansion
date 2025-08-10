import {
    lib,
    game,
    ui,
    get,
    ai,
    _status
} from "../../noname.js";
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
            return player.countCards("h") > 0 && ["sha", "juedou"].includes(event.card.name)
        },
        logTarget: "player",
        async cost(event, trigger, player) {
            event.result = await player.chooseCard(get.prompt2("gblixi"), 1, "h")
                .set("ai", (card) => {
                    let player = _status.event.player
                    let cards = player.getStorage("gbxiwei_compare")
                    if (get.attitude(player, trigger.target) < 0) {
                        if (!cards.includes(card)) return get.number(card)
                        return 1
                    }
                    return 0
                })
                .forResult()
        },
        async content(event, trigger, player) {
            if (event.cards) {
                await player.showCards(event.cards)
                trigger.getParent().baseDamage++
                let target = trigger.target
                let list = []
                if (target.canCompare(player)) list.push("选项一")
                list.push("选项二")
                let control = await target.chooseControl(list, true)
                    .set("prompt", "立袭")
                    .set('choiceList', ["与" + get.translation(event.player) + "拼点，若你赢，则你回复一点体力", "令此牌无法被响应"])
                    .set("ai", () => {
                        let player = _status.event.player
                        let cards = _status.event.source.getStorage("gbxiwei_compare")
                        if (player.getCards("h").some(c => !cards.some(card => get.number(card) > get.number(c))) && player.countCards("h") > 2) return 0
                        return 1
                    })
                    .set("source", player)
                    .forResult()
                switch (control.control) {
                    case "选项一":
                        let next = await target.chooseToCompare(player).forResult()
                        if (next && next.bool) {
                            await target.recover()
                        }
                        break
                    case "选项二":
                        trigger.directHit.addArray(game.players)
                        break
                }
            }
        },
        ai: {
            threaten: 1,
            expose: 0.3,
        }
    },
    gbxiwei: {
        audio: "ext:GirlsBand/audio/skill:3",
        forced: true,
        charlotte: true,
        group: ["gbxiwei_draw", "gbxiwei_show"],
        subSkill: {
            draw: {
                audio: "gbxiwei",
                trigger: {
                    player: "showCardsBegin",
                },
                forced: true,
                charlotte: true,
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
                charlotte: true,
                async content(event, trigger, player) {
                    let result = await player.chooseCard("希威", "请展示一张手牌", 1, true, "h")
                        .set("ai", (card) => {
                            let player = _status.event.player
                            let cards = player.storage["gbxiwei_compare"] || []
                            if (!cards.includes(card)) return get.number(card)
                            return true
                        })
                        .forResult()
                    player.showCards(result.cards)
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
                            dialog.addText('本回合已展示手牌:');

                            dialog.add([cards, 'vcard']);
                        } else dialog.addText('未展示手牌');
                    }

                },
                charlotte: true,
                async cost(event, trigger, player) {
                    event.result = await player.chooseCard("希威", "选择一张牌作为拼点结果。", true)
                        .set("filterCard", (card, player) => {
                            return player.storage["gbxiwei_compare"].includes(card) && get.event("filterCardx")(card, player)
                        })
                        .set("filterCardx", function (card, player) {
                            return trigger.filterCard ? trigger.filterCard(card, player) : true
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
            event.result = await player.chooseTarget([1, 2], get.prompt2("gbsumou"))
                .set("ai", (target) => {
                    let player = _status.event.player
                    if (ui.selected.targets.length >= game.countPlayer() - 1) return false
                    if (game.hasPlayer(p => p.isDamaged() && get.attitude(player, p) > 0)) return get.attitude(player, target) > 0 && target.isDamaged()
                    else get.attitude(player, target) < 0
                })
                .forResult()
        },
        async content(event, trigger, player) {
            if (event.targets) {
                let target = game.filterPlayer(i => !event.targets.includes(i))
                if (target.length > 0) {
                    player.chooseToDebate(target).set("callback", () => {
                        const {
                            bool,
                            opinion,
                        } = event.debateResult;
                        let player = _status.event.player
                        let exclusion = event.getParent(2).targets
                        if (bool && opinion) {
                            if (opinion && ["red", "black"].includes(opinion)) {
                                if (opinion == "red") exclusion.forEach(i => i.recover())
                                else exclusion.forEach(i => {
                                    if (i != player) player.gainPlayerCard(i)
                                })
                            }
                        }
                    })
                        .set("ai", (card) => {
                            let player = _status.event.player
                            let source = get.event("source")
                            let targets = event.targets
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
            threaten: 0.6,
            expose: 0.15,
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
            let targets = game.players.filter(p => !trigger.targets.includes(p))
            event.result = await player.chooseTarget(get.prompt2("gbyingxiang"))
                .set("filterTarget", (card, player, target) => get.event("targets").some(t => t == target) && player.canCompare(target))
                .set("ai", (target) => {
                    let player = _status.event.player
                    if (get.attitude(player, target) < 0) return 10
                    else return 1
                })
                .set("targets", targets)
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
        skillAnimation: true,
        animationColor: "soil",
        filter(event, player) {
            return player.countExpansions("gbfuming") >= 5
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
                    "step 0"
                    game.log(player, "使命失败");
                    player.popup("使命失败")
                    player.awakenSkill("gbfuming");
                    player.recover()
                    player.gain(player.getExpansions("gbfuming"), "gain2", "bySelf")
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
        selectCard() {
            return [1, _status.event.player.maxHp]
        },
        filterTarget: lib.filter.notMe,
        selectTarget() {
            return ui.selected.cards.length
        },
        ai1(card) {
            let player = _status.event.player
            if (game.countPlayer(p => p != player) > ui.selected.cards.length) return get.value(card) < 5;
            return 0
        },
        ai2(target) {
            let player = _status.event.player
            if (get.attitude(player, target) <= 0) return 10
            return 1
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
            order: 6,
            threaten: 1.2,
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
                    return get.event('targets').includes(target) && target != player && target.countCards("h") > 0
                })
                .set("targets", trigger.list)
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
            for (let target of event.targets) {
                let card = await player.choosePlayerCard("掠菲", "展示" + get.translation(target) + "的一张手牌", "h", target, true).forResultCards()
                target.showCards(card)
                cards.addArray(card)
            }
            let card = await player.chooseButton(["掠菲", "选择一张视为你展示的议事牌", cards], true)
                .set("ai", (button) => {
                    let player = _status.event.player
                    return get.event("filterCardx")(button.link, player)
                })
                .set("filterCardx", (card, player) => {
                    return trigger.filterCard ? trigger.filterCard(card, player) : true
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
                    player.chooseBool("掠菲", "是否失去一点体力上限并获得" + get.translation(cardx)).set("ai", () => {
                        let player = _status.event.player
                        return player.isDamaged()
                    })
                })
                .then(() => {
                    if (result && result.bool) {
                        player.loseMaxHp()
                        player.gain(cardx.filter(card => targetx.includes(get.owner(card))), "gain2")
                    }
                })
                .vars({
                    targetx: event.targets,
                    cardx: cards
                })
        },
        ai: {
            threaten: 1,
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
                            if (num + 1 < game.countPlayer()) return 8
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
            expose: 0.1,
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
        prompt2: "当你进行议事/拼点时，你可以摸两张牌并交给本次事件中的一名其他角色一张牌，然后令其展示此牌，其仅能使用此牌参与本次事件",
        async content(event, trigger, player) {
            player.draw(2)
            let result = await player.chooseCardTarget()
                .set("prompt", "和弦")
                .set("prompt2", "请选择一张牌并交给参与本次事件的一名其他角色")
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
        subSkill: {
            debate: {
                audio: false,
                trigger: {
                    global: "chooseToDebateBegin"
                },
                filter(event, player) {
                    return !event.list.includes(player)
                },
                prompt2: "议事开始时，若议事角色中不包括你，则你可以参与议事，然后若议事结果为：红色，当前角色的回合结束时，你摸两张牌并执行一个额外的出牌阶段；黑色，你失去1点体力。",
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
                                else player.loseHp()
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
                    `转换技，出牌阶段限一次，你可以展示一名其他角色的一张手牌，然后令其使用此牌与你拼点：若你赢，你获得拼点的牌；若你没赢，此技能视为未使用过。` :
                    `转换技，出牌阶段限一次，你可以展示一名其他角色的一张手牌，然后令其使用此牌与你议事，若结果为：红色，你获得议事的牌；黑色，你摸一张牌且本回合手牌上限+1。`;
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
                            if (bool && ["red", "black"].includes(opinion)) {
                                if (opinion == "red") {
                                    let cards = []
                                    red.addArray(black).forEach(evt =>
                                        cards.add(evt[1])
                                    )
                                    player.gain(cards, "giveAuto", "log")
                                } else {
                                    player.draw()
                                    player.addTempSkill("gbchunying_add")
                                    player.addMark("gbchunying_add", 1, false);
                                }
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
        subSkill: {
            add: {
                audio: false,
                onremove: true,
                mod: {
                    maxHandcard: function (player, num) {
                        return num + player.countMark("gbchunying_add");
                    },
                },
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
                    if (target.hasSkill("gbshanshen") && get.attitude(player, target) < 0) return 0
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
                    let num = player.storage["gbheming_effect"]
                    for (var name of lib.inpile) {
                        if (num > 4) {
                            if (get.type(name) == "basic" || name == "huogong") list.push(name)
                        } else if (num == 4 && ["sha", "shan", "jiu", "huogong"].includes(name)) list.push(name)
                        else if (num == 3 && ["jiu", "huogong"].includes(name)) list.push(name)
                    }
                    return player.countCards("hs", card => card.name == "ying") && player.storage.gbheming_effect > 2 && list.some(name => event.filterCard({
                        name: name
                    }, player, event))
                },
                hiddenCard(player, name) {
                    var list = [];
                    let num = player.storage["gbheming_effect"]
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
                        let num = player.storage["gbheming_effect"]
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
                        let num = player.storage["gbheming_effect"]
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
                for (let target of result.targets) {
                    let next = await target.chooseControlList("墨影", [`弃置一张牌，然后本回合无法响应${get.translation(player)}使用的牌`, `本回合不能使用或打出与本回合弃置牌花色相同的牌`], true)
                        .set("ai", () => {
                            let player = _status.event.player
                            if (player.countCards("hes") > 2 && Math.random() < 0.3) return 1
                            if ((player.getEquip("bagua") || player.getEquip("rewrite_bagua")) && Math.random() > 0.3) return 1
                            return 0
                        })
                        .forResult()
                    switch (next.control) {
                        case "选项一":
                            target.chooseToDiscard("hes", true)
                            target.markAuto("gbmoying_effect", player)
                            target.addTempSkill("gbmoying_effect")
                            game.log(target, "选择了", "#g【墨影】", "的", "#y选项一")
                            break
                        case "选项二":
                            target.addTempSkill("gbmoying_discard")
                            game.log(target, "选择了", "#g【墨影】", "的", "#y选项二")
                            break
                    }
                }
                player.chooseToDiscard("墨影", "你可以弃置两张牌", "he", 2)
                    .set("ai", (card) => {
                        let player = _status.event.player
                        let cards = player.getCards("h", card => get.value(card) <= 4).sort((a, b) => get.value(a) - get.value(b)).slice(0, 2)
                        if (cards.length == 2) return cards.includes(card)
                        return false
                    })
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
                        if (game.getGlobalHistory("everything", evt => evt.type == "discard").map(evt => evt.cards).flat().reduce((suit, card) => suit.add(card.suit), []).includes(get.suit(card))) return false;
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
        usable: 1,
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
            }, event.targets[0], false, true)) {
                let next = player.useCard({
                    name: "sha",
                    nature: "thunder"
                }, event.targets[0])
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
            player.gain(lib.card.ying.getYing(player.getHistory("sourceDamage")?.reduce((num, evt) => num += evt.num, 1)))
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
                    let val = get.value(button.link)
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
    gbyoumeng: {
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
                .set("filterTarget", (card, player, target) => !target.hasExpansions("gbyoumeng_fire"))
                .set("prompt", "祐梦")
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
                for (let i in result.cards) {
                    result.targets[i].addToExpansion(result.cards[i], "giveAuto").gaintag.add("gbyoumeng_fire")
                }
            }
        },
        ai: {
            threaten: 0.6,
            expose: 0.3
        },
        group: "gbyoumeng_fire",
        subSkill: {
            fire: {
                audio: false,
                trigger: {
                    global: "phaseBegin"
                },
                filter(event, player) {
                    return event.player.hasExpansions("gbyoumeng_fire")
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
                    if (trigger.player.hasExpansions("gbyoumeng_fire")) list.push("获得『火』并失去一点体力")
                    if (trigger.player.countCards("he")) list.push(`令${get.translation(player)}获得你一张牌。`)
                    let result = await trigger.player.chooseControlList("###祐梦###", list, true)
                        .set("ai", (event, player) => {
                            if (get.effect(player, {
                                name: "losehp"
                            }, player, player) > 0) return 0
                            if (player.hp + player.num("h", "tao") > 3) return 0
                            else return 1
                        })
                        .forResult()
                    if (result) {
                        if (result.control == "选项一") {
                            await trigger.player.gain(trigger.player.getExpansions("gbyoumeng_fire"), "log")
                            trigger.player.loseHp()
                            if (!trigger.player.hasExpansions("gbyoumeng_fire")) trigger.player.unmarkSkill("gbyoumeng_fire")
                        } else if (trigger.player.countGainableCards(player, "he") > 0) player.gainPlayerCard(trigger.player, "he", true, 1)
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
            if (ui.selected.cards.length < game.countPlayer(target => (get.attitude(player, target) < 0 && !target.hasExpansions("gbyoumeng_fire")) || (get.attitude(player, target) > 0 && target.hasExpansions("gbyoumeng_fire")))) return 1
            return 0
        },
        ai2(target) {
            var player = _status.event.player;
            return (get.attitude(player, target) < 0 && !target.hasExpansions("gbyoumeng_fire")) || (get.attitude(player, target) > 0 && target.hasExpansions("gbyoumeng_fire")) || target == player
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
                            let card = await target.chooseCard("传庭", "选择一张牌置于武将牌上，称为『火』", 1, "he", true)
                                .set("ai", (card) => {
                                    return 6 - get.value(card)
                                })
                                .forResultCards()
                            if (card) target.addToExpansion(card[0]).gaintag.add("gbyoumeng_fire")
                        }
                    }
                    if (opinion != "red") {
                        player.gain(lib.card.ying.getYing(player.hp))
                    }
                })
                .set("ai", (card) => {
                    let player = _status.event.player
                    if (player.hasExpansions("gbyoumeng_fire")) return get.color(card) == "red"
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
            if (ui.selected.targets.length == 1) return target.hasExpansions("gbyoumeng_fire")
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
            if (ui.selected.targets.length == 1 && ui.selected.targets[0].hasExpansions("gbyoumeng_fire")) return [1, 2]
            return 2
        },
        targetprompt() {
            if (ui.selected.targets.length == 1 && ui.selected.cards.length > 0) return "出杀目标"
            if (ui.selected.targets.length == 1 && ui.selected.targets[0].hasExpansions("gbyoumeng_fire")) return "出杀目标<br>弃『火』"
            if (ui.selected.targets.length == 1 && !ui.selected.targets[0].hasExpansions("gbyoumeng_fire")) return "出杀目标"
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
                let result = await player.chooseButton(["若叶", "移去一张火", [event.targets[1].getExpansions("gbyoumeng_fire"), "card"]], true)
                    .set("ai", (button) => get.value(button.link))
                    .forResult()
                if (result.bool) {
                    await event.targets[1].discard(result.links[0], player, "giveAuto")
                    if (!event.targets[1].hasExpansions("gbyoumeng_fire")) event.targets[1].unmarkSkill("gbyoumeng_fire")
                    player.addTempSkill("gbruoye_1")
                }
            } else if (event.targets.length == 1 && event.cards.length == 0) {
                let result = await player.chooseButton(["若叶", "移去一张火", [event.targets[0].getExpansions("gbyoumeng_fire"), "card"]], true)
                    .set("ai", (button) => get.value(button.link))
                    .forResult()
                if (result.bool) {
                    await event.targets[0].discard(result.links[0], player, "giveAuto")
                    if (!event.targets[0].hasExpansions("gbyoumeng_fire")) event.targets[0].unmarkSkill("gbyoumeng_fire")
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
    gbshanshen: {
        audio: false,
        trigger: {
            global: ["phaseBefore", "phaseBegin"],
            player: "enterGame"
        },
        mark: "auto",
        marktext: "独",
        intro: {
            markcount: "expansion",
            content: "expansion"
        },
        charlotte: true,
        filter(event, player) {
            return (event.name == "phase" && !player.hasExpansions("gbshanshen")) || game.phaseNumber == 0;
        },
        prompt2: "你可以摸一张牌，然后将一张牌置于武将牌上，称为『独』",
        async content(event, trigger, player) {
            player.draw()
            let result = await player.chooseCard("善身", "将一张牌置于武将牌上，称为『独』", "he", true)
                .set("ai", card => 6 - get.value(card))
                .forResult()
            if (result.bool) {
                player.addToExpansion(result.cards, "giveAuto", "bySelf").gaintag.add("gbshanshen")
            }
        },
        group: "gbshanshen_debate",
        subSkill: {
            debate: {
                audio: false,
                trigger: {
                    global: "chooseToDebateBegin",
                    player: "chooseToCompareBegin",
                    target: "chooseToCompareBegin"
                },
                charlotte: true,
                filter(event, player) {
                    if (event.name == "chooseToDebate") return event.list.includes(player) && player.hasExpansions("gbshanshen")
                    return player.hasExpansions("gbshanshen")
                },
                async cost(event, trigger, player) {
                    event.result = await player.chooseButton(["善身", "选择一张『独』作为结果。", [player.getExpansions("gbshanshen"), "card"]], true)
                        .set("ai", (button) => get.number(button.link))
                        .forResult()
                    event.result.cost_data = event.result.links
                },
                async content(event, trigger, player) {
                    if (event.triggername != "chooseToDebateBegin") {
                        if (!trigger.fixedResult) trigger.fixedResult = {}
                        trigger.fixedResult[player.playerid] = event.cost_data[0]
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
        usable: 1,
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
                forced: true,
                charlotte: true,
                trigger: {
                    player: "compare",
                    target: "compare"
                },
                filter(event, player) {
                    return event.lose_list.some(i => i[0] == player && i[1][0].name == "ying")
                },
                async content(event, trigger, player) {
                    delete player.getStat("skill").yongling
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
                if (card == "ying") return num + 4
            },
            aiUseful(player, card, num) {
                if (card == "ying") return num + 5
            }
        },
        trigger: {
            player: "damageBegin4"
        },
        async cost(event, trigger, player) {
            let result = await player.chooseCard("求存", "弃置一张【影】并恢复一点体力。")
                .set("prompt2", "或点取消获得一张【影】并获得对你造成伤害的牌")
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
                player.recover()
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
            return (event.player === player && event.source.group === player.group) ||
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
            player: "phaseZhunbeiBegin",
            target: "useCardToTargeted"
        },
        mark: "auto",
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        filter(event, player, name) {
            if (name == "phaseZhunbeiBegin") return true
            if (event.targets.length > 1) return false
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
            } = await player.chooseControlList("###宣泄###", ["摸一张牌", "本回合结束时，对当前回合的角色使用『空箱』中所有的【杀】", "本回合结束时，令当前回合的角色获得『空箱』中的所有牌。"])
                .set("ai", () => {
                    let player = _status.event.player
                    let target = _status.currentPhase
                    let num = player.countExpansions("gbkongxiang")
                    let selected = game.getGlobalHistory("everything", evt => evt.skill == "gbxuanxie_cost").map(evt => evt.result.control)
                    if (get.attitude(player, target) > 0 && num > 1 && !selected.includes("选项三")) return 2
                    if (get.attitude(player, target) < 0 && player.countCards("x", card => card.gaintag.includes("gbkongxiang") && card.name == "sha") > 1 && !selected.includes("选项二")) return 1
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
                        let next1 = target.addToExpansion(next.cards, "giveAuto")
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
                            let result = await target.judge().forResult()
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
                    const judging = _status.event.judging;
                    const result = trigger.judge(card) - trigger.judge(judging);
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
            return event.targets && event.targets.length == 1
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
            let cards = get.cards(Math.min(game.countPlayer(), 5))
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
    // 神丰川祥子
    gbkaimu: {
        audio: false,
        persevereSkill: true,
        trigger: {
            global: ["phaseBefore", "roundStart"],
            player: "enterGame"
        },
        forced: true,
        locked: true,
        filter(event, player, name) {
            return name != "phaseBefore" || game.phaseNumber == 0;
        },
        async content(event, trigger, player) {
            let info = ["当【杀】造成伤害时，伤害来源需弃置一张基本牌，否则本次伤害-1",
                "一名角色使用防具牌时，其需弃置一张装备牌，否则弃置此牌；所有角色的攻击范围+2",
                "使用【桃】时失去1点体力，使用【酒】时恢复1点体力",
                "当【南蛮入侵】或【万箭齐发】造成伤害时，改为回复体力；当【桃园结义】回复体力时，改为造成伤害"
            ]
            let name = [`明场`, `暗场`, `独语`, `乱叙`]
            const switchToAuto = function () {
                _status.imchoosing = false;
                if (event.dialog) event.dialog.close();
                if (event.control) event.control.close();
                game.resume();
                event._result = () => {
                    let player = _status.event.player
                    let control = {
                        1: (((get.mode() == "identity" && ["zhong", "zhu"].includes(player.identity)) || (get.mode() == "doudizhu" && player.identity == "fan2") || (get.mode() == "versus" && [2, 3].includes(player.getSeatNum())) ? Math.random() : 0) + game.countPlayer(p => get.attitude(player, p) > 0 && !p.mayHaveShan && get.effect(p, {
                            name: "sha"
                        }) < 0)) || Math.random(),
                        2: (get.mode() == "identity" && player.identity == "fan") ? Math.random() + 0.2 : Math.random(),
                        3: (game.countPlayer(p => get.attitude(player, p) > 0 && p.isDamaged() && p.hasKnownCards(player, card => card.name == "jiu") && !p.hasKnownCards(player, card => card.name == "tao")) + game.countPlayer(p => get.attitude(player, p) < 0 && p.isDamaged() && p.hasKnownCards(player, card => card.name == "tao"))) || Math.random(),
                        4: (([...ui.cardPile.childNodes].some(card => ["nanman", "wanjian"].includes(card.name)) ? game.countPlayer(p => get.attitude(player, p) > 0 && get.recoverEffect(p) > 0) - game.countPlayer(p => get.attitude(player, p) < 0 && get.recoverEffect(p) > 0) : 0) + ([...ui.cardPile.childNodes].some(card => ["taoyuan"].includes(card.name)) ? game.countPlayer(p => get.attitude(player, p) < 0 && get.damageEffect(p) < 0 && p.isDamaged()) - game.countPlayer(p => get.attitude(player, p) > 0 && get.damageEffect(p) < 0 && p.isDamaged()) : 0)) || Math.random()
                    }
                    return [1, 2, 3, 4].sort((a, b) => control[b] - control[a])[0]
                }
                return Promise.resolve(event._result());
            }
            let chooseButton = (name, info) => {
                const {
                    promise,
                    resolve
                } = Promise.withResolvers();
                _status.imchoosing = true;
                const event = _status.event;
                event.switchToAuto = () => {
                    _status.imchoosing = false;
                    if (event.dialog) event.dialog.close();
                    if (event.control) event.control.close();
                    game.resume();
                    event._result = () => {
                        let player = _status.event.player
                        let control = {
                            1: (((get.mode() == "identity" && ["zhong", "zhu"].includes(player.identity)) || (get.mode() == "doudizhu" && player.identity == "fan2") || (get.mode() == "versus" && [2, 3].includes(player.getSeatNum())) ? Math.random() : 0) + game.countPlayer(p => get.attitude(player, p) > 0 && !p.mayHaveShan && get.effect(p, {
                                name: "sha"
                            }) < 0)) || Math.random(),
                            2: (get.mode() == "identity" && player.identity == "fan") ? Math.random() + 0.2 : Math.random(),
                            3: (game.countPlayer(p => get.attitude(player, p) > 0 && p.isDamaged() && p.hasKnownCards(player, card => card.name == "jiu") && !p.hasKnownCards(player, card => card.name == "tao")) + game.countPlayer(p => get.attitude(player, p) < 0 && p.isDamaged() && p.hasKnownCards(player, card => card.name == "tao"))) || Math.random(),
                            4: (([...ui.cardPile.childNodes].some(card => ["nanman", "wanjian"].includes(card.name)) ? game.countPlayer(p => get.attitude(player, p) > 0 && get.recoverEffect(p) > 0) - game.countPlayer(p => get.attitude(player, p) < 0 && get.recoverEffect(p) > 0) : 0) + ([...ui.cardPile.childNodes].some(card => ["taoyuan"].includes(card.name)) ? game.countPlayer(p => get.attitude(player, p) < 0 && get.damageEffect(p) < 0 && p.isDamaged()) - game.countPlayer(p => get.attitude(player, p) > 0 && get.damageEffect(p) < 0 && p.isDamaged()) : 0)) || Math.random()
                        }
                        return [1, 2, 3, 4].sort((a, b) => control[b] - control[a])[0]
                    }
                    resolve(event._result());
                }
                let dialog = ui.create.dialog("开幕", "选择一项作为效果")
                dialog.addText("")
                dialog.add([
                    [
                        [1, `<img src=extension/GirlsBand/image/1.png height=100px>`],
                        [2, `<img src=extension/GirlsBand/image/2.png height=100px>`],
                        [3, `<img src=extension/GirlsBand/image/3.png height=100px>`],
                        [4, `<img src=extension/GirlsBand/image/4.png height=100px>`]
                    ], "tdnodes"
                ])
                for (let div of dialog.querySelectorAll(".tdnodes")) {
                    div.setNodeIntro(name[div.link - 1], info[div.link - 1])
                    div.addEventListener(lib.config.touchscreen ? "touchend" : "click", () => {
                        dialog.querySelectorAll(".tdnodes").forEach(d => {
                            if (d !== div) d.classList.remove("selected")
                        });
                        div.classList.add("selected")
                        dialog.querySelectorAll(".text")[0].innerHTML = `${div.nodeTitle}</br>${div.nodeContent}`
                        ui.update()
                        event._result = div.link
                        if (event.control) event.control.open();
                    })
                }
                event.dialog = dialog
                event.control = ui.create.control("ok", function (link) {
                    event.dialog.close();
                    event.control.close();
                    game.resume();
                    _status.imchoosing = false;
                    resolve(event._result);
                });
                event.control.close();
                game.pause();
                game.countChoose();
                return promise;
            }
            let next;
            if (event.isMine()) {
                next = chooseButton(name, info);
            } else if (event.isOnline()) {
                const {
                    promise,
                    resolve
                } = Promise.withResolvers();
                player.send(chooseButton, name, info);
                player.wait(async result => resolve(result))
                next = promise;
            } else {
                next = switchToAuto();
            }
            const result = await next;
            game.log(player, `将<span class="greentext">【开幕】</span>的效果修改为`, name[result - 1])
            player.$fullscreenpop(name[result - 1], get.groupnature(player.group))
            for (let num = 1; num < 5; num++) {
                game.removeGlobalSkill(`gbkaimu_${num}`)
            }
            player.setStorage("gbkaimu", result)
            game.addGlobalSkill(`gbkaimu_${result}`)
            game.delay(2);
        },
        group: "gbkaimu_die",
        subSkill: {
            die: {
                audio: false,
                trigger: {
                    player: "die"
                },
                forced: true,
                forceDie: true,
                async content(event, trigger, player) {
                    for (let num = 1; num < 5; num++) {
                        game.removeGlobalSkill(`gbkaimu_${num}`)
                    }
                }
            },
            1: {
                audio: false,
                trigger: {
                    player: "chooseToUseBegin",
                    source: "damageBegin1"
                },
                filter(event, player, name) {
                    if (name == "chooseToUseBegin") return event.getTrigger() && event.getTrigger().card && event.getTrigger().card.name == "sha"
                    return event && event.card && event.card.name == "sha"
                },
                forced: true,
                async content(event, trigger, player) {
                    if (event.triggername == "chooseToUseBegin") {
                        trigger.ai = (card) => {
                            var evt = _status.event.getParent();
                            if (_status.event.useShan) return evt.player.countCards("h") == 0 ? 0 : get.order(card)
                            return 0
                        }
                    } else {
                        let next = await player.chooseCard("请弃置一张基本牌")
                            .set("prompt2", "否则本次伤害-1")
                            .set("position", "he")
                            .set("filterCard", (card) => get.type(card) == "basic")
                            .set("ai", (card) => {
                                let player = _status.event.source
                                let target = _status.event.getParent(4).player
                                if (get.effect(target, {
                                    name: "sha"
                                }, player, player) > 0) return 6 - get.value(card)
                                return false
                            })
                            .forResult()
                        if (next && next.bool) {
                            player.discard(next.cards)
                        } else {
                            trigger.num--
                        }
                    }
                },
                ai: {
                    effect: {
                        target(card, player, target, current) {
                            if (card.name == "sha" && get.attitude(player, target) < 0) {
                                if (get.attitude(player, target) > 0 && current < 0) return "zerotarget";
                                const bs = player.getCards("h", {
                                    type: "basic"
                                });
                                bs.remove(card);
                                if (card.cards) bs.removeArray(card.cards);
                                else bs.removeArray(ui.selected.cards);
                                if (!bs.length) return "zerotarget";
                                if (player.hasSkill("jiu") || player.hasSkill("tianxianjiu")) return;
                                if (bs.length <= 2) {
                                    for (let i = 0; i < bs.length; i++) {
                                        if (get.value(bs[i]) < 7) {
                                            return [1, 0, 1, -0.5];
                                        }
                                    }
                                    return [1, 0, 0.3, 0];
                                }
                                return [1, 0, 1, -0.5];
                            }
                        },
                    }
                }
            },
            2: {
                audio: false,
                trigger: {
                    player: "useCard2"
                },
                mod: {
                    attackRange: (player, num) => num + 2,
                },
                filter(event, player) {
                    return get.type(event.card) == "equip" && get.subtype(event.card) == "equip2"
                },
                forced: true,
                async content(event, trigger, player) {
                    let next = await player.chooseCard("请弃置一张装备牌")
                        .set("prompt2", "否则弃置此牌")
                        .set("position", "he")
                        .set("filterCard", (card) => get.type(card) == "equip")
                        .set("ai", (card) => {
                            return 6 - get.value(card)
                        })
                        .forResult()
                    if (next && next.bool) {
                        player.discard(next.cards)
                    } else {
                        trigger.cancel()
                        player.discard(trigger.cards)
                    }
                },
                ai: {
                    effect: {
                        player(card, player, target) {
                            if (get.type(card) == "equip" && get.subtype(card) == "equip2" && !player.countCards("he", c => get.type(c == "equip" && c != card))) return 0
                        }
                    }
                }
            },
            3: {
                audio: false,
                trigger: {
                    player: "useCard"
                },
                filter(event, player) {
                    return event.card.name == "tao" || event.card.name == "jiu"
                },
                forced: true,
                popup: false,
                async content(event, trigger, player) {
                    if (trigger.card.name == "tao") trigger.player.loseHp()
                    else trigger.player.recover()
                },
                ai: {
                    effect: {
                        player(card, player, target) {
                            if (card.name == "tao") return [0, 0, 1, 0]
                            if (card.name == "jiu") return [1, get.recoverEffect(player, player, player), 1, 0]
                        }
                    }
                }
            },
            4: {
                audio: false,
                trigger: {
                    player: ["damageBegin4", "changeHpBefore", "chooseToRespondBegin", "chooseToUseBegin"]
                },
                filter(event, player, name) {
                    if (name == "chooseToRespondBegin") return true
                    if (name == "chooseToUseBegin") return event.getTrigger() && event.getTrigger().card && ["wanjian", "nanman", "taoyuan"].includes(event.getTrigger().card.name)
                    if (event.name == "changeHp") return event && event.getParent().card && event.getParent().card.name == "taoyuan"
                    return event && event.card && (event.card.name == "nanman" || event.card.name == "wanjian")
                },
                forced: true,
                popup: false,
                async content(event, trigger, player) {
                    if (event.triggername == "changeHpBefore") {
                        player.damage(trigger.num, trigger.getParent().source)
                        trigger.finish()
                    } else if (event.triggername == "damageBegin4") {
                        player.recover(trigger.num)
                        trigger.num = 0
                    } else if (event.triggername == "chooseToRespondBegin") {
                        switch (trigger.getParent().card?.name) {
                            case "nanman":
                                trigger.ai = (card) => {
                                    var evt = _status.event.getParent();
                                    if (evt.player.hasSkillTag("notricksource")) return 0
                                    if (evt.target.hasSkillTag("notrick")) return 0
                                    if (evt.target.hasSkillTag("noSha")) {
                                        return -1
                                    }
                                    if (get.recoverEffect(evt.target, evt.player, evt.target) >= 0) return 0
                                    return get.order(card)
                                }
                                break
                            case "wanjian":
                                trigger.ai = (card) => {
                                    var evt = _status.event.getParent();
                                    if (evt.player.hasSkillTag("notricksource")) return 0
                                    if (evt.target.hasSkillTag("notrick")) return 0
                                    if (evt.target.hasSkillTag("noShan")) {
                                        return -1
                                    }
                                    if (get.recoverEffect(evt.target, evt.player, evt.target) >= 0) return 0
                                    return get.order(card)
                                }
                                break
                        }
                    } else {
                        trigger.ai1 = () => {
                            let source = _status.event.getTrigger().player
                            let player = _status.event.player
                            let target = _status.event.source
                            let card = _status.event.getTrigger().card
                            let att = Math.sign(get.attitude(player, target))
                            if (target.hasSkillTag("notricksource")) return 0
                            if (target.hasSkillTag("notrick")) return 0
                            return get.effect(target, card, source, player) * -att
                        }
                    }
                },
                ai: {
                    effect: {
                        target(card, player, target) {
                            if (card.name == "taoyuan") return target.isDamaged() ? [0, get.damageEffect(target, player, target)] : 0
                            if (["nanman", "wanjian"].includes(card.name)) return [0, get.recoverEffect(target, player, target)]
                        }
                    }
                }
            }
        }
    },
    gbrenou: {
        audio: false,
        round: 1,
        trigger: {
            global: "phaseEnd"
        },
        changeSeat: true,
        seatRelated: true,
        persevereSkill: true,
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget("人偶", "选择一名角色与当前回合角色交换座次")
                .set("filterTarget", (card, player, target) => {
                    return target != _status.currentPhase
                })
                .set("ai", (target) => {
                    let player = _status.event.player
                    let targets = game.filterPlayer(p => get.attitude(player, p) > 0)
                    if (get.attitude(player, _status.currentPhase) > 0) {
                        if (get.attitude(player, _status.currentPhase.next) >= 0) return false
                        if (_status.currentPhase.next.isTurnedOver()) return false
                        return target == _status.currentPhase.next
                    }
                    return false
                })
                .forResult()
        },
        async content(event, trigger, player) {
            var evt = trigger.getParent();
            if (evt.name == "phaseLoop" && evt._isStandardLoop) {
                evt.player = event.targets[0]
                _status.lastPhasedPlayer = event.targets[0]
            }
            game.broadcastAll(
                function (target1, target2) {
                    game.swapSeat(target1, target2);
                },
                event.targets[0],
                _status.currentPhase
            );
            let next = event.targets[0].insertPhase()
            event.targets[0].when("phaseEnd")
                .filter((event, player) => {
                    return event == next
                })
                .then(() => {
                    player.chooseControlList("###人偶###", ["翻面", "弃置所有手牌并获得两张【影】,然后令所有未翻面角色各失去1点体力。"])
                        .set("forced", true)
                        .set("ai", () => {
                            let player = _status.event.player
                            let is = game.filterPlayer(p => get.attitude(player, p) > 0 && !p.isTurnedOver()).reduce((num, p) => num += get.effect(p, {
                                name: "losehp"
                            }, player), 0)
                            let not = game.filterPlayer(p => get.attitude(player, p) < 0 && !p.isTurnedOver()).reduce((num, p) => num += get.effect(p, {
                                name: "losehp"
                            }, player), 0)
                            if (get.value({
                                name: "ying"
                            }, player) > 0 && player.countCards("h") < 4 && is > not) return "选项二"
                            return "选项一"
                        })
                        .forResult()
                })
                .then(() => {
                    if (result) {
                        if (result.control == "选项一") player.turnOver()
                        else {
                            player.discard(player.getCards("h"))
                            player.gain(lib.card.ying.getYing(2))
                            let targets = game.filterPlayer(p => !p.isTurnedOver())
                            for (let target of targets.sortBySeat()) {
                                target.loseHp()
                            }
                        }
                    }
                })

        },
        ai: {
            threaten: 1.6,
            expose: 0.3,
        }
    },
    // sp长崎素世
    gbansu: {
        audio: "ext:GirlsBand/audio/skill:2",
        trigger: {
            global: "chooseToDebateBegin"
        },
        filter(event, player) {
            return event.list.includes(player) && event.list.filter(p => p != player).length > 0
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget("暗素", "选择一名参与本次议事的其他角色")
                .set("targetx", trigger.list)
                .set("filterTarget", (card, player, target) => get.event("targetx").includes(target) && target != player)
                .set("ai", (target) => {
                    if (!target.countCards("h")) return true
                    return Math.random()
                })
                .forResult()
        },
        async content(event, trigger, player) {
            player.when({
                global: "chooseToDebateEnd"
            })
                .then(() => {
                    const {
                        bool,
                        opinion,
                        red,
                        black,
                        other,
                        targets
                    } = trigger.result;
                    if (red && red.some(tar => tar[0] == player) && red.some(tar => tar[0] == targetx)) event.goto(1)
                    else if (black && black.some(tar => tar[0] == player) && black.some(tar => tar[0] == targetx)) event.goto(1)
                    else if (other && other.some(tar => tar[0] == player) && other.some(tar => tar[0] == targetx)) event.goto(1)
                    else event.goto(3)
                })
                .then(() => {
                    player.chooseControl(["弃牌", "翻面", "cancel2"])
                        .set("prompt", "暗素")
                        .set("prompt2", `令${get.translation(targetx)}...`)
                        .set("ai", () => {
                            let player = _status.event.player
                            if (get.attitude(player, targetx) > 0) {
                                if (trigger.result.opinion == "red") {
                                    if (targetx.isTurnedOver()) return "弃牌"
                                    return "翻面"
                                } else if (targetx.isTurnedOver()) return "翻面"
                                return "弃牌"
                            }
                            if (get.attitude(player, targetx) < 0) {
                                if (trigger.result.opinion == "red") {
                                    if (targetx.isTurnedOver()) return "翻面"
                                    return "弃牌"
                                } else if (targetx.isTurnedOver()) return "弃牌"
                                return "翻面"
                            }
                        })
                })
                .then(() => {
                    if (result.control == "cancel2") {
                        event.finish()
                        return
                    }
                    if (result.control == "弃牌") player.discardPlayerCard(targetx, "he", 2, true)
                    else if (result.control == "翻面") targetx.turnOver()
                    player.logSkill("gbansu", targetx)
                    event.finish()
                })
                .then(() => {
                    player.chooseBool("暗素", "是否摸两张牌并翻面").set("ai", () => {
                        let player = _status.event.player
                        if (trigger.result.opinion == "black") {
                            if (player.isTurnedOver()) return false
                            return true
                        }
                        if (player.isTurnedOver()) return true
                        return false
                    })
                })
                .then(() => {
                    if (result.bool) {
                        player.draw(2)
                        player.turnOver()
                    }
                    player.logSkill("gbansu")
                    event.finish()
                })
                .vars({
                    targetx: event.targets[0]
                })
                .assign({
                    ai: {
                        expose: 0.15,
                    }
                })
            player.when({
                global: "chooseToDebateAfter"
            })
                .then(() => {
                    const {
                        bool,
                        opinion,
                        targets
                    } = trigger.result;
                    if (opinion == "red") {
                        player.logSkill("gbansu", targetx)
                        if (targetx.isTurnedOver()) {
                            targetx.draw(2)
                        }
                        targetx.turnOver(false)
                        targetx.link(false)
                    }
                    if (opinion == "black") {
                        player.logSkill("gbansu")
                        player.turnOver(false)
                        player.link(false)
                    }
                })
                .vars({
                    targetx: event.targets[0]
                })
        }
    },
    // sp爱音
    gbzhuyin: {
        audio: "ext:GirlsBand/audio/skill:3",
        trigger: {
            player: "chooseToCompareBegin",
            target: "chooseToCompareBegin",
            global: "chooseToDebateBegin"
        },
        filter(event, player) {
            if (event.name == "chooseToDebate") return event.list.includes(player)
            return true
        },
        prompt2: "当你进行议事/拼点时，你可以获得参与本次事件的一名其他角色的一张牌，若如此做，你展示此牌并仅能使用此牌参与本次事件",
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget("主音", "选择一名其他角色并获得其一张牌")
                .set("filterTarget", (card, player, target) => player != target && get.event("targetx").includes(target))
                .set("ai", (target) => {
                    let player = _status.event.player
                    if (get.attitude(player, target) < 0) return 10
                    return 1
                })
                .set("targetx", trigger.list || trigger.targets || [trigger.target, trigger.player])
                .forResult()
        },
        async content(event, trigger, player) {
            if (!player.countGainableCards(event.targets[0], "he")) return
            let next = await player.gainPlayerCard("he", true, event.targets[0]).forResult()
            if (next) {
                player.showCards(next.cards)
                if (event.triggername != "chooseToDebateBegin") {
                    if (!trigger.fixedResult) trigger.fixedResult = {}
                    trigger.fixedResult[player.playerid] = next.cards[0]
                } else {
                    if (!trigger.fixedResult) trigger.fixedResult = [];
                    trigger.fixedResult.push([player, next.cards[0]]);
                }
            }
        },
        group: "gbzhuyin_end",
        ai: {
            expose: 0.15
        },
        subSkill: {
            end: {
                audio: false,
                trigger: {
                    player: "phaseEnd",
                },
                filter(event, player) {
                    return player.getHistory("skipped") && player.getHistory("skipped").includes("phaseDraw") && player.getHistory("skipped").includes("phaseUse") && player.countCards("he") >= player.getHistory("skipped").length
                },
                async cost(event, trigger, player) {
                    event.result = await player.chooseCard("主音", "弃置" + get.cnNumber(player.getHistory("skipped").length) + "张牌获得一个额外的出牌阶段", player.getHistory("skipped").length)
                        .set("ai", (card) => {
                            let player = _status.event.player
                            let cards = player.getCards("he", c => {
                                return get.value(c) < 6 && !player.hasValueTarget(c)
                            })
                            if (cards.length >= player.getHistory("skipped").length) return cards.includes(card)
                        })
                        .forResult()
                },
                async content(event, trigger, player) {
                    player.discard(event.cards)
                    trigger.phaseList.push("phaseUse|gbzhuyin")
                }
            }
        }
    },
    gbzhuyi2: {
        inherit: "gbzhuyi",
        audio: "gbzhuyi",
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
                            if (num + 1 <= game.countPlayer()) {
                                if (player.countCards("he") < 4) return 0
                                return 8
                            }
                            return 0
                        },
                        other: () => {
                            if (num + 2 <= game.countPlayer() && game.hasPlayer(c => get.attitude(player, c) < 0)) return 9
                            return 0
                        },
                        draw: () => {
                            if (num + 1 <= game.countPlayer() && game.hasPlayer(c => get.attitude(player, c) < 0)) return 10
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
                        if (get.attitude(player, target) < 0) return 10
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
                        if (get.attitude(player, target) < 0) return 10
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
                        if (target == player) return 10
                        if (get.attitude(player, target) < 0) return 5
                        else return 1
                    })
                    .forResult()
                if (result) await player.chooseToDebate(result.targets)
            }
        },
    },
    // spmortis
    gbsiwang: {
        audio: false,
        trigger: {
            player: "damageBegin4",
            source: "damageBegin2"
        },
        persevereSkill: true,
        mod: {
            aiValue(player, card, num) {
                if (card.name == "ying") return num + 4
            },
            aiUseful(player, card, num) {
                if (card.name == "ying") return num + 7
            }
        },
        filter(event, player) {
            return player.hasCard("ying")
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard("死亡", "你可以弃置一张【影】并恢复一点体力。")
                .set("filterCard", (card) => card.name == "ying")
                .set("ai", (card) => true)
                .forResult()
        },
        async content(event, trigger, player) {
            player.discard(event.cards)
            player.recover()
            var list = [];
            if (!player.hasSkill("gbfuxi")) {
                list.push("gbfuxi");
            }
            if (!player.hasSkill("gbruoye")) {
                list.push("gbruoye");
            }
            if (!player.hasSkill("gbchenggu")) {
                list.push("gbzicheng");
            }
            list.push("cancel2")
            if (list.length) {
                let result = await player.chooseControl(list)
                    .set("prompt", "死亡")
                    .set("prompt2", "失去一点体力上限并获得下列技能中的一个")
                    .set("ai", () => {
                        let player = _status.event.player
                        let list = get.event("controls")
                        if (player.isDamaged() && player.maxHp > 2) return list.sort((a, b) => {
                            return get.skillRank(b, ["in", "out"]) - get.skillRank(a, ["in", "out"])
                        })[0]
                        else return "cancel2"
                    })
                    .forResult()
                if (result.control != "cancel2") {
                    player.loseMaxHp()
                    player.addSkill(result.control)
                } else {
                    event.finish()
                }
            }
        },
        ai: {
            effect: {
                player(card, player, target) {
                    if (get.tag(card, "damage") && player.hasCard("ying")) return [1, 1]
                },
                target(card, player, target) {
                    if (get.tag(card, "damage")) return [1, 1]
                },
            },
        }
    },
    // sp高松灯
    gbjianqiu: {
        audio: "ext:GirlsBand/audio/skill:2",
        zhuanhuanji: true,
        mark: true,
        marktext: "☯",
        intro: {
            content(storage, player, skill) {
                let str = !player.storage.gbjianqiu ?
                    `转换技，每轮每名角色限一次，当你参与的拼点结束后，你可以展示一名其他角色的一张牌，你获得此牌，然后本轮你不能对其使用〖歧路〗` :
                    `转换技，每轮每名角色限一次，当你参与的拼点结束后，你可以展示一名其他角色的一张牌，交给其一张牌，然后你可以获得此牌`
                return str;
            },
        },
        trigger: {
            player: ["chooseToCompareAfter", "compareMultipleAfter"],
            target: ["chooseToCompareAfter", "compareMultipleAfter"],
        },
        filter(event, player) {
            if (event.preserve) return false;
            if (event.name == "compareMultiple") return true;
            return !event.compareMultiple;
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(get.prompt2("gbjianqiu"))
                .set("filterTarget", (card, player, target) => player != target && !player.getStorage("gbjianqiu_used").includes(target))
                .set("ai", (target) => {
                    let player = _status.event.player
                    if (!player.getStorage("gbjianqiu", false)) {
                        if (get.attitude(player, target) < 0) return 1 / target.countCards("he")
                        else return target.countCards("he")
                    } else {
                        if (get.attitude(player, target) > 0) return 1
                        else return Math.random()
                    }
                })
                .forResult()
        },
        async content(event, trigger, player) {
            let target = event.targets[0]
            let result = await player.choosePlayerCard("箋秋", "请选择" + get.translation(target) + "一张牌", "he", target, true).forResult()
            if (result) {
                target.showCards(result.cards)
                if (!player.getStorage("gbjianqiu", false)) {
                    player.gain(result.cards, "gain2")
                    player.markAuto("gbjianqiu_used", target)
                    player.markAuto("gbqilu_used", target)
                    player.addTempSkill("gbjianqiu_used", "roundStart")
                    player.addTempSkill("gbqilu_used", "roundStart")
                } else {
                    let next = await player.chooseCard("箋秋", "交给" + get.translation(target) + "一张牌", "he", true).forResult()
                    if (next && next.bool) {
                        player.give(next.cards, target, "giveAuto")
                        let next2 = await player.chooseBool("是否获得" + get.translation(result.cards))
                            .set("ai", () => {
                                let card = get.event("card")
                                let player = _status.event.player
                                if (player.isMaxHandcard()) return true
                                return get.value(card) > 7
                            })
                            .set("card", result.cards[0])
                            .forResult()
                        if (next2.bool) {
                            player.gain(result.cards, "gain2")
                        }
                    }
                    player.markAuto("gbjianqiu_used", target)
                    player.addTempSkill("gbjianqiu_used", "roundStart")
                }
            }
            player.changeZhuanhuanji("gbjianqiu")
        },
        subSkill: {
            used: {
                onremove: true,
            }
        }
    },
    // sp若叶睦
    gbduoluo: {
        audio: false,
        trigger: {
            player: "discardAfter"
        },
        usable: 1,
        filter(event, player) {
            return event.cards.length >= 2 || event.cards.some(card => get.color(card) == "black" && card.original == "h")
        },
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(get.prompt2("gbduoluo"))
                .set("filterTarget", lib.filter.notMe)
                .set("ai", (target) => {
                    let player = _status.event.player
                    if (get.attitude(player, target) < 0) return 1
                    return Math.random()
                })
                .forResult()
        },
        async content(event, trigger, player) {
            let choice = ["获得2张【影】，本回合你的【影】均视为【杀】", "失去1点体力，视为对另一角色使用一张【杀】", "本回合对另一角色使用【杀】无距离与次数限制", "令另一角色摸两张牌，然后终止〖堕落〗"]
            let target = event.targets[0]
            for (let i = 0; i < choice.length; i++) {
                let list = []
                let choiceList = []
                for (let i = 0; i < choice.length; i++) {
                    if (player.getStorage("gbduoluo_used").includes(choice[i])) {
                        choiceList.push(`<s style="opacity: 0.5;">${choice[i]}</s>`)
                    } else {
                        choiceList.push(`${choice[i]}`)
                        list.push("选项" + get.cnNumber(i + 1, true))
                    }
                }
                if (i % 2 == 0) {
                    let next = await player.chooseControl(list)
                        .set("prompt", "堕落")
                        .set("choiceList", choiceList)
                        .set("ai", function () {
                            var evt = _status.event,
                                player = evt.player,
                                target = evt.targetx,
                                att = get.attitude(player, target),
                                choice = evt.controls
                            if (att > 0) {
                                if (choice.includes("选项一") && get.value({
                                    name: "ying"
                                }) >= get.value({
                                    name: "ying"
                                }, target)) return "选项一"
                                if (choice.includes("选项二") && get.effect(player, {
                                    name: "losehp"
                                }, player, player) > get.effect(target, {
                                    name: "sha"
                                }, player, player)) return "选项二"
                                if (choice.includes("选项三") && choice.includes("选项四")) {
                                    if (get.effect(player, {
                                        name: "draw"
                                    }, player, player) > get.effect(target, {
                                        name: "draw"
                                    }, player, player)) return "选项三"
                                    return "选项四"
                                }
                                if (choice.includes("选项四")) return "选项四"
                            } else {
                                if (choice.includes("选项一") && get.value({
                                    name: "ying"
                                }) <= get.value({
                                    name: "ying"
                                }, target)) return "选项一"
                                if (choice.includes("选项二") && get.effect(player, {
                                    name: "losehp"
                                }, player, player) > get.effect(target, {
                                    name: "sha"
                                }, player, player)) return "选项二"
                                if (choice.includes("选项三") && choice.includes("选项四")) {
                                    return "选项三"
                                }
                                if (choice.includes("选项四")) return "选项四"
                            }
                        })
                        .set("targetx", target)
                        .forResult()
                    if (next) {
                        player.markAuto("gbduoluo_used", choice[["选项一", "选项二", "选项三", "选项四"].indexOf(next.control)])
                        player.addTempSkill("gbduoluo_used")
                        switch (next.control) {
                            case "选项一":
                                player.gain(lib.card.ying.getYing(2))
                                player.addTempSkill(`${event.name}_sha`)
                                break
                            case "选项二":
                                player.loseHp()
                                if (player.canUse({
                                    name: "sha"
                                }, target, false, false)) {
                                    player.useCard({
                                        name: "sha"
                                    }, target)
                                }
                                break
                            case "选项三":
                                player.addTempSkill("gbduoluo_temp")
                                player.markAuto("gbduoluo_temp", target)
                                break
                            case "选项四":
                                target.draw(2)
                                event.finish()
                                break
                        }
                    }
                } else {
                    let next = await target.chooseControl(list)
                        .set("prompt", "堕落")
                        .set("choiceList", choiceList)
                        .set("ai", function () {
                            var evt = _status.event,
                                player = evt.player,
                                target = evt.targetx,
                                att = get.attitude(player, target),
                                choice = evt.controls
                            if (att > 0) {
                                if (choice.includes("选项一") && get.value({
                                    name: "ying"
                                }) >= get.value({
                                    name: "ying"
                                }, target)) return "选项一"
                                if (choice.includes("选项二") && get.effect(player, {
                                    name: "losehp"
                                }, player, player) > get.effect(target, {
                                    name: "sha"
                                }, player, player)) return "选项二"
                                if (choice.includes("选项三") && choice.includes("选项四")) {
                                    if (get.effect(player, {
                                        name: "draw"
                                    }, player, player) > get.effect(target, {
                                        name: "draw"
                                    }, player, player)) return "选项三"
                                    return "选项四"
                                }
                                if (choice.includes("选项四")) return "选项四"
                            } else {
                                if (choice.includes("选项一") && get.value({
                                    name: "ying"
                                }) <= get.value({
                                    name: "ying"
                                }, target)) return "选项一"
                                if (choice.includes("选项二") && get.effect(player, {
                                    name: "losehp"
                                }, player, player) > get.effect(target, {
                                    name: "sha"
                                }, player, player)) return "选项二"
                                if (choice.includes("选项三") && choice.includes("选项四")) {
                                    return "选项三"
                                }
                                if (choice.includes("选项四")) return "选项四"
                            }
                        })
                        .set("targetx", player)
                        .forResult()
                    if (next) {
                        player.markAuto("gbduoluo_used", choice[["选项一", "选项二", "选项三", "选项四"].indexOf(next.control)])
                        player.addTempSkill("gbduoluo_used")
                        switch (next.control) {
                            case "选项一":
                                target.gain(lib.card.ying.getYing(2))
                                target.addTempSkill(`${event.name}_sha`)
                                break
                            case "选项二":
                                target.loseHp()
                                if (target.canUse({
                                    name: "sha"
                                }, player)) {
                                    target.useCard({
                                        name: "sha"
                                    }, player)
                                }
                                break
                            case "选项三":
                                target.addTempSkill("gbduoluo_temp")
                                target.markAuto("gbduoluo_temp", player)
                                break
                            case "选项四":
                                player.draw(2)
                                event.finish()
                                break
                        }
                    }
                }
            }
        },
        subSkill: {
            used: {
                onremove: true,
            },
            temp: {
                onremove: true,
                mod: {
                    cardUsableTarget(card, player, target) {
                        if (player.getStorage("gbduoluo_temp").includes(target) && card.name == "sha") return true;
                    },
                    targetInRange(card, player, target) {
                        if (player.getStorage("gbduoluo_temp").includes(target) && card.name == "sha") return true;
                    },
                }
            },
            sha: {
                mod: {
                    cardname(card, player, current) {
                        if (card.name == "ying") return "sha"
                    },
                }
            },
        }
    },
    // 小白
    gbqixiang: {
        audio: false,
        trigger: {
            global: "phaseBefore",
            player: "phaseZhunbei"
        },
        mark: "auto",
        marktext: "幻",
        intro: {
            markcount: "expansion",
            content: "expansion"
        },
        filter(event, player, name) {
            return name != "phaseBefore" || game.phaseNumber == 0;
        },
        async content(event, trigger, player) {
            let cards = get.cards(3, true)
            if (cards.length > 0) {
                player.showCards(cards)
                game.delayx(1)
                let result = await player.chooseButton(["绮想", "选择一张置于武将牌上", [cards, "vcard"]], true)
                    .set("ai", function (button, cards) {
                        let player = _status.event.player
                        if (!["basic", "trick"].includes(get.type(button.link))) return -player.getUseValue(button.link)
                        if (player.getExpansions("gbqixiang").some(card => card.name == button.link.name)) return -player.getUseValue(button.link)
                        return player.getUseValue(button.link)
                    })
                    .forResult()
                if (result && result.bool) {
                    player.addToExpansion(result.links, "giveAuto", "bySelf").gaintag.add("gbqixiang")
                }
            }
        },
        ai: {
            combo: "gbyingjian"
        }
    },
    gbyingjian: {
        audio: false,
        enable: ["chooseToUse", "chooseToRespond"],
        usable: 5,
        filter(event, player) {
            return player.hasExpansions("gbqixiang") && player.getExpansions("gbqixiang").some(card => event.filterCard(card, player, event))
        },
        chooseButton: {
            dialog(event, player) {
                var list = [];
                for (var card of player.getExpansions("gbqixiang")) {
                    if (list.some(i => i[2] == card.name)) continue
                    if (!["basic", "trick"].includes(get.type(card))) continue
                    list.push(["", "", card.name])
                }
                return ui.create.dialog("绮想", [list, "vcard"]);
            },
            filter(button, player) {
                return _status.event.getParent().filterCard({
                    name: button.link[2]
                }, player, _status.event.getParent());
            },
            backup(links, player) {
                return {
                    audio: false,
                    selectCard: 0,
                    viewAs: {
                        name: links[0][2]
                    },
                    onuse(result, player) {
                        player.addTempSkill("gbyingjian_1", "useCardAfter")
                        player.addTempSkill("gbyingjian_2")
                    },
                    onrespond(result, player) {
                        player.addTempSkill("gbyingjian_1", "respondAfter")
                        player.addTempSkill("gbyingjian_2")
                    }
                };
            },
            prompt(links, player) {
                return "视为使用或打出" + get.translation(links[0][2]);
            },
        },
        ai: {
            save: true,
            respondSha: true,
            respondShan: true,
            skillTagFilter(player, tag, arg) {
                if (!player.countCards("he")) return false
                switch (tag) {
                    case "save":
                        return player.getExpansions("gbqixiang").some(card => card.name == "tao")
                    case "respondShan":
                        return player.getExpansions("gbqixiang").some(card => card.name == "shan")
                    case "respondSha":
                        return player.getExpansions("gbqixiang").some(card => card.name == "sha")
                }
            },
            order: 8,
            threaten: 1.7,
            result: {
                player(player, target) {
                    if (player.getExpansions("gbqixiang").some(c => {
                        if (!["basic", "trick"].includes(get.type(c))) return false
                        return player.hasValueTarget(c)
                    })) return 1
                    return 0
                }
            },
        },
        subSkill: {
            1: {
                audio: false,
                trigger: {
                    global: ["useCard", "respond"]
                },
                forced: true,
                filter(event, player) {
                    return Array.isArray(event.respondTo) && event.respondTo[0] == player
                },
                async content(event, trigger, player) {
                    player.discard(player.getExpansions("gbqixiang").filter(card => card.name == trigger.respondTo[1].name))
                    player.removeSkill("gbyingjian_2")
                }
            },
            2: {
                audio: false,
                trigger: {
                    player: ["useCardAfter", "respondAfter"]
                },
                forced: true,
                async content(event, trigger, player) {
                    player.removeSkill("gbyingjian_2")
                    let list = []
                    if (player.countCards("h")) list.push("选项一")
                    if (player.countExpansions("gbqixiang")) list.push("选项二")
                    let result = await player.chooseControl(list, true)
                        .set("choiceList", ["弃置X张牌", "移去所有的『幻』"])
                        .set("prompt", "萤茧")
                        .set("ai", () => {
                            let player = _status.event.player
                            if (player.countCards("he", card => get.value(card) <= 4) >= player.countSkill("gbyingjian")) return 0
                            return 1
                        })
                        .forResult()
                    if (result) {
                        switch (result.control) {
                            case "选项一":
                                player.chooseToDiscard("he", true, player.countSkill("gbyingjian"))
                                break
                            case "选项二":
                                player.discard(player.getExpansions("gbqixiang"))
                                if (_status.currentPhase == _status.event.player) player.useSkill("gbqixiang")
                                break
                        }
                    }
                }
            }
        }
    },
    gbhuadie: {
        audio: false,
        zhuSkill: true,
        trigger: {
            global: "showCardsBegin"
        },
        filter(event, player) {
            return event.player.group == player.group && event.player != player
        },
        async cost(event, trigger, player) {
            event.result = await trigger.player.chooseBool("化蝶", `是否将牌堆中的一张同名牌置于『幻』中`)
                .set("ai", () => {
                    let player = _status.event.player
                    let source = get.event("source")
                    let cards = get.event("cards")
                    if (get.attitude(player, source) > 0) return !source.getExpansions("gbqixiang").some(c => cards.some(card => card.name == c.name))
                    return false
                })
                .set("cards", trigger.cards)
                .set("source", player)
                .forResult()
        },
        async content(event, trigger, player) {
            let cards = []
            for (let card of trigger.cards) {
                if (cards.some(c => c.name == card.name)) continue
                cards.push(get.cardPile2(card.name, "random"))
            }
            player.addToExpansion(cards, "giveAuto").gaintag.add("gbqixiang")
        }
    },
    // 桐谷透子
    gbxinyi: {
        audio: false,
        trigger: {
            player: "phaseZhunbei"
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCardTarget()
                .set("prompt", get.prompt2("gbxinyi"))
                .set("selectCard", [0, 1])
                .set("filterTarget", (card, player, target) => {
                    return target.hasEquipableSlot(2)
                })
                .set("position", "h")
                .set("ai1", (card) => {
                    return false
                })
                .set("ai2", (target) => {
                    let player = _status.event.player
                    let card
                    let top = get.cards(1, true)[0]
                    if (ui.selected.cards && ui.selected.cards.length > 0) card = ui.selected.cards[0]
                    else if (top && top.isKnownBy(player)) card = top
                    else card = {
                        color: ["red", "black"].randomGet()
                    }
                    switch (get.color(card)) {
                        case "red":
                            return get.effect(target, {
                                name: "bagua"
                            }, player, player)
                        case "black":
                            return get.effect(target, {
                                name: "renwang"
                            }, player, player)
                    }
                })
                .forResult()
        },
        async content(event, trigger, player) {
            let cards = event.cards && event.cards.length > 0 ? event.cards : get.cards(1),
                name = get.color(cards[0]) == "red" ? "bagua" : "renwang"
            let card = get.autoViewAs({
                name
            }, cards)
            await event.targets[0].equip(card)
        },
    },
    gbchaoliu: {
        audio: false,
        trigger: {
            global: "roundStart"
        },
        filter(event, trigger) {
            return game.phaseNumber != 1 && game.hasPlayer(cur => cur.hasCard(card => get.subtype(card, cur) == "equip2", "ej"))
        },
        forced: true,
        charlotte: true,
        async content(event, trigger, player) {
            player.draw(game.players.reduce((num, cur) => num += cur.countCards("ej", card => get.subtype(card, cur) == "equip2"), 0))
        },
        group: "gbchaoliu_effect",
        subSkill: {
            effect: {
                audio: false,
                charlotte: true,
                forced: true,
                trigger: {
                    player: "useCardToPlayer"
                },
                filter(event, player) {
                    return event.target != player && player.getEquip(2)
                },
                async content(event, trigger, player) {
                    switch (get.color(player.getEquip(2))) {
                        case "red":
                            await player.gainPlayerCard("e", trigger.target)
                            break
                        case "black":
                            trigger.directHit.addArray(game.players)
                            break
                    }
                }
            }
        }
    },
    // 
    gbyouzi: {
        audio: false,
        trigger: {
            global: "phaseBefore",
            player: "phaseUseBegin"
        },
        filter(event, player, name) {
            return name != "phaseBefore" || game.phaseNumber == 0;
        },
        marktext: "佑",
        intro: {
            name: "佑",
            nocount: true,
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(get.prompt("gbyouzi"), "令一名其他角色获得「佑」")
                .set("ai", target => {
                    let player = _status.event.player
                    if (get.attitude(player, target) > 0) return 10
                    return 1
                })
                .set("filterTarget", (card, player, target) => !target.hasMark("gbyouzi") && target != player)
                .forResult()
        },
        async content(event, trigger, player) {
            event.targets[0].addMark("gbyouzi")
            event.targets[0].updateMark("gbyouzi")
        },
        ai: {
            order: 8,
            result: {
                player: 1
            },
            expose: 0.1
        },
        group: "gbyouzi_effect",
        subSkill: {
            effect: {
                audio: false,
                trigger: {
                    global: "useCardToTarget"
                },
                filter(event, player) {
                    if (event.targets.length == 1 && event.targets[0].hasMark("gbyouzi") && event.targets[0] != player && get.tag(event.card, "damage")) return event.player.canUse({
                        name: "juedou"
                    }, player, false)
                },
                async content(event, trigger, player) {
                    trigger.targets[0].clearMark("gbyouzi")
                    trigger.targets[0].updateMark("gbyouzi")
                    trigger.getParent().targets.remove(trigger.target);
                    trigger.getParent().triggeredTargets2.remove(trigger.target);
                    trigger.getParent().targets.push(player);
                    trigger.untrigger();
                    trigger.player.line(player);
                    game.delayx();
                }
            },
            ai: {
                threaten: 1.1,
                expose: 0.3
            }
        },
    },
    gbtubi: {
        audio: false,
        trigger: {
            target: "useCardToTarget"
        },
        filter(event, player) {
            return event.targets.length == 1 && event.targets[0] == player && ["sha", "juedou"].includes(event.card.name)
        },
        async cost(event, trigger, player) {
            let list = []
            if (game.hasPlayer(p => p.hasMark("gbyouzi"))) list.push("选项一")
            list.push("选项二")
            list.push("背水！")
            let result = await player.chooseControl(list)
                .set("prompt", "土笔")
                .set("choiceList", ["移除场上的一枚「佑」标记，然后摸两张牌", "此牌结算后，若你未受到伤害，则你获得其一张牌，否则你令一名其他角色获得「佑」标记。", "背水！失去1点体力并增加1点体力上限，然后依次执行上述所有选项。"])
                .set("ai", () => {
                    let player = _status.event.player
                    let bool1 = false,
                        bool2 = false
                    if (game.hasPlayer(p => get.attitude(player, p) < 0 && p.hasMark("gbyouzi")) || !game.hasPlayer(p => get.attitude(player, p) > 0 && p.hasMark("gbyouzi") && p.hp < 2)) return bool1 = true
                    if (trigger.card.name == "sha" && player.hasShan()) bool2 = true
                    if (trigger.card.name == "juedou" && player.hasSha() && !trigger.player.mayHaveSha(player)) bool2 = true
                    if (player.hp > 3 && bool1 && bool2) return "背水！"
                    if (bool2) return "选项二"
                    if (!bool1 && player.hp > 3) return "选项二"
                    return "选项一"
                })
                .forResult()
            if (result) {
                event.result = {
                    bool: true,
                    cost_data: result.control
                }
            }
        },
        async content(event, trigger, player) {
            if (event.cost_data == "选项一" || event.cost_data == "背水！") {
                let result = await player.chooseTarget("土笔", "移除场上的一枚「佑」标记")
                    .set("filterTarget", (card, player, target) => {
                        return target.hasMark("gbyouzi")
                    })
                    .set("ai", (target) => {
                        let player = _status.event.player
                        if (get.attitude(player, target) < 0) return 10
                        if (get.attitude(player, target) > 0) {
                            if (target.hp > 2) return 5
                            return 1
                        }
                    })
                    .forResult()
                if (result && result.bool) {
                    result.targets[0].clearMark("gbyouzi")
                    result.targets[0].updateMark("gbyouzi")
                    player.draw(2)
                }
            }
            if (event.cost_data == "选项二" || event.cost_data == "背水！") {
                trigger.player.when("useCardAfter")
                    .filter((event, player) => {
                        return event.card == trigger.card
                    })
                    .then(() => {
                        if (!player.hasHistory("sourceDamage", evt => evt.card == trigger.card)) {
                            trigger.targets[0].gainPlayerCard("he", player, true)
                            event.finish()
                        } else {
                            player.chooseTarget("土笔", "令一名其他角色「佑」")
                                .set("filterTarget", (card, player, target) => {
                                    return !target.hasMark("gbyouzi") && player != target
                                })
                                .set("ai", (target) => {
                                    let player = _status.event.player
                                    if (get.attitude(player, target) > 0) {
                                        if (target.hp < 2) return 10
                                        return 5
                                    }
                                    if (get.attitude(player, target) < 0) return 1
                                })
                                .forResult()
                        }
                    })
                    .then(() => {
                        if (result && result.bool) {
                            result.targets[0].addMark("gbyouzi")
                            result.targets[0].updateMark("gbyouzi")
                        }
                    })
            }
            if (event.cost_data == "背水！") {
                player.loseHp()
                player.gainMaxHp()
            }
            game.log(player, "选择了", "#g【土笔】", "的", "#y" + event.cost_data)
        },
        ai: {
            effect: {
                target(card, player, target) {
                    if (["sha", "juedou"].includes(card.name)) return [1, 1]
                }
            }
        }
    },
    //
    gbtianzi: {
        audio: false,
        trigger: {
            player: "phaseUseBegin"
        },
        mod: {
            targetInRange(card, player, target) {
                if (player.getStorage("gbtianzi_on").length > 0) {
                    if (get.type(card, "trick") == get.type(player.getStorage("gbtianzi_on")[0], "trick")) return true
                }
            },
            cardUsable(card, player) {
                if (player.getStorage("gbtianzi_on").length > 0) {
                    if (get.type(card, "trick") == get.type(player.getStorage("gbtianzi_on")[0], "trick")) return Infinity
                }
            },
            cardEnabled(card, player) {
                if (player.getStorage("gbtianzi_on").length > 0) {
                    if (get.type(card, "trick") == get.type(player.getStorage("gbtianzi_on")[0], "trick")) return true
                }
            }
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(get.prompt2("gbtianzi"))
                .set("filterTarget", (card, player, target) => player != target && target.countCards("h"))
                .set("ai", (target) => {
                    return Math.random()
                })
                .forResult()
        },
        async content(event, trigger, player) {
            let target = event.targets[0]
            let result = await player.choosePlayerCard("请选择" + get.translation(target) + "一张手牌", "h", target, true).forResult()
            if (result) {
                target.showCards(result.cards)
                player.markAuto("gbtianzi_on", result.cards)
                player.addTempSkill("gbtianzi_on")
            }
        },
        subSkill: {
            on: {
                onremove: true
            }
        }
    },
    gbzicun: {
        audio: false,
        persevereSkill: true,
        trigger: {
            player: "useCard"
        },
        prompt() {
            return get.prompt("gbzicun")
        },
        check(event, player) {
            if (player.countSkill("gbzicun") < player.maxHp) return true
            if (!player.getCards("hs").some(card => player.hasValueTarget(card, false, true))) return true
            return false
        },
        prompt2: "摸一张牌",
        async content(event, trigger, player) {
            player.draw()
            if (player.countSkill("gbzicun") > player.maxHp) {
                if (_status.currentPhase == player) {
                    _status.event.getParent("phaseUse").skipped = true
                } else {
                    let list = []
                    if (player.countCards("h")) list.push("弃置所有手牌")
                    list.push("失去1点体力")
                    player.chooseControl(list)
                        .set("prompt", "自寸")
                        .set("ai", () => {
                            let player = _status.event.player
                            if (player.countCards("h") > 2) {
                                if (player.hp > 1) return "失去1点体力"
                                if (player.hasCard("tao") || player.hasCard("jiu")) return "失去1点体力"
                            }
                            return "弃置所有手牌"
                        })
                }
            }
        },
        group: "gbzicun_effect",
        subSkill: {
            effect: {
                audio: false,
                trigger: {
                    source: "damageSource"
                },
                persevereSkill: true,
                forced: true,
                filter(event, player) {
                    return player.getHistory("sourceDamage")?.reduce((num, evt) => num += evt.num, 0) > player.maxHp
                },
                async content(event, trigger, player) {
                    if (_status.currentPhase == player) {
                        _status.event.getParent("phaseUse").skipped = true
                    } else {
                        let list = []
                        if (player.countCards("h")) list.push("弃置所有手牌")
                        list.push("失去1点体力")
                        player.chooseControl(list)
                            .set("prompt", "自寸")
                            .set("ai", () => {
                                let player = _status.event.player
                                if (player.countCards("h") > 2) {
                                    if (player.hp > 1) return "失去1点体力"
                                    if (player.hasCard("tao") || player.hasCard("jiu")) return "失去1点体力"
                                }
                                return "弃置所有手牌"
                            })
                    }
                }
            },
        }
    },
    // 
    gbzhenglun: {
        audio: false,
        trigger: {
            player: "useCardToPlayered"
        },
        mod: {
            attackRange(player, num) {
                return num + 2
            }
        },
        filter(event, player) {
            return event.targets.length > 0 && event.card.name == "sha"
        },
        charlotte: true,
        async cost(event, trigger, player) {
            let result = await player.chooseSkill(trigger.target, "选择一项技能", (skill, name) => {
                return trigger.target.hasSkill(name)
            })
                .forResult()
            if (result && result.bool) {
                event.result = {
                    bool: true,
                    cost_data: result.skill
                }
            }
        },
        async content(event, trigger, player) {
            if (lib.skill[event.cost_data].persevereSkill) return
            trigger.target.tempBanSkill(event.cost_data, null, true)
        }
    },
    gbweiqin: {
        audio: false,
        enable: "phaseUse",
        usable: 1,
        position: "he",
        selectCard: 1,
        filterCard: true,
        lose: false,
        check(card) {
            let player = _status.event.player
            switch (get.color(card)) {
                case "black":
                    if (!player.hasSha()) return 0
                    if (player.countCards("hs", card => card.name == "sha") == 1 && card.name == "sha") return 0
                    let targets = game.filterPlayer(p => get.effect(p, {
                        name: "sha"
                    }, player, player) > 0 && get.attitude(player, p) < 0 && player.canUse({
                        name: "sha"
                    }, p) && !p.hasSkillTag("filterDamage") && !p.mayHaveShan())
                    if (targets.length > 0) return player.getUseValue("jiu", false, false) - player.getUseValue(card)
                    return 0
                case "red":
                    return 1
            }
        },
        ai: {
            order: 7,
            result: {
                player: 1
            }
        },
        async content(event, trigger, player) {
            player.showCards(event.cards)
            switch (get.color(event.cards[0])) {
                case "black":
                    player.discard(event.cards)
                    player.chooseUseTarget("jiu", true, false)
                    delete player.getStat("skill").gbweiqin
                    break
                case "red":
                    let result = await player.chooseTarget("选择至多" + get.cnNumber(player.getAttackRange()) + "名角色", [1, player.getAttackRange()], true)
                        .set("filterTarget", lib.filter.notMe)
                        .set("ai", (target) => {
                            let player = _status.event.player
                            if (get.attitude(player, target) < 0) return 10
                            return Math.random() < 0.5
                        })
                        .forResult()
                    if (result && result.bool) {
                        for (let target of result.targets) {
                            let list = []
                            list.push("无法响应" + get.translation(player) + "使用的牌")
                            if (target.countCards("he")) list.push("交出一张牌")
                            let next = await target.chooseControlList("唯琴", list)
                                .set("ai", () => {
                                    let player = _status.event.player
                                    if (player.countCards("hs", card => ["tao", "shan", "sha", "jiu", "wuxie"].includes(card.name)) && player.countCards("he") > 2) return 1
                                    return 0

                                })
                                .forResult()
                            if (next) {
                                switch (next.control) {
                                    case "选项一":
                                        target.markAuto("gbweiqin_effect", player)
                                        target.addTempSkill("gbweiqin_effect")
                                        break
                                    case "选项二":
                                        let card = await target.chooseCard("选择一张牌", "he", true).forResult()
                                        if (card) await target.give(card.cards, player, "giveAuto")
                                        break
                                }
                            }
                        }
                    }
                    break
            }
        },
        subSkill: {
            effect: {
                audio: false,
                trigger: {
                    target: "useCardToTargeted"
                },
                forced: true,
                onremove: true,
                filter(event, player) {
                    return player.getStorage("gbweiqin_effect").includes(event.player)
                },
                async content(event, trigger, player) {
                    trigger.directHit.add(player)
                }
            }
        }

    },
    // 大场奈奈
    gbzaiyan: {
        audio: false,
        trigger: {
            global: "roundStart"
        },
        async content(event, trigger, player) {
            for (let target of game.players) {
                let result = await target.chooseButton([
                    "###再演###",
                    [
                        [
                            ["discard", `弃置一张牌，本轮中，下次造成的属性伤害+1`],
                            ["draw", `摸一张牌，本轮中，下次受到的属性伤害+1`],
                            ["lose", "失去1点体力"]
                        ],
                        "textbutton",
                    ]
                ], true)
                    .set("ai", function (button) {
                        let player = _status.event.player
                        switch (button.link) {
                            case "discard":
                                if (player.hasSkillTag("fireAttack")) return Math.random() + 0.2
                                if (player.countCards("hs", card => get.tag(card, "damage") && typeof card == "object" && card.hasNature())) return Math.random() + 0.2
                                if (player.countCards("e", card => card.name == "zhuque")) return Math.random() + 0.2
                                return Math.random()
                            case "draw":
                                if (player.hasSkillTag("filterDamage")) return Math.random() + 0.2
                                if (player.hasSkillTag("nofire") || player.hasSkillTag("nothunder") || player.hasSkillTag("nodamage")) return Math.random() + 0.2
                                if (player.hasSkillTag("maixie")) return Math.random() + 0.2
                                return Math.random()
                            case "lose":
                                if (get.effect(player, {
                                    name: "losehp"
                                }, player, player) > 0) return Math.random() + 0.2
                                if (game.getGlobalHistory("changeHp", evt => evt.getParent(2).name == "gbzaiyan") < 1 && player.hp > 2 && !player.hasSkill("gbjiesha")) return Math.random()
                        }
                    })
                    .set("filterButton", (button) => {
                        let player = _status.event.player
                        if (["discard"].includes(button.link)) return player.countCards("he")
                        return true
                    })
                    .forResult()
                if (result && result.bool) {
                    switch (result.links[0]) {
                        case "discard":
                            target.chooseToDiscard(`弃置一张牌`, "he", true)
                            target.addTip("gbzaiyan_1", "下次造成的属性伤害+1", false)
                            target.when({
                                source: "damageBegin2"
                            }, {
                                global: "roundStart"
                            }, false)
                                .filter((event, player, name) => {
                                    if (name == "roundStart") return true
                                    return event.nature
                                })
                                .then(() => {
                                    if (event.triggername == "damageBegin2") trigger.num++
                                    player.removeTip("gbzaiyan_1")
                                })
                                .assign({
                                    firstDo: true,
                                    ai: {
                                        effect: {
                                            player(card, player, target) {
                                                let att = -Math.sign(get.attitude(player, target))
                                                if (get.tag(card, "damage") && typeof card == "object" && card.hasNature()) return att * 2
                                            }
                                        }
                                    }
                                })
                                .finish()
                            break
                        case "draw":
                            target.draw()
                            target.addTip("gbzaiyan_2", "下次受到的属性伤害+1", false)
                            target.when({
                                player: "damageBegin4"
                            }, {
                                global: "roundStart"
                            }, false)
                                .filter((event, player, name) => {
                                    if (name == "roundStart") return true
                                    return event.nature
                                })
                                .then(() => {
                                    if (event.triggername == "damageBegin4") trigger.num++
                                    player.removeTip("gbzaiyan_2")
                                })
                                .assign({
                                    firstDo: true,
                                    ai: {
                                        effect: {
                                            target(card, player, target) {
                                                if (get.tag(card, "damage") && typeof card == "object" && card.hasNature()) return 2
                                            }
                                        }
                                    }
                                })
                                .finish()
                            break
                        case "lose":
                            await target.loseHp()
                            break
                    }
                }
            }
            let lose = game.getGlobalHistory("changeHp", evt => evt.getParent(2).name == "gbzaiyan")
            if (lose.length == 1) lose[0].player.addTempSkill("gbjiesha", {
                global: "roundStart"
            })
        },
        ai: {
            threaten: 1.8,
            result: {
                player: 1,
            }
        },
    },
    gbliejiu: {
        audio: false,
        enable: "phaseUse",
        usable: 1,
        async content(event, trigger, player) {
            player.loseHp()
            await player.drawTo(player.maxHp)
            let result = await player.chooseCard("烈酒", "请展示一张手牌", 1, true, "h")
                .set("ai", (card) => {
                    let player = _status.event.player
                    if (player.countCards("hs", c => c.name == "sha") > 1) return get.color(card) == "red"
                    return get.color(card) == "black"
                })
                .forResult()
            if (result && result.bool) {
                player.showCards(result.cards)
                switch (get.color(result.cards[0])) {
                    case "red":
                        player.addTempSkill("gbliejiu_temp")
                        break
                    case "black":
                        player.addTempSkill("gbliejiu_effect")
                        break
                }
            }
        },
        ai: {
            threaten: 1,
            order: 4,
            result: {
                player(player, target, card) {
                    if (player.countCards("h") > player.maxHp - 2) return 0
                    if (player.hp > 1) return 1
                    if (player.hasCard("tao") || player.hasCard("jiu")) return 1
                    return 0
                }
            }
        },
        subSkill: {
            temp: {
                mod: {
                    targetInRange(card, player, target) {
                        if (card.name == "sha") return true
                    },
                    cardUsable(card, player) {
                        if (card.name == "sha") return Infinity
                    }
                }
            },
            effect: {
                audio: false,
                trigger: {
                    player: "useCard1"
                },
                forced: true,
                filter(event, trigger) {
                    return event.card.name == "sha"
                },
                async content(event, trigger, player) {
                    game.setNature(trigger.card, "thunder")
                    trigger.directHit.addArray(trigger.targets)
                }
            }
        }
    },
    gbjiesha: {
        audio: false,
        zhuSkill: true,
        trigger: {
            global: "dieAfter"
        },
        filter(event, player) {
            return event.source
        },
        direct: true,
        async content(event, trigger, player) {
            if (game.hasGlobalHistory("everything", evt => evt.skill == "gbjiesha" && evt.name == "logSkill" && evt.getParent(4).player == trigger.player)) return
            if (trigger.source == player) {
                let result = await player.chooseBool("皆杀：是否弃置所有手牌", "回合结束后可执行一个额外回合").set("ai", () => {
                    if (Math.random() > 0.4) return true
                }).forResult()
                if (result.bool) {
                    if (!game.hasGlobalHistory("everything", evt => evt.skill == "gbjiesha" && evt.name == "logSkill" && evt.targets.includes(player))) player.insertPhase()
                    player.logSkill("gbjiesha", trigger.source)
                    player.discard(player.getCards("h"))
                }
            } else {
                let result = await trigger.source.chooseBool("皆杀：是否将所有手牌交给" + get.translation(player), "回合结束后可执行一个额外回合")
                    .set("ai", () => {
                        let player = _status.event.player
                        let source = get.event("sourcex")
                        if (get.attitude(player, source) > 0) return true
                        if (player.countCards("h") < 2) return true
                        return false
                    })
                    .set("sourcex", player)
                    .forResult()
                if (result.bool) {
                    if (!game.hasGlobalHistory("everything", evt => evt.skill == "gbjiesha" && evt.name == "logSkill" && evt.targets.includes(trigger.source))) trigger.source.insertPhase()
                    player.logSkill("gbjiesha", trigger.source)
                    trigger.source.give(trigger.source.getCards("h"), player, "giveAuto")
                }

            }
        }
    },
    // 凑友希那
    gbgugao: {
        audio: false,
        trigger: {
            player: "gainAfter"
        },
        forced: true,
        charlotte: true,
        mark: true,
        marktext: "孤",
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        filter(event, player) {
            return event.getParent().name != "gbgugao_effect"
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("he", true, [1, Infinity], "孤高", "将任意张牌置于武将牌上，称为『孤』")
                .set("ai", card => {
                    let player = _status.event.player,
                        dis = player.needsToDiscard(0, (i, player) => !player.canIgnoreHandcard(i) && !player.hasValueTarget(i))
                    if (get.position(card) == "e") {
                        if (card.name == "baiyin" && player.isDamaged()) return 10
                    }
                    if (_status.currentPhase == player && !player.countSkill("gbgugao_effect")) {
                        let cards = player.getCards("he", card => (player.getUseValue(card) < 0 || !player.hasValueTarget(card))).sort((a, b) => get.value(a) - get.value(b))
                        if (cards.length > 1) return cards.includes(card) && cards.at(-1) != card
                        return -get.value(card)
                    }
                    if (ui.selected.cards.length > dis) return false
                    if ((!["tao", "shan", "jiu", "wuxie", "sha"].includes(card.name) || !player.hasValueTarget(card)) && get.value(card) < 6) return get.value(card) + 6
                    return get.value(card)
                })
                .forResult()
            if (result && result.bool) {
                player.addToExpansion(result.cards, "giveAuto", "bySelf").gaintag.add("gbgugao")
            }
        },
        group: "gbgugao_effect",
        subSkill: {
            effect: {
                audio: false,
                forced: true,
                charlotte: true,
                trigger: {
                    player: "phaseEnd"
                },
                filter(event, player) {
                    return player.hasExpansions("gbgugao")
                },
                async content(event, trigger, player) {
                    player.gain(player.getExpansions("gbgugao"), "bySelf", "gain2")
                    if (player.getHistory("sourceDamage").length == 0) {
                        player.loseHp()
                    }
                }
            }
        }
    },
    gbhuoniao: {
        audio: false,
        enable: "phaseUse",
        usable: 1,
        position: "h",
        filterCard: true,
        selectCard: -1,
        filterTarget(card, player, target) {
            return lib.card.wanjian.filterTarget(card, player, target)
        },
        filter(event, player) {
            return player.countCards("h")
        },
        selectTarget: -1,
        multitarget: true,
        multiline: true,
        async content(event, trigger, player) {
            await player.chooseUseTarget({
                name: "wanjian"
            }, event.cards, true)
            let result = await player.chooseTarget("###火鸟###", "请选择至多X名角色（X为你『孤』的数量）", [1, player.countExpansions("gbgugao")], true)
                .set("ai", (target) => {
                    let player = _status.event.player
                    let cards = player.getExpansions("gbgugao")
                    let num = cards.filter(card => ["sha", "shan", "tao", "jiu", "wuxie"].includes(card.name) || get.value(card) > 6).length
                    let max = Math.min(player.countExpansions("gbgugao"), game.countPlayer())
                    const dp = Array(max + 1).fill().map(() => [])
                    dp[0] = [
                        []
                    ]
                    for (const target of game.players) {
                        for (let k = max; k >= 1; k--) {
                            for (const comb of dp[k - 1]) {
                                dp[k].push([...comb, target])
                            }
                        }
                    }
                    let maxProfit = -999
                    let bestComb = [];
                    for (let k = 1; k <= max; k++) {
                        for (const comb of dp[k]) {
                            let profit = 0,
                                tempN = num
                            for (const t of comb) {
                                const att = get.attitude(player, t);
                                profit += att > 0 ? (tempN ? 2 : 1) : (tempN ? -1 : 1)
                                tempN && tempN--
                            }
                            if (profit > maxProfit) {
                                maxProfit = profit;
                                bestComb = comb
                            }
                        }
                    }
                    return bestComb.includes(target)
                })
                .forResult()
            if (result && result.bool) {
                let targets = result.targets
                player.logSkill(event.name, targets)
                for (let target of targets.sortBySeat()) {
                    var next
                    if (!target.countCards("he")) next = "选项二"
                    else {
                        next = await target.chooseControlList("火鸟", [`令${get.translation(player)}获得你一张牌`, `获得${get.translation(player)}一张『孤』，然后其摸两张牌`], true).set("ai", () => {
                            let player = _status.event.player
                            let source = _status.event.sourcex
                            if (get.attitude(player, source) > 0) return 1
                            if (get.effect(player, {
                                name: "shunshou_copy2"
                            }, source, player) > get.effect(source, {
                                name: "draw"
                            }, player, player) * 2) return 0
                            return 1
                        })
                            .set("sourcex", player)
                            .forResultControl()
                    }
                    if (next == "选项一") {
                        player.gainPlayerCard(target, "he", true)
                    } else {
                        game.log(target, "选择了", "#g【火鸟】", "的", "#y" + next)
                        let card = await target.chooseButton([`获得${get.translation(player)}一张『孤』`, [player.getExpansions("gbgugao"), "card"]], true)
                            .set("ai", (button) => get.value(button.link))
                            .forResult()
                        target.gain(card.links, "giveAuto")
                        player.draw(2)
                    }
                }
            }
        },
        ai: {
            order: 5,
            result: {
                player(player, target, card) {
                    if (!player.hasHistory("sourceDamage") && player.hasExpansions("gbgugao") && !player.countCards("h", card => player.hasValueTarget(card))) return 1
                    if (!player.countCards("h", card => player.hasValueTarget(card)) && player.getUseValue("wanjian") > 0) return 1
                    return 0
                }
            }
        }
    },
    gbqiangwei: {
        audio: false,
        trigger: {
            source: "damageSource"
        },
        direct: true,
        zhuSkill: true,
        filter(event, player) {
            return event.player.group == player.group && player.hasExpansions("gbgugao")
        },
        async content(event, trigger, player) {
            let result = await trigger.player.chooseBool("###蔷薇###", `是否获得${get.translation(player)}一张『孤』`).set("ai", () => {
                let player = _status.event.player
                let source = get.event("sourcex")
                if (get.attitude(player, source) > 0) return true
                return Math.random < 0.5
            })
                .set("sourcex", player)
                .forResult()
            if (result.bool) {
                player.logSkill("gbqiangwei", trigger.player)
                let card = await trigger.player.chooseButton([`获得${get.translation(player)}一张『孤』`, [player.getExpansions("gbgugao"), "card"]], true)
                    .set("ai", (button) => get.value(button.link))
                    .forResult()
                trigger.player.gain(card.links, "giveAuto")
                player.draw()
            }
        }
    },
    // 今井莉莎
    gbquqi: {
        audio: false,
        trigger: {
            player: "gainAfter"
        },
        forced: true,
        charlotte: true,
        mark: true,
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        filter(event, player) {
            return event.getParent().name != "gbquqi_effect"
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("he", true, [1, Infinity], "曲奇", "将任意张牌置于武将牌上，称为『曲奇』")
                .set("ai", card => {
                    let player = _status.event.player,
                        dis = player.needsToDiscard(0, (i, player) => !player.canIgnoreHandcard(i) && !player.hasValueTarget(i)) || 1
                    if (get.position(card) == "e") {
                        if (card.name == "baiyin" && player.isDamaged()) return 10
                    }
                    return player.getCards("he").sort((a, b) => {
                        let valA = ["tao", "sha", "jiu", "wuxie"].includes(a.name) ?
                            get.value(a) + 1 :
                            get.value(a)
                        let valB = ["tao", "sha", "jiu", "wuxie"].includes(b.name) ?
                            get.value(b) + 1 :
                            get.value(b)
                        return valA - valB
                    }).slice(0, dis).includes(card)
                })
                .forResult()
            if (result && result.bool) {
                player.addToExpansion(result.cards, "giveAuto", "bySelf").gaintag.add("gbquqi")
            }
        },
        group: "gbquqi_effect",
        subSkill: {
            effect: {
                audio: false,
                forced: true,
                charlotte: true,
                trigger: {
                    global: "roundStart"
                },
                filter(event, player) {
                    return player.hasExpansions("gbquqi")
                },
                async content(event, trigger, player) {
                    await player.discard(player.getExpansions("gbquqi"))
                    player.draw(2)
                }
            }
        }
    },
    gbciai: {
        audio: false,
        trigger: {
            player: "damageEnd"
        },
        forced: true,
        locked: false,
        filter(event, player) {
            return player.hasExpansions("gbquqi") && game.hasPlayer(target => !player.getStorage("gbciai_used").includes(target))
        },
        async content(event, trigger, player) {
            let next = await player.chooseButton([`慈爱`, "选择至多两张『曲奇』", [player.getExpansions("gbquqi"), "card"]], true, [1, 2])
                .set("ai", (button) => {
                    let player = _status.event.player
                    if (game.hasPlayer(tar => get.attitude(player, tar) > 0 && tar.hp < 3 && tar.isDamaged() && !player.getStorage("gbciai_used").includes(tar))) {
                        if (ui.selected.buttons.length == 0) return get.value(button.link)
                        return false
                    } else if (game.hasPlayer(tar => get.attitude(player, tar) < 0 && !tar.isDamaged() && !player.getStorage("gbciai_used").includes(tar))) {
                        if (ui.selected.buttons.length == 0) return -get.value(button.link)
                        return false
                    } else if (ui.selected.buttons.length == 0) return get.value(button.link)
                    return false
                })
                .forResult()
            let targets = await player.chooseTarget("慈爱", "请选择一名角色", true)
                .set("ai", (target) => {
                    let player = _status.event.player
                    if (get.attitude(player, target) > 0 && target.hp < 3 && target.isDamaged()) return 10
                    if (get.attitude(player, target) < 0 && !target.isDamaged()) return 5
                    if (get.attitude(player, target) > 0) return 2
                    return 1
                })
                .set("filterTarget", (card, player, target) => !player.getStorage("gbciai_used").includes(target))
                .forResultTargets()
            let target = targets[0]
            await player.give(next.links, target, "giveAuto")
            player.markAuto("gbciai_used", target)
            player.addTempSkill("gbciai_used", "roundStart")
            let result = await target.chooseControlList("慈爱", [`回复1点体力，然后${get.translation(player)}摸两张牌`, "弃置此牌并失去1点体力"], true)
                .set("ai", () => {
                    let player = _status.event.player
                    if (player.isDamaged()) return 0
                    if (get.effect(player, {
                        name: "losehp"
                    }, player, player) > 0) return 1
                    return 0
                })
                .set("source", player)
                .forResult()
            switch (result.control) {
                case "选项一":
                    game.log(target, "选择了", "#g【慈爱】", "的", "#y" + result.control)
                    target.recover()
                    player.draw(3)
                    break
                case "选项二":
                    game.log(target, "选择了", "#g【慈爱】", "的", "#y" + result.control)
                    target.discard(next.cards)
                    target.loseHp()
                    break
            }
        },
        subSkill: {
            used: {
                onremove: true
            }
        }
    },
    // 冰川纱夜
    gbzhunzhen: {
        audio: false,
        trigger: {
            player: "gainAfter"
        },
        forced: true,
        charlotte: true,
        mark: true,
        marktext: "针",
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        filter(event, player) {
            return event.getParent(2).name != "gbzhunzhen_effect"
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("he", true, [1, Infinity], "准针", "将任意张牌置于武将牌上，称为『针』")
                .set("ai", card => {
                    let player = _status.event.player,
                        dis = player.needsToDiscard(0, (i, player) => !player.canIgnoreHandcard(i) && !player.hasValueTarget(i))
                    if (get.position(card) == "e") {
                        if (card.name == "baiyin" && player.isDamaged()) return 10
                    }
                    if (_status.currentPhase == player) {
                        return player.getCards("he").sort((a, b) => {
                            let valA = ["tao", "shan", "jiu", "wuxie"].includes(a.name) ?
                                get.value(a) + 1 :
                                get.value(a)
                            let valB = ["tao", "shan", "jiu", "wuxie"].includes(b.name) ?
                                get.value(b) + 1 :
                                get.value(b)
                            if (player.getExpansions("gbzhunzhen").some(card => card.number == a.number)) valA += 1
                            if (player.getExpansions("gbzhunzhen").some(card => card.number == b.number)) valB += 1
                            if (ui.selected.cards.some(card => card.number == a.number && card != a)) valA += 1
                            if (ui.selected.cards.some(card => card.number == b.number && card != b)) valB += 1
                            return valA - valB
                        }).slice(0, dis ? dis : player.countCards("h") / 2).includes(card)
                    }
                    if ((!["tao", "shan", "jiu", "wuxie", "sha"].includes(card.name) || !player.hasValueTarget(card)) && get.value(card) < 6) return get.value(card)
                    return -get.value(card)
                })
                .forResult()
            if (result && result.bool) {
                player.addToExpansion(result.cards, "giveAuto", "bySelf").gaintag.add("gbzhunzhen")
            }
        },
        group: "gbzhunzhen_effect",
        subSkill: {
            effect: {
                audio: false,
                forced: true,
                charlotte: true,
                trigger: {
                    player: "useCardAfter"
                },
                filter(event, player) {
                    return event.card && player.getExpansions("gbzhunzhen").some(card => card.number == event.card.number)
                },
                popup: false,
                async content(event, trigger, player) {
                    let result = await player.chooseTarget("准针", "请选择一名距离为1的角色", true)
                        .set("filterTarget", (card, player, target) => {
                            return get.distance(player, target) <= 1
                        })
                        .set("ai", (target) => {
                            let player = _status.event.player
                            if (target == player && get.damageEffect(player, player, player, "thunder") + get.effect(player, {
                                name: "draw"
                            }, player, player) * 2 > 0 && player.hp > 2) return 10
                            if (get.attitude(player, target) < 0) return get.damageEffect(target, player, player, "thunder")
                            return get.damageEffect(target, player, player, "thunder")
                        })
                        .forResult()
                    if (result) {
                        player.logSkill(event.name, result.targets)
                        result.targets[0].damage("thunder")
                        if (result.targets[0] == player) player.draw(3)
                    }
                },
                ai: {
                    expose: 0.2,
                    threaten: 1.6,
                    effect: {
                        player(card, player) {
                            if (player.getExpansions("gbzhunzhen").some(c => card.number == c.number)) {
                                if (game.hasPlayer(target => get.distance(player, target) <= 1 && get.attitude(player, target) < 0)) return [1, 1, 1, 0]
                                else if (player.hp > 2) return [1, 1, 1, 0]
                                return [1, -1, 1, 0]
                            }
                        }
                    }
                },
            },
        }
    },
    gbqianwei: {
        audio: false,
        trigger: {
            player: "damageEnd"
        },
        filter(event, player) {
            return player.hasExpansions("gbzhunzhen")
        },
        async content(event, trigger, player) {
            let next = await player.chooseButton([`前卫`, "选择移去任意张『针』", [player.getExpansions("gbzhunzhen"), "card"]])
                .set("selectButton", [1, Infinity])
                .set("ai", (button) => {
                    let {
                        player,
                        dialog
                    } = _status.event;
                    let btns = dialog.buttons;

                    let total = btns.reduce((s, b) => s + b.link.number, 0);
                    if (total <= 39 || player.hp > 2) return false;

                    let dp = Array(61).fill(null);
                    dp[0] = {
                        c: [],
                        t: new Set()
                    };

                    for (let btn of [...btns].sort((a, b) => a.link.number - b.link.number)) {
                        let num = btn.link.number;
                        for (let s = 60; s >= num; s--) {
                            if (!dp[s - num]) continue;

                            let types = new Set(dp[s - num].t);
                            types.add(num);
                            let combo = [...dp[s - num].c, btn];

                            if (!dp[s] || combo.length < dp[s].c.length - 2 ||
                                (Math.abs(combo.length - dp[s].c.length) <= 2 && types.size < dp[s].t.size - 1) ||
                                (Math.abs(combo.length - dp[s].c.length) <= 2 &&
                                    Math.abs(types.size - dp[s].t.size) <= 1 &&
                                    s < dp[s].sum - 5)) {
                                dp[s] = {
                                    c: combo,
                                    t: types,
                                    sum: s
                                };
                            }
                        }
                    }
                    return dp.slice(40).filter(Boolean).sort((a, b) =>
                        Math.abs(a.c.length - b.c.length) > 2 ? a.c.length - b.c.length :
                            Math.abs(a.t.size - b.t.size) > 1 ? a.t.size - b.t.size :
                                a.sum - b.sum
                    )[0]?.c.includes(button)
                })
                .forResult()
            if (next && next.bool) {
                player.discard(next.links)
                if (next.links.reduce((num, card) => num += card.number, 0) > 39) {
                    player.draw(2)
                    player.recover()
                }
            }
        }
    },
    // 宇田川亚子
    gbduoluo_r: {
        audio: false,
        trigger: {
            player: "gainAfter"
        },
        forced: true,
        charlotte: true,
        mark: true,
        marktext: "魔",
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        filter(event, player) {
            return event.getParent(2).name != "gbduoluo_r"
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("he", true, [1, Infinity], "堕萝", "将任意张牌置于武将牌上，称为『魔』")
                .set("ai", card => {
                    let player = _status.event.player,
                        dis = player.needsToDiscard(0, (i, player) => !player.canIgnoreHandcard(i) && !player.hasValueTarget(i))
                    if (get.position(card) == "e") {
                        if (card.name == "baiyin" && player.isDamaged()) return 10
                    }
                    if (_status.currentPhase == player) {
                        return player.getCards("he").sort((a, b) => {
                            let valA = ["tao", "shan", "jiu", "wuxie"].includes(a.name) ?
                                get.value(a) + 1 :
                                get.value(a)
                            let valB = ["tao", "shan", "jiu", "wuxie"].includes(b.name) ?
                                get.value(b) + 1 :
                                get.value(b)
                            if (player.getExpansions("gbduoluo_r").some(card => get.suit(card) == get.suit(a))) valA += 1
                            if (player.getExpansions("gbduoluo_r").some(card => get.suit(card) == get.suit(b))) valB += 1
                            return valA - valB
                        }).slice(0, dis ? dis : player.countCards("h") / 2).includes(card)
                    }
                    if ((!["tao", "shan", "jiu", "wuxie", "sha"].includes(card.name) || !player.hasValueTarget(card)) && get.value(card) < 6) return get.value(card)
                    return -get.value(card)
                })
                .forResult()
            if (result && result.bool) {
                let suit = result.cards.reduce((suit, card) => suit.add(card.suit), [])
                let suitOld = player.getExpansions("gbduoluo_r").reduce((suit, card) => suit.add(card.suit), [])
                let num = suit.filter(s => !suitOld.includes(s)).length
                player.addToExpansion(result.cards, "giveAuto", "bySelf").gaintag.add("gbduoluo_r")
                player.draw(num)
            }
        },
    },
    gbmoshe: {
        audio: false,
        zhuanhuanji: true,
        mark: true,
        marktext: "☯",
        intro: {
            content(storage, player, skill) {
                let str = !player.storage.gbmoshe ?
                    `转换技，一名角色的结束阶段，若你有『魔』，你可以将任意张『魔』置入弃牌堆，若此法置入弃牌堆的牌点数之和为14，你对一名其他角色造成1点雷属性伤害，然后你摸一张牌。` :
                    `转换技，一名角色的结束阶段，若你有『魔』，你可以将任意张『魔』置入弃牌堆，若此法置入弃牌堆的牌花色均不相同且数量为四，你对一名其他角色造成2点伤害。`;
                str += "</br>每轮结束时，若本轮你发动过〖魔射〗且未以此法杀死其他角色，你失去X点体力（X为本轮你发动〖魔射〗的次数-1）。"
                return str;
            },
        },
        trigger: {
            global: "phaseJieshuBegin"
        },
        filter(event, player) {
            return player.hasExpansions("gbduoluo_r")
        },
        async cost(event, trigger, player) {
            let result = await player.chooseButton([get.prompt("gbmoshe"), "选择任意张『魔』", [player.getExpansions("gbduoluo_r"), "card"]])
                .set("selectButton", [1, Infinity])
                .set("ai", (button) => {
                    let player = _status.event.player
                    let all = _status.event.dialog.buttons
                    let suit = all.reduce((suit, button) => suit.add(get.suit(button.link, player)), [])
                    const dp = Array(15).fill().map(() => []);
                    dp[0] = [
                        []
                    ];
                    for (const btn of all) {
                        let num = btn.link.number
                        for (let sum = 14; sum >= num; sum--) {
                            if (dp[sum - num].length > 0) {
                                for (const combo of dp[sum - num]) {
                                    dp[sum].push([...combo, btn]);
                                }
                            }
                        }
                    }
                    if (!player.storage.gbmoshe) {
                        if (dp[14].length > 0) return dp[14][0].includes(button)
                        if (suit > 3 && all.length > 4) {
                            let cardSuit = {
                                heart: 0,
                                club: 0,
                                diamond: 0,
                                spade: 0
                            }
                            all.forEach(button => cardSuit[get.suit(button.link, player)] += 1)
                            return all.filter(button => cardSuit[get.suit(button.link, player)] > 1).randomGet() == button
                        }
                        return false
                    } else {
                        let suit2 = all.remove(dp[14].flat()).reduce((suit, button) => suit.add(get.suit(button.link, player)), [])
                        if (all.remove(dp[14].flat()).length > 0 && suit2.length > 3) {
                            return all.remove(dp[14].flat()).includes(button) && !ui.selected.buttons.reduce((suit, button) => suit.add(get.suit(button.link, player)), []).includes(get.suit(button.link))
                        } else if (suit > 3) {
                            return !ui.selected.buttons.reduce((suit, button) => suit.add(get.suit(button.link, player)), []).includes(get.suit(button.link))
                        }
                        return false
                    }
                })
                .forResult()
            if (result && result.bool) {
                event.result = {
                    bool: true,
                    cards: result.links
                }
            }
        },
        async content(event, trigger, player) {
            player.loseToDiscardpile(event.cards)
            if (!player.storage.gbmoshe) {
                if (event.cards.reduce((num, card) => num += card.number, 0) == 14) {
                    let result = await player.chooseTarget("魔射", "选择一名其他角色", true)
                        .set("filterTarget", lib.filter.notMe)
                        .set("ai", (target) => {
                            let player = _status.event.player
                            return get.effect(target, {
                                name: "thunderdamage"
                            }, player, player)
                        })
                        .forResult()
                    if (result) {
                        result.targets[0].when(["dieAfter", "damageAfter"])
                            .filter((event, player, name) => {
                                if (name == "damageAfter") return true
                                return event.getParent(3).name == "gbmoshe"
                            })
                            .assign({
                                forceDie: true,
                            })
                            .then(() => {
                                if (event.triggername != "damageAfter") sourcex.removeSkill("gbmoshe_effect")
                            })
                            .vars({
                                sourcex: player
                            })
                        result.targets[0].damage("thunder")
                        player.draw()
                    }
                }
            } else if (event.cards.reduce((suit, card) => suit.add(get.suit(card)), []).length == 4) {
                let suit = []
                let bool = true
                for (let card of event.cards) {
                    if (suit.includes(card.suit)) bool = false
                    suit.add(card.suit)
                }
                if (bool) {
                    let result = await player.chooseTarget("魔射", "选择一名其他角色", true)
                        .set("filterTarget", lib.filter.notMe)
                        .set("ai", (target) => {
                            let player = _status.event.player
                            return get.damageEffect(target, player, player)
                        })
                        .forResult()
                    if (result) {
                        result.targets[0].when(["dieAfter", "damageAfter"])
                            .filter((event, player, name) => {
                                if (name == "damageAfter") return true
                                return event.getParent(3).name == "gbmoshe"
                            })
                            .assign({
                                forceDie: true,
                            })
                            .then(() => {
                                if (event.triggername != "damageAfter") sourcex.removeSkill("gbmoshe_effect")
                            })
                            .vars({
                                sourcex: player
                            })
                        result.targets[0].damage(2)
                    }
                }
            }
            player.addMark("gbmoshe_effect", 1)
            player.changeZhuanhuanji("gbmoshe")
        },
        group: ["gbmoshe_round", "gbmoshe_effect"],
        subSkill: {
            round: {
                audio: false,
                forced: true,
                locked: false,
                trigger: {
                    global: "roundStart"
                },
                async content(event, trigger, player) {
                    if (player.hasSkill("gbmoshe_effect")) {
                        player.loseHp(player.countMark("gbmoshe_effect") - 1)
                        player.removeSkill("gbmoshe_effect")
                    }
                    player.addSkill("gbmoshe_effect")
                }
            },
            effect: {
                onremove: true,
            }

        }
    },
    // 白金燐子
    gbtici: {
        audio: false,
        trigger: {
            player: "gainAfter"
        },
        forced: true,
        charlotte: true,
        mark: true,
        marktext: "词",
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        filter(event, player) {
            return event.getParent().name != "gbtici_effect"
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("he", true, [1, Infinity], "题词", "将任意张牌置于武将牌上，称为『词』")
                .set("ai", card => {
                    let player = _status.event.player,
                        dis = player.needsToDiscard(0, (i, player) => !player.canIgnoreHandcard(i) && !player.hasValueTarget(i)) || 1
                    if (get.position(card) == "e") {
                        if (card.name == "baiyin" && player.isDamaged()) return 10
                    }
                    if (_status.currentPhase == player) {
                        return player.getCards("he").sort((a, b) => {
                            let valA = ["tao", "sha", "jiu", "wuxie"].includes(a.name) ?
                                get.value(a) + 1 :
                                get.value(a)
                            let valB = ["tao", "sha", "jiu", "wuxie"].includes(b.name) ?
                                get.value(b) + 1 :
                                get.value(b)
                            return valA - valB
                        }).slice(0, dis).includes(card)
                    }
                    if ((!["tao", "sha", "jiu", "wuxie", "shan"].includes(card.name) || !player.hasValueTarget(card)) && get.value(card) < 6) return get.value(card)
                    return -get.value(card)
                })
                .forResult()
            if (result && result.bool) {
                player.addToExpansion(result.cards, "giveAuto", "bySelf").gaintag.add("gbtici")
            }
        },
        group: "gbtici_effect",
        subSkill: {
            effect: {
                audio: false,
                charlotte: true,
                trigger: {
                    global: "phaseBegin"
                },
                filter(event, player) {
                    return player.hasExpansions("gbtici")
                },
                check(event, player) {
                    if (get.attitude(player, event.player) > 0) return true
                    if (player.countCards("h") < player.maxHp) {
                        if (player.getExpansions("gbtici").some(card => event.player.hasValueTarget(card) && get.type(card) != "equip")) return false
                        return true
                    }
                },
                logTarget: "player",
                async content(event, trigger, player) {
                    let result = await trigger.player.chooseButton(["题词", [player.getExpansions("gbtici"), "card"]], true)
                        .set("ai", (button) => get.value(button.link))
                        .forResult()
                    trigger.player.gain(result.links, "giveAuto")
                    player.when({
                        global: "phaseEnd"
                    })
                        .then(() => {
                            if (get.position(cardx) != "d") player.drawTo(player.maxHp).name = "gbtici_effect"
                        })
                        .vars({
                            cardx: result.links[0]
                        })
                }
            },
            ai: {
                expose: 0.1
            }
        }
    },
    gbbuya: {
        audio: false,
        trigger: {
            player: "phaseJieshuBegin"
        },
        filter(event, player) {
            return player.hasExpansions("gbtici")
        },
        popup: false,
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget("补亚", "选择至多X名角色", [1, player.countExpansions("gbtici")])
                .set("ai", (target) => {
                    let player = _status.event.player
                    return get.attitude(player, target) > 0
                })
                .forResult()
        },
        async content(event, trigger, player) {
            player.logSkill(event.name, event.targets)
            event.targets.forEach(target => target.draw())
            player.draw(event.targets.reduce((num, target) => num += target.hp < player.hp, 0))
        }
    },

    gbbomu: {
        audio: false,
        forced: true,
        trigger: {
            player: "gainAfter"
        },
        charlotte: true,
        filter(event, player) {
            return event.getParent(2).name != "gbbomu_effect"
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("薄暮", "请选择至少一张手牌，使其增加「暮」标记", [1, Infinity], "h", true)
                .set("filterCard", card => !card.hasGaintag("gbbomu_tag"))
                .set("ai", card => {
                    let player = _status.event.player,
                        dis = player.needsToDiscard(0, (i, player) => !player.canIgnoreHandcard(i))
                    if (_status.currentPhase == player) {
                        if (player.hasSkill("gbkongtan") && !player.isTempBanned("gbkongtan") && player.countSkill("gbkongtan") < 3) {
                            if (!player.countSkill("gbkongtan")) return player.getUseValue(card) <= 0 || !player.hasValueTarget(card)
                            if (player.getStorage("gbkongtan_temp").includes("选项一")) return player.getUseValue(card) <= 0 || !player.hasValueTarget(card)
                            else {
                                let zhu = player.isZhu2() && player.hasSkill("gbhuadao") && game.hasPlayer(p => p != player && p.group == player.group),
                                    num = Math.min(player.countMark("gbkongtan_show") + (zhu ? 1 : 0) + player.countCards("h", card => get.color(card) == "red"), 6),
                                    red = player.getCards("h", card => get.color(card) == "red").sort((a, b) => get.value(a) - get.value(b)),
                                    cards = get.cards(num, true)
                                for (let i of red) {
                                    cards.unshift(i)
                                    if (cards.slice(0, num).reduce((num, c) => num += c.isKnownBy(player) ? (get.color(c) == "red" ? 1 : 0) : 0) > (num / 2))
                                        return cards.slice(0, num).includes(card)
                                }
                                if (!player.getStorage("gbkongtan_temp").includes("选项二")) {
                                    if (!player.getStorage("gbkongtan_temp").includes("选项三")) {
                                        return player.getUseValue(card) <= 0 || !player.hasValueTarget(card)
                                    } else return get.color(card) == "black"
                                }
                            }
                        }
                        return player.getCards("h", card => !card.hasGaintag("gbbomu_tag")).sort((a, b) => {
                            const valA = ["tao", "shan", "jiu", "wuxie"].includes(a.name) ?
                                get.value(a) + 1 :
                                get.value(a) - (!player.hasValueTarget(a) ? 4 : 0);
                            const valB = ["tao", "shan", "jiu", "wuxie"].includes(b.name) ?
                                get.value(a) + 1 :
                                get.value(b) - (!player.hasValueTarget(b) ? 4 : 0);
                            return valA - valB
                        }).slice(0, dis).includes(card)
                    }
                    if (["tao", "shan", "jiu", "wuxie"].includes(card.name)) return -get.value(card)
                    return 1 - get.value(card)
                })
                .forResult()
            if (result && result.bool) {
                await player.showCards(result.cards)
                player.addGaintag(result.cards, "gbbomu_tag")
            }
        },
        group: "gbbomu_effect",
        ai: {
            combo: "gbkongtan",
        },
        subSkill: {
            effect: {
                mod: {
                    ignoredHandcard(card, player, result) {
                        if (card.hasGaintag("gbbomu_tag")) return true
                    },
                    cardEnabled2(card, player, result) {
                        if (card.hasGaintag("gbbomu_tag")) return false
                    },
                    cardDiscardable(card, player) {
                        if (card.hasGaintag("gbbomu_tag")) return false
                    },
                }
            }
        },
    },
    gbkongtan: {
        audio: false,
        enable: "phaseUse",
        usable: 3,
        filter(event, player) {
            return player.countCards("h", card => card.hasGaintag("gbbomu_tag"))
        },
        async content(event, trigger, player) {
            let cards = player.getCards("h", card => card.hasGaintag("gbbomu_tag"))
            let zhu = player.isZhu2() && player.hasSkill("gbhuadao") && game.hasPlayer(p => p != player && p.group == player.group)
            var bool = true
            await player.showCards(cards)
            player.addMark("gbkongtan_show", cards.length)
            player.addTempSkill("gbkongtan_show")
            let num = Math.min(player.countMark("gbkongtan_show") + (zhu ? 1 : 0), 6)
            while (bool) {
                let card = await player.chooseCard("空谭", "选择一张「暮」牌", true, "h")
                    .set("filterCard", card => card.hasGaintag("gbbomu_tag"))
                    .forResult()
                if (card && card.bool) {
                    let result = await player.chooseControl("牌堆顶", "牌堆底", "cancel2")
                        .set("prompt", "将此牌置于...")
                        .set("card", card.cards[0])
                        .set("ai", () => {
                            let player = _status.event.player
                            let card = _status.event.card
                            if (player.getStorage("gbkongtan_temp").includes("选项一")) {
                                if (get.value(card) >= 6) return player.hasSkill("nzry_cunmu") ? "牌堆底" : "牌堆顶"
                                else return player.hasSkill("nzry_cunmu") ? "牌堆顶" : "牌堆底"
                            } else if (get.color(card) == "red") return "牌堆顶"
                            return "牌堆底"
                        })
                        .forResult()
                    if (result.control == "cancel2") continue
                    await player.lose(card.cards, ui.cardPile, "visible")
                        .set("insert_card", result.control == "牌堆顶" ? true : false)
                    card.cards.forEach(card => card.addKnower("everyone"))
                    game.log(player, "将", card.cards, "置于了", "#y" + result.control)
                    if (!player.countCards("h", card => card.hasGaintag("gbbomu_tag"))) bool = false
                }
            }
            let target = await player.chooseTarget("空谭", "选择一名角色", true)
                .set("ai", (target) => {
                    let player = _status.event.player,
                        zhu = player.isZhu2() && player.hasSkill("gbhuadao") && game.hasPlayer(p => p != player && p.group == player.group),
                        num = Math.min(player.countMark("gbkongtan_show") + (zhu ? 1 : 0), 6),
                        cards = get.cards(num, true),
                        red = cards.reduce((num, c) => num += c.isKnownBy(player) ? (get.color(c) == "red" ? 1 : 0) : Math.round(Math.random() - 0.2), 0) > (cards.length / 2)
                    if (!player.getStorage("gbkongtan_temp").includes("选项二") || !player.getStorage("gbkongtan_temp").includes("选项三")) return get.attitude(player, target)
                    return -get.attitude(player, target)
                }).forResultTargets()
            if (target[0]) {
                let list = ["选项一", "选项二", "选项三"]
                list.removeArray(player.getStorage("gbkongtan_temp"))
                let next = await target[0].chooseControl(list)
                    .set("prompt", "空谭")
                    .set("choiceList", [`展示牌堆顶X张牌，若红色牌较多，则${get.translation(player)}对你造成1点伤害并获得所有展示牌，否则，将这些牌以原顺序放回牌堆顶`, `${get.translation(player)}将手牌数调整至X（X为其本回合展示的「暮」数量，且至多为6）`, `令${get.translation(player)}本回合获得〖寸目〗，然后摸两张牌`])
                    .set("ai", () => {
                        let player = _status.event.player,
                            source = _status.event.source,
                            zhu = player.isZhu2() && player.hasSkill("gbhuadao") && game.hasPlayer(p => p != player && p.group == player.group),
                            num = Math.min(source.countMark("gbkongtan_show") + (zhu ? 1 : 0), 6),
                            cards = get.cards(num, true),
                            red = cards.reduce((num, c) => num += c.isKnownBy(player) ? (get.color(c) == "red" ? 1 : 0) : Math.round(Math.random() - 0.2), 0) > (cards.length / 2)
                        if (get.attitude(player, source) > 0) {
                            let result = {
                                选项一: 0,
                                选项二: num - source.countCards("h"),
                                选项三: 10
                            }
                            return _status.event.controls.slice().sort((a, b) => result[b] - result[a])[0]
                        } else {
                            let result = {
                                选项一: red ? (get.effect(player, {
                                    name: "damage"
                                }, source, player) < 0 ? 0 : -num) : 0,
                                选项二: source.countCards("h") - num,
                                选项三: -3
                            }
                            return _status.event.controls.slice().sort((a, b) => result[b] - result[a])[0]
                        }
                    })
                    .set("source", player)
                    .forResult()
                switch (next.control) {
                    case "选项一":
                        let card = get.cards(num)
                        game.cardsGotoOrdering(card)
                        await player.showCards(card)
                        if (card.reduce((num, c) => num += get.color(c) == "red" ? 1 : 0, 0) > (card.length / 2)) {
                            target[0].damage()
                            player.gain(card, "giveAuto")
                        } else {
                            while (card.length) {
                                ui.cardPile.insertBefore(card.pop(), ui.cardPile.firstChild)
                            }
                        }
                        game.updateRoundNumber()
                        break
                    case "选项二":
                        if (player.countCards("h") <= num) player.drawTo(num)
                        else player.chooseToDiscard(true, player.countCards("h") - num)
                        break
                    case "选项三":
                        player.addTempSkill("nzry_cunmu")
                        player.draw(2)
                        break
                }
                game.log(target[0], "选择了", "#g【空谭】", "的", "#y" + next.control)
                player.markAuto("gbkongtan_temp", next.control)
                player.addTempSkill("gbkongtan_temp")
            }
        },
        subSkill: {
            temp: {
                audio: false,
                onremove: true,
            },
            show: {
                onremove: true,
                intro: {
                    content: "已展示#张「暮」"
                }
            }
        },
        ai: {
            order: 1,
            expose: 0.1,
            combo: "gbbomu",
            result: {
                player(player, target, card) {
                    let zhu = player.isZhu2() && player.hasSkill("gbhuadao") && game.hasPlayer(p => p != player && p.group == player.group),
                        num1 = Math.min(player.countMark("gbkongtan_show") + (zhu ? 1 : 0) + player.countCards("h", card => card.hasGaintag("gbbomu_tag")), 6),
                        num2 = player.countCards("h", card => !card.hasGaintag("gbbomu_tag")),
                        red = [...player.getCards("h", card => card.hasGaintag("gbbomu_tag") && get.color(card) == "red"), ...get.cards(num1, true)].slice(0, num1).reduce((num, c) => num += c.isKnownBy(player) ? (get.color(c) == "red" ? 1 : 0) : Math.round(Math.random()), 0) > (num1 / 2)
                    if (player.getUseValue(card) > 0 && player.hasValueTarget(card)) return 0
                    if (num1 < num2) return 0
                    if (player.getStorage("gbkongtan_temp").includes("选项二") && player.getStorage("gbkongtan_temp").includes("选项三") && !red) return 0
                    return 1
                }
            }
        }
    },
    gbhuadao: {
        audio: false,
        zhuSkill: true,
        ai: {
            combo: "gbkongtan"
        }
    },

    gbchenyang: {
        audio: false,
        forced: true,
        trigger: {
            player: "gainAfter"
        },
        charlotte: true,
        filter(event, player) {
            return event.getParent(2).name != "gbchenyang_effect"
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("尘阳", "请选择至少一张手牌，使其增加「尘」标记", [1, Infinity], "h", true)
                .set("filterCard", card => !card.hasGaintag("gbchenyang_tag"))
                .set("ai", card => {
                    let player = _status.event.player,
                        dis = player.needsToDiscard(0, (i, player) => !player.canIgnoreHandcard(i))
                    if (_status.currentPhase == player) {
                        if (ui.selected.cards.length > dis) return false
                        if (player.hasSkill("gbxinzhong") && (player.getUseValue(card) <= 0 || !player.hasValueTarget(card))) return ["tao", "shan", "jiu", "wuxie"].includes(card.name) || get.value(card) < 4
                        return -get.value(card)
                    }
                    return -get.value(card)
                })
                .forResult()
            if (result && result.bool) {
                await player.showCards(result.cards)
                player.addGaintag(result.cards, "gbchenyang_tag")
            }
        },
        ai: {
            combo: "gbxinzhong"
        },
        group: "gbchenyang_effect",
        subSkill: {
            effect: {
                audio: false,
                forced: true,
                charlotte: true,
                trigger: {
                    player: "loseAfter"
                },
                filter(event, player) {
                    for (var i in event.gaintag_map) {
                        if (event.gaintag_map[i].includes("gbchenyang_tag") && !player.countCards("h", card => card.hasGaintag("gbchenyang_tag"))) return true
                    }
                },
                async content(event, trigger, player) {
                    let num = player.countCards("h") - 6
                    if (num > 0) player.chooseToDiscard(num, true)
                    else player.drawTo(6)
                },
                mod: {
                    cardEnabled2(card, player, result) {
                        if (card.hasGaintag("gbchenyang_tag")) return false
                    },
                    cardDiscardable(card, player) {
                        if (card.hasGaintag("gbchenyang_tag")) return false
                    }
                }
            }
        },
    },
    gbxinzhong: {
        audio: false,
        trigger: {
            global: "phaseBegin"
        },
        filter(event, player) {
            return event.player != player && player.countCards("h") > 0;
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard("心钟", "请选择任意张手牌", [1, Infinity], "h")
                .set("ai", (card) => {
                    let player = _status.event.player
                    let target = _status.currentPhase
                    if (get.attitude(player, target) < 0) {
                        if (player.countCards("h", card => card.hasGaintag("gbchenyang_tag"))) {
                            if (player.countCards("h", card => card.hasGaintag("gbchenyang_tag"))) {
                                let cards = player.getCards("h", card => card.hasGaintag("gbchenyang_tag") && ["shan", "wuxie", "tao", "jiu"].includes(card.name)).sort((a, b) => get.value(a) - get.value(b)).slice(0, 6)
                                return cards.includes(card)
                            }
                        } else {
                            if (ui.selected.cards.length > 0) return false
                            if (["shan", "wuxie", "sha", "tao", "jiu"].includes(card.name)) return false
                            return 6 - get.value(card)
                        }
                    } else {
                        if (ui.selected.cards.length > 0) return false
                        if (target.countCards("h") >= 5) return get.value(card)
                        return false
                    }
                })
                .forResult();
        },
        async content(event, trigger, player) {
            await player.lose(event.cards, ui.cardPile).set("insert_card", true)
            game.log(player, "将", get.cnNumber(event.cards.length), "张牌置于了", "#y牌堆顶")
            let target = trigger.player
            let result = await target.chooseControlList("心钟", [`令${get.translation(player)}于本回合内获得〖寸目〗，然后其将所有的「尘」牌交给你，以此法获得的牌不能使用、打出或弃置，直到本轮结束`, `你于本回合内获得〖寸目〗，然后交给${get.translation(player)}一张锦囊牌或两张非锦囊牌。`], true)
                .set("ai", () => {
                    let player = _status.event.player
                    let source = _status.event.source
                    if (get.attitude(player, source) < 0) {
                        let num = source.countCards("h") - 6
                        if (source.getCards("h", card => card.isKnownBy(player)).some(card => card.hasGaintag("gbchenyang_tag"))) return 1
                        if (num > 0 && get.cards(num, true).some(card => card.isKnownBy(player) && (["shan", "tao", "jiu", "wuxie"].includes(card.name)) || get.value(card) >= 6)) return 0
                        if (Math.random() > 0.6) return 1
                        return 0
                    }
                    if (player.countCards("h") >= 5) return 1
                    if (!source.countSkill("gbchenyang_effect") && player.getHandcardLimit() > 3 && source.countCards("h") <= 2) return 0
                    return 0
                })
                .set("source", player)
                .forResult()
            switch (result.control) {
                case "选项一":
                    player.addTempSkill("nzry_cunmu")
                    player.give(player.getCards("h", card => card.hasGaintag("gbchenyang_tag")), target, "giveAuto").gaintag.add("gbchenyang_tag")
                    target.addSkill("gbxinzhong_temp")
                    break
                case "选项二":
                    target.addTempSkill("nzry_cunmu")
                    let next = await target.chooseCard("心钟", "选择一张锦囊牌或两张非锦囊牌", "he", true)
                        .set("selectCard", () => get.type(ui.selected.cards[0], "trick") == "trick" ? 1 : _status.event.player.countCards("he") < 2 ? 1 : 2)
                        .set("filterCard", card => ui.selected.cards.length > 0 ? get.type(card, "trick") != "trick" : true)
                        .set("complexCard", true)
                        .forResult()
                    target.give(next.cards, player, "giveAuto")
                    break
            }
            game.log(target, "选择了", "#g【心钟】", "的", "#y" + result.control)
        },
        subSkill: {
            temp: {
                audio: false,
                forced: true,
                trigger: {
                    global: "roundStart"
                },
                mod: {
                    cardEnabled2(card, player, result) {
                        if (card.hasGaintag("gbchenyang_tag")) return false
                    },
                    cardDiscardable(card, player) {
                        if (card.hasGaintag("gbchenyang_tag")) return false
                    }
                },
                async content(event, trigger, player) {
                    let cards = player.getCards("h", card => card.hasGaintag("gbchenyang_tag"))
                    if (cards.length) player.removeGaintag("gbchenyang_tag", cards)
                    player.removeSkill(event.name)
                }
            }
        }
    },

    gbhongri: {
        audio: false,
        forced: true,
        trigger: {
            player: "gainAfter"
        },
        charlotte: true,
        filter(event, player) {
            return event.getParent(2).name != "gbhongri_effect"
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("红日", "请选择至少一张手牌，使其增加「日」标记", [1, Infinity], "h", true)
                .set("filterCard", card => !card.hasGaintag("gbhongri_tag"))
                .set("ai", card => {
                    let player = _status.event.player
                    if (!["sha", "shan"].includes(card.name)) return true
                    if ([...ui.cardPile.childNodes].some(card => card.name == "wanjian")) return card != player.getCards("h", card => !card.hasGaintag("gbhongri_tag") && card.name == "shan")[0]
                    if ([...ui.cardPile.childNodes].some(card => card.name == "juedou" || card.name == "nanman")) return card != player.getCards("h", card => !card.hasGaintag("gbhongri_tag") && card.name == "sha")[0]
                })
                .forResult()
            if (result && result.bool) {
                await player.showCards(result.cards)
                player.addGaintag(result.cards, "gbhongri_tag")
            }
        },
        group: "gbhongri_effect",
        subSkill: {
            effect: {
                audio: false,
                trigger: {
                    player: "loseAfter"
                },
                filter(event, player) {
                    for (var i in event.gaintag_map) {
                        if (event.gaintag_map[i].includes("gbhongri_tag")) return true
                    }
                },
                usable: 3,
                check(event, player) {
                    return game.hasPlayer(p => get.attitude(player, p) > 0 && p != player)
                },
                prompt2: "展示牌堆顶的一张牌并交给一名其他角色",
                async content(event, trigger, player) {
                    let card = get.cards(1, true)
                    await player.showCards(card)
                    let result = await player.chooseTarget("红日", "将此牌交给一名其他角色", true)
                        .set("filterTarget", lib.filter.notMe)
                        .set("ai", target => {
                            let player = _status.event.player
                            return get.attitude(player, target)
                        })
                        .forResult()
                    if (result && result.bool) player.give(card, result.targets[0], "giveAuto")
                },
                mod: {
                    cardRespondable(card, player, result) {
                        if (card.hasGaintag("gbhongri_tag")) return false
                    },
                    cardEnabled2(card, player, result) {
                        if (_status.event.name == "chooseToRespond" && card.hasGaintag("gbhongri_tag")) return false
                    }
                },
            }
        },
    },

    gbyuanzhen: {
        audio: false,
        charlotte: true,
        trigger: {
            global: "phaseUseBegin"
        },
        filter(event, player) {
            return event.player != player && player.inRange(event.player) && player.countCards("h", card => card.hasGaintag("gbhongri_tag"))
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard("圆阵", "请选择任意张「日」牌", [1, Infinity], true)
                .set("ai", (card) => {
                    let player = _status.event.player
                    let target = _status.currentPhase
                    let cards = player.getCards("h", card => card.hasGaintag("gbhongri_tag"))
                    if (get.attitude(player, target) < 0 && target.mayHaveSha()) {
                        if (player.hasShan() || player.hp > 3 || get.effect(player, {
                            name: "sha"
                        }, target, player) > 0) return cards.sort((a, b) => get.value(a) - get.value(b))[0] == card
                        return false
                    } else {
                        if (ui.selected.cards.length < Math.random() * 3 + 2) return false
                        return cards.sort((a, b) => get.value(a) - get.value(b)).slice(0, game.countPlayer(p => get.attitude(player, p) > 0)).includes(card)
                    }
                })
                .set("filterCard", card => card.hasGaintag("gbhongri_tag"))
                .forResult()
        },
        async content(event, trigger, player) {
            let num = event.cards.length
            await player.lose(event.cards, ui.cardPile).set("insert_card", true)
            game.log(player, "将", get.cnNumber(num), "张牌置于了", "#y牌堆顶")
            let target = trigger.player
            let targets = await player.chooseTarget("圆阵", "请选择" + get.cnNumber(num) + "名角色与" + get.translation(target) + "议事", Math.min(num, game.countPlayer(p => p != target)), true)
                .set("ai", target => {
                    let player = _status.event.player
                    let num = _status.event.selectTarget[1]
                    if (num == 1) return player == target
                    if (get.attitude(player, target) > 0) return 10
                    return 1
                })
                .set("filterTarget", (card, player, tar) => tar != get.event("targetx"))
                .set("targetx", target)
                .forResultTargets()
            if (targets.length > 0) {
                target.chooseToDebate(targets.concat(target))
                    .set("callback", () => {
                        const {
                            bool,
                            opinion,
                            black,
                            red,
                            others,
                            targets
                        } = event.debateResult;
                        let player = event.getParent(2).player
                        if (bool) {
                            switch (opinion) {
                                case "red":
                                    for (target of targets.sortBySeat()) target.draw()
                                    break
                                case "black":
                                    for (target of targets.sortBySeat()) {
                                        if (target == player) continue
                                        target.useCard({
                                            name: "sha"
                                        }, player)
                                    }
                                    break
                                default:
                                    let cards = black.reduce((card, evt) => card.add(evt[1]), []).concat(red.reduce((card, evt) => card.add(evt[1]), []), others.reduce((card, evt) => card.add(evt[1]), []))
                                    player.gain(cards, "giveAuto")
                                    break
                            }
                        }
                    })
                    .set("ai", (card) => {
                        let player = _status.event.player
                        let source = _status.event.getParent(3).player
                        if (get.attitude(player, source) > 0) return get.color(card) == "red"
                        else return get.color(card) == "black"
                    })
            }
        },
    },

    gbfeishou: {
        audio: false,
        forced: true,
        trigger: {
            player: "gainAfter"
        },
        charlotte: true,
        filter(event, player) {
            return event.getParent(2).name != "gbfeishou_effect"
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("绯手", "请选择至少一张手牌，使其增加「绯」标记", [1, Infinity], "h", true)
                .set("filterCard", card => !card.hasGaintag("gbfeishou_tag"))
                .set("ai", card => {
                    let player = _status.event.player
                    if (!["sha", "shan"].includes(card.name)) return true
                    if ([...ui.cardPile.childNodes].some(card => card.name == "wanjian")) return card != player.getCards("h", card => !card.hasGaintag("gbhongri_tag") && card.name == "shan")[0]
                    if ([...ui.cardPile.childNodes].some(card => card.name == "juedou" || card.name == "nanman")) return card != player.getCards("h", card => !card.hasGaintag("gbhongri_tag") && card.name == "sha")[0]
                })
                .forResult()
            if (result && result.bool) {
                await player.showCards(result.cards)
                player.addGaintag(result.cards, "gbfeishou_tag")
            }
        },
        group: "gbfeishou_effect",
        subSkill: {
            effect: {
                audio: false,
                usable: 1,
                trigger: {
                    player: "loseAfter"
                },
                prompt2: "从牌堆底摸一张牌",
                check(event, player) {
                    return get.effect(player, {
                        name: "draw"
                    }, player, player) > 0
                },
                filter(event, player) {
                    for (var i in event.gaintag_map) {
                        if (event.gaintag_map[i].includes("gbfeishou_tag")) return true
                    }
                },
                async content(event, trigger, player) {
                    player.draw("bottom")
                },
                mod: {
                    cardRespondable(card, player, result) {
                        if (card.hasGaintag("gbfeishou_tag")) return false
                    },
                    cardEnabled2(card, player, result) {
                        if (_status.event.name == "chooseToRespond" && card.hasGaintag("gbfeishou_tag")) return false
                    }
                }
            }
        },
    },
    gbbafeng: {
        audio: false,
        trigger: {
            global: "phaseBegin"
        },
        logTarget: "player",
        async cost(event, trigger, player) {
            let list = []
            if (trigger.player != player && player.countCards("hs", card => card.name == "sha" || get.type(card) == "trick")) list.push("选项一")
            list.push("选项二")
            list.push("cancel2")
            let result = await player.chooseControl(list)
                .set("choiceList", [`对${get.translation(trigger.player)}使用一张【杀】或普通锦囊牌，若此牌造成伤害，你获得其一张牌`, `摸一张牌并将一张「绯」置于牌堆顶，${get.translation(trigger.player)}本回合获得〖马术〗`])
                .set("prompt", "巴锋")
                .set("ai", () => {
                    let player = _status.event.player
                    let target = _status.currentPhase
                    if (get.attitude(player, target) > 0) return "选项二"
                    if (target.countCards("j") && !target.hasWuxie()) return "选项二"
                    for (let name of lib.inpile) {
                        if (!player.canUse(name, target, true, true)) continue
                        if (get.type(name) == "trick") {
                            if (player.hasCard(name, "hs") && get.effect(target, {
                                name: name
                            }, player, player) > 0) return "选项一"
                        }
                        if (name == "sha" && player.hasCard("sha", "hs") && !target.mayHaveShan() && get.effect(target, {
                            name: name
                        }, player, player) > 0) return "选项一"
                    }
                    return "选项二"
                })
                .forResult()
            if (result.control != "cancel2")
                event.result = {
                    bool: true,
                    cost_data: result.control
                }
        },
        async content(event, trigger, player) {
            let target = trigger.player
            game.log(target, "选择了", "#g【巴锋】", "的", "#y" + event.cost_data)
            switch (event.cost_data) {
                case "选项一":
                    let next = await player.chooseCard("巴锋", `对${get.translation(trigger.player)}使用一张【杀】或普通锦囊牌`, "hs", true)
                        .set("target", trigger.player)
                        .set("filterCard", card => {
                            if (card.name == "sha" || get.type(card) == "trick") return player.canUse(card, target, true, true)
                        })
                        .set("ai", (card) => {
                            let player = _status.event.player
                            let target = _status.currentPhase
                            return get.effect(target, card, player, player)
                        })
                        .forResultCards()
                    let evt = player.useCard(next, target)
                    player.when("useCardAfter")
                        .filter((event, player) => {
                            return event.card == evt.card
                        })
                        .then(() => {
                            if (player.hasHistory("sourceDamage", evt => evt.card == trigger.card)) {
                                player.gainPlayerCard("he", trigger.targets[0], true)
                            }
                        })
                    break
                case "选项二":
                    player.draw()
                    let result = await player.chooseCard("巴锋", `请选择一张「绯」牌`, true)
                        .set("filterCard", card => card.hasGaintag("gbfeishou_tag"))
                        .set("ai", (card) => {
                            let player = _status.event.player
                            let target = _status.currentPhase
                            let att = get.sgn(get.attitude(player, target))
                            if (target.countCards("j") && !target.hasWuxie()) {
                                var judge = get.judge(target.getCards("j")[0])
                                return player.getCards("h", card => card.hasGaintag("gbfeishou_tag")).sort((a, b) => (judge(b) - judge(a)) * att)[0] == card
                            } else {
                                return player.getCards("h", card => card.hasGaintag("gbfeishou_tag")).sort((a, b) => (get.value(b, target) - get.value(a, target)) * att)[0] == card
                            }
                        })
                        .forResult()
                    await player.lose(result.cards, ui.cardPile).set("insert_card", true)
                    game.log(player, "将", get.cnNumber(result.cards.length), "张牌置于了", "#y牌堆顶")
                    target.addTempSkill("mashu")
                    break
            }
        },
    },

    gbfanzhi: {
        audio: false,
        forced: true,
        trigger: {
            player: "gainAfter"
        },
        charlotte: true,
        filter(event, player) {
            return event.getParent(2).name != "gbfanzhi_effect"
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("绯手", "请选择至少一张手牌，使其增加「志」标记", [1, Infinity], "h", true)
                .set("filterCard", card => !card.hasGaintag("gbfanzhi_tag"))
                .set("ai", card => {
                    let player = _status.event.player
                    if (!["sha", "shan"].includes(card.name)) return true
                    if ([...ui.cardPile.childNodes].some(card => card.name == "wanjian")) return card != player.getCards("h", card => !card.hasGaintag("gbhongri_tag") && card.name == "shan")[0]
                    if ([...ui.cardPile.childNodes].some(card => card.name == "juedou" || card.name == "nanman")) return card != player.getCards("h", card => !card.hasGaintag("gbhongri_tag") && card.name == "sha")[0]
                })
                .forResult()
            if (result && result.bool) {
                await player.showCards(result.cards)
                player.addGaintag(result.cards, "gbfanzhi_tag")
            }
        },
        group: "gbfanzhi_effect",
        subSkill: {
            effect: {
                audio: false,
                usable: 1,
                trigger: {
                    player: "loseAfter"
                },
                check(event, player) {
                    return player.hp > 2
                },
                prompt2: "失去1点体力并摸三张牌",
                filter(event, player) {
                    for (var i in event.gaintag_map) {
                        if (event.gaintag_map[i].includes("gbfanzhi_tag")) return true
                    }
                },
                async content(event, trigger, player) {
                    player.loseHp()
                    player.draw(3)
                },
                mod: {
                    cardRespondable(card, player, result) {
                        if (card.hasGaintag("gbfanzhi_tag")) return false
                    },
                    cardEnabled2(card, player, result) {
                        if (_status.event.name == "chooseToRespond" && card.hasGaintag("gbfanzhi_tag")) return false
                    }
                }
            }
        },
    },

    gbcigu: {
        audio: false,
        trigger: {
            global: "phaseJudgeBegin"
        },
        zhuanhuanji: true,
        mark: true,
        marktext: "☯",
        intro: {
            content(storage, player, skill) {
                let str = !player.storage.gbcigu ?
                    `转换技，一名角色的判定阶段开始时，你可以展示任意张「志」，观看牌堆顶的X张牌，并获得其中任意张牌，然后将等量张手牌依次置入牌堆顶（X为你的展示牌数，且至多为4）。` :
                    `转换技，一名角色的判定阶段开始时，你可以展示任意张「志」，展示牌堆顶X张牌，并令一名角色获得其中与你展示牌点数相同的牌，然后将剩余的牌以任意顺序置入牌堆顶或牌堆底（X为你的展示牌数，且至多为4）。`;
                return str;
            },
        },
        filter(event, player) {
            return player.countCards("h", card => card.hasGaintag("gbfanzhi_tag"))
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard("茨菇", "请选择任意张「志」牌", [1, Infinity], true)
                .set("ai", (card) => {
                    let player = _status.event.player
                    if (ui.selected.cards.length >= 4) return false
                    if (card.hasGaintag("gbfanzhi_tag")) return true
                })
                .set("filterCard", card => card.hasGaintag("gbfanzhi_tag"))
                .forResult()
        },
        async content(event, trigger, player) {
            await player.showCards(event.cards)
            let num = player.maxHp
            var cards = get.cards(num)
            game.cardsGotoOrdering(cards)
            if (!player.storage.gbcigu) {
                let result = await player.chooseButton(["茨菇", "获得其中的任意张牌", cards], [1, Infinity])
                    .set("ai", (button) => get.value(button.link))
                    .forResult()
                if (result && result.bool) {
                    player.gain(result.links, "giveAuto")
                    for (var i = 0; i < result.links.length; i++) {
                        if (!player.countCards("h")) continue
                        let next = await player.chooseCard("茨菇", `请选择一张手牌，将其置于牌堆顶`, true)
                            .set("num", result.links.length - i)
                            .set("ai", (card) => {
                                var player = _status.event.player
                                var target = _status.currentPhase
                                var att = get.sgn(get.attitude(player, target))
                                let cards = []
                                let num = get.event("num")
                                if (target.countCards("j") && !target.hasWuxie()) {
                                    for (var i = 0; i < target.getCards("j").length; i++) {
                                        var judge = get.judge(target.getCards("j")[i])
                                        cards.unshift(player.getCards("h").sort((a, b) => (judge(b) - judge(a)) * att)[0])
                                    }
                                    if (num - target.getCards("j").length > 0) return player.getCards("h").sort((a, b) => (get.value(b) - get.value(a)) * att).removeArray(cards).slice(0, num - target.getCards("j").length)[0] == card
                                    return cards[0] == card
                                }
                            })
                            .forResult()
                        await player.lose(next.cards, ui.cardPile).set("insert_card", true)
                    }
                    game.log(player, "将", get.cnNumber(i), "张牌置于了", "#y牌堆顶")
                }
            } else {
                player.showCards(cards)
                let card = cards.filter(card => event.cards.some(c => c.number == card.number))
                if (card.length > 0) {
                    let next = await player.chooseTarget("茨菇", `请选择一名角色`, true)
                        .set("ai", target => {
                            let player = _status.event.player
                            return get.attitude(player, target)
                        })
                        .forResult()
                    next.targets[0].gain(card, "giveAuto")
                    cards = cards.filter(c => !card.includes(c))
                }
                let result = await player.chooseToMove("茨菇", true)
                    .set("list", [
                        ["牌堆顶", cards],
                        ["牌堆底"]
                    ])
                    .set("processAI", function (list) {
                        var cards = list[0][1],
                            player = _status.event.player
                        var target = _status.currentPhase
                        var att = get.sgn(get.attitude(player, target));
                        var top = [];
                        var judges = target.getCards("j");
                        var stopped = false;
                        if (player != target || !target.hasWuxie()) {
                            for (var i = 0; i < judges.length; i++) {
                                var judge = get.judge(judges[i]);
                                cards.sort(function (a, b) {
                                    return (judge(b) - judge(a)) * att;
                                });
                                if (judge(cards[0]) * att < 0) {
                                    stopped = true;
                                    break;
                                } else {
                                    top.unshift(cards.shift());
                                }
                            }
                        }
                        var bottom;
                        if (!stopped) {
                            cards.sort(function (a, b) {
                                return (get.value(b, player) - get.value(a, player)) * att;
                            });
                            while (cards.length) {
                                if (get.value(cards[0], player) <= 5 == att > 0) break;
                                top.unshift(cards.shift());
                            }
                        }
                        bottom = cards;
                        return [top, bottom]
                    })
                    .forResult()
                var top = result.moved[0]
                var bottom = result.moved[1]
                top.reverse();
                for (var i = 0; i < top.length; i++) {
                    ui.cardPile.insertBefore(top[i], ui.cardPile.firstChild);
                }
                for (i = 0; i < bottom.length; i++) {
                    ui.cardPile.appendChild(bottom[i]);
                }
                player.popup(get.cnNumber(top.length) + "上" + get.cnNumber(bottom.length) + "下");
                game.log(player, "将" + get.cnNumber(top.length) + "张牌置于#y牌堆顶");
            }
            player.changeZhuanhuanji("gbcigu")
        },
    },
}
export default skills;