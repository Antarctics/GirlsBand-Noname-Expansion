import { lib, game, ui, get, ai, _status } from "../../../noname.js";
/** @type { importCharacterConfig['skill'] } */
const skills = {
    // 丸山彩
    gbwuyin: {
        audio: false,
        enable: "phaseUse",
        limited: true,
        animationColor: "gbpastel",
        filter(event, player) {
            return player.getStorage("gbwuyin_used").length < 5;
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name)
            let list = []
            for (let i = 1; i <= 5; i++) {
                let option = "选项" + get.cnNumber(i, true);
                if (!player.getStorage("gbwuyin_used").includes(option)) {
                    list.push(option);
                }
            }
            let result = await player.chooseControl(list)
                .set("prompt", "五音")
                .set("choiceList", [
                    "当你使用牌时，若你于此阶段使用牌的点数为严格递增，你摸一张牌",
                    "当你使用牌时，若此牌点数小于你使用的上一张牌，你可以重铸一名角色的一张牌",
                    "当你使用普通锦囊牌时，可以为此牌额外增加两名目标",
                    "当你对其他角色造成伤害时，你可以防止此伤害并获得其一张牌",
                    "摸三张牌然后弃置X张牌（X为你本回合〖添彩〗发动的次数）"
                ])
                .set("ai", () => {
                    let player = get.player()
                    let used = player.getHistory("useCard", evt => evt.isPhaseUsing(player))
                    let control = {
                        选项一: player.getCards("hs", card => player.hasValueTarget(card)).map(card => card.number).sort((a, b) => a - b).filter((n, i, a) => i === 0 || n !== a[i - 1]) > 1 && (used.every((evt, i) => i == 0 || evt.card.number > used[i - 1].card.number) || used.length == 0) ? 9 : 0,
                        选项二: player.getCards("hs", card => player.hasValueTarget(card)).map(card => card.number).sort((a, b) => b - a).filter((n, i, a) => i === 0 || n !== a[i - 1]) > 1 ? 8 : 0,
                        选项三: player.getCards("hs", card => get.name(card) == "sha" || get.type(card) == "trick").some(card => game.countPlayer(tar => player.canUse(card, tar, true, true) && get.effect(tar, card, player, player) > 0) > 0) ? 7 : 0,
                        选项四: player.countCards("hs", card => get.tag(card, "damage")) > 1 ? (Math.random() > 0.6 ? 2 : 0) : 0,
                        选项五: player.countSkill("gbtiancai") < 3 ? 10 : 0
                    }
                    return get.event().controls.sort((a, b) => control[b] - control[a])[0]
                })
                .forResult();
            player.markAuto("gbwuyin_used", result.control);
            player.addTempSkill("gbwuyin_used")
            game.log(player, "选择了", "#g【五音】", "的", "#y" + result.control)
            switch (result.control) {
                case "选项一":
                    player.addTempSkill("gbwuyin_1")
                    break;
                case "选项二":
                    player.addTempSkill("gbwuyin_2")
                    break;
                case "选项三":
                    player.addTempSkill("gbwuyin_3")
                    break;
                case "选项四":
                    player.addTempSkill("gbwuyin_4")
                    break;
                case "选项五":
                    let count = player.countSkill("gbtiancai") + 1
                    const { targets: [target] } = await player.chooseTarget("五音⑤：选择一名角色摸三张牌并弃置" + get.cnNumber(count) + "张牌", true).set("ai", target => {
                        const player = get.player()
                        const num = player.countSkill("gbtiancai") + 1
                        if (num > 3) return -get.attitude(player, target)
                        return get.attitude(player, target)
                    }).forResult()
                    await target.draw(3)
                    if (count > 0) target.chooseToDiscard("he", true, count).set("ai", (card) => 6 - get.value(card))
                    break
            }
        },
        ai: {
            threaten: 1,
            order(name, player) {
                let list = []
                for (let i = 1; i <= 5; i++) {
                    let option = "选项" + get.cnNumber(i, true);
                    if (!player.getStorage("gbwuyin_used").includes(option)) {
                        if (option == "选项五") {
                            let count = player.countSkill("gbtiancai")
                            if (player.countCards("h") > count) list.push(option);
                        } else {
                            list.push(option);
                        }
                    }
                }
                let used = player.getHistory("useCard", evt => evt.isPhaseUsing(player))
                let control = {
                    选项一: player.getCards("hs", card => player.hasValueTarget(card)).map(card => card.number).sort((a, b) => a - b).filter((n, i, a) => i === 0 || n !== a[i - 1]) > 1 && (used.every((evt, i) => i == 0 || evt.card.number > used[i - 1].card.number) || used.length == 0) ? 10 : 0,
                    选项二: player.getCards("hs", card => player.hasValueTarget(card)).map(card => card.number).sort((a, b) => b - a).filter((n, i, a) => i === 0 || n !== a[i - 1]) > 1 ? 10 : 0,
                    选项三: player.getCards("hs", card => get.name(card) == "sha" || get.type(card) == "trick").some(card => game.countPlayer(tar => player.canUse(card, tar, true, true) && get.effect(tar, card, player, player) > 0) > 0) ? 10 : 0,
                    选项四: player.countCards("hs", card => get.tag(card, "damage")) > 1 ? 10 : 0,
                    选项五: player.countSkill("gbtiancai") < 3 ? 10 : 0
                }
                return list.map(a => control[a]).sort((a, b) => b - a)[0]
            },
            result: {
                player(player) {
                    let used = player.getHistory("useCard", evt => evt.isPhaseUsing(player))
                    if (!player.getStorage("gbwuyin_used").includes("选项五")) return 1
                    if (!player.getStorage("gbwuyin_used").includes("选项一") && (player.getCards("hs", card => player.hasValueTarget(card)).map(card => card.number).sort((a, b) => a - b).filter((n, i, a) => i === 0 || n !== a[i - 1]) > 1 && (used.every((evt, i) => i == 0 || evt.card.number > used[i - 1].card.number) || used.length == 0))) return 1
                    if (!player.getStorage("gbwuyin_used").includes("选项二") && (player.getCards("hs", card => player.hasValueTarget(card)).map(card => card.number).sort((a, b) => b - a).filter((n, i, a) => i === 0 || n !== a[i - 1]) > 1)) return 1
                    if (!player.getStorage("gbwuyin_used").includes("选项三") && (player.getCards("hs", card => get.name(card) == "sha" || get.type(card) == "trick").some(card => game.countPlayer(tar => player.canUse(card, tar, true, true) && get.effect(tar, card, player, player) > 0) > 0))) return 1
                    if (!player.getStorage("gbwuyin_used").includes("选项四") && player.countCards("hs", card => get.tag(card, "damage")) > 1) return Math.random() > 0.7 ? 1 : 0
                    return 0
                }
            }
        },
        subSkill: {
            used: {
                onremove: true,
            },
            1: {
                audio: false,
                forced: true,
                charlotte: true,
                trigger: {
                    player: "useCard"
                },
                name: "五音①",
                mod: {
                    aiOrder(player, card, num) {
                        if (typeof card.number != "number") return;
                        const phaseName = get.event().getParent("phase", true)?.currentPhase
                        let used = player.getHistory("useCard", evt => evt.getParent(phaseName, true))
                        if (used.length == 0) return num + 10 * (14 - card.number)
                        if (!used.every((evt, i) => i == 0 || evt.card.number > used[i - 1].card.number)) return num
                        if (card.number > used.at(-1).card.number) return num + 10 * (14 - card.number)
                    },
                },
                filter(event, player) {
                    const phaseName = get.event().getParent("phase", true)?.currentPhase
                    let used = player.getHistory("useCard", evt => evt.getParent(phaseName, true))
                    return used.length > 1 && used.every((evt, i) => i == 0 || evt.card.number > used[i - 1].card.number)
                },
                async content(event, trigger, player) {
                    player.draw()
                },
            },
            2: {
                audio: false,
                charlotte: true,
                trigger: {
                    player: "useCard"
                },
                name: "五音②",
                filter(event, player) {
                    let used = player.getAllHistory("useCard")
                    return used.at(-2)?.card.number > event.card.number
                },
                mod: {
                    aiOrder(player, card, num) {
                        if (typeof card.number != "number") return;
                        let used = player.getAllHistory("useCard")
                        if (used.length == 0) return num + 5 * card.number
                        if (card.number < used.at(-1).card.number) return num + 5 * card.number
                    },
                },
                async cost(event, trigger, player) {
                    event.result = await player.chooseTarget("五音②：重铸一名角色的一张牌")
                        .set("ai", (target) => {
                            var player = get.player();
                            if (target == player && player.countCards("he", card => get.value(card) < 5)) return 2
                            if (get.attitude(player, target) <= 0) {
                                return 1;
                            }
                            return 0.5;
                        })
                        .set("filterTarget", (card, player, target) => target.countCards("he"))
                        .forResult()
                },
                async content(event, trigger, player) {
                    let next = await player.choosePlayerCard(event.targets[0], "he", 1, true).set("prompt", "五音②：请重铸一张牌")
                        .set("ai", button => {
                            let player = get.player()
                            let target = get.event().target
                            if (get.attitude(player, target) > 0) return -get.value(button.link)
                            return get.value(button.link)
                        })
                        .forResult()
                    event.targets[0].recast(next.cards)
                }
            },
            3: {
                audio: false,
                charlotte: true,
                mod: {
                    selectTarget(card, player, range) {
                        if (get.type(card) == "trick") range[1] += 2
                    }
                },
                name: "五音③",
            },
            4: {
                audio: false,
                charlotte: true,
                onremove: true,
                trigger: {
                    source: "damageBegin2"
                },
                logTarget: "player",
                name: "五音④",
                filter(event, player) {
                    return event.player != player
                },
                check(event, player) {
                    if (get.damageEffect(event.player, player, player) < 0) return true;
                    var att = get.attitude(player, event.player);
                    if (event.num > 1) {
                        if (att < 0) return false;
                        if (att > 0) return true;
                    }
                    var cards = event.player.getGainableCards(player, "he");
                    for (var i = 0; i < cards.length; i++) {
                        if (get.equipValue(cards[i]) >= 6) return true;
                    }
                    return false;
                },
                prompt2: "防止此伤害并获得其一张牌",
                async content(event, trigger, player) {
                    trigger.cancel()
                    player.gainPlayerCard(trigger.player, "he", 1, true)
                }
            },
        }
    },
    gbtiancai: {
        audio: false,
        enable: "phaseUse",
        filterTarget(card, player, target) {
            return target.group == player.group && target.awakenedSkills.length > 0
        },
        filterCard: true,
        selectCard: 1,
        selectTarget: 1,
        position: "he",
        lose: false,
        ai1(card) {
            return 6 - get.value(card)
        },
        ai2(target) {
            let player = get.player()
            return get.attitude(player, target)
        },
        async content(event, trigger, player) {
            let target = event.target
            target.skills.forEach(skill => {
                if (!lib.skill[skill].limited) return
                target.restoreSkill(skill)
                delete target.getStat("skill")[skill]
            })
            player.recast(event.cards)
        },
        ai: {
            order: 10,
        }
    },
    gbshanguang: {
        audio: false,
        trigger: {
            global: "phaseUseBegin"
        },
        filter(event, player) {
            return event.player != player && event.player.group == player.group
        },
        zhuSkill: true,
        logTarget: "player",
        async cost(event, trigger, player) {
            event.result = await trigger.player.chooseCard(`###${get.prompt(event.skill)}###是否交给${get.translation(player)}一张牌？`)
                .set("ai", (card) => {
                    let player = get.player()
                    if (player.awakenedSkills.length > 0 && player.skills.some(skill => lib.skill[skill].limited))
                        return 4 - get.value(card)
                    return false
                })
                .forResult()
        },
        async content(event, trigger, player) {
            let target = trigger.player
            target.give(event.cards, player, "giveAuto")
            target.skills.forEach(skill => {
                if (!lib.skill[skill].limited) return
                target.restoreSkill(skill)
                delete target.getStat("skill")[skill]
            })
        }
    },
    //
    gbmeiying: {
        audio: false,
        limited: true,
        enable: "phaseUse",
        animationColor: "gbpastel",
        filter(event, player) {
            return player.hasEnabledSlot()
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name)
            let list = []
            for (var i = 1; i <= 5; i++) {
                if (player.hasEnabledSlot(i)) {
                    let str = ["equip" + i]
                    switch (i) {
                        case 1:
                            str.push("武器栏：本回合你使用【杀】的次数+3")
                            break
                        case 2:
                            str.push("防具栏：本回合你使用【杀】指定目标后，你可以取消目标并弃置其各区域内的一张牌")
                            break
                        case 3:
                            if (get.is.mountCombined()) str.push("坐骑栏：摸三张牌，且本回合你使用的实体【杀】不可被响应")
                            else str.push("防御马栏：摸三张牌")
                            break
                        case 4:
                            str.push("进攻马栏：本回合你使用的实体【杀】不可被响应")
                            break
                        case 5:
                            str.push("宝物栏：本轮你可以将锦囊牌视为无次数与距离限制的【杀】使用或打出")
                            break
                    }
                    list.push(str)
                }
            }
            let next = (await player.chooseButton(["请选择废除" + get.translation(player.name) + "的任意个装备栏", [list, "textbutton"]], true, [1, Infinity])
                .set("ai", (button) => {
                    let player = get.player()
                    let card = player.getEquip(button.link)
                    let hasSha = player.hasCard("sha", "hs") || ((player.hasSkill("gbmeiying_5") || (player.hasEnabledSlot(5) && !player.hasCard({
                        subtype: "equip5"
                    }, "hs"))) && player.countCards("hs", card => get.type(card) != "basic"))
                    let noDistance = ((player.hasSkill("gbmeiying_5") || (player.hasEnabledSlot(5) && !player.hasCard({
                        subtype: "equip5"
                    }, "hs"))) && player.countCards("hs", card => get.type(card, "trick") == "trick")) || !game.hasPlayer(p => !player.inRange(p))
                    switch (button.link) {
                        case "equip1":
                            if (player.countCards("hes", card => ["zhuge", "qinglong"].includes(card)) && hasSha) return 0
                            if (game.countPlayer(target => player.canUse({
                                name: "sha"
                            }, target, true) && get.effect(target, {
                                name: "sha"
                            }, player, player) > 0) > 1) {
                                if (player.hasCard({
                                    subtype: "equip1"
                                }, "hs")) return Math.random() > 0.3
                                return 1
                            }
                            return hasSha
                        case "equip2":
                            if (card) return game.hasPlayer(p => get.effect(p, {
                                name: "guohe_copy2"
                            }, player, player) > 0 && player.canUse({
                                name: "sha"
                            }, p, (noDistance ? false : true)))
                            return hasSha
                        case "equip3":
                            var val = 0
                            if (get.is.mountCombined()) {
                                if (player.hasCard({
                                    subtype: "equip4"
                                }, "hs")) val += noDistance ? 5 : 10
                            }
                            if (player.hasCard({
                                subtype: "equip3"
                            }, "hs")) val += player.hp > 2 ? 5 : 10
                            if (val <= 10) return 1
                            return 0
                        case "equip4":
                            var val = 0
                            if (player.hasCard({
                                subtype: "equip4"
                            }, "hs")) val += noDistance ? 5 : 10
                            if (val < 10) return 1
                            return 0
                        case "equip5":
                            if (player.hasSkill("gbmeiying_5")) return 0
                            return !player.hasCard({
                                subtype: "equip5"
                            }, "hs")
                    }
                })
                .forResult()).links
            if (next.includes("equip1")) {
                player.disableEquip(1)
                player.addTempSkill("gbmeiying_1")
            }

            if (next.includes("equip2")) {
                player.disableEquip(2)
                player.addTempSkill("gbmeiying_2")
            }
            if (next.includes("equip3")) {
                player.disableEquip(3)
                player.draw(3)
                if (get.is.mountCombined()) {
                    player.disableEquip(4)
                    player.addTempSkill('gbmeiying_4')
                }
            }
            if (next.includes("equip4")) {
                player.disableEquip(4)
                player.addTempSkill('gbmeiying_4')
            }
            if (next.includes("equip5")) {
                player.disableEquip(5)
                player.addTempSkill("gbmeiying_5", { global: 'roundEnd' })
            }
        },
        ai: {
            order: 9,
            result: {
                player: 1,
            }
        },
        subSkill: {
            1: {
                audio: false,
                charlotte: true,
                mod: {
                    cardUsable(card, player, num) {
                        if (get.name(card) == "sha") return num + 3
                    }
                }
            },
            2: {
                audio: false,
                trigger: {
                    player: "useCardToPlayer"
                },
                name: "魅影②",
                prompt2: "取消此目标并弃置其各区域一张牌",
                filter(event, player) {
                    return get.name(event.card) == "sha" && event.target.countCards("hej")
                },
                check(event, player) {
                    return get.effect(event.target, {
                        name: "guohe_copy2"
                    }, player, player) > get.damageEffect(event.target, player, player, event.card.nature) * event.getParent().baseDamage
                },
                logTarget: "target",
                async content(event, trigger, player) {
                    trigger.excluded.add(trigger.target)
                    player.discardPlayerCard("hej", trigger.target, true).set("filterButton", button => !ui.selected.buttons.some(b => get.position(b.link) == get.position(button.link))).set("selectButton", () => {
                        let player = get.event().target,
                            list = ["h", "e", "j"],
                            num = 0
                        for (let i of list) {
                            if (player.countCards(i)) num += 1
                        }
                        return num
                    })
                }
            },
            4: {
                audio: false,
                trigger: {
                    player: 'useCard'
                },
                name: '魅影④',
                forced: true,
                charlotte: true,
                logTarget: 'targets',
                filter(event, player) {
                    return get.name(event.card) == 'sha' && event.card.isCard && event.cards.length == 1
                },
                async content(event, trigger, player) {
                    trigger.directHit.addArray(trigger.targets)
                }
            },
            5: {
                audio: false,
                name: "魅影⑤",
                enable: ["chooseToUse", "chooseToRespond"],
                position: "hes",
                filterCard(card) {
                    return get.type2(card) == "trick"
                },
                selectCard: 1,
                viewAs: {
                    name: "sha",
                    storage: {
                        gbmeiying: true
                    }
                },
                async precontent(event, trigger, player) {
                    event.getParent().addCount = false
                },
                filter(event, player) {
                    return player.countCards("he", card => get.type2(card) == "trick")
                },
                prompt: "将一张锦囊牌当【杀】使用或打出",
                check(card) {
                    return 6 - get.value(card)
                },
                mod: {
                    cardUsable(card) {
                        if (card.storage?.["gbmeiying"]) return true
                    },
                    targetInRange(card, player) {
                        if (card.storage?.["gbmeiying"]) return true
                    }
                },
                ai: {
                    skillTagFilter(player) {
                        if (!player.countCards("he", card => get.type(card, "trick") == "trick")) return false;
                    },
                    respondSha: true,
                },
            }
        }
    },
    gbbanmian: {
        audio: false,
        forced: true,
        trigger: {
            player: "damageAfter",
            source: "damageEnd"
        },
        async content(event, trigger, player) {
            if (player.hasDisabledSlot()) player.chooseToEnable().set("ai", (event, player, list) => {
                for (let i of list) {
                    if (player.hasCard({
                        subtype: i
                    }, "hs")) return player.getCards("hs", card => get.subtype(card) == i).map(card => get.equipValue(card)).sort((a, b) => b - a)[0]
                    return 1
                }
            })
        },
        mod: {
            maxHandcard: function (player, num) {
                const countEnabled = (...slots) => slots.reduce((n, i) => n + (player.hasEnabledSlot(i) ? 1 : 0), 0)
                return num + countEnabled(1, 2, 5) + (get.is.mountCombined() ? (player.hasEnabledSlot(3) ? 2 : 0) : countEnabled(3, 4))

            },
        },
        group: "gbbanmian_round",
        subSkill: {
            round: {
                audio: false,
                forced: true,
                trigger: {
                    player: "phaseZhunbeiBegin"
                },
                async content(event, trigger, player) {
                    if (!player.hasDisabledSlot()) player.restoreSkill("gbmeiying")
                }
            }
        }
    },
    // 
    gbguancai: {
        audio: false,
        limited: true,
        animationColor: "gbpastel",
        trigger: {
            global: "phaseEnd"
        },
        logTarget(event) {
            if (event.cost_data == "选项一") return game.filterPlayer(tar => tar.isLinked())
            return game.filterPlayer(tar => !tar.isLinked())
        },
        async cost(event, trigger, player) {
            let list = ["选项一", "选项二", "cancel2"]
            let choiceList = [
                "令所有已横置角色弃一张牌，然后重置其的武将牌",
                "令所有未横置角色摸一张牌，然后横置其的武将牌"
            ]
            let result = await player.chooseControl(list)
                .set("prompt", get.prompt(event.skill))
                .set("choiceList", choiceList)
                .set("ai", () => {
                    let player = get.player()
                    let discard = 0
                    let draw = 0
                    if (player.isLinked() && player.countCards("he") > 0) {
                        discard = game.countPlayer(tar => tar.isLinked() && tar.countCards("he") > 0) * get.effect(player, {
                            name: "draw"
                        }, player, player)
                    }
                    if (!player.isLinked()) {
                        draw = game.countPlayer(tar => !tar.isLinked()) * get.effect(player, {
                            name: "draw"
                        }, player, player)
                    }
                    let control = {
                        0: game.filterPlayer(target => target.isLinked()).reduce((num, tar) => num += get.effect(tar, {
                            name: "guohe_copy2"
                        }, player, player), 0) + discard,
                        1: game.filterPlayer(target => !target.isLinked()).reduce((num, tar) => num += get.effect(tar, {
                            name: "draw"
                        }, player, player), 0) + draw
                    }
                    return [0, 1].sort((a, b) => control[b] - control[a])[0]
                })
                .forResult()
            if (result.control != "cancel2") event.result = {
                bool: true,
                cost_data: result.control
            }
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name)
            let num = 0
            let bool = false
            game.log(player, "选择了", "#g【观才】", "的", "#y" + event.cost_data)
            switch (event.cost_data) {
                case "选项一": {
                    for (let target of game.filterPlayer(p => p.isLinked())) {
                        let next = await target.chooseToDiscard("he", true).forResult()
                        target.link(false)
                        if (next.cards.length > 0 && next.cards.some(card => card.original == "h") && target == player) bool = true
                        if (next.cards.length > 0 && target != player) num += 1
                    }
                    break
                }
                case "选项二": {
                    for (let target of game.filterPlayer(p => !p.isLinked())) {
                        target.draw()
                        target.link(true)
                        if (target == player) bool = true
                        if (target != player) num += 1
                    }
                    break
                }
            }
            if (bool) {
                player.draw(num)
            }
        }
    },
    gbluguang: {
        audio: false,
        forced: true,
        trigger: {
            player: "useCardToPlayered",
        },
        filter(event, player, name) {
            return event.isFirstTarget && event.targets.some(target => target != player)
        },
        logTarget: "targets",
        multitarget: true,
        async content(event, trigger, player) {
            for (let target of trigger.targets) {
                if (target == player) continue
                target.link(true)
            }
        },
        ai: {
            effect: {
                player(card, player, target, num) {
                    if (target != player && get.name(card) == "tiesuo" && !target.isLinked()) return 0
                },
            }
        },
        group: "gbluguang_target",
        subSkill: {
            target: {
                audio: false,
                forced: true,
                charlotte: true,
                trigger: {
                    target: "useCardToTargeted"
                },
                logTarget: "target",
                async content(event, trigger, player) {
                    player.link()
                    player.restoreSkill("gbguancai")
                },
                ai: {
                    effect: {
                        target(card, player, target, num) {
                            if (player.awakenedSkills.includes("gbguancai")) return [1, 1, 1, 0]
                            if (get.name(card) == "tiesuo") return 0
                        }
                    }
                },
            }
        }
    },
    //
    gbshanqi: {
        audio: false,
        limited: true,
        animationColor: "gbpastel",
        enable: "phaseUse",
        filter(event, player) {
            if ([1, 2, 3, 4, 5].some(i => player.hasEmptySlot(i))) return true
            else return player.countCards("he")
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name)
            if ([1, 2, 3, 4, 5].some(i => player.hasEmptySlot(i))) {
                player.draw()
                var list = [];
                for (var name of lib.inpile) {
                    if (get.type(name) == "equip") list.push(name)
                    if (get.subtype(name) == "equip5") list.remove(name)
                }
                let next = await player.chooseButton(["善器", [list, "vcard"]], true)
                    .set("ai", button => {
                        let player = get.player()
                        if (player.hasCard({
                            subtype: get.subtype(button.link[2])
                        }, "hs")) return get.equipValue({
                            name: button.link[2]
                        }) - 1
                        return get.equipValue({
                            name: button.link[2]
                        })
                    })
                    .set("filterButton", button => get.player().canEquip({
                        name: button.link[2]
                    }, false))
                    .forResult()
                let result = await player.chooseCard(`善器：将一张手牌当做${get.translation(next.links[0][2])}使用`, true)
                    .set("ai", card => {
                        let player = get.player()
                        let val = get.value(card)
                        if (get.type(card) == "equip") {
                            if (player.canEquip(card)) return val -= 1
                            return val
                        }
                        if (get.type(card) != "basic") {
                            return val -= 1
                        }
                        return val
                    })
                    .forResult()
                let card = get.autoViewAs({
                    name: next.links[0][2]
                }, result.cards)
                await player.equip(card)
            } else {
                let { cards } = await player.chooseCard("善器：重铸装备区中的任意张牌", "e", [1, Infinity], true)
                    .set("ai", card => 6 - get.value(card))
                    .forResult()
                await player.recast(cards)
            }
            player.when("chooseToDiscardBegin")
                .filter((event, player) => player.awakenedSkills.includes("gbshanqi") && player.countCards("he", card => get.type(card) != "basic") && event.getParent(evt => ["gbjiyue", "phaseDiscard"].includes(evt.name), true))
                .then(() => {
                    trigger.ai = (card) => {
                        let player = get.player()
                        if (ui.selected.cards.some(c => get.type(c) != "basic")) return 6 - get.value(card)
                        return card == player.getCards("he", card => get.type(card) != "basic").sort((a, b) => get.value(a) - get.value(b))[0]
                    }
                })
        },
        ai: {
            order: 10,
            result: {
                player: 1,
            }
        }
    },
    gbjiyue: {
        audio: false,
        locked: true,
        trigger: {
            player: "equipAfter"
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(`###${get.prompt(event.skill)}###请选择一名角色`)
                .set("ai", target => {
                    let player = get.player()
                    let num = Math.abs(Math.min(player.countCards("e"), 4) - 1)
                    if (!player.hasCard({
                        type: "equip"
                    }, "hs") && player.awakenedSkills.includes("gbshanqi") && !player.getStorage("gbjiyue_used").includes(player)) return target == player
                    if (get.attitude(player, target) > 0) return get.effect(target, {
                        name: "draw"
                    }, player, player) * Math.min(player.countCards("e"), 4)
                    return get.effect(target, {
                        name: "guohe_copy2"
                    }, player, player) * Math.min(num, target.countCards("he"))
                })
                .set("filterTarget", (card, player, target) => !player.getStorage("gbjiyue_used").includes(target))
                .forResult()
        },
        async content(event, trigger, player) {
            let target = event.targets[0]
            player.markAuto("gbjiyue_used", target)
            player.addTempSkill("gbjiyue_used")
            let num = player.countCards("e")
            let next = await player.chooseButton([
                "击乐",
                [
                    [
                        ["draw", "摸" + get.cnNumber(num) + "张牌并弃置一张牌"],
                        ["discard", "摸一张牌并弃置" + get.cnNumber(num) + "张牌"]
                    ], "textbutton"
                ]
            ], true)
                .set("ai", button => {
                    let player = get.player()
                    let num = Math.min(player.countCards("e"), 4)
                    if (get.attitude(player, target) > 0) return button.link == num > 0 ? "draw" : "discard"
                    return button.link == (num == 0 ? "draw" : "discard")
                })
                .forResult()
            switch (next.links[0]) {
                case "draw":
                    target.draw(num)
                    target.chooseToDiscard("he", true)
                    break
                case "discard":
                    target.draw(1)
                    target.chooseToDiscard("he", true, num)
                    break
            }
        },
        group: ["gbjiyue_init", "gbjiyue_discard"],
        ai: {
            effect: {
                target(card, player, target) {
                    if (get.type(card) == "equip") {
                        let num = Math.min(player.countCards("e"), 4)
                        if (game.hasPlayer(p => player.getStorage("gbjiyue_used").includes(p))) return [1, num, 1, 0]
                        return 1
                    }
                }
            }
        },
        subSkill: {
            discard: {
                audio: false,
                forced: true,
                charlotte: true,
                trigger: {
                    player: "discardBegin"
                },
                filter(event, player) {
                    return event.getParent(evt => evt.skill == "gbjiyue", true) && event.cards.some(card => get.type(card) != "basic")
                },
                async content(event, trigger, player) {
                    player.restoreSkill("gbshanqi")
                }
            },
            init: {
                audio: false,
                forced: true,
                charlotte: true,
                trigger: {
                    global: "phaseBefore",
                    player: "enterGame",
                },
                filter(event, player) {
                    return event.name != "phase" || game.phaseNumber == 0;
                },
                async content(event, trigger, player) {
                    player.disableEquip(5)
                    let card = get.cardPile("filed", card => get.name(card) == "zheji")
                    if (!card) card = game.createCard2({ suit: "club", number: 5, name: "zheji" })
                    player.gain(card)
                },
            },
            used: {
                onremove: true,
            },
        }
    },
    //
    gbwudao: {
        audio: false,
        limited: true,
        animationColor: "gbpastel",
        trigger: {
            player: ["shaDamage", "shaAfter"]
        },
        logTarget: "target",
        check(event) {
            let player = get.player()
            return get.attitude(player, event.target) < 0
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name)
            if (event.triggername == "shaDamage") {
                const target = trigger.target
                let n = target.countEmptySlot(1) + target.countEmptySlot(2) + target.countEmptySlot(5)

                if (get.is.mountCombined()) {
                    n += target.countEmptySlot(3) ? 2 : 0;
                } else {
                    n += target.countEmptySlot(3) + target.countEmptySlot(4);
                }
                player.draw(n)
            } else {
                if (!player.hasHistory("sourceDamage", evt => evt.card == trigger.card)) {
                    let { bool, targets: [target], cards } = await player.chooseCardTarget()
                        .set("prompt", `###${get.prompt(event.name)}###弃置一张牌，视为对一名其他角色使用【杀】`)
                        .set("position", "he")
                        .set("filterTarget", (card, player, target) => !target.hasHistory("damage") && player.canUse({ name: "sha" }, target, true, false))
                        .set("ai1", card => 6 - get.value(card))
                        .set("ai2", (target) => get.effect(target, { name: "sha" }, get.player(), get.player()))
                        .forResult()
                    if (bool) {
                        await player.discard(cards)
                        await player.useCard({ name: "sha" }, target, false)
                    }
                }
            }
        },
    },
    gbdahe: {
        audio: false,
        forced: true,
        trigger: {
            global: "discardBegin"
        },
        filter(event, player) {
            return event.cards.some(card => get.type(card) != "basic")
        },
        async content(event, trigger, player) {
            player.restoreSkill("gbwudao")
        },
        group: "gbdahe_sha",
        subSkill: {
            sha: {
                locked: true,
                trigger: {
                    player: "useCardToPlayer"
                },
                logTarget: "target",
                filter(event, player) {
                    return get.name(event.card) == "sha"
                },
                check(event, player) {
                    return get.effect(event.target, { name: "guohe_copy" }, player, player)
                },
                prompt2: "弃置其一张牌",
                async content(event, trigger, player) {
                    await player.discardPlayerCard(trigger.target, "he", true)
                }
            }
        }
    },
    gbjixing: {
        audio: false,
        forced: true,
        trigger: {
            player: "phaseZhunbeiBegin"
        },
        mark: "auto",
        marktext: "极",
        intro: {
            markcount: "expansion",
            content: "expansion",
            name: "极",
        },
        filter(event, player) {
            return player.countCards("he")
        },
        async content(event, trigger, player) {
            let result = await player.chooseCardTarget()
                .set("position", "he")
                .set("filterTarget", lib.filter.notMe)
                .set("selectTarget", [1, 5])
                .set("forced", true)
                .set("prompt", "极星：请展示一张牌，然后令至多五名其他角色与你合奏")

                .set("ai1", (card) => -get.value(card))
                .set("ai2", (target) => get.attitude(get.player(), target) <= 0 ? 10 : 1)
                .forResult()
            if (result) {
                await player.showCards(result.cards)
                let targets = result.targets
                await player.chooseToEnsemble(targets.add(player).sortBySeat())
                    .set("ai", (card) => {
                        let player = get.player()
                        let source = get.event().source
                        if (get.attitude(player, source) > 0) return get.value(card) <= 4
                        return get.value(card) <= 0
                    })
                    .set("callback", () => {
                        const { bool, list, cards, targets } = get.event().ensembleResult
                        let player = get.player()
                        if (cards.length > 0) {
                            player.addToExpansion(cards.flat(), "giveAuto").gaintag.add("gbjixing")
                        }
                    })
                    .forResult()
            }
        },
        group: "gbjixing_draw",
        subSkill: {
            draw: {
                audio: false,
                forced: true,
                charlotte: true,
                trigger: { player: "phaseDrawBegin2" },
                filter(event, player) {
                    return !event.numFixed;
                },
                async content(event, trigger, player) {
                    trigger.num += Math.min(player.countExpansions("gbjixing"), player.maxHp)
                },
            }
        }
    },
    gbduomu: {
        audio: false,
        enable: "phaseUse",
        usable: 5,
        filter(event, player) {
            return player.countExpansions("gbjixing")
        },
        chooseButton: {
            dialog(event, player) {
                var list = ["kaihua", "yiyi", "shuiyanqijunx", "jiwangkailai", "sadouchengbing"];
                var dialog = ui.create.dialog("夺目");
                dialog.add("<div class='text center'>选择要视为的牌</div>");
                dialog.addSmall([list, "vcard"]);
                dialog.add("<div class='text center'>选择『极』</div>");
                dialog.addSmall([player.getExpansions("gbjixing"), "card"]);
                dialog.classList.add("fullheight")
                return dialog
            },
            select: 2,
            filter(button, player) {
                if (ui.selected.buttons.length == 0) {
                    return Array.isArray(button.link) && !player.getStorage("gbduomu_temp").includes(button.link[2]) && get.event().getParent().filterCard({ name: button.link[2], }, player, get.event().getParent());
                } else if (ui.selected.buttons.length == 1) {
                    return !Array.isArray(button.link)
                }
            },
            check(button) {
                if (Array.isArray(button.link)) return get.player().getUseValue({ name: button.link[2] })
                return true
            },
            backup(links, player) {
                return {
                    audio: false,
                    position: "x",
                    selectCard: -1,
                    filterCard(card) {
                        return card == lib.skill.gbduomu_backup.card;
                    },
                    viewAs: { name: links[0][2] },
                    card: links[1],
                    onuse(result, player) {
                        player.markAuto("gbduomu_temp", result.card.name)
                        player.addTempSkill("gbduomu_temp")
                    }
                }
            },
            prompt(links, player) {
                return "将" + get.translation(links[1]) + "当做" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]) + "使用";
            }
        },
        ai: {
            order: 8,
            result: {
                player: 1
            }
        },
        subSkill: {
            temp: {
                onremove: true,
            }
        }
    },
    gbgemian: {
        audio: false,
        forced: true,
        trigger: {
            player: "phaseZhunbeiBegin"
        },
        filter(event, player) {
            return player.countCards("he")
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCardTarget()
                .set("position", "he")
                .set("selectCard", [1, Infinity])
                .set("selectTarget", [1, Infinity])
                .set("prompt", get.prompt2(event.skill))
                .set("ai1", card => 6 - get.value(card))
                .set("ai2", target => 1)
                .forResult()
        },
        async content(event, trigger, player) {
            await player.discard(event.cards)
            for (let target of event.targets.sortBySeat()) {
                let list = ["选项一", "选项二"]
                let choiceList = [
                    "将手牌数调整至与" + get.translation(player) + "相同",
                    "令" + get.translation(player) + "摸一张牌，且其本回合可使用【杀】的次数+1"
                ]
                let next = await target.chooseControl(list)
                    .set("prompt", "革面：请选择一项")
                    .set("choiceList", choiceList)
                    .set("ai", () => {
                        let source = get.event().source
                        let player = get.event().player
                        let num = source.countCards("h") - player.countCards("h")
                        if (get.attitude(player, source) > 0) return num > 3 ? "选项一" : "选项二"
                        return num < -1 ? "选项二" : "选项一"
                    })
                    .set("source", player)
                    .forResult()
                game.log(player, "选择了", "#g【革面】", "的", "#y" + next.control)
                if (next.control == "选项一") {
                    let num = target.countCards("h") - player.countCards("h")
                    if (num > 0) target.chooseToDiscard("h", true, num)
                    else target.drawTo(player.countCards("h"))
                } else {
                    player.draw()
                    player.addMark("gbgemian_temp", 1, false)
                    player.addTempSkill("gbgemian_temp")
                }
            }
        },
        subSkill: {
            temp: {
                audio: false,
                charlotte: true,
                onremove: true,
                mod: {
                    cardUsable(card, player, num) {
                        if (get.name(card) == "sha") return num + player.countMark("gbgemian_temp")
                    }
                }
            }
        }
    },
    gbkuangchi: {
        audio: false,
        trigger: {
            player: ["phaseZhunbeiEnd", "phaseJudgeEnd", "phaseDrawEnd", "phaseUseEnd", "phaseDiscardEnd", "phaseJieshuEnd"]
        },
        filter(event, player, name) {
            const phaseName = name.slice(0, -3)
            return player.hasHistory("lose", evt => evt.cards.length && evt.getParent(phaseName, true))
        },
        async content(event, trigger, player) {
            let result = await player.chooseTarget("狂匙：选择一名其他角色与你“合奏”", true)
                .set("filterTarget", lib.filter.notMe)
                .set("ai", target => -get.attitude(get.event().player, target))
                .forResult()
            if (result) {
                let targets = [player, result.targets[0]]
                player.chooseToEnsemble(targets)
                    .set("ai", (card) => {
                        let player = get.player()
                        let source = get.event().source
                        let att = get.attitude(player, source)
                        if (att < 0) {
                            if (Math.random() < 0.7) return true
                            return false
                        }
                        return false
                    })
                    .set("callback", () => {
                        const { bool, list, cards, targets } = get.event().ensembleResult
                        let player = get.player()
                        let bool1 = true, bool2 = true
                        if (cards[0].length == cards[1].length) {
                            player.draw()
                            targets.find(t => t != player).draw()
                            player.gain(cards[1], "giveAuto")
                        } else {
                            for (let target of targets) {
                                if (target == player) continue
                                target.damage(player)
                                player.markAuto("gbkuangchi_distance", target)
                                player.addTempSkill("gbkuangchi_distance")
                            }
                        }
                    })
            }
        },
        subSkill: {
            distance: {
                audio: false,
                charlotte: true,
                onremove: true,
                mod: {
                    globalFrom(from, to) {
                        if (from.getStorage("gbkuangchi_distance").includes(to)) return -Infinity;
                    },
                }
            }
        }
    },
    gbkuangquan: {
        audio: false,
        forced: true,
        trigger: {
            player: "phaseZhunbeiBegin"
        },
        async content(event, trigger, player) {
            let list = ["选项一", "选项二"]
            let choiceList = [
                "将体力值调整为1，然后执行一个额外的出牌阶段",
                "将手牌数调整为1，然后执行一个额外的摸牌阶段"
            ]
            let result = await player.chooseControl(list)
                .set("prompt", "狂犬：请选择一项")
                .set("choiceList", choiceList)
                .set("ai", () => {
                    let player = get.player()
                    if (player.countCards("h") < 3) return 1
                    return 0
                })
                .forResult()
            let evt = trigger.getParent("phase", true, true)
            game.log(player, "选择了", "#g【狂犬】", "的", "#y" + result.control)
            switch (result.control) {
                case "选项一":
                    player.hp = 1
                    player.update()
                    if (evt?.phaseList) evt.phaseList.splice(evt.num + 1, 0, `phaseUse|${event.name}`)
                    break
                case "选项二":
                    let num = player.countCards('h') - 1
                    if (num > 0) await player.chooseToDiscard(true, "h", num)
                    else await player.drawTo(1)
                    if (evt?.phaseList) evt.phaseList.splice(evt.num + 1, 0, `phaseDraw|${event.name}`)
                    break
            }
        }
    },
    gbkuangbiao: {
        audio: false,
        enable: "phaseUse",
        filterTarget(card, player, target) {
            return target != player
        },
        ai2(target) {
            let player = get.player()
            if (get.attitude(player, target) < 0) return player.countCards("h") >= target.countCards("h")
            return player.countCards("h") >= target.countCards("h")
        },
        usable: 3,
        async content(event, trigger, player) {
            let targets = [player, event.targets[0]]
            player.chooseToEnsemble(targets)
                .set("ai", (card) => {
                    let player = get.player()
                    let source = get.event().source
                    let targets = get.event().targets
                    let att = get.attitude(player, source)
                    if (player == source) {
                        if (ui.selected.cards.length >= targets[1].countCards("h")) return false
                        if (player.countCards("h") >= targets[1].countCards("h")) return true
                        return false
                    }
                    else {
                        if (att < 0) {
                            if (ui.selected.cards.length > source.countCards("h")) return false
                            if (player.countCards("h") > source.countCards("h")) return true
                            return false
                        }
                        return false
                    }
                })
                .set("callback", async () => {
                    const { bool, list, cards, targets } = get.event().ensembleResult
                    let player = get.player()
                    if (cards[0].length >= cards[1].length) {
                        let list = ["选项一", "选项二"]
                        let choiceList = [
                            "获得" + get.translation(targets[1]) + "的合奏牌",
                            "弃置X张牌并摸等量张牌（X为你与其合奏牌数之差，且至多为5）"
                        ]
                        let next = await player.chooseControl(list)
                            .set("prompt", "狂飙：请选择一项")
                            .set("choiceList", choiceList)
                            .set("ai", () => {
                                const { bool, list, cards, targets, player } = get.event().getParent().ensembleResult
                                let num = Math.min(player.countCards("he"), Math.min(cards[0].length - cards[1].length, 5))
                                if (player.getCards("he").filter(card => get.value(card) <= 4).length >= num - 1) return 0
                                return 1
                            })
                            .forResult()
                        game.log(player, "选择了", "#g【狂飙】", "的", "#y" + next.control)
                        switch (next.control) {
                            case "选项一":
                                player.gain(cards[1], "giveAuto")
                                break
                            case "选项二":
                                let num = Math.min(cards[0].length - cards[1].length, 5)
                                if (num) {
                                    await player.chooseToDiscard("he", true, num).set("ai", card => -get.value(card))
                                    await player.draw(num)
                                }
                                break
                        }
                    }
                })
        },
        ai: {
            order: 9,
            result: {
                player(player, target, card) {
                    if (target.countCards("h") <= player.countCards("h")) return 1
                }
            }
        },
    },
    gbzhongquan: {
        audio: false,
        locked: true,
        trigger: {
            global: "phaseBefore",
            player: "enterGame"
        },
        filter(event, player, name) {
            return name != "phaseBefore" || game.phaseNumber == 0;
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(`忠犬：请选择一名其他角色`, true)
                .set("ai", (target) => get.attitude(get.event().player, target))
                .set("filterTarget", lib.filter.notMe)
                .forResult()
        },
        async content(event, trigger, player) {
            let target = event.targets[0]
            player.markAuto("gbzhongquan_owner", target)
            player.addSkill("gbzhongquan_owner")
            target.when("dyingBegin")
                .then(() => {
                    sourcex.logSkill("gbzhongquan")
                    sourcex.hp = 8
                    sourcex.update()
                })
                .vars({ sourcex: player })
        },
        subSkill: {
            owner: {
                audio: false,
                forced: true,
                charlotte: true,
                trigger: {
                    global: ["gainAfter", "discardAfter"]
                },
                filter(event, player, name) {
                    return player.getStorage("gbzhongquan_owner").includes(event.player) && event.cards.length > 0 && _status.currentPhase == event.player
                },
                async content(event, trigger, player) {
                    if (event.triggername == "gainAfter") {
                        player.draw(trigger.cards.length)
                    }
                    if (event.triggername == "discardAfter") {
                        player.chooseToDiscard("he", true, trigger.cards.length)
                    }
                }
            }
        }
    },
    gbcaiyan: {
        audio: false,
        enable: "phaseUse",
        usable: 1,
        position: "he",
        selectCard: 1,
        filterCard: true,
        lose: false,
        async content(event, trigger, player) {
            await player.showCards(event.cards)
            let result = await player.chooseTarget("彩颜：选择任意名其他角色", [1, Infinity], true).set("filterTarget", lib.filter.notMe).set("ai", (target) => true).forResult()
            if (result) {
                let targets = [player].addArray(result.targets)
                targets.sortBySeat()
                player.chooseToEnsemble(targets)
                    .set("ai", () => {
                        let player = get.player()
                        let source = get.event().source
                        let att = get.attitude(player, source)
                        if (att < 0) {
                            if (Math.random() < 0.7) return true
                            return false
                        }
                        return false
                    })
                    .set("callback", async () => {
                        const { bool, list, cards, targets, player } = get.event().ensembleResult
                        let source = list.filter(item => item[0] == player).flatMap(item => item[1]).flat()
                        let target = list.filter(item => item[0] != player).flatMap(item => item[1]).flat()
                        let num = Math.min(targets.length, 5)
                        if (!source.some(card => target.some(c => c.name == get.name(card)))) {
                            let next = await player.chooseTarget(`彩颜：令一名角色摸${get.cnNumber(num)}张牌`).set("ai", (target) => get.attitude(get.event().player, target)).forResult()
                            if (next && next.bool) await next.targets[0].draw(num)
                        }
                    })
            }
        }
    },
    gbzhiyou: {
        audio: false,
        locked: true,
        trigger: {
            player: "phaseZhunbeiBegin"
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(`###${get.prompt(event.skill)}###观看一名其他角色的手牌并展示其中至多3张花色各不相同的牌`)
                .set("ai", (target) => target.countCards("h"))
                .set("filterTarget", (card, player, target) => player != target && target.countCards("h"))
                .forResult()
        },
        async content(event, trigger, player) {
            let result = await player.chooseButton(["知由：请选择至多三张花色各不同的手牌", event.targets[0].getCards("h")], [1, 3])
                .set("ai", button => get.value(button.link))
                .set("filterButton", function (button) {
                    for (let i = 0; i < ui.selected.buttons.length; i++) {
                        if (get.suit(button.link) == get.suit(ui.selected.buttons[i].link)) return false
                    }
                    return true
                }).forResult()
            if (result.bool) {
                let cards = result.links;
                player.showCards(cards)
                let list = ["选项一", "选项二"]
                let choiceList = [
                    "将展示牌交给" + get.translation(player) + "，然后摸等量张牌",
                    "弃置展示牌，然后弃置" + get.translation(player) + "一张牌"
                ]
                let next = await event.targets[0].chooseControl(list)
                    .set("prompt", "知由：请选择一项")
                    .set("choiceList", choiceList)
                    .set("ai", () => {
                        let player = get.player()
                        let source = get.event().source
                        if (get.attitude(player, source) > 0) return 0
                        return get.rand(0, 1)
                    })
                    .set("source", player)
                    .forResult()
                game.log(event.targets[0], "选择了", "#g【知由】", "的", "#y" + next.control)
                if (next.control == "选项一") {
                    event.targets[0].give(cards, player)
                    event.targets[0].draw(cards.length)
                } else {
                    event.targets[0].discard(cards)
                    event.targets[0].discardPlayerCard(player, "he", true, 1)
                }
            }
        }
    },
    gbzhiyin: {
        audio: false,
        trigger: {
            player: ["phaseZhunbeiEnd", "phaseJudgeEnd", "phaseDrawEnd", "phaseUseEnd", "phaseDiscardEnd", "phaseJieshuEnd"]
        },
        filter(event, player, name) {
            const phaseName = name.slice(0, -3)
            return player.hasHistory("gain", evt => evt.cards.length && evt.getParent(phaseName, true))
        },
        async content(event, trigger, player) {
            let result = await player.chooseTarget("制音：选择至多两名其他角色进行“合奏”", [1, 2], true)
                .set("ai", (target) => get.attitude(get.event().player, target) <= 0)
                .set("filterTarget", lib.filter.notMe)
                .forResult()
            if (result) {
                let targets = result.targets
                targets.sortBySeat()
                player.chooseToEnsemble(targets)
                    .set("ai", (card) => {
                        let player = get.player()
                        if (ui.selected.cards.length == 1) return false
                        if (player.countCards("h") > 3 && player.countCards("h", card => get.value(card) < 5)) return player.getCards("h", card => get.value(card) < 5).randomGet() == card
                        if (player.hp < 2 && !player.countCards("h", card => ["tao", "jiu"].includes(get.name(card)))) return get.value(card) < 6
                        return false
                    })
                    .set("callback", async () => {
                        const { bool, list, cards, targets, player } = get.event().ensembleResult
                        let choiceList = [
                            "弃置合奏牌并令" + get.translation(targets) + "摸等量张牌",
                            "获得合奏牌，然后令未因此失去牌的参与者失去1点体力"
                        ]
                        let next = await player.chooseControl(["选项一", "选项二"])
                            .set("prompt", "制音：请选择一项")
                            .set("choiceList", choiceList)
                            .set("ai", () => get.rand(0, 1) ? "选项一" : "选项二")
                            .forResult()
                        game.log(player, "选择了", "#g【制音】", "的", "#y" + next.control)
                        if (next.control == "选项一") {
                            for (let target of targets) {
                                await target.discard(list.filter(item => item[0] == target)[0][1])
                                await target.draw(list.filter(item => item[0] == target)[0][1].length)
                            }
                        } else {
                            await player.gain(cards.flat(), "giveAuto")
                            for (let target of targets) {
                                if (!target.getHistory("lose").some(evt => evt.getParent(evt => evt == get.event(), true))) await target.loseHp()
                            }
                        }
                    })
            }
        },
    },
    // SP丰川祥子
    gbchunhua: {
        audio: false,
        enable: "phaseUse",
        usable: 2,
        position: "he",
        check(card) {
            let player = get.player(),
                yingNum = player.countCards("h", card => get.name(card) == "ying"),
                judgeNum = player.countCards("j")
            if (get.suit(card, player) == "spade" && !yingNum) return 1
            if (get.suit(card, player) == "spade" && yingNum && (judgeNum + 1) >= yingNum) return 10 - get.value(card)
            if (get.suit(card, player) == "spade" && player.countSkill("gbchunhua") == 1 && yingNum) return 10 - get.value(card)
            if (get.suit(card, player) != "spade") return 6 - get.value(card)
        },
        filter(event, player) {
            return player.canAddJudge("xumou_jsrg") && player.countCards("he") > 0
        },
        filterCard(card, player) {
            let suit = player.getCards("j").reduce((suit, card) => suit.add(get.suit(card, player)), [])
            if (suit.includes(get.suit(card, player))) return false
            return true
        },
        selectCard: 1,
        lose: false,
        async content(event, trigger, player) {
            await player.addJudge("xumou_jsrg", event.cards)
            let num = player.countCards("j")
            player.draw(num)
            if (get.suit(event.cards[0], player) == "spade" && num > 0) player.chooseToDiscard("he", true, num)
        },
        ai: {
            order: 10,
            result: {
                player: 1
            }
        }
    },
    gblingming: {
        audio: false,
        trigger: {
            global: "phaseBegin"
        },
        filter(event, player) {
            return event.player != player
        },
        async cost(event, trigger, player) {
            const target = trigger.player
            const list = []
            const choiceList = [
                "与" + get.translation(target) + "拼点",
                "与" + get.translation(target) + "议事",
                "与" + get.translation(target) + "合奏"
            ]
            if (player.canCompare(target)) list.push("选项一")
            if (target.countCards("h")) list.push("选项二")
            list.push("选项三")
            list.push("cancel2")
            const { control } = await player.chooseControl(list)
                .set("prompt", "蛉鸣：请选择一项")
                .set("choiceList", choiceList)
                .set("target", target)
                .set("ai", () => {
                    const event = get.event()
                    const player = event.player
                    const target = event.target
                    if (player.canCompare(target) && get.attitude(player, target) < 0) {
                        const hs = player.getCards("h")
                        if (hs.length > target.countCards("h")) {
                            for (const card of hs) {
                                const val = get.value(card)
                                if (card.number >= 10 && val <= 6) return "选项一"
                                if (card.number >= 8 && val <= 3) return "选项一"
                            }
                        }
                    }
                    const controls = event.controls
                    const hasJudge = player.countCards("j")
                    const blackJudge = player.countCards("j", card => get.color(card) == "black")
                    const blackHand = player.countCards("h", card => get.color(card) == "black")
                    if (get.attitude(player, target) < 0) {
                        if (hasJudge && blackJudge) return controls.includes("选项二") ? "选项二" : "选项三"
                        if (hasJudge && !blackJudge) return "选项三"
                        if (!hasJudge && blackHand) return controls.includes("选项二") ? "选项二" : "选项三"
                        if (!hasJudge && !blackHand) return "选项三"
                    }
                    if (hasJudge >= 2) return "选项三"
                    return ["选项三", "选项二"].filter(control => controls.includes(control)).randomGet() || "选项三"
                })
                .forResult()
            event.result = {
                bool: control != "cancel2",
                cost_data: control
            }
        },
        async content(event, trigger, player) {
            const control = event.cost_data
            game.log(player, "选择了", "#g【蛉鸣】", "的", "#y" + control)
            let cards
            switch (control) {
                case "选项一":
                    let next = await player.chooseToCompare(trigger.player).forResult()
                    if (next && next.bool) {
                        player.give(next.player, trigger.player, "giveAuto")
                        trigger.player.addTempSkill("gblingming_effect")
                        trigger.player.markAuto("gblingming_effect", next.player)
                    } else {
                        cards = next.target
                    }
                    break
                case "选项二":
                    player.chooseToDebate([player, trigger.player]).set("callback", async () => {
                        const {
                            bool,
                            opinion,
                            black,
                            red,
                            others,
                            targets
                        } = get.event().debateResult;
                        if (!bool) return
                        let player = get.player()
                        let target = targets.filter(i => i != player)[0]
                        if (opinion != "black") {
                            let cards = [...red, ...black, ...others].filter(i => i[0] == player).map(i => i[1]).flat()
                            if (cards.length) player.give(cards, target)
                            target.addTempSkill("gblingming_effect")
                            target.markAuto("gblingming_effect", cards)
                        } else {
                            cards = [...red, ...black, ...others].filter(i => i[0] != player).map(i => i[1]).flat()
                        }
                    })
                    break
                case "选项三":
                    player.chooseToEnsemble([player, trigger.player])
                        .set("ai", (card) => {
                            let player = get.player()
                            let source = get.event().source
                            if (player == source) return Math.random()
                            if (6 - get.value(card)) return Math.random() < 0.3
                            return false
                        })
                        .set("callback", async () => {
                            const { bool, cards, list, targets } = get.event().ensembleResult
                            let player = get.player()
                            let target = targets[1]
                            if (cards[0].length <= cards[1].length) {
                                player.give(cards[0], target)
                                target.addTempSkill("gblingming_effect")
                                target.markAuto("gblingming_effect", cards[0])
                            } else {
                                game.broadcastAll((list) => {
                                    for (let card of list) {
                                        const namex = "gblingming_" + card.name;
                                        if (!lib.card[namex]) {
                                            lib.card[namex] = {
                                                type: "special_delay",
                                                fullskin: true,
                                                noEffect: true,
                                                wuxieable: false,
                                                cardimage: card.name,
                                            };
                                            lib.translate[namex] = lib.translate[card.name] + "·春华";
                                            lib.translate[namex + "_info"] = "由【蛉鸣】技能创造的无效果【延时锦囊牌】";
                                        }
                                    }
                                }, cards[1])
                                for (let card of cards[1]) {
                                    await player.addJudge("gblingming_" + get.name(card), card)
                                }
                            }
                        })
                    break
            }
            if (cards) {
                game.broadcastAll((list) => {
                    for (let card of list) {
                        const namex = "gblingming_" + card.name;
                        if (!lib.card[namex]) {
                            lib.card[namex] = {
                                type: "special_delay",
                                fullskin: true,
                                noEffect: true,
                                wuxieable: false,
                                cardimage: card.name,
                            };
                            lib.translate[namex] = lib.translate[card.name] + "·春华";
                            lib.translate[namex + "_info"] = "由【蛉鸣】技能创造的无效果【延时锦囊牌】";
                        }
                    }
                }, cards)
                await player.addJudge("gblingming_" + next.target.name, next.target)
            }
        },
        subSkill: {
            effect: {
                audio: false,
                onremove: true,
                forced: true,
                trigger: {
                    player: "useCard"
                },
                filter(event, player) {
                    return event.card.isCard && event.cards.length == 1 && player.getStorage("gblingming_effect").includes(event.cards[0])
                },
                async content(event, trigger, player) {
                    trigger.directHit.addArray(game.filterPlayer())
                    game.log(trigger.card, "不可被响应")
                }
            }
        }
    },
    gbzhaying: {
        audio: "ext:GirlsBand/audio/skill:4",
        locked: true,
        audioname2: { "gb_sp_mortis": [6, 7, 8].map(i => "ext:GirlsBand/audio/skill/gbzhaying" + i) },
        trigger: {
            global: ["chooseToDebateBegin", "chooseToEnsembleBegin"],
            target: "chooseToCompareBegin",
            player: "chooseToCompareBegin"
        },
        filter(event, player, name) {
            if (event.name == "chooseToCompare") return player.countCards("j")
            return event.list.includes(player) && player.countCards("j")
        },
        derivation: "gbwuwang",
        async cost(event, trigger, player) {
            event.result = await player.chooseButton([`###${get.prompt(event.skill)}###选择${event.triggername != "chooseToEnsembleBegin" ? "一" : "任意"}张牌作为${event.triggername == "chooseToDebateBegin" ? "议事" : event.triggername == "chooseToEnsembleBegin" ? "合奏" : "拼点"}结果。`, [player.getCards("j"), "card"]], true, event.triggername != "chooseToEnsembleBegin" ? 1 : [1, Infinity])
                .set("ai", (button) => {
                    let ai = _status.event.getParent(4).ai
                    if (ai) return ai(button.link)
                    switch (_status.event.getParent(evt => ["chooseToEnsemble", "chooseToDebate", "chooseToCompare"].includes(evt.name), true)?.name) {
                        case "chooseToEnsemble":
                            if (6 - get.value(button.link)) return Math.random() < 0.3
                            break
                        case "chooseToDebate":
                            return Math.random()
                        case "chooseToCompare":
                            if (_status.event.getParent(4).small) return -button.link.number
                            return button.link.number
                    }
                })
                .set("source", _status.event.getParent(4).player)
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
        },
        group: ["gbzhaying_1", "gbzhaying_2"],
        subSkill: {
            1: {
                audio: "gbzhaying",
                forced: true,
                trigger: {
                    player: "phaseBegin"
                },
                filter(event, player) {
                    return player.countCards("j")
                },
                async content(event, trigger, player) {
                    let cards = player.getCards("j")
                    player.gain(cards)
                    player.gain(lib.card.ying.getYing(cards.length))
                }
            },
            2: {
                audio: "ext:GirlsBand/audio/skill/gbzhaying5",
                audioname2: { "gb_sp_mortis": "gbzhaying" },
                forced: true,
                trigger: {
                    player: "phaseJieshuBegin"
                },
                mod: {
                    aiOrder(player, card, num) {
                        if (get.name(card) == "ying") return num + 6
                    }
                },
                filter(event, player) {
                    return player.getHistory("lose", evt => evt.getParent("phaseDiscard", true) && evt.cards.some(card => get.name(card) == "ying")).length
                },
                async content(event, trigger, player) {
                    await player.discard(player.getCards("h"))
                    player.addSkill("gbwuwang")
                }
            }
        }
    },
    // SP三角初华
    gbshiqi: {
        audio: "ext:GirlsBand/audio/skill:4",
        locked: true,
        logAudio: index => ("ext:GirlsBand/audio/skill/gbshiqi" + index),
        popup: false,
        trigger: {
            player: "enterGame",
            global: "phaseBefore"
        },
        mark: true,
        marktext: "视",
        intro: {
            name: "视",
            markcount: "expansion",
            content: "expansion"
        },
        onremove: true,
        filter(event, player) {
            return event.name != "phase" || game.phaseNumber == 0;
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(true).set("prompt", `视气：选择一名其他角色`).set("filterTarget", lib.filter.notMe).set("ai", (target) => get.attitude(get.event().player, target)).forResult()
        },
        async content(event, trigger, player) {
            let target = event.targets[0]
            player.logSkill(event.name, target, null, null, [1])
            player.markAuto("gbshiqi_effect", target)
        },
        group: ["gbshiqi_gain", "gbshiqi_effect"],
        subSkill: {
            effect: {
                audio: "ext:GirlsBand/audio/skill/gbshiqi2",
                forced: true,
                trigger: {
                    global: "discardAfter"
                },
                intro: {
                    nocount: true,
                    content: "被$标记"
                },
                filter(event, player) {
                    if (!event.cards || !event.cards.length) return false
                    return event.player == player || player.getStorage("gbshiqi_effect").includes(event.player)
                },
                async content(event, trigger, player) {
                    await player.addToExpansion(trigger.cards, "giveAuto").gaintag.add("gbshiqi")
                }
            },
            gain: {
                audio: [3, 4].map(i => "ext:GirlsBand/audio/skill/gbshiqi" + i),
                forced: true,
                trigger: {
                    player: "phaseUseBegin"
                },
                mod: {
                    ignoredHandcard(card, player) {
                        if (card.gaintag?.includes("gbshiqi")) {
                            return true;
                        }
                    },
                    cardDiscardable(card, player, name) {
                        if (name == "phaseDiscard" && card.gaintag?.includes("gbshiqi")) {
                            return false;
                        }
                    },
                },
                filter(event, player) {
                    return player.hasExpansions("gbshiqi")
                },
                async content(event, trigger, player) {
                    player.gain(player.getExpansions("gbshiqi"), "giveAuto").gaintag.add("gbshiqi")
                }
            },
        }
    },
    gbbeiqiu: {
        audio: "ext:GirlsBand/audio/skill:5",
        logAudio: index => ("ext:GirlsBand/audio/skill/gbbeiqiu" + index),
        log: false,
        enable: "phaseUse",
        filter(event, player) {
            return !player.hasExpansions("gbbeihua") && player.countSkill("gbbeiqiu") < 3
        },
        selectTarget: 1,
        filterTarget(card, player, target) {
            if (player == target) return false
            return target.canUse({ name: "guohe" }, player)
        },
        ai2(target) {
            let player = get.player()
            if (game.hasPlayer(target => get.effect(player, { name: "guohe" }, target, player) > 0)) return get.effect(player, { name: "guohe" }, target, player)
            return -1 / get.effect(player, { name: "guohe" }, target, player)
        },
        async content(event, trigger, player) {
            player.logSkill(event.name, event.target, null, null, [get.rand(1, 3)])
            await player.draw()
            await event.targets[0].useCard({ name: "guohe" }, player)
        },
        ai: {
            order(skill, player) {
                if (player.isDamaged() && player.hasCard("tao")) {
                    return get.order({ name: "tao" }, player) - 1
                }
                if (player.hasCard("wuzhong")) return get.order({ name: "wuzhong" }, player) - 1
                return 9
            },
            result: {
                target: -1
            }
        },
        group: "gbbeiqiu_has",
        subSkill: {
            has: {
                audio: [4, 5].map(i => "ext:GirlsBand/audio/skill/gbbeiqiu" + i),
                enable: "phaseUse",
                filter(event, player) {
                    return player.hasExpansions("gbbeihua") && player.countSkill("gbbeiqiu") < 3
                },
                ai1(card) {
                    return true
                },
                filterCard: { name: "ying" },
                async content(event, trigger, player) {
                    await player.recast(event.cards)
                    let { links, targets: [target] } = await player.chooseButtonTarget()
                        .set("createDialog", ["背丘：获得一张『华』并对一名角色使用火攻", [player.getExpansions("gbbeihua"), "card"]])
                        .set("forced", true)
                        .set("filterTarget", (card, player, target) => player.canUse({ name: "huogong" }, target))
                        .set("ai1", (button) => {
                            let val = get.value(button.link)
                            if (!player.countCards("h", card => card.suit == button.link.suit)) val += 1
                            return val
                        })
                        .set("ai2", target => get.effect(target, { name: "huogong" }, get.player(), get.player()))
                        .forResult()
                    await player.gain(links, "bySelf", "giveAuto", "log")
                    await player.useCard(target, { name: "huogong" })
                },
                ai: {
                    order: 10,
                    result: {
                        player: 1
                    }
                },
            }
        }
    },
    gbduoxin: {
        audio: "ext:GirlsBand/audio/skill:2",
        juexingji: true,
        skillAnimation: true,
        animationColor: "gbmujica",
        forced: true,
        trigger: {
            player: "phaseJieshu"
        },
        filter(event, player) {
            return player.countCards("h") > player.hp
        },
        derivation: ["gbbeihua", "gbchenggu"],
        async content(event, trigger, player) {
            player.awakenSkill(event.name)
            await player.gain(player.getExpansions("gbshiqi"), "giveAuto")
            await player.recover()
            player.removeSkill("gbshiqi")
            player.addSkill("gbbeihua")
            player.addSkill("gbchenggu")
        },
    },
    gbxuanjuan: {
        audio: "ext:GirlsBand/audio/skill:2",
        trigger: {
            global: "phaseBefore",
            player: "enterGame",
        },
        forced: true,
        filter(event, player) {
            return event.name != "phase" || game.phaseNumber == 0;
        },
        async content(event, trigger, player) {
            let num = 0;
            for (let i = 1; i <= 5; i++) {
                if (player.hasEnabledSlot(i)) {
                    player.disableEquip(i);
                    num++;
                    if (i == 3 && get.is.mountCombined()) num++
                }
            }
            if (num > 0) player.draw(num)
        },
        mod: {
            globalFrom(from, to, distance) {
                if (_status.currentPhase == from) return 1
            },
            suit(card, suit) {
                if (get.type(card) == "equip") return "heart";
            },
            ignoredHandcard(card, player) {
                if (get.type(card) == "equip") return true;
            }
        },
    },
    gbzhuxin: {
        audio: "ext:GirlsBand/audio/skill:4",
        forced: true,
        trigger: {
            player: ["useCard", "discard"]
        },
        direct: true,
        filter(event, player, name) {
            if (name == "useCard") return true
            return event.discarder == player
        },
        async content(event, trigger, player) {
            let list = ["选项一", "选项二", "选项三"];
            let used = player.getStorage("gbzhuxin_used");
            list.removeArray(used);
            if (list.length == 0) {
                return;
            }
            player.logSkill("gbzhuxin");
            let result = await player.chooseTarget("逐心：选择一名角色", true)
                .set('filterTarget', (card, player, target) => {
                    if (_status.event.controls.includes("选项三")) return true
                    return target.countCards("he") > 0
                })
                .set("controls", list)
                .set("ai", (target) => {
                    return -get.attitude(get.event().player, target)
                })
                .forResult()
            if (result.bool) {
                let target = result.targets[0];
                if (!target.countCards("he")) list.removeArray(["选项一", "选项二"])
                let choice = await target.chooseControl(list)
                    .set("prompt", "逐心")
                    .set("choiceList", [
                        "弃置一张牌。若此牌花色为❤️，" + get.translation(player) + "摸一张牌",
                        "展示一张牌，若此牌花色不为❤️，你弃置此牌",
                        "令" + get.translation(player) + "恢复一个装备栏，若均已恢复，则你展示所有手牌，然后令其获得其中的非❤️️牌"
                    ])
                    .set("ai", () => {
                        let player = get.player();
                        let source = _status.event.getParent().player;
                        let controls = get.event().controls;
                        if (controls.includes("选项三") && source.countDisabledSlot() > 1) return "选项三"
                        if (controls.includes("选项二") && player.hasCard({ suit: "heart" }, "he")) return "选项二"
                        if (controls.includes("选项一")) return "选项一"
                        if (controls.includes("选项二")) return "选项二"
                        if (controls.includes("选项三")) return "选项三"

                        return controls.randomGet();
                    })
                    .forResult();
                game.log(target, "选择了", "#g【逐心】", "的", "#y" + choice.control)
                if (choice.control) {
                    player.markAuto("gbzhuxin_used", choice.control)
                    player.addTempSkill("gbzhuxin_used")
                    if (choice.control == "选项一") {
                        let discard = await target.chooseToDiscard("he", true)
                            .set("ai", card => {
                                let player = get.player()
                                let source = _status.event.getParent().player
                                let val = -get.value(card)
                                if (get.attitude(player, source) > 0) {
                                    if (get.suit(card) == "heart") val += 1
                                } else {
                                    if (get.suit(card) == "heart") val -= 1
                                }
                            })
                            .forResult()
                        if (discard.bool && discard.cards.length && get.suit(discard.cards[0]) == "heart") {
                            player.draw()
                        }
                    } else if (choice.control == "选项二") {
                        let show = await target.chooseCard("请展示一张牌", "he", true)
                            .set("ai", card => {
                                if (get.suit(card) == "heart") return 10
                                return 1
                            })
                            .forResult();
                        if (show.bool) {
                            target.showCards(show.cards);
                            if (get.suit(show.cards[0]) != "heart") {
                                await player.discard(show.cards);
                            }
                        }
                    } else if (choice.control == "选项三") {
                        if (player.hasDisabledSlot()) await player.chooseToEnable().forResult()
                        if (!player.hasDisabledSlot()) {
                            target.showCards(target.getCards("h"));
                            let cards = target.getCards("h").filter(card => get.suit(card) != "heart");
                            if (cards.length) {
                                await player.gain(cards, "giveAuto")
                            }
                        }
                    }
                }
            }
        },
        subSkill: {
            used: {
                onremove: true,
            }
        }
    },
    gbtongxin: {
        audio: "ext:GirlsBand/audio/skill:2",
        zhuSkill: true,
        trigger: {
            player: "phaseBegin"
        },
        forced: true,
        locked: false,
        filter(event, player) {
            return player.hasDisabledSlot()
        },
        async content(event, trigger, player) {
            let count = game.countPlayer(p => p.group == player.group && p != player) + 1
            if (count > 0) {
                await player.chooseToEnable(count)
            }
        }
    },
    gbfuxin: {
        audio: "ext:GirlsBand/audio/skill:2",
        trigger: {
            player: "loseAfter"
        },
        filter(event, player) {
            if (_status.currentPhase == player) return false;
            return event.cards.some(card => get.suit(card) == "heart" && card.original != "x")
        },
        forced: true,
        async content(event, trigger, player) {
            let current = _status.currentPhase
            var result = await player.chooseCard("he", true, "抚心：重铸一张牌").forResult();
            await player.recast(result.cards)
            if (current) {
                var result = await current.chooseCard("he", true, "抚心：重铸一张牌").forResult();
                await current.recast(result.cards)
            }
        },
        group: "gbfuxin_show",
        subSkill: {
            show: {
                audio: false,
                direct: true,
                trigger: {
                    player: ["gameDrawAfter", "gainAfter"]
                },
                async content(event, trigger, player) {
                    let cards = player.getCards("h")
                    player.addShownCards(cards, "visible_gbfuxin")
                }
            }
        }
    },
    gbxiongyi: {
        audio: "ext:GirlsBand/audio/skill:3",
        mark: true,
        marktext: "翼",
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        trigger: {
            player: ["useCardAfter", "respondAfter"]
        },
        filter(event, player) {
            if (event.getParent("gbxiongyi", true)) return false
            return event.cards.some(card => card.original == "h")
        },
        forced: true,
        async content(event, trigger, player) {
            let cards = trigger.cards.filter(card => card.original == "h")
            let next = player.addToExpansion(cards, "giveAuto")
            next.gaintag.add("gbxiongyi")
            await next
        },
        group: ["gbxiongyi_end"],
        subSkill: {
            end: {
                audio: "gbxiongyi",
                charlotte: true,
                trigger: {
                    global: "phaseEnd"
                },
                async cost(event, trigger, player) {
                    event.result = await player.chooseCard("熊翼：重铸一张牌", "he").forResult();
                },
                async content(event, trigger, player) {
                    await player.recast(event.cards)
                    let target = trigger.player;
                    let cards = player.getExpansions("gbxiongyi");
                    if (cards.length && cards.some(card => player.canUse(card, target, true, true))) {
                        let result = await player.chooseButton(["熊翼：对" + get.translation(target) + "使用一张『翼』", [cards, "vcard"]], true)
                            .set("filterButton", button => {
                                let player = get.player()
                                let target = _status.currentPhase
                                return player.canUse(button.link, target, true, true)
                            })
                            .forResult();
                        if (result.bool) {
                            let card = result.links[0]
                            await player.useCard(card, target)
                        }
                    }
                }
            }
        }
    },
    gbmeilv: {
        audio: "ext:GirlsBand/audio/skill:4",
        forced: true,
        trigger: {
            player: "addToExpansionAfter"
        },
        filter(event, player) {
            return player.countExpansions("gbxiongyi") >= 4
        },
        async content(event, trigger, player) {
            let cards = player.getExpansions("gbxiongyi")
            await player.showCards(cards)
            await player.discard(cards)
            let suits = cards.map(card => get.suit(card))
            let numbers = cards.map(card => get.number(card))
            let uniqueSuits = new Set(suits).size
            let uniqueNumbers = new Set(numbers).size
            let bool = false
            if (uniqueSuits == cards.length) {
                await player.gainMaxHp()
                await player.draw()
                bool = true
            }
            if (uniqueNumbers == cards.length) {
                let result = await player.choosePlayerCard("美律：重铸自身区域内的一张牌", "hej", player, true).forResult()
                if (result && result.bool) await player.recast(result.cards)
                bool = true
            }
            if (uniqueSuits == 1 || uniqueNumbers == 1) {
                let num = player.maxHp - player.countCards("h")
                if (num > 0) await player.draw(num)
                else if (num < 0) await player.chooseToDiscard("h", -num, true)
                bool = true
            }
            if (!bool) {
                await player.loseMaxHp()
                await player.draw(3)
            }
        }
    },
    gbmenghuan: {
        audio: "ext:GirlsBand/audio/skill:4",
        trigger: {
            target: "useCardToTarget",
            player: ["useCard", "respond"]
        },
        mod: {
            cardUsable(card, player, num) {
                if (player.isDying() && get.name(card, player) == "jiu") return false
            }
        },
        filter(event, player) {
            if (event.name == "useCard" || event.name == "respond") {
                return _status.currentPhase != player;
            }
            return true;
        },
        forced: true,
        async content(event, trigger, player) {
            await player.turnOver();
            let result = await player.chooseCard("梦幻：重铸一张牌", "he", true)
                .set("ai", card => {
                    let val = -get.value(card)
                    if (get.suit(card) == "heart") val += 8
                    return val
                }).forResult();
            if (result.bool && result.cards.length) {
                let card = result.cards[0];
                await player.recast(card)
                if (get.suit(card) == "heart") {
                    await player.draw(2);
                }
            }
        }
    },
    gbxundan: {
        audio: "ext:GirlsBand/audio/skill:4",
        forced: true,
        trigger: {
            player: "useCard0"
        },
        mod: {
            cardUsable(card, player, num) {
                if (!player.isTurnedOver() && get.type(card) != "basic") return Infinity
            },
            cardname(card, player, name) {
                if (!player.isTurnedOver() && lib.card[card.name].type != "basic") return "jiu"
            },
        },
        filter(event, player) {
            if (player.isTurnedOver() && get.type(event.card) == "equip") return true
            return event.card && get.name(event.card) == "jiu" && event.modSkill?.cardname == "gbxundan"
        },
        async content(event, trigger, player) {
            if (player.isTurnedOver() && get.type(trigger.card) == "equip") {
                await player.chooseUseTarget({ name: "tuixinzhifu" }).set("filterTarget", (card, player, target) => get.distance(player, target) <= 1)
            }
            else {
                trigger.addCount = false
                player.getStat().card.jiu--
            }
        },
    },
    gbmitu: {
        audio: "ext:GirlsBand/audio/skill:2",
        trigger: {
            player: "useCardToPlayer",
            target: "useCardToTarget"
        },
        forced: true,
        filter(event, player) {
            if (event.name == "useCardToPlayer" && event.targets.length != 1) return false;
            return event.target != player || event.player != player
        },
        async content(event, trigger, player) {
            let list = []
            if (game.hasPlayer(current => {
                return current != player && !trigger.targets.includes(current) && trigger.player.canUse(trigger.card, current, false, false)
            })) {
                list.push("选项一")
            }
            list.push("选项二")
            let other = player == trigger.player ? trigger.target : trigger.player;
            let choice = await player.chooseControl(list)
                .set("choiceList", [`从你的上家或下家开始，令你与${get.translation(other)}之间的所有角色均成为此牌目标`, "摸一张牌，本回合你和其他角色之间计算距离时+1"])
                .set("source", trigger.player)
                .set("target", trigger.target)
                .set("card", trigger.card)
                .set("ai", () => {
                    let evt = _status.event
                    let card = evt.card
                    let target = evt.target
                    let source = evt.source
                    let player = evt.player
                    let pre = 0
                    let next = 0
                    let current = source;
                    while (current != target) {
                        current = current.previous;
                        if (current != target && source.canUse(card, current, false, false)) {
                            pre += get.effect(current, card, source, player);
                        }
                        if (current == source) break;
                    }
                    current = source;
                    while (current != target) {
                        current = current.next;
                        if (current != target && source.canUse(card, current, false, false)) {
                            next += get.effect(current, card, source, player);
                        }
                        if (current == source) break;
                    }
                    if (pre > 1 || next > 1) return "选项一"
                    return "选项二"
                })
                .forResult()
            game.log(player, "选择了", "#g【迷途】", "的", "#y" + choice.control);
            if (choice.control == "选项一") {
                let next = await player.chooseControl("上家", "下家")
                    .set("prompt", `迷途：选择起始角色`)
                    .set("source", trigger.player)
                    .set("target", trigger.target)
                    .set("card", trigger.card)
                    .set("ai", () => {
                        let evt = _status.event
                        let card = evt.card
                        let target = evt.target
                        let source = evt.source
                        let player = evt.player
                        let pre = 0
                        let next = 0
                        let current = source;
                        while (current != target) {
                            current = current.previous;
                            if (current != target && source.canUse(card, current, false, false)) {
                                pre += get.effect(current, card, source, player);
                            }
                            if (current == source) break;
                        }
                        current = source;
                        while (current != target) {
                            current = current.next;
                            if (current != target && source.canUse(card, current, false, false)) {
                                next += get.effect(current, card, source, player);
                            }
                            if (current == source) break;
                        }
                        if (pre > next) return "上家"
                        return "下家"
                    })
                    .forResult();
                game.log(player, "选择了", "#g【迷途】", "的", "#y" + next.control)
                var targetNext = trigger.player
                while (targetNext != trigger.target) {
                    targetNext = next.control == "上家" ? targetNext.previous : targetNext.next
                    trigger.getParent().targets.add(targetNext)
                }
            } else {
                player.draw();
                player.addTempSkill("gbmitu_dist");
            }
        },
        subSkill: {
            dist: {
                mod: {
                    globalFrom: (from, to, num) => num + 1,
                    globalTo: (from, to, num) => num + 1,
                }
            }
        }
    },
    gbxinglu: {
        audio: "ext:GirlsBand/audio/skill:2",
        locked: true,
        trigger: {
            target: "useCardToTarget"
        },
        filter(event, player) {
            if (event.player == player) return false
            return get.suit(event.card) == "heart"
        },
        mod: {
            cardUsable(card, player, num) {
                if (get.suit(card) == "heart") return Infinity;
            },
            targetInRange(card, player, target) {
                if (get.suit(card) == "heart") return true;
            }
        },
        check(event, player) {
            if (get.attitude(player, event.player) > 0) return true
        },
        async content(event, trigger, player) {
            let current = trigger.player
            if (current) {
                current.draw();
                current.addTempSkill("gbxinglu_buff");
            }
        },
        subSkill: {
            buff: {
                mod: {
                    cardUsable(card, player, num) {
                        if (get.name(card) == "sha") return num + 1;
                    }
                }
            }
        }
    },
    gbbenxi: {
        audio: "ext:GirlsBand/audio/skill:3",
        locked: true,
        trigger: {
            player: "useCard"
        },
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(get.prompt2(event.skill))
                .set("filterTarget", (c, p, t) => get.distance(p, t) <= 1 && t.countCards("he"))
                .set("ai", target => {
                    let player = get.player()
                    if (target == player) return player.countCards("he", card => get.value(card) <= 5) / 2
                    if (get.attitude(player, target) < 0) return target.countCards("he", card => get.value(card) > 4)
                    return 1
                })
                .forResult();
        },
        async content(event, trigger, player) {
            let target = event.targets[0];
            let cardResult = await player.choosePlayerCard(target, "he", true).forResult();
            if (cardResult.bool) {
                let card = cardResult.cards[0];
                target.showCards(card);
                target.discard(card);
                if (get.suit(card) == "heart") {
                    player.draw()
                } else {
                    target.addMark("gbbenxi_draw", 1, false);
                    target.addTempSkill("gbbenxi_draw");
                }

            }
        },
        subSkill: {
            draw: {
                audio: "gbbenxi",
                forced: true,
                onremove(player, skill) {
                    player.draw(player.countMark(skill))
                    player.removeStorage(skill)
                }
            }
        }
    },
    gbjinhuan: {
        audio: "ext:GirlsBand/audio/skill:3",
        trigger: {
            player: "useCard"
        },
        forced: true,
        firstDo: true,
        mod: {
            ignoredHandcard(card, player) {
                if (get.suit(card) == "heart") return true;
            },
            cardUsable(card, player, num) {
                if (get.suit(card) == "heart") return Infinity;
            }
        },
        async content(event, trigger, player) {
            if (_status.currentPhase == player) {
                player.addMark("gbjinhuan_dist")
                player.addTempSkill("gbjinhuan_dist", { global: "roundStart" })
            }
            if (get.suit(trigger.card) == "heart") {
                trigger.addCount = false;
                player.getStat().card[trigger.card.name]--
                trigger.directHit.addArray(game.filterPlayer());
                game.log(trigger.cards, "不可被响应");
            }
        },
        subSkill: {
            dist: {
                onremove: true,
                mod: {
                    globalFrom(from, to, num) {
                        return num - from.countMark("gbjinhuan_dist")
                    }
                }
            }
        }
    },
    // --- 户山香澄 ---
    gbshanyao: {
        audio: false,
        trigger: {
            global: "roundStart",
        },
        filter(event, player) {
            return true
        },
        forced: true,
        async content(event, trigger, player) {
            let players = game.filterPlayer().sortBySeat();
            for (let p of players) {
                let result = await p.chooseBool("闪耀：是否将牌堆顶的一张牌视为【闪电】置入判定区？")
                    .set("ai", () => {
                        let player = get.event().player
                        let source = get.event().source
                        if (get.effect(player, { name: "shandian" }, player, player) > 0) return 1
                        if (get.attitude(player, source) > 0) return 1
                        return Math.random() > 0.8
                    })
                    .set("source", player)
                    .forResult();
                if (result.bool) {
                    if (!p.canAddJudge({ name: "shandian" })) continue
                    let card = get.cards()
                    game.cardsGotoOrdering(card)
                    if (card) {
                        p.addJudge({ name: "shandian" }, card)
                    }
                }
            }
        },
        group: ["gbshanyao_gain"],
        subSkill: {
            gain: {
                trigger: { player: "useCardToPlayer" },
                filter(event, player) {
                    return get.tag(event.card, "damage") > 0 && !event.target.countCards("j", { name: "shandian" });
                },
                logTarget: "target",
                async content(event, trigger, player) {
                    await player.gainPlayerCard(trigger.target, "hej", true);
                }
            },
        }
    },
    gbjidong: {
        audio: false,
        trigger: { global: "phaseBegin" },
        forced: true,
        derivation: ["guidao", "qiangxi", "tiaoxin", "guanxing"],
        filter(event, player) {
            return event.player.countCards("j") > 0
        },
        async content(event, trigger, player) {
            let target = trigger.player;
            let result = await target.chooseButton(
                ["悸动：选择其中一项",
                    [[
                        [1, "摸一张牌并跳过判定阶段与摸牌阶段，然后获得〖强袭〗、〖挑衅〗持续至回合结束"],
                        [2, "摸两张牌，然后令" + get.translation(player) + "获得〖鬼道〗持续至回合结束"],
                        [3, "令" + get.translation(player) + "摸一张牌，然后你可弃置判定区内的一张牌。"],
                        [4, "令" + get.translation(player) + "摸两张牌，然后你获得〖观星〗持续至回合结束。"],
                    ], "textbutton"]
                ]
                , true)
                .set("ai", (button) => {
                    let player = get.event().player
                    let source = get.event().source
                    if (get.attitude(player, source) > 0) {
                        if (player.countCards("j", card => get.name(card) != "shandian")) return button.link == 3
                        return button.link == 4
                    }
                    else if (player.countCards("j")) return button.link == 1
                    else return button.link == 2
                })
                .set("source", player)
                .forResult();
            game.log(target, "选择了", "#g【悸动】", "的", "#y" + "选项" + get.cnNumber(result.links[0], true))
            switch (result.links[0]) {
                case 1:
                    target.draw();
                    target.skip("phaseJudge");
                    target.skip("phaseDraw");
                    target.addTempSkill("qiangxi");
                    target.addTempSkill("tiaoxin");
                    break;
                case 2:
                    target.draw(2);
                    player.addTempSkill("guidao");
                    break;
                case 3:
                    player.draw();
                    let next = await target.chooseCardButton(target.getCards("j"), true).forResult()
                    target.discard(next.links)
                    break;
                default:
                    player.draw(2);
                    target.addTempSkill("guanxing");
            }
        },
        ai: {
            threaten: 2,
        },
    },
    gbxingdong: {
        audio: false,
        trigger: { player: "gainAfter" },
        direct: true,
        zhuSkill: true,
        filter(event, player) {
            return _status.currentPhase != player && event.cards.length > 0 && game.hasPlayer(p => p != player && p.group == player.group)
        },
        async content(event, trigger, player) {
            let list = new Map()
            for (let i = 0; i < trigger.cards.length; i++) {
                let result = await player.chooseTarget(`星动：是否将 ${get.translation(trigger.cards[i])} 交给...`)
                    .set("filterTarget", (card, player, target) => player != target && target.group == player.group)
                    .forResult();
                if (result?.bool) {
                    let target = result.targets[0];
                    if (!list.has(target)) {
                        list.set(target, []);
                    }
                    list.get(target).push(trigger.cards[i]);
                }
            }
            if (list.size > 0) {
                for (let [target, cards] of list) {
                    player.give(cards, target)
                }
            }
        }
    },

    // --- 市谷有咲 ---
    gbliuxing: {
        audio: false,
        trigger: { player: "damageBegin" },
        forced: true,
        async content(event, trigger, player) {
            if (player.countCards("j")) {
                player.executeDelayCardEffect("shandian")
            } else {
                trigger.cancel()
                player.addJudge({ name: "shandian" }, get.cards())
            }
        }
    },
    gbxingyin: {
        audio: false,
        trigger: { player: "judgeEnd" },
        frequent(event) {
            return event.result.card.name !== "du";
        },
        check(event) {
            return event.result.card.name !== "du";
        },
        filter(event, player) {
            return get.position(event.result.card, true) == "o";
        },
        async content(event, trigger, player) {
            let card = trigger.result.card;
            await player.gain(card, "gain2");
            let { cards, targets: [target] } = await player.chooseCardTarget()
                .set("forced", true)
                .set("prompt", "星引：令一名角色横置/重置并重铸任意张手牌")
                .set("selectCard", [1, Infinity])
                .set("ai2", (target) => {
                    let player = get.event().player
                    if (target.isLinked() && get.attitude(player, target) > 0) return 10
                    if (!target.isLinked() && get.attitude(player, target) < 0) return 1 / target.countCards("h")
                    if (get.attitude(player, target) > 0) return target.countCards("h")
                })
                .forResult();
            await player.recast(cards);
            await target.link();

        }
    },
    gbkami: {
        audio: false,
        trigger: { player: "damageBegin" },
        forced: true,
        filter(event) { return event.nature == "thunder" && event.num > 0 },
        async content(event, trigger, player) {
            trigger.num = 1;
        },
        group: ["gbkami_draw"],
        subSkill: {
            draw: {
                audio: false,
                trigger: { player: "damageAfter" },
                charlotte: true,
                forced: true,
                filter(event) { return event.getParent("shandian", true) && event.num > 0 },
                async content(event, trigger, player) {
                    player.draw(3);
                    let result = await player.chooseCard("卡密：选择一张牌置于牌堆顶", true).set("ai", card => 1 / get.value(card)).forResult()
                    game.cardsGotoPile(result.cards, "insert")
                },
            }
        }
    },

    // --- 花园多惠 ---
    gbhuajing: {
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
        discard(card, noinsert) {
            if (!["hschenzhi_poker", "gb_sking", "gb_bking"].includes(get.name(card))) {
                card.discard(false);
                return;
            }
            if (noinsert) {
                game.cardsGotoSpecial(card, "toPokerDiscarded");
            } else {
                ui.special.appendChild(card);
                _status.pokerPile.splice(get.rand(0, _status.pokerPile.length - 1), 0, card);
                lib.skill.hschenzhi.update();
            }
        },
        audio: false,
        trigger: { global: ["gameDrawBegin", "replaceHandcardsBegin"], },
        forced: true,
        async content(event, trigger, player) {
            if (!trigger.otherPile) {
                trigger.set("otherPile", {});
            }
            trigger.otherPile[player.playerid] = {
                getCards: lib.skill.hschenzhi.getCards,
                discard: lib.skill.gbhuajing.discard,
            };
        },
        group: "gbhuajing_king",
        ai: {
            sortCardByNum: true,
            combo: "gbhuisi",
        },
        subSkill: {
            king: {
                audio: false,
                forced: true,
                trigger: {
                    global: "phaseBefore",
                    player: "enterGame"
                },
                filter(event, player) {
                    return event.name != "phase" || game.phaseNumber == 0
                },
                async content(event, trigger, player) {
                    const card = game.createCard("gb_sking", "none", 0);
                    lib.actualCardName.set("小王", "")
                    player.gain(card)
                }
            }
        }
    },
    gbtuxi: {
        audio: false,
        trigger: { global: "phaseBegin" },
        filter(event, player) { return event.player != player && player.countCards("he") },
        async content(event, trigger, player) {
            let target = trigger.player;
            let list = []
            if (player.countCards("he")) list.addArray(["选项一", "选项二"])
            if (player.countCards("h") && target.countCards("h")) list.push("选项三")
            let result = await target.chooseControl(list)
                .set("choiceList", [
                    "令" + get.translation(player) + "展示一张牌，然后视为对你使用一张【推心置腹】",
                    "令" + get.translation(player) + "展示并交给你一张牌，然后视为对你使用一张【趁火打劫】",
                    "令" + get.translation(player) + "与你交换一张手牌，然后其可以展示你与其的所有手牌",
                ])
                .set("prompt", "兔袭：请选择一项")
                .set("ai", () => {
                    let player = get.event().player
                    let source = get.event().source
                    if (get.attitude(player, source) > 0) return "选项一"
                    if (_status.event.controls.includes("选项三")) return "选项" + get.cnNumber(get.rand(2, 3), true)
                    return "选项二"
                })
                .set("source", player)
                .forResult();
            game.log(target, "选择了", "#g【兔袭】", "的", "#y" + result.control)
            if (result.control == "选项一") {
                let result2 = await player.chooseCard("展示一张牌", "h", true).set("ai", card => get.type(card) == "poker" ? 10 : 1 / get.value(card)).forResult();
                player.showCards(result2.cards);
                if (player.canUse({ name: "tuixinzhifu" }, target, false, false)) player.useCard({ name: "tuixinzhifu" }, target);
            } else if (result.control == "选项二") {
                let result2 = await player.chooseCard("h", "展示并交给" + get.translation(target) + "一张牌", true)
                    .set("ai", card => get.type(card) == "poker" ? (get.name(card) == "gb_sking" ? 9 : 10) : 1 / get.value(card))
                    .forResult();
                player.showCards(result2.cards);
                player.give(result2.cards, target);
                if (player.canUse({ name: "chenghuodajie" }, target, false, false)) player.useCard({ name: "chenghuodajie" }, target);
            } else {
                let result2 = await player.chooseCardOL([player, target], "h", "交换一张手牌", true)
                    .set("ai", card => {
                        let player = get.event().player
                        let source = get.event().source
                        let target = get.event().getParent().target
                        if (player != source) return 1 / get.value(card)
                        if (get.attitude(player, target) > 0) return 1 / get.value(card)
                        else if (get.name(card) == "gb_sking") return 10
                        return 1 / get.value(card)
                    })
                    .set("source", player)
                    .forResult();
                const card1 = result2[0].cards[0];
                const card2 = result2[1].cards[0];
                await player.swapHandcards(target, [card1], [card2]);
                let next = await player.chooseBool("是否展示你与" + get.translation(target) + "的所有手牌")
                    .set("ai", () => true)
                    .forResult()
                if (next.bool) {
                    player.showCards(player.getCards("h"))
                    target.showCards(target.getCards("h"))
                }
            }
        }
    },
    gbhuisi: {
        audio: false,
        trigger: {
            global: "showCardsBegin"
        },
        forced: true,
        filter(event, player) {
            if (event.player == player) return event.cards.some(card => get.type(card) == "poker")
            return event.cards.some(c => get.type(c) == "poker" && c.name == "gb_sking")
        },
        mod: {
            aiValue(player, card, num) {
                if (get.type(card) == "poker") return num + 7
            }
        },
        async content(event, trigger, player) {
            if (trigger.player == player) {
                player.draw();
            } else {
                trigger.player.loseHp();
            }
        },
        group: "gbhuisi_end",
        subSkill: {
            end: {
                trigger: { global: "roundEnd" },
                forced: true,
                async content(event, trigger, player) {
                    let num = 4 - player.countCards("h", card => get.type(card) == "poker")
                    if (num <= 0) return
                    let cards = lib.skill.hschenzhi.getCards(num)
                    if (cards && cards.length) await player.gain(cards, "gain2")
                }
            }
        }
    },

    // --- 牛込里美 ---
    gbqiaoluo: {
        audio: false,
        trigger: { global: "judgeEnd" },
        zhuanhuanji: true,
        forced: true,
        mark: true,
        marktext: "☯",
        intro: {
            content(storage, player, skill) {
                if (!player.storage[skill]) {
                    return "锁定技，转换技，当一名角色的判定牌生效后，你摸一张牌并展示一张牌，此牌视为雷【杀】且无距离限制。"
                } else {
                    return "锁定技，转换技，当一名角色的判定牌生效后，你获得判定牌并展示一张牌，此牌视为火【杀】且可以额外指定一个目标。"
                }
            }
        },
        async content(event, trigger, player) {
            if (!player.storage.gbqiaoluo) {
                player.draw();
                let result = await player.chooseCard("巧螺：展示一张牌令其视为雷【杀】", "h", true)
                    .set("ai", card => -get.value(card))
                    .set("filterCard", card => !card.hasGaintag("gbqiaoluo_thunder"))
                    .forResult();
                if (result.bool) {
                    player.showCards(result.cards);
                    player.addGaintag(result.cards, "gbqiaoluo_thunder")
                }
            } else {
                player.gain(trigger.result.card, "gain2");
                let result = await player.chooseCard("展示一张牌令其视为火【杀】", "h", true)
                    .set("ai", card => -get.value(card))
                    .set("filterCard", card => !card.hasGaintag("gbqiaoluo_fire"))
                    .forResult();
                if (result.bool) {
                    player.showCards(result.cards);
                    player.addGaintag(result.cards, "gbqiaoluo_fire")
                }
            }
            player.changeZhuanhuanji("gbqiaoluo")
        },
        group: ["gbqiaoluo_fire", "gbqiaoluo_thunder"],
        subSkill: {
            fire: {
                mod: {
                    cardname(card, player) {
                        if (get.itemtype(card) && card.hasGaintag("gbqiaoluo_fire")) return "sha"
                    },
                    cardnature(card, player, nature) {
                        if (get.itemtype(card) && card.hasGaintag("gbqiaoluo_fire")) return "fire";

                    },
                    selectTarget(card, player, range) {
                        if (get.name(card) == "sha") {
                            if (card.cards?.length == 1 && card.cards[0].hasGaintag("gbqiaoluo_fire")) range[1] += 1
                        }
                    }
                },
            },
            thunder: {
                mod: {
                    cardname(card, player) {
                        if (get.itemtype(card) && card.hasGaintag("gbqiaoluo_thunder")) return "sha"
                    },
                    cardnature(card, player, nature) {
                        if (get.itemtype(card) && card.hasGaintag("gbqiaoluo_thunder")) return "thunder";

                    },
                    targetInRange(card, player, target) {
                        if (get.name(card) == "sha") {
                            if (card.cards?.length == 1 && card.cards[0].hasGaintag("gbqiaoluo_thunder")) return true
                        }
                    }
                },
            }
        }
    },
    gbkuangniu: {
        audio: false,
        locked: true,
        trigger: { player: "useCardToPlayered" },
        filter(event) { return get.name(event.card) == "sha" && event.isFirstTarget },
        check(event, player) {
            if (event.targets.some(target => target.mayHaveShan() || target.hasSkill("bagua_skill"))) return player.maxHp > 1
            return true
        },
        async content(event, trigger, player) {
            await player.executeDelayCardEffect("shandian")
            player.when("useCardAfter")
                .filter((event, player) => {
                    return event.card == trigger.card
                })
                .then(() => {
                    if (player.hasHistory("sourceDamage", evt => evt.card == trigger.card)) {
                        player.gainMaxHp()
                        player.recover()
                    } else {
                        player.loseMaxHp()
                    }
                })
        },
    },
    gbxingli: {
        audio: false,
        trigger: { player: "damageBegin" },
        forced: true,
        filter(event) { return event.getParent("shandian", true) },
        async content(event, trigger, player) {
            trigger.cancel();
            player.loseMaxHp(4);
        },
        group: ["gbxingli_effect"],
        subSkill: {
            effect: {
                trigger: { player: "loseMaxHpAfter" },
                forced: true,
                getIndex(event, player) { return event.num },
                async content(event, trigger, player) {
                    player.draw();
                    player.addMark("gbxingli_extra", 1, false)
                    player.addTempSkill("gbxingli_extra");
                }
            },
            extra: {
                onremove: true,
                intro: {
                    content: "本回合使用【杀】的次数+#"
                },
                mod: {
                    cardUsable(card, player, num) {
                        if (get.name(card) == "sha") return num + player.countMark("gbxingli_extra")
                    }
                }
            }
        }
    },

    // --- 山吹沙绫 ---
    gbqiaoyou: {
        audio: false,
        trigger: { player: "useCardToPlayered" },
        filter(event) { return get.name(event.card) == "sha" || get.name(event.card) == "juedou" },
        check(event, player) {
            let target = event.target
            if (player.countCards("j") != 0 && get.attitude(player, target) > 0) return target.countCards("j")
            return true
        },
        async content(event, trigger, player) {
            if (player.countCards("j") == 0) {
                if (trigger.target.countCards("he")) {
                    let result = await player.choosePlayerCard("巧诱：选择一张牌视为【闪电】置入判定区", trigger.target, "he", true).set("ai", button => get.value(button.link)).forResult();
                    player.addJudge({ name: "shandian" }, result.cards);
                }
            } else {
                player.gainPlayerCard(trigger.target, "hej", true);
            }
        }
    },
    gbshanqian: {
        trigger: { player: "gainAfter" },
        forced: true,
        locked: false,
        filter(event, player) { return event.cards.length > 0 && player.isPhaseUsing() },
        async content(event, trigger, player) {
            player.addGaintag(trigger.cards, "gbshanqian")
        },
        mod: {
            selectTarget(card, player, range) {
                if (get.name(card) == "sha" || get.name(card) == "juedou") range[1] += 1
            },
        },
        group: "gbshanqian_use",
        subSkill: {
            use: {
                enable: ["chooseToRespond", "chooseToUse"],
                filter(event, player) {
                    return player.hasCard(card => card.hasGaintag("gbshanqian"))
                },
                filterCard(card, player) {
                    return card.hasGaintag("gbshanqian")
                },
                viewAs: "sha"
            }
        }
    }
}
export default skills;