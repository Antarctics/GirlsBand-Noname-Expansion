import { lib, game, ui, get, ai, _status } from "../../../noname.js";
/** @type { importCharacterConfig['skill'] } */
const skill = {
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
                    player.chooseControlList("###人偶###", ["翻面", "弃置所有手牌并获得两张【影】,然后令所有未翻面角色各失去1点体力。"], true)
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
                    return Math.random()
                })
                .forResult()
        },
        async content(event, trigger, player) {
            let list = [],
                target = event.targets[0]
            if (target.countCards("he")) list.push("选项一")
            list.push("选项二")
            list.push("背水！")
            let result = await target.chooseControl(list).set("prompt", "暗素").set("choiceList", ["弃置两张牌", "失去一点体力", "背水！翻面并执行上述所有选项"]).forResult()
            game.log(target, "选择了", "#g【暗素】", "的", "#y" + result.control)
            switch (result.control) {
                case "选项一":
                    await target.chooseToDiscard("he", true, 2)
                    break
                case "选项二":
                    target.loseHp()
                    break
                case "背水！":
                    target.turnOver()
                    await target.chooseToDiscard("he", true, 2)
                    target.loseHp()
                    break
            }
            player.when({
                global: "chooseToDebateAfter"
            })
                .then(() => {
                    if (player.countCards("h") > target.countCards("h")) {
                        player.draw(3)
                        target.draw()
                        player.chooseCard("暗素", "是否交给" + get.translation(target) + "一张牌", "he").set("ai", card => {
                            let player = _status.event.player
                            let taregt = _status.event.target
                            if (get.attitude(player, target) > 0) return get.value(card)
                            return false
                        })
                            .set("target", target)
                    }
                }).then(() => {
                    if (result && result.bool) {
                        player.give(result.cards, target)
                    }
                    if (player.hp > target.hp) {
                        player.draw()
                        target.draw()
                    }
                    if (target.isTurnedOver()) {
                        player.chooseCard("暗素", "是否交给" + get.translation(target) + "一张牌", "he").set("ai", card => {
                            let player = _status.event.player
                            let taregt = _status.event.target
                            if (get.attitude(player, target) > 0) return get.value(card)
                            return false
                        })
                            .set("target", target)
                    }
                })
                .then(() => {
                    if (result && result.bool) {
                        player.give(result.cards, target)
                        target.turnOver(false)
                    }
                })
                .vars({
                    target: event.targets[0]
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
                    return player.countCards("he") >= player.getHistory("skipped").length - 1
                },
                async cost(event, trigger, player) {
                    event.result = await player.chooseCard("主音", "弃置" + get.cnNumber(player.getHistory("skipped").length - 1) + "张牌获得一个额外的出牌阶段", player.getHistory("skipped").length - 1)
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
    // spmortis
    gbsiwang: {
        audio: false,
        trigger: {
            player: "damageBegin4",
        },
        derivation: ["gbruoye", "gbchenggu", "gbzhaying"],
        charlotte: true,
        mod: {
            aiValue(player, card, num) {
                if (card.name == "ying") return num + 4
                if (card.gaintag?.includes("gbsiwang")) return num + 1
            },
            aiUseful(player, card, num) {
                if (card.name == "ying") return num + 7
                if (card.gaintag?.includes("gbsiwang")) return num - 1
            },
            ignoredHandcard(card, player) {
                if (card.gaintag?.includes("gbsiwang")) {
                    return true;
                }
            },
            cardDiscardable(card, player, name) {
                if (name == "phaseDiscard" && card.gaintag?.includes("gbsiwang")) {
                    return false;
                }
            },
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
            await player.recover()
            var list = [],
                skill = [],
                choiceList = []
            choiceList.push("摸两张牌且不计入手牌上限")
            list.push("选项一")
            if (!player.hasSkill("gbruoye")) {
                skill.push("gbruoye");
            }
            if (!player.hasSkill("gbchenggu")) {
                skill.push("gbchenggu");
            }
            if (!player.hasSkill("gbzhaying")) {
                skill.push("gbzhaying");
            }
            if (skill.length > 0) {
                choiceList.push("失去1点体力上限并依次获得以下一项技能：〖若叶〗、〖成孤〗、〖乍影〗")
                list.push("选项二")
            }
            choiceList.push("背水！执行上述所有选项，然后摸两张牌")
            list.push("背水！")
            list.push("cancel2")
            let next = await player.chooseControl(list)
                .set("prompt", "死亡")
                .set("ai", () => {
                    if (player.isDamaged() && player.maxHp > 3) return 1
                    return 0
                })
                .set("choiceList", choiceList).forResult()
            if (next.control != "cancel2") {
                game.log(player, "选择了", "#g死亡", "的", "#y" + next.control)
                if (next.control == "选项一" || next.control == "背水！") {
                    player.draw(1).gaintag.add("gbsiwang")
                }
                if (next.control == "选项二" || next.control == "背水！") {
                    if (skill.length) {
                        player.loseMaxHp()
                        player.addSkill(skill[0])
                    }
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
            let result = await player.choosePlayerCard("箋秋", "请选择" + get.translation(target) + "一张牌", "hej", target, true).forResult()
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
                await player.showCards(cards)
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
        hiddenCard(player, name) {
            return player.getExpansions("gbqixiang").some(card => card.name == name)
        },
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
                    if (player.countCards("he")) list.push("选项一")
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
        enable: "phaseUse",
        usable: 1,
        selectCard: [0, 1],
        selectTarget: 1,
        filterCard: true,
        filterTarget(card, player, target) {
            return target.hasEnabledSlot(2)
        },
        position: "h",
        discard: false,
        ai1(card) {
            return false
        },
        ai2(target) {
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
        },
        async content(event, trigger, player) {
            let target = event.targets[0]
            let cards = event.cards && event.cards.length > 0 ? event.cards : get.cards(1),
                name = get.color(cards[0]) == "red" ? "bagua" : "renwang"
            let card = get.autoViewAs({
                name
            }, cards)
            await target.equip(card)
            if (!target.getCards("e").some(c => c != card && get.color(c) == get.color(cards[0]))) delete player.getStat("skill")[event.name]
        },
        ai: {
            order: 10,
            result: {
                player: 1
            }
        }
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
        group: ["gbzhunzhen_effect", "gbzhunzhen_draw"],
        subSkill: {
            draw: {
                audio: false,
                forced: true,
                charlotte: true,
                trigger: { player: "phaseDrawBegin2" },
                filter(event, player) {
                    return player.hasExpansions("gbzhunzhen") && !event.numFixed
                },
                async content(event, trigger, player) {
                    trigger.num++
                },
            },
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
        mod: {
            ignoredHandcard(card, player, result) {
                if (!(player.hasSkill("gbhuadao") && _status.currentPhase == player && game.hasPlayer(p => p != player && p.group == player.group)) && card.gaintag?.includes("gbbomu_tag")) return true
            },
            cardEnabled2(card, player, result) {
                if (!(player.hasSkill("gbhuadao") && _status.currentPhase == player && game.hasPlayer(p => p != player && p.group == player.group)) && card.gaintag?.includes("gbbomu_tag")) return false
            },
            cardDiscardable(card, player) {
                if (!(player.hasSkill("gbhuadao") && _status.currentPhase == player && game.hasPlayer(p => p != player && p.group == player.group)) && card.gaintag?.includes("gbbomu_tag")) return false
            },
        },
        charlotte: true,
        filter(event, player) {
            return event.getParent(2).name != "gbbomu"
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("薄暮", "请选择至少一张手牌，使其增加「暮」标记", [1, Infinity], "h", true)
                .set("filterCard", card => !card.gaintag?.includes("gbbomu_tag"))
                .set("ai", card => {
                    let player = _status.event.player,
                        dis = player.needsToDiscard(0, (i, player) => !player.canIgnoreHandcard(i))
                    if (_status.currentPhase == player) {
                        if (player.hasSkill("gbkongtan") && !player.isTempBanned("gbkongtan") && player.countSkill("gbkongtan") < 3) {
                            if (!player.countSkill("gbkongtan")) return player.getUseValue(card) <= 0 || !player.hasValueTarget(card)
                            if (player.getStorage("gbkongtan_temp").includes("选项一")) return player.getUseValue(card) <= 0 || !player.hasValueTarget(card)
                            else {
                                let num = Math.min(player.countMark("gbkongtan_show") + player.countCards("h", card => get.color(card) == "red"), 5),
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
                        return player.getCards("h", card => !card.gaintag?.includes("gbbomu_tag")).sort((a, b) => {
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
        ai: {
            combo: "gbkongtan",
        },
    },
    gbkongtan: {
        audio: false,
        enable: "phaseUse",
        usable: 3,
        filter(event, player) {
            return player.countCards("h", card => card.gaintag?.includes("gbbomu_tag"))
        },
        async content(event, trigger, player) {
            let cards = player.getCards("h", card => card.gaintag?.includes("gbbomu_tag"))
            var bool = true
            await player.showCards(cards)
            player.addMark("gbkongtan_show", cards.length)
            player.addTempSkill("gbkongtan_show")
            let num = Math.min(player.countMark("gbkongtan_show"), 5)
            while (bool) {
                let card = await player.chooseCard("空谭", "选择一张「暮」牌", true, "h")
                    .set("filterCard", card => card.gaintag?.includes("gbbomu_tag"))
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
                    if (!player.countCards("h", card => card.gaintag?.includes("gbbomu_tag"))) bool = false
                }
            }
            let target = await player.chooseTarget("空谭", "选择一名角色", true)
                .set("ai", (target) => {
                    let player = _status.event.player,
                        num = Math.min(player.countMark("gbkongtan_show"), 5),
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
                            num = Math.min(source.countMark("gbkongtan_show"), 5),
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
                    let num1 = Math.min(player.countMark("gbkongtan_show") + player.countCards("h", card => card.gaintag?.includes("gbbomu_tag")), 5),
                        num2 = player.countCards("h", card => !card.gaintag?.includes("gbbomu_tag")),
                        red = [...player.getCards("h", card => card.gaintag?.includes("gbbomu_tag") && get.color(card) == "red"), ...get.cards(num1, true)].slice(0, num1).reduce((num, c) => num += c.isKnownBy(player) ? (get.color(c) == "red" ? 1 : 0) : Math.round(Math.random()), 0) > (num1 / 2)
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
        trigger: {
            player: ["useCard", "respond", "discard"]
        },
        mod: {
            aiOrder(player, card, num) {
                if (card.gaintag?.includes("gbbomu_tag")) return num - 6
            }
        },
        filter(event, player) {
            return event.cards && event.cards.some(card => card.gaintag?.includes("gbbomu_tag"))
        },
        async content(event, trigger, player) {
            let cards = player.getCards("h"),
                cardx = trigger.cards.filter(c => c.gaintag?.includes("gbbomu_tag"))
            await player.showCards(cards)
            await player.discard(cards.filter(card => cardx.some(c => c.name == card.name)))
        },
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
                .set("filterCard", card => !card.gaintag?.includes("gbchenyang_tag"))
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
                        if (event.gaintag_map[i].includes("gbchenyang_tag") && !player.countCards("h", card => card.gaintag?.includes("gbchenyang_tag"))) return true
                    }
                },
                async content(event, trigger, player) {
                    let num = player.countCards("h") - 5
                    if (num > 0) player.chooseToDiscard(num, true)
                    else player.drawTo(5)
                },
                mod: {
                    cardRespondable(card, player, result) {
                        if (card.gaintag?.includes("gbchenyang_tag")) return false
                    },
                    cardEnabled2(card, player, result) {
                        if (_status.event.name == "chooseToRespond" && card.gaintag?.includes("gbchenyang_tag")) return false
                    },
                    aiOrder(player, card, num) {
                        if (card.gaintag?.includes("gbchenyang_tag")) return num + 6
                    }
                },
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
            event.result = await player.chooseCard("心钟", "请选择一张手牌", 1, "h")
                .set("ai", (card) => {
                    return Math.random()
                })
                .forResult();
        },
        async content(event, trigger, player) {
            await player.lose(event.cards, ui.cardPile).set("insert_card", true)
            game.log(player, "将", get.cnNumber(event.cards.length), "张牌置于了", "#y牌堆顶")
            let target = trigger.player
            let result = await target.chooseControlList("心钟", [`令${get.translation(player)}展示牌堆顶上的一张牌，若为红色，其弃置此牌，视为堆你使用【推心置腹】；若为黑色，你展示手牌并弃置其中一种颜色的所有牌，然后其展示手牌并将对应颜色的所有牌交给你`, `你于本回合内获得〖寸目〗，然后交给${get.translation(player)}一张锦囊牌或两张非锦囊牌。`], true)
                .set("ai", () => {
                    let player = _status.event.player
                    let source = _status.event.source
                    if (get.attitude(player, source) < 0) {
                        let num = source.countCards("h") - 6
                        if (source.getCards("h", card => card.isKnownBy(player)).some(card => card.gaintag?.includes("gbchenyang_tag"))) return 1
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
                    let cards = get.cards(1, true)
                    await player.showCards(cards)
                    if (get.color(cards[0]) == "red") {
                        player.useCard({ name: "tuixinzhifu" }, target)
                    } else {
                        await target.showCards(target.getCards("h"))
                        let list = []
                        if (target.getCards("h").some(card => get.color(card) == "red")) list.push("红色")
                        if (target.getCards("h").some(card => get.color(card) == "black")) list.push("黑色")
                        if (list.length) {
                            let result = await target.chooseControl(list, true).set("prompt", "弃置一种颜色的所有手牌").forResult()
                            await player.showCards(player.getCards("h"))
                            player.give(player.getCards("h").filter(card => get.color(card) == (result.control == "红色" ? "red" : "black")), target, "giveAuto")
                        }
                    }
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
                        if (card.gaintag?.includes("gbchenyang_tag")) return false
                    },
                    cardDiscardable(card, player) {
                        if (card.gaintag?.includes("gbchenyang_tag")) return false
                    }
                },
                async content(event, trigger, player) {
                    let cards = player.getCards("h", card => card.gaintag?.includes("gbchenyang_tag"))
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
                .set("filterCard", card => !card.gaintag?.includes("gbhongri_tag"))
                .set("ai", card => {
                    let player = _status.event.player
                    if (!["sha", "shan"].includes(card.name)) return true
                    if ([...ui.cardPile.childNodes].some(card => card.name == "wanjian")) return card != player.getCards("h", card => !card.gaintag?.includes("gbhongri_tag") && card.name == "shan")[0]
                    if ([...ui.cardPile.childNodes].some(card => card.name == "juedou" || card.name == "nanman")) return card != player.getCards("h", card => !card.gaintag?.includes("gbhongri_tag") && card.name == "sha")[0]
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
                        if (card.gaintag?.includes("gbhongri_tag")) return false
                    },
                    cardEnabled2(card, player, result) {
                        if (_status.event.name == "chooseToRespond" && card.gaintag?.includes("gbhongri_tag")) return false
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
            return event.player != player && player.inRange(event.player) && player.countCards("h", card => card.gaintag?.includes("gbhongri_tag"))
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard("圆阵", "请选择任意张「日」牌", [1, Infinity], true)
                .set("ai", (card) => {
                    let player = _status.event.player
                    let target = _status.currentPhase
                    let cards = player.getCards("h", card => card.gaintag?.includes("gbhongri_tag"))
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
                .set("filterCard", card => card.gaintag?.includes("gbhongri_tag"))
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
                .set("filterCard", card => !card.gaintag?.includes("gbfeishou_tag"))
                .set("ai", card => {
                    let player = _status.event.player
                    if (!["sha", "shan"].includes(card.name)) return true
                    if ([...ui.cardPile.childNodes].some(card => card.name == "wanjian")) return card != player.getCards("h", card => !card.gaintag?.includes("gbhongri_tag") && card.name == "shan")[0]
                    if ([...ui.cardPile.childNodes].some(card => card.name == "juedou" || card.name == "nanman")) return card != player.getCards("h", card => !card.gaintag?.includes("gbhongri_tag") && card.name == "sha")[0]
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
                        if (card.gaintag?.includes("gbfeishou_tag")) return false
                    },
                    cardEnabled2(card, player, result) {
                        if (_status.event.name == "chooseToRespond" && card.gaintag?.includes("gbfeishou_tag")) return false
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
            if (trigger.player != player && player.countCards("hs", card => card.name == "sha" || get.tag(card, "damage") && get.tag(card, "damage") == "trick")) list.push("选项一")
            list.push("选项二")
            list.push("cancel2")
            let result = await player.chooseControl(list)
                .set("choiceList", [`对${get.translation(trigger.player)}使用一张【杀】或伤害类锦囊牌，若此牌造成伤害，你获得其一张牌`, `摸一张牌并将一张「绯」置于牌堆顶，${get.translation(trigger.player)}本回合获得〖马术〗`])
                .set("prompt", "巴锋")
                .set("ai", () => {
                    let player = _status.event.player
                    let target = _status.currentPhase
                    if (get.attitude(player, target) > 0) return "选项二"
                    if (target.countCards("j") && !target.hasWuxie()) return "选项二"
                    for (let name of lib.inpile) {
                        if (!player.canUse(name, target, true, true)) continue
                        if (get.type(name) == "trick" && get.tag({ name: name }, "damage")) {
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
                    let next = await player.chooseCard("巴锋", `对${get.translation(trigger.player)}使用一张【杀】或伤害类锦囊牌`, "hs", true)
                        .set("filterCard", card => {
                            if (card.name == "sha" || get.tag(card, "damage") && get.type(card) == "trick") return player.canUse(card, _status.currentPhase, true, true)
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
                    await player.draw()
                    if (player.countCards("h", card => card.gaintag?.includes("gbfeishou_tag"))) {
                        let result = await player.chooseCard("巴锋", `请选择一张「绯」牌`, true)
                            .set("filterCard", card => card.gaintag?.includes("gbfeishou_tag"))
                            .set("ai", (card) => {
                                let player = _status.event.player
                                let target = _status.currentPhase
                                let att = get.sgn(get.attitude(player, target))
                                if (target.countCards("j") && !target.hasWuxie()) {
                                    var judge = get.judge(target.getCards("j")[0])
                                    return player.getCards("h", card => card.gaintag?.includes("gbfeishou_tag")).sort((a, b) => (judge(b) - judge(a)) * att)[0] == card
                                } else {
                                    return player.getCards("h", card => card.gaintag?.includes("gbfeishou_tag")).sort((a, b) => (get.value(b, target) - get.value(a, target)) * att)[0] == card
                                }
                            })
                            .forResult()
                        await player.lose(result.cards, ui.cardPile).set("insert_card", true)
                        game.log(player, "将", get.cnNumber(result.cards.length), "张牌置于了", "#y牌堆顶")
                    }
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
                .set("filterCard", card => !card.gaintag?.includes("gbfanzhi_tag"))
                .set("ai", card => {
                    let player = _status.event.player
                    if (!["sha", "shan"].includes(card.name)) return true
                    if ([...ui.cardPile.childNodes].some(card => card.name == "wanjian")) return card != player.getCards("h", card => !card.gaintag?.includes("gbhongri_tag") && card.name == "shan")[0]
                    if ([...ui.cardPile.childNodes].some(card => card.name == "juedou" || card.name == "nanman")) return card != player.getCards("h", card => !card.gaintag?.includes("gbhongri_tag") && card.name == "sha")[0]
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
                        if (card.gaintag?.includes("gbfanzhi_tag")) return false
                    },
                    cardEnabled2(card, player, result) {
                        if (_status.event.name == "chooseToRespond" && card.gaintag?.includes("gbfanzhi_tag")) return false
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
            return player.countCards("h", card => card.gaintag?.includes("gbfanzhi_tag"))
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard("茨菇", "请选择任意张「志」牌", [1, Infinity], true)
                .set("ai", (card) => {
                    let player = _status.event.player
                    if (ui.selected.cards.length >= 4) return false
                    if (card.gaintag?.includes("gbfanzhi_tag")) return true
                })
                .set("filterCard", card => card.gaintag?.includes("gbfanzhi_tag"))
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
export default skill