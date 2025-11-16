import { lib, game, ui, get, ai, _status } from "../../../noname.js";
/** @type { importCharacterConfig['skill'] } */
const skills = {
    // 丸山彩
    gbwuyin: {
        audio: false,
        enable: "phaseUse",
        usable: 1,
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
                    if (option == "选项五") {
                        let count = player.countSkill("gbtiancai")
                        if (player.countCards("h") > count) {
                            list.push(option);
                        }
                    } else {
                        list.push(option);
                    }
                }
            }
            let result = await player.chooseControl(list)
                .set("prompt", "五音")
                .set("choiceList", [
                    "当你使用牌时，若你于本回合的出牌阶段内使用的所有牌的点数均为严格递增，你摸一张牌",
                    "当你使用牌时，若此牌点数小于你使用的上一张牌，你可以重铸一名角色的一张牌",
                    "当你使用【杀】或普通锦囊牌时，你可以令一名其他角色成为此牌的目标",
                    "当你对其他角色造成伤害时，你可以防止此伤害并获得其一张牌（每回合每名角色限一次）",
                    "弃置X张牌并摸3张牌（X为你本回合〖添彩〗发动的次数）"
                ])
                .set("ai", () => {
                    let player = _status.event.player
                    let used = player.getHistory("useCard", evt => evt.isPhaseUsing(player))
                    let control = {
                        选项一: player.getCards("hs", card => player.hasValueTarget(card)).map(card => card.number).sort((a, b) => a - b).filter((n, i, a) => i === 0 || n !== a[i - 1]) > 1 && (used.every((evt, i) => i == 0 || evt.card.number > used[i - 1].card.number) || used.length == 0) ? 9 : 0,
                        选项二: player.getCards("hs", card => player.hasValueTarget(card)).map(card => card.number).sort((a, b) => b - a).filter((n, i, a) => i === 0 || n !== a[i - 1]) > 1 ? 8 : 0,
                        选项三: player.getCards("hs", card => card.name == "sha" || get.type(card) == "trick").some(card => game.countPlayer(tar => player.canUse(card, tar, true, true) && get.effect(tar, card, player, player) > 0) > 0) ? 7 : 0,
                        选项四: player.countCards("hs", card => get.tag(card, "damage")) > 1 ? (Math.random() > 0.6 ? 2 : 0) : 0,
                        选项五: player.countSkill("gbtiancai") < 3 ? 10 : 0
                    }
                    return _status.event.controls.sort((a, b) => control[b] - control[a])[0]
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
                    let count = player.countSkill("gbtiancai")
                    if (count > 0) player.chooseToDiscard("五音", `请弃置${count}张牌`, count, "he", true).set("ai", (card) => 4 - get.value(card))
                    player.draw(3)
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
                            if (player.countCards("h") > count) {
                                list.push(option);
                            }
                        } else {
                            list.push(option);
                        }
                    }
                }
                let used = player.getHistory("useCard", evt => evt.isPhaseUsing(player))
                let control = {
                    选项一: player.getCards("hs", card => player.hasValueTarget(card)).map(card => card.number).sort((a, b) => a - b).filter((n, i, a) => i === 0 || n !== a[i - 1]) > 1 && (used.every((evt, i) => i == 0 || evt.card.number > used[i - 1].card.number) || used.length == 0) ? 10 : 0,
                    选项二: player.getCards("hs", card => player.hasValueTarget(card)).map(card => card.number).sort((a, b) => b - a).filter((n, i, a) => i === 0 || n !== a[i - 1]) > 1 ? 10 : 0,
                    选项三: player.getCards("hs", card => card.name == "sha" || get.type(card) == "trick").some(card => game.countPlayer(tar => player.canUse(card, tar, true, true) && get.effect(tar, card, player, player) > 0) > 0) ? 10 : 0,
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
                    if (!player.getStorage("gbwuyin_used").includes("选项三") && (player.getCards("hs", card => card.name == "sha" || get.type(card) == "trick").some(card => game.countPlayer(tar => player.canUse(card, tar, true, true) && get.effect(tar, card, player, player) > 0) > 0))) return 1
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
                        let used = player.getHistory("useCard", evt => evt.isPhaseUsing(player))
                        if (used.length == 0) return num + 10 * (14 - card.number)
                        if (!used.every((evt, i) => i == 0 || evt.card.number > used[i - 1].card.number)) return num
                        if (card.number > used.at(-1).card.number) return num + 10 * (14 - card.number)
                    },
                },
                filter(event, player) {
                    let used = player.getHistory("useCard", evt => evt.isPhaseUsing(player))
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
                    event.result = await player.chooseTarget("五音②", "重铸一名角色的一张牌")
                        .set("ai", function (target) {
                            var player = _status.event.player;
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
                    let next = await player.choosePlayerCard("五音②", "重铸一张牌", event.targets[0], true, "he")
                        .set("ai", button => {
                            let player = _status.event.player
                            let target = _status.event.target
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
                trigger: {
                    player: "useCard"
                },
                filter(event, player) {
                    return event.card.name == "sha" || get.type(event.card) == "trick"
                },
                name: "五音③",
                async cost(event, trigger, player) {
                    event.result = await player.chooseTarget("五音③", "选择一名其他角色成为此牌目标")
                        .set("ai", target => {
                            let player = _status.event.player
                            return get.effect(target, _status.event.getTrigger().card, player, player)
                        })
                        .set("filterTarget", (card, player, target) => player.canUse(_status.event.getTrigger().card, target) && !_status.event.getTrigger().targets.includes(target))
                        .forResult()
                },
                async content(event, trigger, player) {
                    trigger.targets.addArray(event.targets)
                }
            },
            4: {
                audio: false,
                charlotte: true,
                onremove: true,
                trigger: {
                    player: "damageBegin2"
                },
                name: "五音④",
                filter(event, player) {
                    return event.player != player && !player.getStorage(event.name).includes(event.player)
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
                prompt: "防止此伤害并获得其一张牌（每回合每名角色限一次）",
                async content(event, trigger, player) {
                    player.markAuto(event.name, trigger.targets[0])
                    trigger.cancel()
                    player.gainPlayerCard(trigger.targets[0], "he", 1, true)
                }
            },
        }
    },
    gbtiancai: {
        audio: false,
        enable: "phaseUse",
        filterTarget: true,
        filterCard: true,
        selectCard: 1,
        selectTarget: 1,
        position: "he",
        ai1(card) {
            return 5 - get.value(card)
        },
        ai2(target) {
            let player = _status.event.player
            if (target.awakenedSkills.length > 0) return get.sgnAttitude(player, target) > 0
            return 0

        },
        async content(event, trigger, player) {
            let target = event.target
            if (target.group == player.group) {
                target.skills.forEach(skill => {
                    if (!lib.skill[skill].limited) return
                    target.restoreSkill(skill)
                    delete target.getStat("skill")[skill]
                })
            }
        },
        ai: {
            order: 10,
            result: {
                player(player, target, card) {
                    if (player.awakenedSkills.length > 0 && get.value(card) < 5) return 1
                }
            }
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
            event.result = await trigger.player.chooseCard("闪光", "是否交给" + get.translation(player) + "一张牌")
                .set("ai", (card) => {
                    let player = _status.event.player
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
                if (player.hasEnabledSlot(i)) list.push("equip" + i);
            }
            list.sort();
            list = list.map(current => [current, get.translation(current)])
            let next = await player.chooseButton(["请选择废除" + get.translation(player.name) + "的任意个装备栏", [list, "tdnodes"]], true, [1, Infinity])
                .set("ai", (button) => {
                    let player = _status.event.player
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
                            if (player.hasCard({
                                subtype: "equip3"
                            }, "hs")) val += player.hp > 2 ? 5 : 10
                            if (val < 10) return 1
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
                .forResultLinks()
            if (next.includes("equip1")) {
                player.disableEquip(1)
                player.addSkill("gbmeiying_1")
            }

            if (next.includes("equip2")) {
                player.disableEquip(2)
                player.addTempSkill("gbmeiying_2")
            }
            if (next.includes("equip3")) {
                player.disableEquip(3)
                player.draw(3)
            }
            if (next.includes("equip4")) {
                player.disableEquip(4)
                player.addTempSkill('gbmeiying_4')
            }
            if (next.includes("equip5")) {
                player.disableEquip(5)
                player.addTempSkill("gbmeiying_5", {
                    global: 'roundStart'
                })
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
                trigger: {
                    player: "useCard"
                },
                forced: true,
                charlotte: true,
                name: "魅影①",
                filter(event, player) {
                    return event.card.name == "sha"
                },
                async content(event, trigger, player) {
                    player.removeSkill("gbmeiying_1")
                    if (!game.hasPlayer(p => player.canUse({
                        name: "sha"
                    }, p, true) && !trigger.targets.includes(p))) {
                        event.finish()
                        return
                    }
                    let result = await player.chooseTarget("魅影①", "请选择" + get.translation(trigger.card) + "的额外目标", [1, Infinity])
                        .set("filterTarget", (card, player, target) => player.inRange(target) && !_status.event.getTrigger().targets.includes(target))
                        .set("ai", target => {
                            let player = _status.event.player
                            return get.effect(target, !_status.event.getTrigger().card, player, player) > 0
                        })
                        .forResult()
                    if (result && result.bool) {
                        trigger.targets.addArray(result.targets)
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
                    return event.card.name == "sha" && event.target.countCards("hej")
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
                        let player = _status.event.target,
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
                locked: false,
                logTarget: 'targets',
                filter(event, player) {
                    return event.card.name == 'sha' && event.card.isCard && event.cards.length == 1
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
                    return get.type(card, "trick") == "trick"
                },
                selectCard: 1,
                viewAs: {
                    name: "sha",
                    storage: {
                        gbmeiying: true
                    }
                },
                filter(event, player) {
                    return player.countCards("hes", card => get.type(card, "trick") == "trick")
                },
                prompt: "将一张锦囊牌当杀使用或打出",
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
                        if (!player.countCards("hes", card => get.type(card, "trick") == "trick")) return false;
                    },
                    respondSha: true,
                },
            }
        }
    },
    gbbanmian: {
        audio: false,
        forced: true,
        charlotte: true,
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
                return num + [1, 2, 3, 4, 5].map(i => player.hasEnabledSlot(i)).reduce((p, c) => p + c, 0)
            },
        },
        group: "gbbanmian_round",
        subSkill: {
            round: {
                audio: false,
                forced: true,
                charlotte: true,
                trigger: {
                    player: "phaseZhunbei"
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
            let result = await player.chooseControlList("观才", ["令所有已横置角色弃一张牌，然后重置其的武将牌", "令所有未横置角色摸一张牌，然后横置其的武将牌"])
                .set("ai", () => {
                    let player = _status.event.player
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
                        if (next.cards.length > 0 && target == player) bool = true
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
        charlotte: true,
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
                    if (target != player && card.name == "tiesuo" && !target.isLinked()) return 0
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
                            if (card.name == "tiesuo") return 0
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
                        let player = _status.event.player
                        if (player.hasCard({
                            subtype: get.subtype(button.link[2])
                        }, "hs")) return get.equipValue({
                            name: button.link[2]
                        }) - 1
                        return get.equipValue({
                            name: button.link[2]
                        })
                    })
                    .set("filterButton", button => _status.event.player.canEquip({
                        name: button.link[2]
                    }, false))
                    .forResult()
                let result = await player.chooseCard("善器", "将一张手牌当做" + get.translation(next.links[0][2]) + "使用")
                    .set("ai", card => {
                        let player = _status.event.player
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
                player.equip(card)
            } else {
                let next = await player.chooseToDiscard("善器", "重铸装备区中的任意张装备牌", "e", true, [1, Infinity])
                    .forResult()
                player.draw(next.cards.length)
            }
            player.when("chooseToDiscardBegin")
                .filter((event, player) => player.awakenedSkills.includes("gbshanqi") && player.countCards("he", card => get.type(card) != "basic") && ["gbjiyue", "phaseDiscard"].includes(event.getParent().name))
                .then(() => {
                    trigger.ai = (card) => {
                        let player = _status.event.player
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
        charlotte: true,
        trigger: {
            player: "equipAfter"
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget("击乐", "选择一名角色")
                .set("ai", target => {
                    let player = _status.event.player
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
            let num = Math.min(player.countCards("e"), 4)
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
                    let player = _status.event.player
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
                    return event.getParent(3).skill == "gbjiyue" && event.cards.some(card => get.type(card) != "basic")
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
            player: "useCardToPlayer"
        },
        logTarget: "target",
        filter(event, player) {
            return event.card.name == "sha" && event.target.countCards("he")
        },
        check(event) {
            let player = _status.event.player
            return get.attitude(player, event.target) < 0
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name)
            trigger.target.chooseToDiscard(true, "he").set("ai", card => {
                let val = get.value(card)
                if (card.name == "shan") val + 1
                return 6 - val
            })
            player.when("shaEnd")
                .filter((event, player) => event.card == trigger.card)
                .then(() => {
                    if (player.hasHistory("sourceDamage", evt => evt.card == trigger.card)) {
                        player.draw([1, 2, 3, 4, 5].map(i => targetx.countEmptySlot(i)).reduce((p, c) => p + c, 0))
                        event.finish()
                    }
                    else {
                        player.chooseCardTarget("he")
                            .set("prompt", "武道")
                            .set("prompt2", "弃置一张牌并视为对一名其他角色使用杀")
                            .set("filterTarget", (card, player, target) => !player.getStorage("gbwudao_temp").includes(target) && target != player && player.inRange(target))
                            .set("ai2", (target) => get.effect(target, { name: "sha" }, _status.event.player, _status.event.player))
                    }
                })
                .then(() => {
                    if (result && result.bool) {
                        player.discard(result.cards)
                        player.addTempSkill("gbwudao_temp")
                        player.markAuto("gbwudao_temp", result.targets[0])
                        player.useCard({ name: "sha" }, result.targets[0], false)
                    }
                })
                .vars({
                    targetx: trigger.target
                })
        },
        subSkill: {
            temp: {
                onremove: true
            }
        }
    },
    gbdahe: {
        audio: false,
        forced: true,
        charlotte: true,
        trigger: {
            global: "discardBegin"
        },
        filter(event, player) {
            return event.cards.some(card => card.name != "shan") && _status.currentPhase == player
        },
        async content(event, trigger, player) {
            player.restoreSkill("gbwudao")
        }
    },
    gbjixing: {
        audio: false,
        forced: true,
        charlotte: true,
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
        check(event, player) {
            if (player.countCards("he", card => get.value(card) <= 6)) return true
        },
        filter(event, player) {
            return player.countCards("he")
        },
        async content(event, trigger, player) {
            let result = await player.chooseCardTarget("极星", true)
                .set("position", "he")
                .set("filterTarget", lib.filter.notMe)
                .set("selectTarget", [1, 4])
                .set("forced", true)
                .set("prompt", "极星")
                .set("prompt2", "展示并弃置一张牌，然后令至多四名其他角色进行“合奏”")
                .set("ai1", (card) => -get.value(card))
                .set("ai2", (target) => get.attitude(_status.event.player, target) <= 0 ? 10 : 1)
                .forResult()
            if (result) {
                await player.showCards(result.cards)
                await player.discard(result.cards)
                let targets = result.targets
                targets.sortBySeat()
                await player.chooseToEnsemble(targets)
                    .set("ai", (card) => {
                        let player = _status.event.player
                        let source = get.event("source")
                        if (get.attitude(player, source) > 0) return get.value(card) <= 4
                        return get.value(card) <= 0
                    })
                    .set("callback", () => {
                        const { bool, list, cards, targets } = _status.event.ensembleResult
                        let player = _status.event.player
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
                    trigger.num += Math.min(player.countExpansions("gbjixing"), 5)
                },
            }
        }
    },
    gbduomu: {
        audio: false,
        enable: "phaseUse",
        usable: 3,
        filter(event, player) {
            return player.countExpansions("gbjixing")
        },
        chooseButton: {
            dialog(event, player) {
                var list = ["kaihua", "yiyi", "shuiyanqijunx"];
                var dialog = ui.create.dialog("夺目");
                dialog.add("<div class='text center'>选择要视为的牌</div>");
                dialog.add([list, "vcard"]);
                dialog.add("<div class='text center'>选择特殊区的牌</div>");
                dialog.add([player.getExpansions("gbjixing"), "card"]);
                dialog.classList.add("fullheight")
                return dialog
            },
            select: 2,
            filter(button, player) {
                if (ui.selected.buttons.length == 0) {
                    return Array.isArray(button.link) && !player.getStorage("gbduomu_temp").includes(button.link[2]) && _status.event.getParent().filterCard({ name: button.link[2], }, player, _status.event.getParent());
                } else if (ui.selected.buttons.length == 1) {
                    return !Array.isArray(button.link)
                }
            },
            check(button) {
                if (Array.isArray(button.link)) return _status.event.player.getUseValue({ name: button.link[2] })
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
        charlotte: true,
        forced: true,
        trigger: {
            player: "phaseZhunbeiBegin"
        },
        async content(event, trigger, player) {
            if (player.countCards("he")) {
                let result = await player.chooseControl("弃置任意张牌", "失去一点体力").forResult()
                switch (result.control) {
                    case "弃置任意张牌":
                        player.chooseToDiscard(true, [1, Infinity], "he")
                        break
                    case "失去一点体力":
                        player.loseHp()
                        break
                }
            } else {
                player.loseHp()
            }
            let targets = await player.chooseTarget("革面", "选择任意名角色", [1, Infinity], true).forResultTargets()
            for (let target of targets.sortBySeat()) {
                let next = await target.chooseControlList("革面", "将手牌数调整至与" + get.translation(player) + "相同", "令" + get.translation(player) + "摸一张牌，且其本回合可使用【杀】的次数+1", true)
                    .set("ai", () => {
                        let source = get.event("source")
                        let player = get.event("player")
                        let num = source.countCards("h") - player.countCards("h")
                        if (get.attitude(player, source) > 0) return num > 3 ? 0 : 1
                        return num < -1 ? 1 : 0
                    })
                    .set("source", player)
                    .forResult()
                game.log(player, "选择了", "#g【革面】", "的", "#y" + next.control)
                if (next.control == "选项一") {
                    let num = target.countCards("h") - player.countCards("h")
                    if (num > 0) target.chooseToDiscard(true, "h", num)
                    else target.draw(-num)
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
                mod: {
                    cardUsable(card, player, num) {
                        if (card.name == "sha") return num + player.countMark("gbgemian_temp")
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
        filter(event, player) {
            return player.hasSkill("gbkuangchi_temp")
        },
        async content(event, trigger, player) {
            let card = get.cards(1, true)
            await player.showCards(card)
            let result = await player.chooseTarget("狂匙", "选择一名其他角色与你“合奏”", true).set("filterTarget", lib.filter.notMe).set("ai", target => -get.attitude(get.event("player"), target)).forResult()
            if (result) {
                let targets = [player, result.targets[0]]
                player.chooseToEnsemble(targets)
                    .set("ai", (card) => {
                        let player = _status.event.player
                        let source = get.event("source")
                        let att = get.attitude(player, source)
                        if (att < 0) {
                            if (Math.random() < 0.7) return true
                            return false
                        }
                        return false
                    })
                    .set("callback", () => {
                        const { bool, list, cards, targets } = _status.event.ensembleResult
                        let player = _status.event.player
                        let bool1 = true, bool2 = true
                        let temp = cards[0].concat(cards[1])
                        if (temp.every(card => card.name === cards[0][0].name)) {
                            for (let target of targets) target.draw()
                            bool1 = false;
                        }
                        if (temp.every(card => card.number === cards[0][0].name)) {
                            player.gain(cards[1], "giveAuto")
                            bool2 = false
                        }
                        if (bool1 && bool2) {
                            for (let target of targets) {
                                if (target == player) continue
                                target.damage(player)
                                player.markAuto("gbkuangchi_distance", target[1])
                                player.addTempSkill("gbkuangchi_distance")
                            }
                        }
                    })
            }
        },
        group: "gbkuangchi_discard",
        subSkill: {
            discard: {
                audio: false,
                forced: true,
                charlotte: true,
                trigger: {
                    player: "discardBegin"
                },
                filter(event, player) {
                    return event.cards.some(card => get.position(card, true) == "h")
                },
                async content(event, trigger, player) {
                    player.addTempSkill("gbkuangchi_temp", "phaseChange")
                }
            },
            temp: {
                onremove: true
            },
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
        charlotte: true,
        trigger: {
            player: "phaseZhunbeiBegin"
        },
        async content(event, trigger, player) {
            let result = await player.chooseControlList("狂犬", "将体力值调整为1，然后执行一个额外的出牌阶段", "将手牌数调整为1，然后执行一个额外的摸牌阶段", true)
                .set("ai", () => {
                    let player = _status.event.player
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
                    if (num > 0) player.chooseToDiscard(true, "h", num)
                    else player.draw(num)
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
            let player = _status.event.player
            if (get.attitude(player, target) < 0) return player.countCards("h") >= target.countCards("h")
            return player.countCards("h") >= target.countCards("h")
        },
        usable: 3,
        async content(event, trigger, player) {
            let targets = [player, event.targets[0]]
            player.chooseToEnsemble(targets)
                .set("ai", (card) => {
                    let player = _status.event.player
                    let source = get.event("source")
                    let targets = get.event("targets")
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
                    const { bool, list, cards, targets } = _status.event.ensembleResult
                    let player = _status.event.player
                    if (cards[0].length >= cards[1].length) {
                        let next = await player.chooseControlList("狂飙", "获得" + get.translation(targets[1]) + "的合奏牌", "弃置X张牌并摸等量张牌（X为你与其合奏牌数之差，且至多为4）", true)
                            .set("ai", () => {
                                const { bool, list, cards, targets, player } = _status.event.getParent().ensembleResult
                                let num = Math.min(player.countCards("he"), Math.min(cards[0].length - cards[1].length, 4))
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
                                let num = Math.min(player.countCards("he"), Math.min(cards[0].length - cards[1].length, 4))
                                if (num) {
                                    player.chooseToDiscard(true, num, "he").set("ai", card => -get.value(card))
                                    player.draw(num)
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
        charlotte: true,
        trigger: {
            global: "phaseBefore",
            player: "enterGame"
        },
        filter(event, player, name) {
            return name != "phaseBefore" || game.phaseNumber == 0;
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget("忠犬", "选择一名其他角色", true)
                .set("ai", (target) => get.attitude(get.event("player"), target))
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
                    sourcex.hp = 6
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
            let result = await player.chooseTarget("彩颜", "选择任意名其他角色", [1, Infinity], true).set("filterTarget", lib.filter.notMe).set("ai", (target) => true).forResult()
            if (result) {
                let targets = [player].addArray(result.targets)
                targets.sortBySeat()
                player.chooseToEnsemble(targets)
                    .set("ai", () => {
                        let player = _status.event.player
                        let source = get.event("source")
                        let att = get.attitude(player, source)
                        if (att < 0) {
                            if (Math.random() < 0.7) return true
                            return false
                        }
                        return false
                    })
                    .set("callback", async () => {
                        const { bool, list, cards, targets, player } = _status.event.ensembleResult
                        let source = list.filter(item => item[0] == player).flatMap(item => item[1]).flat()
                        let target = list.filter(item => item[0] != player).flatMap(item => item[1]).flat()
                        let num = Math.min(targets.length, 5)
                        if (!source.some(card => target.some(c => c.name == card.name))) {
                            let next = await player.chooseTarget("彩颜", "令一名角色摸" + get.cnNumber(num) + "张牌").set("ai", (target) => get.attitude(get.event("player"), target)).forResult()
                            if (next && next.bool) next.targets[0].draw(num)
                        }
                    })
            }
        }
    },
    gbzhiyou: {
        audio: false,
        charlotte: true,
        trigger: {
            player: "phaseZhunbeiBegin"
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(get.prompt2("gbzhiyou")).set("ai", (target) => target.countCards("h")).set("filterTarget", (card, player, target) => player != target && target.countCards("h")).forResult()
        },
        async content(event, trigger, player) {
            let result = await player.chooseButton([1, player.maxHp], [get.translation(event.targets[0]) + "的手牌", event.targets[0].getCards("h")])
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
                let next = await event.targets[0].chooseControlList("知由", "将展示牌交给" + get.translation(player) + "，然后摸等量张牌", "弃置展示牌，然后弃置" + get.translation(player) + "一张牌", true)
                    .set("ai", () => {
                        let player = _status.event.player
                        let source = get.event("source")
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
                    event.targets[0].discardPlayerCard("he", player, true, 1)
                }
            }
        }
    },
    gbzhiyin: {
        audio: false,
        trigger: {
            player: ["phaseZhunbeiEnd", "phaseJudgeEnd", "phaseDrawEnd", "phaseUseEnd", "phaseDiscardEnd", "phaseJieshuEnd"]
        },
        filter(event, player) {
            return player.hasSkill("gbzhiyin_temp")
        },
        async content(event, trigger, player) {
            let result = await player.chooseTarget("制音", "选择至多两名其他角色进行“合奏”", [1, 2], true)
                .set("ai", (target) => get.attitude(get.event("player"), target) <= 0)
                .set("filterTarget", lib.filter.notMe)
                .forResult()
            if (result) {
                let targets = result.targets
                targets.sortBySeat()
                player.chooseToEnsemble(targets)
                    .set("ai", (card) => {
                        let player = _status.event.player
                        if (ui.selected.cards.length == 1) return false
                        if (player.countCards("h") > 3 && player.countCards("h", card => get.value(card) < 5)) return player.getCards("h", card => get.value(card) < 5).randomGet() == card
                        if (player.hp < 2 && !player.countCards("h", card => ["tao", "jiu"].includes(card.nmae))) return get.value(card) < 6
                        return false
                    })
                    .set("callback", async () => {
                        const { bool, list, cards, targets, player } = _status.event.ensembleResult
                        let next = await player.chooseControlList("制音", "弃置合奏牌并令" + get.translation(targets) + "摸等量张牌", "获得合奏牌，然后令未因此失去牌的目标角色失去1点体力").set("ai", () => get.rand(0, 1)).forResult()
                        game.log(player, "选择了", "#g【制音】", "的", "#y" + next.control)
                        if (next.control == "选项一") {
                            for (let target of targets) {
                                target.discard(list.filter(item => item[0] == target)[0][1])
                                target.draw(list.filter(item => item[0] == target)[0][1].length)
                            }
                        } else {
                            await player.gain(cards.flat(), "giveAuto")
                            for (let target of targets) {
                                if (!target.getHistory("lose").some(evt => evt.getParent(2) == _status.event)) target.loseHp()
                            }
                        }
                    })
            }
        },
        group: "gbzhiyin_gain",
        subSkill: {
            gain: {
                audio: false,
                forced: true,
                charlotte: true,
                trigger: {
                    player: "gainBegin"
                },
                popup: false,
                filter(event, player) {
                    return event.cards.length > 0
                },
                async content(event, trigger, player) {
                    player.addTempSkill("gbzhiyin_temp", "phaseChange")
                }
            },
            temp: {
                onremove: true
            },
        }
    },
    // SP丰川祥子
    gbchunhua: {
        audio: false,
        enable: "phaseUse",
        usable: 2,
        position: "he",
        check(card) {
            let player = _status.event.player,
                yingNum = player.countCards("h", card => card.name == "ying"),
                judgeNum = player.countCards("j")
            if (get.suit(card, player) == "spade" && !yingNum) return 1
            if (get.suit(card, player) == "spade" && yingNum && (judgeNum + 1) >= yingNum) return 10 - get.value(card)
            if (get.suit(card, player) == "spade" && player.countSkill("gbchunhua") == 1 && yingNum) return 10 - get.value(card)
            if (get.suit(card, player) != "spade") return 6 - get.value(card)
        },
        filterCard(card, player) {
            let suit = player.getCards("j").reduce((suit, card) => suit.add(get.suit(card, player)), [])
            if (suit.includes(get.suit(card, player))) return false
            return true
        },
        cards(list) {
            for (let card of list) {
                const namex = "gbchunhua_" + card.name;
                if (!lib.card[namex]) {
                    lib.card[namex] = {
                        type: "special_delay",
                        fullskin: true,
                        noEffect: true,
                        wuxieable: false,
                        cardimage: card.name,
                    };
                    lib.translate[namex] = lib.translate[card.name] + "·春华";
                    lib.translate[namex + "_info"] = "由【春华】技能创造的无效果【延时锦囊牌】";
                }
            }
        },
        selectCard: 1,
        lose: false,
        async content(event, trigger, player) {
            game.broadcastAll((card) => {
                lib.skill.gbchunhua.cards(card)
            }, event.cards)
            await player.addJudge("gbchunhua_" + event.cards[0].name, event.cards)
            let num = player.countCards("j")
            player.draw(num)
            if (get.suit(event.cards[0], player) == "spade" && num > 0) player.chooseToDiscard(true, "he", num)
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
        async content(event, trigger, player) {
            let list = []
            if (player.canCompare(trigger.player)) list.push("拼点")
            if (trigger.player.countCards("h")) list.push("议事")
            list.push("合奏")
            let result = await player.chooseControl(list, true).set("ai", () => {
                let player = _status.event.player
                let target = _status.currentPhase
                if (player.canCompare(target) && get.attitude(player, target) < 0) {
                    var hs = player.getCards("h");
                    if (hs.length > target.countCards("h"))
                        for (var i = 0; i < hs.length; i++) {
                            var val = get.value(hs[0]);
                            if (hs[i].number >= 10 && val <= 6) return "拼点"
                            if (hs[i].number >= 8 && val <= 3) return "拼点"
                        }
                }
                if (player.countCards("j") && player.countCards("j", card => get.color(card) == "black") && get.attitude(player, target) < 0) return "议事"
                if (player.countCards("j") && !player.countCards("j", card => get.color(card) == "black") && get.attitude(player, target) < 0) return "合奏"
                if (!player.countCards("j") && player.countCards("h", card => get.color(card) == "black") && get.attitude(player, target) < 0) return "议事"
                if (!player.countCards("j") && !player.countCards("h", card => get.color(card) == "black") && get.attitude(player, target) < 0) return "合奏"
                if (player.countCards("j") >= 2) return "合奏"
                return ["合奏", "议事"].randomGet()
            }).forResult()
            switch (result.control) {
                case "拼点":
                    let next = await player.chooseToCompare(trigger.player).forResult()
                    if (next && next.bool) {
                        player.give(next.player, trigger.player, "giveAuto")
                        trigger.player.addTempSkill("gblingming_effect")
                        trigger.player.markAuto("gblingming_effect", next.player)
                    } else {
                        game.broadcastAll((card) => {
                            lib.skill.gbchunhua.cards(card)
                        }, [next.target])
                        await player.addJudge("gbchunhua_" + next.target.name, next.target)
                    }
                    break
                case "议事":
                    player.chooseToDebate([player, trigger.player]).set("callback", async () => {
                        const {
                            bool,
                            opinion,
                            black,
                            red,
                            others,
                            targets
                        } = _status.event.debateResult;
                        if (!bool) return
                        let player = _status.event.player
                        let target = targets.filter(i => i != player)[0]
                        if (opinion != "black") {
                            let cards = [...red, ...black, ...others].filter(i => i[0] == player).map(i => i[1])
                            if (cards.length) player.give(cards, target)
                            target.addTempSkill("gblingming_effect")
                            target.markAuto("gblingming_effect", cards)
                        } else {
                            let cards = [...red, ...black, ...others].filter(i => i[0] != player).map(i => i[1]).flat()
                            if (cards.length > 0) {
                                game.broadcastAll((card) => {
                                    lib.skill.gbchunhua.cards(card)
                                }, cards)
                                await player.addJudge("gbchunhua_" + cards[0].name, cards)
                            }
                        }
                    })
                    break
                case "合奏":
                    player.chooseToEnsemble([player, trigger.player])
                        .set("ai", (card) => {
                            let player = _status.event.player
                            let source = _status.event.source
                            if (player == source) return Math.random()
                            if (6 - get.value(card)) return Math.random() < 0.3
                            return false
                        })
                        .set("callback", async () => {
                            const { bool, cards, list, targets } = _status.event.ensembleResult
                            let player = _status.event.player
                            let target = targets[1]
                            if (cards[0].length <= cards[1].length) {
                                player.give(cards[0], target)
                                target.addTempSkill("gblingming_effect")
                                target.markAuto("gblingming_effect", cards[0])
                            } else {
                                game.broadcastAll((card) => {
                                    lib.skill.gbchunhua.cards(card)
                                }, cards[1])
                                for (let card of cards[1]) {
                                    await player.addJudge("gbchunhua_" + card.name, card)
                                }
                            }
                        })
                    break
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
                    trigger.directHit.addArray(game.players)
                    game.log(trigger.card, "不可被响应")
                }
            }
        }
    },
    gbzhaying: {
        audio: false,
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
        charlotte: true,
        async cost(event, trigger, player) {
            event.result = await player.chooseButton(["乍影", `选择${event.triggername != "chooseToEnsembleBegin" ? "一" : "任意"}张牌作为${event.triggername == "chooseToDebateBegin" ? "议事" : event.triggername == "chooseToEnsembleBegin" ? "合奏" : "拼点"}结果。`, [player.getCards("j"), "card"]], true, event.triggername != "chooseToEnsembleBegin" ? 1 : [1, Infinity])
                .set("ai", (button) => {
                    let ai = _status.event.getParent(4).ai
                    if (ai) return ai(button.link)
                    switch (_status.event.getParent(4).name) {
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
                audio: false,
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
                audio: false,
                forced: true,
                trigger: {
                    player: "phaseJieshuBegin"
                },
                mod: {
                    aiOrder(player, card, num) {
                        if (card.name == "ying") return num + 6
                    }
                },
                filter(event, player) {
                    return player.getHistory("lose", evt => evt.getParent(3).name == "phaseDiscard" && evt.cards.some(card => card.name == "ying")).length
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
        audio: false,
        charlotte: true,
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
        onremove(player) {
            player.getStorage("gbshiqi_effect").forEach(tar => tar.unmarkSkill("gbshiqi_effect"))
        },
        filter(event, player) {
            return event.name != "phase" || game.phaseNumber == 0;
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(true).set("ai", (target) => get.attitude(get.event("player"), target)).forResult()
        },
        async content(event, trigger, player) {
            let target = event.targets[0]
            player.markAuto("gbshiqi_effect", target)
            player.unmarkSkill("gbshiqi_effect")
            target.markAuto("gbshiqi_effect", player)
            target.markSkill("gbshiqi_effect")
        },
        group: ["gbshiqi_gain", "gbshiqi_effect"],
        subSkill: {
            effect: {
                audio: false,
                forced: true,
                trigger: {
                    global: "discardAfter"
                },
                intro: {
                    nocount: true,
                    content: "被$标记"
                },
                filter(event, player) {
                    return event.getParent(2).name != "phaseDiscard" && player.getStorage("gbshiqi_effect").includes(event.player)
                },
                async content(event, trigger, player) {
                    player.draw()
                    player.addToExpansion(trigger.cards, "giveAuto").gaintag.add("gbshiqi")
                }
            },
            gain: {
                audio: false,
                forced: true,
                trigger: {
                    player: "phaseUseBegin"
                },
                filter(event, player) {
                    return player.hasExpansions("gbshiqi")
                },
                async content(event, trigger, player) {
                    player.addTempSkill("gbshiqi_card")
                    player.gain(player.getExpansions("gbshiqi"), "giveAuto").gaintag.add("gbshiqi")
                }
            },
            card: {
                audio: false,
                charlotte: true,
                onremove(player) {
                    player.removeGaintag("gbshiqi");
                },
                mod: {
                    aiOrder(player, card, num) {
                        if (get.itemtype(card) == "card" && card.gaintag?.includes("gbshiqi")) {
                            return num - 2
                        }
                    },
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
            }
        }
    },
    gbbeiqiu: {
        audio: false,
        enable: "phaseUse",
        filter(event, player) {
            return !player.hasExpansions("gbbeihua") && player.countSkill("gbbeiqiu") < 3
        },
        selectTarget: 1,
        filterTarget(card, player, target) {
            if (player == target) return false
            return target.countCards("hej")
        },
        ai2(target) {
            let player = _status.event.player
            if (game.hasPlayer(target => get.effect(player, { name: "guohe" }, target, player) > 0)) return get.effect(player, { name: "guohe" }, target, player)
            return -1 / get.effect(player, { name: "guohe" }, target, player)
        },
        async content(event, trigger, player) {
            await player.draw()
            let evt = event.targets[0].useCard({ name: "guohe" }, player)
            event.targets[0].when("useCardAfter")
                .filter((event, player) => {
                    return event.card == evt.card
                })
                .then(() => {
                    for (let target of targets) {
                        if (!target.hasHistory("lose", evt => evt.getParent(4).card == trigger.card)) {
                            target.chooseToDiscard(true)
                            target.draw()
                        }
                    }
                })
                .vars({
                    targets: player.getStorage("gbshiqi_effect")
                })
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
                audio: false,
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
                    let result = await player.chooseButton(["背丘", [player.getExpansions("gbbeihua"), "card"]], true)
                        .set("ai", (button) => {
                            let val = get.value(button.link)
                            if (!player.countCards("h", card => card.suit == button.link.suit)) val += 1
                            return val
                        })
                        .forResult()
                    if (result.bool) {
                        await player.gain(result.links[0], "bySelf", "giveAuto", "log")
                    }
                    await player.chooseUseTarget({ name: "huogong" }, true).forResult()
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
        audio: false,
        juexingji: true,
        skillAnimation: true,
        animationColor: "gbmujica",
        forced: true,
        trigger: {
            player: "phaseEnd"
        },
        filter(event, player) {
            return player.countCards("h") > player.hp
        },
        async content(event, trigger, player) {
            await player.gain(player.getExpansions("gbshiqi"), "giveAuto")
            await player.recover()
            player.awakenSkill(event.name)
            player.addSkill("gbbeihua")
            player.addSkill("gbchenggu")
            player.removeSkill("gbshiqi")
        },
    },
}
export default skills;