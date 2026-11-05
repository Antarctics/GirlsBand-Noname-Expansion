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
        filter(event, player, name) {
            return name != "phaseBefore" || game.phaseNumber == 0;
        },
        async content(event, trigger, player) {
            let info = ["当【杀】造成伤害时，伤害来源需弃置一张基本牌，否则本次伤害-1",
                "一名角色使用防具牌时，其需弃置一张装备牌，否则弃置此牌；所有角色的攻击范围+2",
                "使用【桃】时失去1点体力，使用【酒】时恢复1点体力",
                "当【南蛮入侵】或【万箭齐发】造成伤害时，改为回复体力；当【桃园结义】回复体力时，改为造成伤害"
            ]
            let name = [`开场`, `暗场`, `独语`, `乱叙`]
            const switchToAuto = () => {
                _status.imchoosing = false;
                if (event.dialog) event.dialog.close();
                if (event.control) event.control.close();
                game.resume();
                event._result = () => {
                    let player = get.player()
                    let control = {
                        1: (((get.mode() == "identity" && ["zhong", "zhu"].includes(player.identity)) || (get.mode() == "doudizhu" && player.identity == "fan2") || (get.mode() == "versus" && [2, 3].includes(player.getSeatNum())) ? Math.random() : 0) + game.countPlayer(p => get.attitude(player, p) > 0 && !p.mayHaveShan && get.effect(p, { name: "sha" }) < 0)) || Math.random(),
                        2: (get.mode() == "identity" && player.identity == "fan") ? Math.random() + 0.2 : Math.random(),
                        3: (game.countPlayer(p => get.attitude(player, p) > 0 && p.isDamaged() && p.hasKnownCards(player, card => get.name(card) == "jiu") && !p.hasKnownCards(player, card => get.name(card) == "tao")) + game.countPlayer(p => get.attitude(player, p) < 0 && p.isDamaged() && p.hasKnownCards(player, card => get.name(card) == "tao"))) || Math.random(),
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
                const event = get.event();
                event.switchToAuto = () => {
                    _status.imchoosing = false;
                    if (event.dialog) event.dialog.close();
                    if (event.control) event.control.close();
                    game.resume();
                    event._result = () => {
                        let player = get.player()
                        let control = {
                            1: (((get.mode() == "identity" && ["zhong", "zhu"].includes(player.identity)) || (get.mode() == "doudizhu" && player.identity == "fan2") || (get.mode() == "versus" && [2, 3].includes(player.getSeatNum())) ? Math.random() : 0) + game.countPlayer(p => get.attitude(player, p) > 0 && !p.mayHaveShan && get.effect(p, { name: "sha" }) < 0)) || Math.random(),
                            2: (get.mode() == "identity" && player.identity == "fan") ? Math.random() + 0.2 : Math.random(),
                            3: (game.countPlayer(p => get.attitude(player, p) > 0 && p.isDamaged() && p.hasKnownCards(player, card => get.name(card) == "jiu") && !p.hasKnownCards(player, card => get.name(card) == "tao")) + game.countPlayer(p => get.attitude(player, p) < 0 && p.isDamaged() && p.hasKnownCards(player, card => get.name(card) == "tao"))) || Math.random(),
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
                    if (name == "chooseToUseBegin") return event.getTrigger() && event.getTrigger().card && get.name(event.getTrigger().card) == "sha"
                    return event && event.card && get.name(event.card) == "sha"
                },
                forced: true,
                async content(event, trigger, player) {
                    if (event.triggername == "chooseToUseBegin") {
                        trigger.ai = (card) => {
                            var evt = get.event().getParent();
                            if (get.event().useShan) return evt.player.countCards("h") == 0 ? 0 : get.order(card)
                            return 0
                        }
                    } else {
                        let next = await player.chooseCard("开幕：请弃置一张基本牌，否则本次伤害-1")

                            .set("position", "he")
                            .set("filterCard", (card) => get.type(card) == "basic")
                            .set("ai", (card) => {
                                let player = get.event().source
                                let target = get.event().getParent(4).player
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
                            if (get.name(card) == "sha" && get.attitude(player, target) < 0) {
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
                    let next = await player.chooseCard("暗场：请弃置一张装备牌，否则弃置此牌")

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
                            if (get.type(card) == "equip" && get.subtype(card) == "equip2" && !player.countCards("he", c => get.type(c) == "equip" && c != card)) return 0
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
                    return get.name(event.card) == "tao" || get.name(event.card) == "jiu"
                },
                forced: true,
                popup: false,
                async content(event, trigger, player) {
                    if (get.name(trigger.card) == "tao") trigger.player.loseHp()
                    else trigger.player.recover()
                },
                ai: {
                    effect: {
                        player(card, player, target) {
                            if (get.name(card) == "tao") return [0, 0, 1, 0]
                            if (get.name(card) == "jiu") return [1, get.recoverEffect(player, player, player), 1, 0]
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
                    if (event.name == "changeHp") return event && event.getParent().card && get.name(event.getParent().card) == "taoyuan"
                    return event && event.card && (get.name(event.card) == "nanman" || get.name(event.card) == "wanjian")
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
                                    var evt = get.event().getParent();
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
                                    var evt = get.event().getParent();
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
                            let source = get.event().getTrigger().player
                            let player = get.player()
                            let target = get.event().source
                            let card = get.event().getTrigger().card
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
                            if (get.name(card) == "taoyuan") return target.isDamaged() ? [0, get.damageEffect(target, player, target)] : 0
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
            event.result = await player.chooseTarget(`###${get.prompt(event.skill)}###你可以令一名角色与${get.translation(trigger.player)}交换座次，并执行一个额外回合`)
                .set("filterTarget", (card, player, target) => target != trigger.player)
                .set("ai", target => {
                    if (get.attitude(player, trigger.player) > 0) return get.attitude(player, trigger.player.next) < 0
                    return false
                })
                .forResult()
        },
        async content(event, trigger, player) {
            const target = event.targets[0]
            const current = trigger.player
            game.broadcastAll(function (target1, target2) {
                game.swapSeat(target1, target2)
            }, target, current)
            const next = target.insertPhase()
            target.when({ player: "phaseEnd" })
                .filter(evt => evt == next)
                .then(async () => {
                    const evt = get.event()
                    const target = evt.player
                    const result = await target.chooseControl(["选项一", "选项二"])
                        .set("prompt", "人偶：请选择一项")
                        .set("choiceList", ["翻面", "弃置所有手牌并获得两张【影】，然后令所有未翻面角色各失去1点体力"])
                        .set("ai", () => {
                            const event = get.event()
                            const target = event.player
                            const good = game.filterPlayer(p => get.attitude(target, p) > 0 && !p.isTurnedOver()).reduce((num, p) => num + get.effect(p, { name: "losehp" }, target), 0)
                            const bad = game.filterPlayer(p => get.attitude(target, p) < 0 && !p.isTurnedOver()).reduce((num, p) => num + get.effect(p, { name: "losehp" }, target), 0)
                            if (target.countCards("h") < 4 && good > bad) return "选项二"
                            return "选项一"
                        })
                        .forResult()
                    game.log(target, "选择了", "#g【人偶】", "的", "#y" + result.control)
                    if (result.control == "选项一") {
                        await target.turnOver()
                    } else {
                        await target.discard(target.getCards("h"))
                        await target.gain(lib.card.ying.getYing(2))
                        for (const current of game.filterPlayer(p => !p.isTurnedOver()).sortBySeat()) await current.loseHp()
                    }
                })
        },
        ai: {
            threaten: 1.6,
            expose: 0.3
        }
    },
    // sp长崎素世
    gbansu: {
        audio: "ext:GirlsBand/audio/skill:2",
        trigger: {
            global: "chooseToDebateEnd"
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(get.prompt2(event.skill))
                .set("filterTarget", (card, player, target) => target != player && player.canCompare(target))
                .set("ai", target => get.attitude(player, target) < 0)
                .forResult()
        },
        async content(event, trigger, player) {
            const target = event.targets[0]
            const result = await player.chooseToCompare(target).forResult()
            if (result?.bool) {
                player.addTempSkill("gbansu_end")
            } else {
                await player.draw(3)
                player.skip("phaseDiscard")
            }
        },
        subSkill: {
            end: {
                charlotte: true,
                trigger: {
                    global: "phaseEnd"
                },
                prompt2: "执行一个额外回合",
                filter(event, player) {
                    return !event.skill
                },
                async content(event, trigger, player) {
                    player.insertPhase()
                }
            }
        },
        ai: {
            threaten: 0.6,
            expose: 0.1
        }
    },
    gbyinai: {
        audio: false,
        forced: true,
        trigger: {
            player: "phaseEnd",
        },
        filter(event, player) {
            return event.skill
        },
        async content(event, trigger, player) {
            const num = game.filterPlayer().reduce((num, p) => num = Math.max(num, p.countCards("h")), 0)
            if (player.countCards("h") <= num) await player.drawTo(num);
            else await player.chooseToDiscard("h", player.countCards("h") - num, true)
        },
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
        async content(event, trigger, player) {
            const targets = trigger.list || trigger.targets || [player, trigger.target]
            let cards = []
            for (let target of targets.sortBySeat()) {
                if (target == player) continue
                if (!player.countGainableCards(target, "he")) continue
                let { cards: [card] } = await player.gainPlayerCard("he", true, target).forResult()
                if (card) {
                    cards.push(card)
                }
            }
            cards = cards.filter(card => get.owner(card) == player)
            if (cards.length) {
                await player.showCards(cards)
                player.when({ player: "chooseCardBegin" })
                    .filter((event, player) => event.getParent(evt => evt == trigger, true) == trigger)
                    .then(async (event, trigger, player) => {
                        const ori = trigger.filterCard;
                        trigger.filterCard = (card, player2, event) => {
                            if (!ori || ori.call(this, card, player2, event)) {
                                return cards.includes(card)
                            }
                            return false;
                        };
                    })

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
                    player: "phaseEnd"
                },
                filter(event, player) {
                    return !player.hasHistory("lose", evt => evt.type == "discard" && evt.cards?.length)
                },
                async content(event, trigger, player) {
                    trigger.phaseList.splice(trigger.num, 0, "phaseUse|gbzhuyin")
                }
            }
        }
    },
    // spmortis
    gbsiwang: {
        audio: "ext:GirlsBand/audio/skill:3",
        trigger: {
            player: "damageBegin4"
        },
        derivation: ["gbruoye", "gbchenggu", "gbzhaying"],
        forced: true,
        filter(event, player) {
            return player.countCards("he") > 0
        },
        mod: {
            aiValue(player, card, num) {
                if (get.name(card) == "ying") return num + 7
                if (card.gaintag?.includes("gbsiwang")) return num + 1
            },
            ignoredHandcard(card, player) {
                if (card.gaintag?.includes("gbsiwang")) return true
            },
            cardDiscardable(card, player, name) {
                if (name == "phaseDiscard" && card.gaintag?.includes("gbsiwang")) return false
            }
        },
        async content(event, trigger, player) {
            const { cards: [card] } = await player.chooseToDiscard("死亡：请弃置一张牌", "he", true)
                .set("ai", card => {
                    if (get.name(card) == "ying" && player.isDamaged()) return 10
                    return 6 - get.value(card)
                })
                .forResult()
            if (get.name(card) == "ying") await player.recover()
            const skills = ["gbruoye", "gbchenggu", "gbzhaying"].filter(skill => !player.hasSkill(skill))
            const list = ["选项一"], choiceList = ["摸一张牌，此牌不计入手牌上限", "失去1点体力上限，然后依次获得一项未拥有的技能：〖若叶〗、〖成孤〗、〖乍影〗"]
            if (skills.length) {
                list.push("选项二")
            }
            list.push("cancel2")
            const result = await player.chooseControl(list)
                .set("prompt", "死亡：请选择一项")
                .set("choiceList", choiceList)
                .set("ai", () => {
                    const event = get.event()
                    const player = get.player()
                    if (player.isDamaged() && event.controls.includes("选项二")) return "选项二"
                    return "选项一"
                })
                .forResult()
            game.log(player, "选择了", "#g【死亡】", "的", "#y" + result.control)
            if (result.control == "选项一") {
                player.draw().gaintag.add("gbsiwang")
            } else if (result.control == "选项二") {
                await player.loseMaxHp()
                const skill = ["gbruoye", "gbchenggu", "gbzhaying"].find(skill => !player.hasSkill(skill))
                if (skill) player.addSkill(skill)
            }
        },
        ai: {
            effect: {
                player(card, player, target) {
                    if (get.tag(card, "damage") && player.hasCard("ying")) return [1, 1]
                },
                target(card, player, target) {
                    if (get.tag(card, "damage")) return [1, 1]
                }
            }
        }
    },
    gbspmortis_dead: {
        audio: "ext:GirlsBand/audio/die/spmortis2",
        trigger: {
            player: "dieBegin"
        },
        forced: true,
        unique: true,
        forceDie: true,
        filter(event, player) {
            return ["gbruoye", "gbchenggu", "gbzhaying"].every(skill => player.hasSkill(skill)) || ["gbruoye", "gbchenggu", "gbzhaying"].every(skill => !player.hasSkill(skill))
        },
        async content(event, trigger, player) {
            trigger.noDieAudio = true
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
                    `转换技，每名角色每轮限一次，当你参与的拼点结束后，你可以展示并获得一名其他角色区域内的一张牌，然后本轮你不能对其使用〖歧路〗` :
                    `转换技，每名角色每轮限一次，当你参与的拼点结束后，你可以展示并获得一名其他角色区域内的一张牌，然后你使用此牌`
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
                .set("filterTarget", (card, player, target) => player != target && !player.getStorage("gbjianqiu_used").includes(target) && target.countCards("hej"))
                .set("ai", (target) => {
                    let player = get.player()
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
            const target = event.targets[0]
            player.markAuto("gbjianqiu_used", target)
            player.addTempSkill("gbjianqiu_used", "roundStart")
            const { cards } = await player.choosePlayerCard(target, "hej", 1, true)
                .set("prompt", "笺秋：展示并获得" + get.translation(target) + "的一张牌")
                .forResult()
            await target.showCards(cards)
            await player.gain(cards, "gain2")
            if (!player.getStorage("gbjianqiu", false)) {
                player.markAuto("gbqilu_used", target)
                player.addTempSkill("gbqilu_used", "roundStart")
            } else {
                await player.chooseUseTarget(cards, true)
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
        audio: "ext:GirlsBand/audio/skill:3",
        trigger: {
            player: "discardAfter"
        },
        usable: 3,
        filter(event, player) {
            return event.cards?.length >= 2 || event.cards?.some(card => get.color(card) == "black" && card.original == "h")
        },
        logTarget: "targets",
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(get.prompt2(event.skill))
                .set("filterTarget", lib.filter.notMe)
                .set("ai", target => get.attitude(player, target) < 0)
                .forResult()
        },
        async content(event, trigger, player) {
            const target = event.targets[0]
            const entries = [
                {
                    key: "选项一", text: () => "获得三张【影】，本回合你的【影】均视为【杀】", run: async chooser => {
                        await chooser.gain(lib.card.ying.getYing(3))
                        chooser.addTempSkill("gbduoluo_sha")
                    }
                },
                {
                    key: "选项二", text: other => "失去1点体力，视为对" + get.translation(other) + "使用一张【杀】", run: async (chooser, other) => {
                        await chooser.loseHp()
                        if (chooser.canUse({ name: "sha" }, other, false, false)) await chooser.useCard({ name: "sha" }, other, false);
                    }
                },
                {
                    key: "选项三", text: other => "本回合对" + get.translation(other) + "使用【杀】无距离与次数限制", run: async (chooser, other) => {
                        chooser.addTempSkill("gbduoluo_temp")
                        chooser.markAuto("gbduoluo_temp", [other])
                    }
                },
                {
                    key: "选项四", text: other => "令" + get.translation(other) + "摸三张牌，然后终止选项", run: async (chooser, other) => {
                        await other.draw(3)
                    }
                }
            ]
            for (let i = 0; i < 4; i++) {
                const chooser = i % 2 == 0 ? player : target
                const other = chooser == player ? target : player
                const used = player.getStorage("gbduoluo_used")
                const available = entries.filter(entry => !used.includes(entry.key))
                if (!available.length) break
                const list = available.map(entry => entry.key)
                const choiceList = [
                    "获得3张【影】，本回合" + get.translation(chooser) + "的【影】均视为【杀】",
                    "失去1点体力，视为对" + get.translation(other) + "使用一张【杀】",
                    "本回合对" + get.translation(other) + "使用【杀】无距离与次数限制",
                    "令" + get.translation(other) + "摸三张牌，然后终止选项"
                ]
                const result = await chooser.chooseControl(list)
                    .set("prompt", "堕落：请选择一项")
                    .set("choiceList", choiceList)
                    .set("other", other)
                    .set("ai", () => {
                        const me = chooser
                        const opp = other
                        const controls = (get.event().controls || []).filter(c => c != "cancel2")
                        if (!controls.length) return "cancel2"
                        const keys = ["选项一", "选项二", "选项三", "选项四"]
                        let validMask = 0
                        for (let i = 0; i < 4; i++) if (controls.includes(keys[i])) validMask |= 1 << i
                        if (!validMask) return "cancel2"
                        if ((validMask & (validMask - 1)) === 0) {
                            for (let i = 0; i < 4; i++) if (validMask & (1 << i)) return keys[i]
                        }
                        const pair = [me, opp]
                        const build = who => {
                            const self = pair[who], foe = pair[1 - who]
                            const canSha = self.canUse({ name: "sha" }, foe)
                            const shaCount = self.countCards("h", { name: "sha" })
                            const att = get.attitude(self, foe)
                            const friend = att > 0
                            const neutral = att == 0
                            const k = friend ? 1 : neutral ? 0.6 : 1
                            const s = friend ? [
                                6,
                                -10,
                                -3,
                                10
                            ] : [
                                5 * k,
                                (canSha ? (self.hp > 2 ? 6 : self.hp > 1 ? 2 : -10) + shaCount : -10) * k,
                                (canSha || shaCount ? 4 + shaCount * 2 : 2) * k,
                                (neutral ? -2 : -8) * k
                            ]
                            return { s, sign: friend ? 1 : neutral ? 0 : -1 }
                        }
                        const info = [build(0), build(1)]
                        const memo = new Map()
                        const search = (who, mask) => {
                            const key = who * 16 + mask
                            const cached = memo.get(key)
                            if (cached) return cached
                            let bestI = -1, bestVal = -Infinity
                            for (let i = 0; i < 4; i++) {
                                const bit = 1 << i
                                if (!(validMask & bit) || (mask & bit)) continue
                                let val = info[who].s[i]
                                if (i != 3) {
                                    const nx = search(1 - who, mask | bit)
                                    val += info[who].sign * nx.val * 0.8
                                }
                                if (val > bestVal) { bestVal = val; bestI = i }
                            }
                            const res = bestI < 0 ? { i: -1, val: 0 } : { i: bestI, val: bestVal }
                            memo.set(key, res)
                            return res
                        }
                        const r = search(0, 0)
                        return r.i < 0 ? "cancel2" : keys[r.i]
                    })
                    .forResult()
                if (!result.control || result.control == "cancel2") break
                game.log(chooser, "选择了", "#g【堕落】", "的", "#y" + result.control)
                player.markAuto("gbduoluo_used", [result.control])
                player.addTempSkill("gbduoluo_used")
                const entry = entries.find(entry => entry.key == result.control)
                await entry.run(chooser, other)
                if (result.control == "选项四") break
            }
        },
        subSkill: {
            used: {
                onremove: true
            },
            temp: {
                onremove: true,
                mod: {
                    cardUsableTarget(card, player, target) {
                        if (player.getStorage("gbduoluo_temp").includes(target) && get.name(card) == "sha") return true
                    },
                    targetInRange(card, player, target) {
                        if (player.getStorage("gbduoluo_temp").includes(target) && get.name(card) == "sha") return true
                    }
                }
            },
            sha: {
                onremove: true,
                mod: {
                    cardname(card, player, current) {
                        if (get.name(card) == "ying") return "sha"
                    }
                }
            }
        }
    },
    // 小白
    gbqixiang: {
        audio: false,
        trigger: {
            global: "phaseBefore",
            player: ["phaseZhunbeiBegin", "enterGame"]
        },
        mark: "auto",
        marktext: "幻",
        intro: {
            markcount: "expansion",
            content: "expansion"
        },
        filter(event, player, name) {
            return name != "phaseBefore" || game.phaseNumber == 0
        },
        async content(event, trigger, player) {
            const cards = get.cards(4, true)
            if (!cards.length) return
            await player.showCards(cards)
            const result = await player.chooseButton(["绮想：选择一张牌置于武将牌上，称为『幻』", [cards, "vcard"]], true)
                .set("ai", button => {
                    const player = get.event().player
                    if (!["basic", "trick"].includes(get.type(button.link))) return -player.getUseValue(button.link)
                    if (player.getExpansions("gbqixiang").some(card => get.name(card) == button.link.name)) return -player.getUseValue(button.link)
                    return player.getUseValue(button.link)
                })
                .forResult()
            if (result.bool) {
                const next = player.addToExpansion(result.links, "giveAuto", "bySelf")
                next.gaintag.add("gbqixiang")
                await next
            }
        },
        ai: {
            combo: "gbyingjian"
        }
    },
    gbyingjian: {
        audio: false,
        enable: ["chooseToUse", "chooseToRespond"],
        hiddenCard(player, name) {
            return player.getExpansions("gbqixiang").some(card => get.name(card) == name)
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
                return get.event().getParent().filterCard({
                    name: button.link[2]
                }, player, get.event().getParent());
            },
            backup(links, player) {
                return {
                    audio: false,
                    selectCard: 0,
                    viewAs: {
                        name: links[0][2],
                        storage: {
                            gbyingjian: true,
                        }
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
                        return player.getExpansions("gbqixiang").some(card => get.name(card) == "tao")
                    case "respondShan":
                        return player.getExpansions("gbqixiang").some(card => get.name(card) == "shan")
                    case "respondSha":
                        return player.getExpansions("gbqixiang").some(card => get.name(card) == "sha")
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
                    player.discard(player.getExpansions("gbqixiang").filter(card => get.name(card) == trigger.respondTo[1].name))
                    player.removeSkill("gbyingjian_2")
                }
            },
            2: {
                audio: false,
                trigger: {
                    player: ["useCardAfter", "respondAfter"]
                },
                forced: true,
                filter(event, player) {
                    return event.card?.storage?.gbyingjian
                },
                async content(event, trigger, player) {
                    player.removeSkill("gbyingjian_2")
                    const x = player.countSkill("gbyingjian")
                    const list = [], choiceList = ["弃置" + get.cnNumber(x) + "张牌", "移去所有的『幻』" + (_status.currentPhase == player ? "，然后发动一次〖绮想〗" : "")]
                    if (player.countCards("he") >= x) {
                        list.push("选项一")
                    }
                    if (player.countExpansions("gbqixiang")) {
                        list.push("选项二")
                    }
                    if (!list.length) return
                    const result = await player.chooseControl(list)
                        .set("prompt", "萤茧：请选择一项")
                        .set("choiceList", choiceList)
                        .set("num", x)
                        .set("ai", () => {
                            const event = get.event()
                            if (event.player.countCards("he", card => get.value(card) <= 6) >= event.num) return "选项一"
                            return event.controls.includes("选项二") ? "选项二" : "选项一"
                        })
                        .forResult()
                    game.log(player, "选择了", "#g【萤茧】", "的", "#y" + result.control)
                    if (result.control == "选项一") {
                        await player.chooseToDiscard("he", true, x)
                    } else if (result.control == "选项二") {
                        await player.discard(player.getExpansions("gbqixiang"))
                        if (_status.currentPhase == player) await player.useSkill("gbqixiang")
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
            event.result = await trigger.player.chooseBool(`###${get.prompt(event.skill)}###是否令${get.translation(player)}将牌堆中的一张同名牌置于『幻』中？`)
                .set("ai", () => {
                    let player = get.player()
                    let source = get.event().source
                    let cards = get.event().cards
                    if (get.attitude(player, source) > 0) return !source.getExpansions("gbqixiang").some(c => cards.some(card => get.name(card) == c.name))
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
            let player = get.player()
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
            if (!target.getCards("e").some(c => c != card && get.color(c) == get.color(card))) delete player.getStat("skill")[event.name]
            await target.equip(card)
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
            global: "roundEnd"
        },
        filter(event, trigger) {
            return game.hasPlayer(cur => cur.hasCard(card => get.subtype(card, cur) == "equip2", "ej"))
        },
        forced: true,
        async content(event, trigger, player) {
            player.draw(game.filterPlayer().reduce((num, cur) => num + cur.countCards("e", card => get.subtype(card, cur) == "equip2"), 0))
        },
        mod: {
            canBeDiscarded(card, player, target) {
                if (player != target && get.position(card) == "e") return false;
            },
        },
        group: "gbchaoliu_effect",
        subSkill: {
            effect: {
                audio: false,
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
                            if (trigger.target.countCards("e")) {
                                await player.gainPlayerCard(`###${get.prompt("gbchaoliu")}###请选择一张装备牌`, "e", trigger.target)
                            }
                            break
                        case "black":
                            trigger.directHit.add(trigger.target)
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
            player: ["phaseUseBegin", "enterGame"]
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
            event.result = await player.chooseTarget(`###${get.prompt(event.skill)}###令一名其他角色获得「佑」`)
                .set("ai", target => {
                    let player = get.player()
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
                    return event.player != player && event.targets?.length == 1 && event.targets[0].hasMark("gbyouzi") && get.is.damageCard(event.card)
                },
                logTarget: "targets",
                async cost(event, trigger, player) {
                    event.result = await player.chooseBool("佑姊：是否将" + get.translation(trigger.card) + "的目标改为你？")
                        .set("ai", () => {
                            const event = get.event()
                            return get.effect(event.player, event.getTrigger().card, event.getTrigger().player, event.player) < 0
                        })
                        .forResult()
                },
                async content(event, trigger, player) {
                    const target = trigger.targets[0]
                    const evt = trigger.getParent()
                    evt.targets.remove(target)
                    evt.triggeredTargets2.remove(target)
                    evt.targets.push(player)
                    evt.triggeredTargets2.push(player)
                    trigger.player.line(player)
                    game.delayx()
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
            return event.targets?.length == 1 && event.targets[0] == player && get.is.damageCard(event.card)
        },
        async cost(event, trigger, player) {
            const list = ["选项一", "选项二"]
            const choiceList = ["摸一张牌", "若此牌结算后你未受到伤害，你获得" + get.translation(trigger.player) + "的一张牌", "背水：移去场上的一枚「佑」"]
            if (game.hasPlayer(target => target.hasMark("gbyouzi"))) {
                list.push("背水")
            }
            list.push("cancel2")
            const result = await player.chooseControl(list)
                .set("prompt", `###${get.prompt(event.skill)}###请选择一项`)
                .set("choiceList", choiceList)
                .set("trigger", trigger)
                .set("ai", () => {
                    let player = get.player()
                    let controls = get.event().controls
                    let bool = false
                    let card = get.event().getTrigger().card
                    if (get.canRespond(card)?.some(c => player.hasCard(c, "hs"))) bool = true
                    if (bool && controls.includes("背水")) return "背水"
                    if (!bool) return "选项一"
                    return "选项二"
                })
                .forResult()
            event.result = {
                bool: result.control != "cancel2",
                cost_data: result.control
            }
        },
        async content(event, trigger, player) {
            game.log(player, "选择了", "#g【土笔】", "的", "#y" + event.cost_data)
            if (event.cost_data != "选项二") await player.draw()
            if (event.cost_data != "选项一") {
                player.when({ global: "useCardAfter" })
                    .filter(evt => evt.card == trigger.card)
                    .then(async () => {
                        const evt = get.event()
                        const player = evt.player
                        if (!player.hasHistory("damage", history => history.card == trigger.card) && trigger.player.countCards("he")) {
                            await player.gainPlayerCard("he", trigger.player, true)
                        }
                    })
            }
            if (event.cost_data == "背水") {
                const result = await player.chooseTarget("土笔：请移除一枚「佑」", true)
                    .set("filterTarget", (card, player, target) => target.hasMark("gbyouzi"))
                    .set("ai", target => get.attitude(player, target) < 0)
                    .forResult()
                if (result.bool) {
                    result.targets[0].clearMark("gbyouzi")
                    result.targets[0].updateMark("gbyouzi")
                }
            }
        },
        ai: {
            effect: {
                target(card, player, target) {
                    if (get.tag(card, "damage")) return [1, 1]
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
            let result = await player.choosePlayerCard(target, "h", 1, true).set("prompt", "天资：请选择" + get.translation(target) + "的一张手牌").forResult()
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
            player: "useCard",
            source: "damageSource"
        },
        filter(event, player, name) {
            if (name == "damageSource") {
                return player.getHistory("sourceDamage")?.reduce((num, evt) => num + evt.num, 0) > player.maxHp
            }
            return true
        },
        async content(event, trigger, player) {
            if (event.triggername == "useCard") {
                await player.draw()
                if (player.getHistory("gain", evt => evt.getParent("gbzicun", true)).flatMap(evt => evt.cards).length <= player.maxHp) return
            }
            if (_status.currentPhase == player) {
                get.event().getParent("phaseUse")?.finish()
            } else {
                const list = [], choiceList = ["弃置所有手牌", "失去1点体力"]
                if (player.countCards("h")) {
                    list.push("选项一")
                }
                list.push("选项二")
                const result = await player.chooseControl(list)
                    .set("prompt", "自寸：请选择一项")
                    .set("choiceList", choiceList)
                    .set("ai", () => {
                        const event = get.event()
                        if (event.player.hp > 1 && event.player.countCards("h") > 2) return "选项二"
                        return event.controls[0]
                    })
                    .forResult()
                game.log(player, "选择了", "#g【自寸】", "的", "#y" + result.control)
                if (result.control == "选项一") await player.discard(player.getCards("h"))
                else await player.loseHp()
            }
        },
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
            return event.targets.length > 0 && get.name(event.card) == "sha"
        },
        locked: true,
        async cost(event, trigger, player) {
            let list = trigger.target.getGainableSkills((info, skill) => !info.persevereSkill)
            if (list.length == 0) return false
            let dialog = ui.create.dialog(`###${get.prompt(event.skill)}###请选择${get.translation(trigger.target)}的一项非持恒技`, "forcebutton");
            list.forEach(i => {
                if (lib.translate[i + "_info"]) {
                    var translation = get.translation(i);
                    dialog.add([[[i, '【' + translation + "】" + lib.translate[i + "_info"]]], "tdnodes"])
                }
            })
            let result = await player.chooseButton(dialog).set("ai", btn => get.skillRank(btn.link, ["in", "out"], true)).forResult()
            if (result && result.bool) {
                event.result = {
                    bool: true,
                    cost_data: result.links[0][0]
                }
            }
        },
        async content(event, trigger, player) {
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
            const player = get.player()
            if (get.color(card) == "black" && !card?.hasGaintag?.("gbweiqin")) return player.getUseValue("jiu", false, false) > player.getUseValue(card) ? 2 : 0
            return 1
        },
        mod: {
            cardname(card, player) {
                if (card?.hasGaintag?.("gbweiqin")) return "jiu"
            },
            cardUsable(card) {
                if (card?.cards?.some(c => c?.hasGaintag?.("gbweiqin"))) return Infinity

            }
        },
        ai: {
            order: 8,
            result: {
                player: 1
            }
        },
        async content(event, trigger, player) {
            const card = event.cards[0]
            await player.showCards(event.cards)
            if (get.color(card) == "black") {
                await player.addGaintag(card, "gbweiqin")
                delete player.getStat("skill").gbweiqin
            } else if (get.color(card) == "red") {
                for (const target of game.filterPlayer(target => target != player).sortBySeat()) {
                    const list = ["选项一"],
                        choiceList = ["本回合无法响应" + get.translation(player) + "使用的牌", "交给" + get.translation(player) + "一张牌"]
                    if (target.countCards("he")) {
                        list.push("选项二")
                    }
                    const result = await target.chooseControl(list)
                        .set("prompt", "唯琴：请选择一项")
                        .set("choiceList", choiceList)
                        .set("source", player)
                        .set("ai", () => {
                            const event = get.event()
                            if (event.controls.includes("选项二") && event.player.countCards("he") > 2) return "选项二"
                            return "选项一"
                        })
                        .forResult()
                    game.log(target, "选择了", "#g【唯琴】", "的", "#y" + result.control)
                    if (result.control == "选项一") {
                        target.markAuto("gbweiqin_effect", player)
                        target.addTempSkill("gbweiqin_effect")
                    } else if (result.control == "选项二") {
                        const next = await target.chooseCard("唯琴：交给" + get.translation(player) + "一张牌", "he", true)
                            .set("ai", card => 6 - get.value(card))
                            .forResult()
                        await target.give(next.cards, player, "giveAuto")
                    }
                }
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
        forced: true,
        async content(event, trigger, player) {
            let drawNum = 0
            for (const target of game.filterPlayer(target => target != player).sortBySeat()) {
                const list = ["选项二"], choiceList = ["弃置一张牌，本轮下次造成的属性伤害+1", "摸一张牌，本轮下次受到的属性伤害+1"]
                if (target.countCards("he")) list.unshift("选项一")
                const result = await target.chooseControl(list)
                    .set("prompt", "再演：请选择一项")
                    .set("choiceList", choiceList)
                    .set("ai", () => {
                        const event = get.event()
                        const player = get.player()
                        let val = Math.random()
                        const entries = {
                            "选项一": () => {
                                if (player.hasSkillTag("fireAttack")) val += 0.2
                                if (player.countCards("hs", card => get.is.damageCard(card) && card.hasNature())) val += 0.2
                                if (player.countCards("e", card => get.name(card) == "zhuque")) val += 0.2
                                return val
                            },
                            "选项二": () => {
                                if (player.hasSkillTag("filterDamage")) val += 0.2
                                if (player.hasSkillTag("nofire") || player.hasSkillTag("nothunder") || player.hasSkillTag("nodamage")) val += 0.2
                                if (player.hasSkillTag("maixie")) val += 0.2
                                return val
                            }
                        }
                        return event.controls.sort((a, b) => entries[b]() - entries[a]())[0]
                    })
                    .forResult()
                game.log(target, "选择了", "#g【再演】", "的", "#y" + result.control)
                if (result.control == "选项一") {
                    const discard = await target.chooseToDiscard("再演：请弃置一张牌", "he", true).forResult()
                    target.addSkill("gbzaiyan_deal")
                    target.addTip("gbzaiyan_deal", "下次造成的属性伤害+1", false)
                } else {
                    await target.draw()
                    target.addSkill("gbzaiyan_take")
                    target.addTip("gbzaiyan_take", "下次受到的属性伤害+1", false)
                    drawNum++
                }
            }
            const result = await player.chooseControl(["选项一", "选项二"])
                .set("prompt", "再演：请选择一项")
                .set("choiceList", ["获得〖皆杀〗直到你的回合结束", "下次造成的属性伤害+" + drawNum])
                .set("ai", () => get.rand(2))
                .forResult()
            game.log(player, "选择了", "#g【再演】", "的", "#y" + result.control)
            if (result.control == "选项一") {
                player.addTempSkill("gbjiesha", { player: "phaseAfter" })
            } else {
                if (drawNum) {
                    player.addSkill("gbzaiyan_deal")
                    player.setStorage("gbzaiyan_deal", drawNum)
                    player.addTip("gbzaiyan_deal", "下次造成的属性伤害+" + drawNum, false)
                }
            }
        },
        subSkill: {
            deal: {
                audio: false,
                charlotte: true,
                trigger: {
                    source: "damageBegin1"
                },
                onremove(player) {
                    player.removeTip("gbzaiyan_deal")
                    player.removeStorage("gbzaiyan_deal")
                },
                forced: true,
                filter(event, player) {
                    return event.nature
                },
                async content(event, trigger, player) {
                    let num = player.getStorage("gbzaiyan_bonus", 1)
                    trigger.num += num
                    player.removeSkill("gbzaiyan_deal")
                }
            },
            take: {
                audio: false,
                charlotte: true,
                trigger: {
                    player: "damageBegin1"
                },
                onremove(player) {
                    player.removeTip("gbzaiyan_take")
                },
                forced: true,
                filter(event, player) {
                    return event.nature
                },
                async content(event, trigger, player) {
                    trigger.num++
                    player.removeSkill("gbzaiyan_take")
                }
            },
        },
        ai: {
            threaten: 1.8,
            result: {
                player: 1
            }
        }
    },
    gbliejiu: {
        audio: false,
        enable: "phaseUse",
        usable: 1,
        async content(event, trigger, player) {
            player.loseHp()
            await player.drawTo(player.maxHp)
            let result = await player.chooseCard("烈酒：请展示一张手牌", 1, true, "h")
                .set("ai", (card) => {
                    let player = get.player()
                    if (get.color(card) == "red") return player.countCards("hs", c => c.name == "sha") - player.getCardUsable("sha")
                    if (get.color(card) == "black") return 1
                    return 0
                })
                .forResult()
            if (result && result.bool) {
                player.showCards(result.cards)
                switch (get.color(result.cards[0])) {
                    case "red":
                        player.addTempSkill("gbliejiu_red")
                        break
                    case "black":
                        player.addTempSkill("gbliejiu_black")
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
            red: {
                trigger: {
                    player: "useCard1"
                },
                mod: {
                    targetInRange(card, player, target) {
                        if (get.name(card) == "sha") return true
                    },
                    cardUsable(card, player) {
                        if (get.name(card) == "sha") return Infinity
                    },
                    cardnature(card, player) {
                        if (get.name(card) == "sha") return "fire"
                    }
                },
                forced: true,
                filter(event, trigger) {
                    return get.name(event.card) == "sha"
                },
                async content(event, trigger, player) {
                    game.setNature(trigger.card, "fire")
                }
            },
            black: {
                trigger: {
                    player: "useCard1"
                },
                mod: {
                    cardnature(card, player) {
                        if (get.name(card) == "sha") return "thunder"
                    }
                },
                forced: true,
                filter(event, trigger) {
                    return get.name(event.card) == "sha"
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
        check() {
            if (Math.random() > 0.4) return true
        },
        prompt2: "是否弃置所有手牌并于本回合结束后执行一个额外回合？",
        async content(event, trigger, player) {
            await player.discard(player.getCards("h"))
            player.insertPhase()
        }
    },
    // 凑友希那
    gbgugao: {
        audio: false,
        trigger: {
            player: "gainAfter"
        },
        forced: true,
        mark: true,
        marktext: "孤",
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        filter(event, player) {
            return !event.getParent("gbgugao_effect", true)
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("孤高：请将任意张牌置于武将牌上，称为『孤』")
                .set("selectCard", [1, Infinity])
                .set("position", "he")
                .set("forced", true)
                .set("allowChooseAll", true)
                .set("ai", card => {
                    let player = get.player(),
                        dis = player.needsToDiscard(0, (i, player) => !player.canIgnoreHandcard(i) && !player.hasValueTarget(i))
                    if (get.position(card) == "e") {
                        if (get.name(card) == "baiyin" && player.isDamaged()) return 10
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
                trigger: {
                    player: "phaseEnd"
                },
                filter(event, player) {
                    return player.hasExpansions("gbgugao")
                },
                async content(event, trigger, player) {
                    player.gain(player.getExpansions("gbgugao"), "bySelf", "gain2")
                }
            }
        }
    },
    gbhuoniao: {
        audio: false,
        enable: "phaseUse",
        usable: 1,
        filter(event, player) {
            return player.countCards("h") > 0
        },
        selectCard: -1,
        filterCard: true,
        viewAs: {
            name: "wanjian",
            storage: { gbhuoniao: true }
        },
        async precontent(event, trigger, player) {
            const { cards: cards } = event.result
            await player.discard(cards)
            event.result.card.cards = [];
            event.result.cards = [];
            player.when({ player: "useCardAfter" })
                .filter((evt, player) => evt?.card?.storage?.gbhuoniao)
                .then(async (event, trigger, player) => {
                    for (const target of game.filterPlayer(target => target != player).sortBySeat()) {
                        const list = [], choiceList = ["令" + get.translation(player) + "获得你的一张牌", "获得" + get.translation(player) + "的一张『孤』，然后令其摸三张牌"]
                        if (target.countCards("he")) list.push("选项一")
                        if (player.countExpansions("gbgugao").length) list.push("选项二")
                        if (!list.length) continue
                        const result = await target.chooseControl(list)
                            .set("prompt", "火鸟：请选择一项")
                            .set("choiceList", choiceList)
                            .set("source", player)
                            .set("ai", () => {
                                const event = get.event()
                                if (event.controls.includes("选项二") && get.attitude(event.player, event.source) > 0) return "选项二"
                                return event.controls[0]
                            })
                            .forResult()
                        game.log(target, "选择了", "#g【火鸟】", "的", "#y" + result.control)
                        if (result.control == "选项一") {
                            await player.gainPlayerCard(target, "he", true)
                        } else if (result.control == "选项二") {
                            const { links: [card] } = await target.chooseButton(["火鸟：请选择并获得一张『孤』", player.getExpansions("gbgugao")], true)
                                .set("ai", button => get.value(button.link))
                                .forResult()
                            await target.gain(card, "giveAuto")
                            await player.draw(3)
                        }
                    }
                })
        },
        ai: {
            order: 5,
            result: {
                player: 1
            }
        }
    },
    gbqiangwei: {
        audio: false,
        trigger: {
            source: "damageSource"
        },
        zhuSkill: true,
        filter(event, player) {
            return event.player.group == player.group && event.player != player && player.hasExpansions("gbgugao")
        },
        logTarget: "player",
        async cost(event, trigger, player) {
            event.result = await trigger.player.chooseBool(`###${get.prompt(event.skill)}###是否获得${get.translation(player)}的两张『孤』？`)
                .set("source", player)
                .set("ai", () => {
                    const event = get.event()
                    return get.attitude(event.player, event.source) > 0
                })
                .forResult()
        },
        async content(event, trigger, player) {
            const result = await trigger.player.chooseButton(["蔷薇：请选择获得" + get.cnNumber(num) + "张『孤』", player.getExpansions("gbgugao")], 2, true)
                .set("ai", button => get.value(button.link))
                .forResult()
            if (result.bool) await trigger.player.gain(result.links, "giveAuto")
            if (trigger.player.countCards("he")) await player.gainPlayerCard(trigger.player, "he", true)
        }
    },
    // 今井莉莎
    gbquqi: {
        audio: false,
        trigger: {
            player: "gainAfter"
        },
        forced: true,
        mark: true,
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        filter(event, player) {
            return !event.getParent("gbquqi_effect", true)
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("曲奇：请将任意张牌置于武将牌上，称为『曲奇』").set("selectCard", [1, Infinity]).set("position", "he").set("forced", true)
                .set("ai", card => {
                    let player = get.player(),
                        dis = player.needsToDiscard(0, (i, player) => !player.canIgnoreHandcard(i) && !player.hasValueTarget(i)) || 1
                    if (get.position(card) == "e") {
                        if (get.name(card) == "baiyin" && player.isDamaged()) return 10
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
                trigger: {
                    global: "roundEnd"
                },
                filter(event, player) {
                    return player.hasExpansions("gbquqi")
                },
                async content(event, trigger, player) {
                    await player.discard(player.getExpansions("gbquqi"))
                    player.draw(3)
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
            let { links: cards, targets: [target] } = await player.chooseButtonTarget()
                .set("createDialog", ["慈爱：请选择并将至多两张『曲奇』交给一名角色", player.getExpansions("gbquqi")])
                .set("forced", true)
                .set("selectButton", [1, 2])
                .set("ai1", button => {
                    let player = get.player()
                    if (game.hasPlayer(tar => get.attitude(player, tar) > 0 && tar.hp < 3 && tar.isDamaged() && !player.getStorage("gbciai_used").includes(tar))) {
                        if (ui.selected.buttons.length == 0) return get.value(button.link)
                        return false
                    } else if (game.hasPlayer(tar => get.attitude(player, tar) < 0 && !tar.isDamaged() && !player.getStorage("gbciai_used").includes(tar))) {
                        if (ui.selected.buttons.length == 0) return -get.value(button.link)
                        return false
                    } else if (ui.selected.buttons.length == 0) return get.value(button.link)
                    return false
                })
                .set("ai2", target => {
                    let player = get.player()
                    if (get.attitude(player, target) > 0 && target.hp < 3 && target.isDamaged()) return 10
                    if (get.attitude(player, target) < 0 && !target.isDamaged()) return 5
                    if (get.attitude(player, target) > 0) return 2
                    return 1
                })
                .set("filterTarget", (card, player, target) => !player.getStorage("gbciai_used").includes(target))
                .forResult()
            await player.give(cards, target, "giveAuto")
            player.markAuto("gbciai_used", target)
            player.addTempSkill("gbciai_used", "roundStart")
            let choiceList = [
                `回复1点体力，然后令${get.translation(player)}摸三张牌`,
                "弃置" + get.translation(cards) + "并失去1点体力"
            ]
            let result = await target.chooseControl(["选项一", "选项二"], true)
                .set("prompt", "慈爱：请选择一项")
                .set("choiceList", choiceList)
                .set("ai", () => {
                    let player = get.player()
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
                    await target.recover()
                    await player.draw(3)
                    break
                case "选项二":
                    game.log(target, "选择了", "#g【慈爱】", "的", "#y" + result.control)
                    await target.discard(cards)
                    await target.loseHp()
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
        mark: true,
        marktext: "针",
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        filter(event, player) {
            return !event.getParent("gbzhunzhen_effect", true)
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("he", true, [1, Infinity], "准针：将任意张牌置于武将牌上，称为『针』")
                .set("ai", card => {
                    let player = get.player(),
                        dis = player.needsToDiscard(0, (i, player) => !player.canIgnoreHandcard(i) && !player.hasValueTarget(i))
                    if (get.position(card) == "e") {
                        if (get.name(card) == "baiyin" && player.isDamaged()) return 10
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
                trigger: {
                    player: "useCardAfter"
                },
                filter(event, player) {
                    return event.card && player.getExpansions("gbzhunzhen").some(card => card.number == event.card.number)
                },
                popup: false,
                async content(event, trigger, player) {
                    let result = await player.chooseTarget("准针：请选择一名距离1以内的角色", true)
                        .set("filterTarget", (card, player, target) => {
                            return get.distance(player, target) <= 1
                        })
                        .set("ai", (target) => {
                            let player = get.player()
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
            let next = await player.chooseButton(["前卫：请选择并弃置任意张『针』", [player.getExpansions("gbzhunzhen"), "card"]])
                .set("selectButton", [1, Infinity])
                .set("ai", (button) => {
                    let {
                        player,
                        dialog
                    } = get.event();
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
                    player.draw(3)
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
        mark: true,
        marktext: "魔",
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        filter(event, player) {
            return !event.getParent("gbduoluo_r", true)
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("he", true, [1, Infinity], "堕萝：请将任意张牌置于武将牌上，称为『魔』")
                .set("ai", card => {
                    let player = get.player(),
                        dis = player.needsToDiscard(0, (i, player) => !player.canIgnoreHandcard(i) && !player.hasValueTarget(i))
                    if (get.position(card) == "e") {
                        if (get.name(card) == "baiyin" && player.isDamaged()) return 10
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
                    `转换技，一名角色的结束阶段，若你有『魔』，你可以将任意张『魔』置入弃牌堆，若这些牌的点数之和为15，你对一名其他角色造成1点雷属性伤害，然后你摸三张牌。` :
                    `转换技，一名角色的结束阶段，若你有『魔』，你可以将任意张『魔』置入弃牌堆，若这些牌的花色各不相同且数量为四，你对一名其他角色造成2点伤害。`;
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
            let result = await player.chooseButton([`###${get.prompt(event.skill)}###请选择任意张『魔』牌`, [player.getExpansions("gbduoluo_r"), "card"]])
                .set("selectButton", [1, Infinity])
                .set("ai", (button) => {
                    let player = get.player()
                    let all = get.event().dialog.buttons
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
                        if (suit.length > 3 && all.length > 4) {
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
                        } else if (suit.length > 3) {
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
                if (event.cards.reduce((num, card) => num += card.number, 0) == 15) {
                    let result = await player.chooseTarget("魔射：选择一名其他角色对其造成1点雷属性伤害", true)
                        .set("filterTarget", lib.filter.notMe)
                        .set("ai", (target) => {
                            let player = get.player()
                            return get.effect(target, {
                                name: "thunderdamage"
                            }, player, player)
                        })
                        .forResult()
                    if (result) {
                        result.targets[0].damage("thunder")
                        player.draw(3)
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
                    let result = await player.chooseTarget("魔射：选择一名其他角色对其造成2点伤害", true)
                        .set("filterTarget", lib.filter.notMe)
                        .set("ai", (target) => {
                            let player = get.player()
                            return get.damageEffect(target, player, player)
                        })
                        .forResult()
                    if (result) {
                        result.targets[0].when(["dieAfter", "damageAfter"])
                            .filter((event, player, name) => {
                                if (name == "damageAfter") return true
                                return event.getParent("gbmoshe", true)
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
            player.changeZhuanhuanji("gbmoshe")
        },
    },
    // 白金燐子
    gbtici: {
        audio: false,
        trigger: {
            player: "gainAfter"
        },
        forced: true,
        mark: true,
        marktext: "词",
        intro: {
            content: "expansion",
            markcount: "expansion"
        },
        filter(event, player) {
            return !event.getParent("gbtici_effect", true)
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("he", true, [1, Infinity], "题词：将任意张牌置于武将牌上，称为『词』")
                .set("ai", card => {
                    let player = get.player(),
                        dis = player.needsToDiscard(0, (i, player) => !player.canIgnoreHandcard(i) && !player.hasValueTarget(i)) || 1
                    if (get.position(card) == "e") {
                        if (get.name(card) == "baiyin" && player.isDamaged()) return 10
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
                trigger: {
                    player: "phaseUseBegin"
                },
                filter(event, player) {
                    return player.hasExpansions("gbtici")
                },
                async cost(event, trigger, player) {
                    let { bool, links } = await player.chooseButton(["题词：你可以获得任意张『词』", player.getExpansions("gbtici")], [1, Infinity])
                        .set("ai", button => get.value(button.link))
                        .forResult()
                    event.result = {
                        bool: bool,
                        cost_data: links
                    }
                },
                async content(event, trigger, player) {
                    const next = player.gain(event.cost_data, "gain2")
                    next.gaintag.add("gbtici_effect")
                    await next
                    player.addTempSkill("gbtici_temp")
                }
            },
            temp: {
                mod: {
                    ignoredHandcard(card, player) {
                        if (card?.hasGaintag?.("gbtici_effect")) return true
                    }
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
            global: "phaseBegin"
        },
        filter(event, player) {
            return game.hasPlayer(target => target != player && target.hp < player.hp)
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(`###${get.prompt(event.skill)}###你可以令至多三名体力值小于你的其他角色摸一张牌`, [1, 3])
                .set("filterTarget", (card, player, target) => target != player && target.hp < player.hp)
                .set("ai", target => {
                    const player = get.player()
                    const X = player.countExpansions("gbtici")
                    if (get.attitude(player, target) <= 0) return 0
                    const eff = get.effect(target, { name: "draw" }, player, player)
                    const num = ui.selected.targets.reduce((s, p) => s + p.hp, 0)
                    if (ui.selected.targets.length === 0) return eff + (X - target.hp) * 0.5
                    if (num + target.hp <= X) return eff
                    return eff - get.effect(player, { name: "draw" }, player, player) * num
                })
                .forResult()
        },
        async content(event, trigger, player) {
            for (const target of event.targets) await target.draw()
            if (event.targets.reduce((sum, target) => sum + target.hp, 0) <= player.countExpansions("gbtici")) await player.draw(event.targets.length)
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
        filter(event, player) {
            return !event.getParent("gbbomu", true)
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("薄暮：请选择并展示任意张手牌，使其增加「暮」标记", [1, Infinity], "h", true)
                .set("filterCard", card => !card.gaintag?.includes("gbbomu_tag"))
                .set("ai", card => {
                    let player = get.player(),
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
                                get.value(b) + 1 :
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
            await player.showCards(cards)
            player.addMark("gbkongtan_show", cards.length)
            player.addTempSkill("gbkongtan_show")
            let num = Math.min(player.countMark("gbkongtan_show"), 5)
            while (true) {
                let card = await player.chooseCard("空谭：请选择一张「暮」牌置于牌堆顶或牌堆底")
                    .set("forced", true)
                    .set("position", "h")
                    .set("filterCard", card => card.gaintag?.includes("gbbomu_tag"))
                    .forResult()
                if (card && card.bool) {
                    let result = await player.chooseControl(["牌堆顶", "牌堆底", "cancel2"])
                        .set("prompt", "空谭：请选择将" + get.translation(card.cards[0]) + "置于...")
                        .set("card", card.cards[0])
                        .set("ai", () => {
                            let player = get.player()
                            let card = get.event().card
                            if (player.getStorage("gbkongtan_temp").includes("牌堆顶")) {
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
                    game.log(player, "将", card.cards, "置于了", "#y" + (result.control))
                    if (!player.countCards("h", card => card.gaintag?.includes("gbbomu_tag"))) break
                }
            }
            let target = (await player.chooseTarget("空谭：选择一名角色", true)
                .set("ai", (target) => {
                    let player = get.player(),
                        num = Math.min(player.countMark("gbkongtan_show"), 5),
                        cards = get.cards(num, true),
                        red = cards.reduce((num, c) => num += c.isKnownBy(player) ? (get.color(c) == "red" ? 1 : 0) : Math.round(Math.random() - 0.2), 0) > (cards.length / 2)
                    if (!player.getStorage("gbkongtan_temp").includes("选项二") || !player.getStorage("gbkongtan_temp").includes("选项三")) return get.attitude(player, target)
                    return -get.attitude(player, target)
                }).forResult()).targets
            if (target[0]) {
                const list = ["选项一", "选项二", "选项三"].removeArray(player.getStorage("gbkongtan_temp"))
                if (!list.length) return
                const choiceList = [
                    "展示牌堆顶" + get.cnNumber(num) + "张牌，若红色牌较多，则" + get.translation(player) + "对你造成1点伤害并获得所有展示牌，否则将这些牌以原顺序放回牌堆顶",
                    "将手牌数调整至" + get.cnNumber(num),
                    "令" + get.translation(player) + "获得〖寸目〗持续到回合结束，然后你摸两张牌"
                ]
                const next = await target[0].chooseControl(list)
                    .set("prompt", "空谭：请选择一项")
                    .set("choiceList", choiceList)
                    .set("source", player)
                    .set("num", num)
                    .set("ai", () => {
                        const player = get.player(),
                            source = get.event().source,
                            num = Math.min(source.countMark("gbkongtan_show"), 5),
                            cards = get.cards(num, true),
                            red = cards.reduce((num, c) => num += c.isKnownBy(player) ? (get.color(c) == "red" ? 1 : 0) : Math.round(Math.random() - 0.2), 0) > (cards.length / 2)
                        if (get.attitude(player, source) > 0) {
                            let result = {
                                选项一: 0,
                                选项二: num - source.countCards("h"),
                                选项三: 10
                            }
                            return get.event().controls.slice().sort((a, b) => result[b] - result[a])[0]
                        } else {
                            let result = {
                                选项一: red ? (get.effect(player, {
                                    name: "damage"
                                }, source, player) < 0 ? 0 : -num) : 0,
                                选项二: source.countCards("h") - num,
                                选项三: -3
                            }
                            return get.event().controls.slice().sort((a, b) => result[b] - result[a])[0]
                        }
                    })
                    .forResult();
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
            return game.hasPlayer(target => target != player && target.group == player.group) && event.cards && event.cards.some(card => card.gaintag?.includes("gbbomu_tag"))
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
        filter(event, player) {
            return !event.getParent("gbchenyang_effect", true)
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("尘阳：请选择并展示任意张手牌，使其增加「尘」标记", [1, Infinity], "h", true)
                .set("filterCard", card => !card.gaintag?.includes("gbchenyang_tag"))
                .set("ai", card => {
                    let player = get.player(),
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
                trigger: {
                    player: "loseAfter"
                },
                filter(event, player) {
                    for (var i in event.gaintag_map) {
                        if (event.gaintag_map[i].includes("gbchenyang_tag") && !player.countCards("h", card => card.gaintag?.includes("gbchenyang_tag"))) return true
                    }
                },
                async content(event, trigger, player) {
                    let num = player.countCards("h") - 4
                    if (num > 0) await player.chooseToDiscard("h", true, num)
                    else await player.drawTo(4)
                },
                mod: {
                    cardRespondable(card, player, result) {
                        if (card.gaintag?.includes("gbchenyang_tag")) return false
                    },
                    cardEnabled2(card, player, result) {
                        if (get.event().name == "chooseToRespond" && card.gaintag?.includes("gbchenyang_tag")) return false
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
            return event.player != player && player.countCards("h") > 0
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard(`${get.prompt2(event.skill)}`, "h")
                .set("ai", card => {
                    const player = get.player()
                    const target = get.event().getTrigger().player
                    let score = 6 - get.value(card)
                    if (get.attitude(player, target) > 0) {
                        if (get.color(card) == "red") score += 4
                    } else {
                        if (get.color(card) == "black") {
                            score += 4
                            score += target.getCards("h", current => get.suit(current) == get.suit(card)).length * 2
                        }
                    }
                    return score
                })
                .forResult()
        },
        async content(event, trigger, player) {
            await player.lose(event.cards, ui.cardPile).set("insert_card", true)
            game.log(player, "将", get.cnNumber(event.cards.length), "张牌置于了", "#y牌堆顶")
            const target = trigger.player
            const result = await target.judge().forResult()
            if (result.color == "red") {
                if (player.canUse("tuixinzhifu", target)) await player.useCard(get.autoViewAs({ name: "tuixinzhifu", isCard: true }), target)
            } else {
                let cards = target.getCards("h", card => get.suit(card) == result.suit)
                if (cards.length) await target.discard(cards, player)
            }
        }
    },

    gbhongri: {
        audio: false,
        forced: true,
        trigger: {
            player: "gainAfter"
        },
        filter(event, player) {
            return !event.getParent("gbhongri_effect", true)
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("红日：请选择并展示任意张手牌，使其增加「日」标记", [1, Infinity], "h", true)
                .set("filterCard", card => !card.gaintag?.includes("gbhongri_tag"))
                .set("ai", card => {
                    let player = get.player()
                    if (!["sha", "shan"].includes(card.name)) return true
                    if ([...ui.cardPile.childNodes].some(card => get.name(card) == "wanjian")) return card != player.getCards("h", card => !card.gaintag?.includes("gbhongri_tag") && get.name(card) == "shan")[0]
                    if ([...ui.cardPile.childNodes].some(card => get.name(card) == "juedou" || get.name(card) == "nanman")) return card != player.getCards("h", card => !card.gaintag?.includes("gbhongri_tag") && get.name(card) == "sha")[0]
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
                    let card = get.cards(1)
                    game.cardsGotoOrdering(card)
                    await player.showCards(card)
                    let result = await player.chooseTarget("红日：将此牌交给一名其他角色", true)
                        .set("filterTarget", lib.filter.notMe)
                        .set("ai", target => {
                            let player = get.player()
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
                        if (get.event().name == "chooseToRespond" && card.gaintag?.includes("gbhongri_tag")) return false
                    }
                },
            }
        },
    },

    gbyuanzhen: {
        audio: false,
        trigger: {
            global: "phaseUseBegin"
        },
        locked: true,
        filter(event, player) {
            return event.player != player && player.inRange(event.player) && player.countCards("h", card => card.gaintag?.includes("gbhongri_tag"))
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard("圆阵：请选择任意张「日」牌置于牌堆顶")
                .set("selectCard", [1, Infinity])
                .set("position", "h")
                .set("forced", true)
                .set("ai", (card) => {
                    let player = get.player()
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
            let { targets } = await player.chooseTarget(`红日：请选择${get.cnNumber(num)}名角色与${get.translation(target)}议事`, Math.min(num, game.countPlayer(p => p != target)), true)
                .set("ai", target => {
                    let player = get.player()
                    let num = get.event().selectTarget[1]
                    if (num == 1) return player == target
                    if (get.attitude(player, target) > 0) return 10
                    return 1
                })
                .set("filterTarget", (card, player, tar) => tar != get.event().targetx)
                .set("targetx", target)
                .forResult()
            if (targets.length > 0) {
                target.chooseToDebate(targets.concat(target))
                    .set("callback", async () => {
                        const debate = get.event()
                        const result = debate.debateResult
                        if (!result?.bool) return
                        const player = debate.player
                        if (result.opinion == "red") {
                            for (const target of debate.targets.sortBySeat()) await target.draw()
                        } else if (result.opinion == "black") {
                            for (const target of debate.targets.sortBySeat()) {
                                if (target == player || target.isDead()) continue
                                if (target.canUse({ name: "sha" }, player, false, false)) await target.useCard({ name: "sha" }, player)
                            }
                        } else {
                            const cards = []
                            for (const list of [result.red || [], result.black || [], result.others || []]) {
                                for (const entry of list) if (entry[1]) cards.add(entry[1])
                            }
                            if (cards.length) await debate.getParent("chooseToDebate", true)?.source?.gain(cards, "giveAuto")
                        }
                    })
                    .set("source", player)
                    .set("ai", (card) => {
                        const debate = get.event()
                        const player = debate.player
                        const source = debate.getParent(3).player
                        if (get.attitude(player, source) > 0) return get.color(card) == "red"
                        return get.color(card) == "black"
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
        filter(event, player) {
            return !event.getParent("gbfeishou_effect", true)
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("绯手：请选择并展示任意张手牌，使其增加「绯」标记", [1, Infinity], "h", true)
                .set("filterCard", card => !card.gaintag?.includes("gbfeishou_tag"))
                .set("ai", card => {
                    let player = get.player()
                    if (!["sha", "shan"].includes(card.name)) return true
                    if ([...ui.cardPile.childNodes].some(card => get.name(card) == "wanjian")) return card != player.getCards("h", card => !card.gaintag?.includes("gbhongri_tag") && get.name(card) == "shan")[0]
                    if ([...ui.cardPile.childNodes].some(card => get.name(card) == "juedou" || get.name(card) == "nanman")) return card != player.getCards("h", card => !card.gaintag?.includes("gbhongri_tag") && get.name(card) == "sha")[0]
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
                        if (get.event().name == "chooseToRespond" && card.gaintag?.includes("gbfeishou_tag")) return false
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
            const target = trigger.player
            const canUseCard = player.countCards("hs", card => (get.name(card) == "sha" || get.type(card) == "trick") && player.canUse(card, target, true, true))
            const list = [], choiceList = ["对" + get.translation(target) + "使用一张【杀】或普通锦囊牌，若此牌造成伤害，你获得其一张牌", "摸一张牌并将一张「绯」置于牌堆顶，且" + get.translation(target) + "获得〖马术〗持续至回合结束"]
            if (canUseCard) {
                list.push("选项一")
            }
            list.push("选项二", "cancel2")
            const result = await player.chooseControl(list)
                .set("prompt", `###${get.prompt(event.skill)}###`)
                .set("choiceList", choiceList)
                .set("target", target)
                .set("ai", () => {
                    const event = get.event()
                    const player = event.player
                    const target = event.target
                    if (get.attitude(player, target) > 0) return "选项二"
                    if (target.countCards("j") && !target.hasWuxie()) return "选项二"
                    if (!event.controls.includes("选项一")) return "选项二"
                    for (const name of lib.inpile) {
                        if (!player.canUse({ name: name }, target, true, true)) continue
                        if (get.type(name) == "trick") {
                            if (player.hasCard(name, "hs") && get.effect(target, { name: name }, player, player) > 0) return "选项一"
                        }
                        if (name == "sha" && player.hasCard("sha", "hs") && !target.mayHaveShan() && get.effect(target, { name: name }, player, player) > 0) return "选项一"
                    }
                    return "选项二"
                })
                .forResult()
            event.result = {
                bool: result.control != "cancel2",
                cost_data: result.control
            }
        },
        async content(event, trigger, player) {
            const target = trigger.player
            game.log(player, "选择了", "#g【巴锋】", "的", "#y" + event.cost_data)
            if (event.cost_data == "选项一") {
                const { card } = await player.chooseToUse("巴锋：请对" + get.translation(target) + "使用一张【杀】或普通锦囊牌", true)
                    .set("filterCard", card => (get.name(card) == "sha" || get.type(card) == "trick"))
                    .set("filterTarget", (card, player, target) => target == get.event().getTrigger().player)
                    .forResult()
                if (player.hasHistory("sourceDamage", history => history.card == card) && target.countCards("he")) await player.gainPlayerCard(target, "he", true)
            } else if (event.cost_data == "选项二") {
                await player.draw()
                const cards = player.getCards("h", card => card.gaintag?.includes("gbfeishou_tag"))
                if (cards.length) {
                    const result = await player.chooseCard("巴锋：请选择一张「绯」牌置于牌堆顶", "h", true)
                        .set("filterCard", card => card.gaintag?.includes("gbfeishou_tag"))
                        .set("target", target)
                        .set("ai", card => {
                            const player = get.player()
                            const target = get.event().target
                            const att = get.sgn(get.attitude(player, target))
                            const cards = player.getCards("h", card => card.gaintag?.includes("gbfeishou_tag"))
                            if (target.countCards("j") && !target.hasWuxie()) {
                                const judge = get.judge(target.getCards("j")[0])
                                return cards.sort((a, b) => (judge(b) - judge(a)) * att)[0] == card
                            }
                            return cards.sort((a, b) => (get.value(b, target) - get.value(a, target)) * att)[0] == card
                        })
                        .forResult()
                    if (result.bool) {
                        await player.lose(result.cards, ui.cardPile).set("insert_card", true)
                        game.log(player, "将", get.cnNumber(result.cards.length), "张牌置于了", "#y牌堆顶")
                    }
                }
                target.addTempSkill("mashu")
            }
        }
    },

    gbfanzhi: {
        audio: false,
        forced: true,
        trigger: {
            player: "gainAfter"
        },
        filter(event, player) {
            return !event.getParent("gbfanzhi_effect", true)
        },
        async content(event, trigger, player) {
            let result = await player.chooseCard("凡志：请选择并展示任意张手牌，使其增加「志」标记", [1, Infinity], "h", true)
                .set("filterCard", card => !card.gaintag?.includes("gbfanzhi_tag"))
                .set("ai", card => {
                    let player = get.player()
                    if (!["sha", "shan"].includes(card.name)) return true
                    if ([...ui.cardPile.childNodes].some(card => get.name(card) == "wanjian")) return card != player.getCards("h", card => !card.gaintag?.includes("gbfanzhi_tag") && get.name(card) == "shan")[0]
                    if ([...ui.cardPile.childNodes].some(card => get.name(card) == "juedou" || get.name(card) == "nanman")) return card != player.getCards("h", card => !card.gaintag?.includes("gbfanzhi_tag") && get.name(card) == "sha")[0]
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
                        if (get.event().name == "chooseToRespond" && card.gaintag?.includes("gbfanzhi_tag")) return false
                    }
                }
            }
        },
    },

    gbcigu: {
        audio: false,
        trigger: {
            global: "phaseBegin"
        },
        zhuanhuanji: true,
        mark: true,
        marktext: "☯",
        intro: {
            content(storage, player, skill) {
                let str = !player.storage.gbcigu ?
                    `转换技，一名角色的回合开始时，你可以展示任意张「志」，观看牌堆顶的X张牌，并获得其中任意张牌，然后将等量张手牌依次置入牌堆顶（X为你的体力上限）。` :
                    `转换技，一名角色的回合开始时，你可以展示任意张「志」，展示牌堆顶X张牌，并令一名角色获得其中与你展示牌点数相同的牌，然后将剩余的牌以任意顺序置入牌堆顶或牌堆底（X为你的体力上限）。`;
                return str;
            },
        },
        filter(event, player) {
            return player.countCards("h", card => card.gaintag?.includes("gbfanzhi_tag"))
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard(get.prompt2(event.skill), [1, Infinity], true)
                .set("ai", (card) => {
                    let player = get.player()
                    if (ui.selected.cards.length >= 4) return false
                    if (card.gaintag?.includes("gbfanzhi_tag")) return true
                })
                .set("filterCard", card => card.gaintag?.includes("gbfanzhi_tag"))
                .forResult()
        },
        async content(event, trigger, player) {
            await player.showCards(event.cards)
            let num = player.maxHp
            var cards = get.cards(num, true)
            if (!player.storage.gbcigu) {
                let result = await player.chooseButton(["茨菇：获得其中的任意张牌", cards], [1, Infinity])
                    .set("ai", (button) => get.value(button.link))
                    .forResult()
                if (result && result.bool) {
                    player.gain(result.links, "giveAuto")
                    for (var i = 0; i < result.links.length; i++) {
                        if (!player.countCards("h")) continue
                        let next = await player.chooseCard(`茨菇：请选择一张手牌，将其置于牌堆顶`, true)
                            .set("num", result.links.length - i)
                            .set("ai", (card) => {
                                var player = get.player()
                                var target = _status.currentPhase
                                var att = get.sgn(get.attitude(player, target))
                                let cards = []
                                let num = get.event().num
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
                    let next = await player.chooseTarget(`茨菇：请选择一名角色`, true)
                        .set("ai", target => {
                            let player = get.player()
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
                            player = get.player()
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
