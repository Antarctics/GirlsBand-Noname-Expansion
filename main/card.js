import { lib, game, ui, get, ai, _status } from "../../../noname.js";
export default {
    /** @type {importCardConfig['card']} */
    card: {
        gb_huanle: {
            fullskin: true,
            type: "equip",
            subtype: "equip1",
            distance: { attackFrom: -1 },
            image: "ext:GirlsBand/image/card/huanle.png",
            ai: {
                basic: {
                    equipValue: 2,
                },
            },
            skills: ["huanle_skill"],
        },
        gb_yibeizi: {
            fullskin: true,
            type: "equip",
            subtype: "equip1",
            image: "ext:GirlsBand/image/card/yibeizi.png",
            ai: {
                order() {
                    return get.order({ name: "sha" }) - 0.1;
                },
                equipValue(card, player) {
                    if (player.getEquip("zhuge")) return 0
                    var result = (function () {
                        if (
                            !game.hasPlayer(function (current) {
                                return get.distance(player, current) <= 1 && player.canUse("sha", current) && get.effect(current, { name: "sha" }, player, player) > 0;
                            })
                        ) {
                            return 1;
                        }
                        var num = Math.max(player.countCards("h", "sha"), 3)
                        return 3 + num;
                    })();
                    return result;
                },
                basic: {
                    equipValue: 5,
                },
                tag: {
                    valueswap: 1,
                },
            },
            skills: ["yibeizi_skill"],
        },
        gb_bingchuan: {
            fullskin: true,
            type: "equip",
            subtype: "equip1",
            image: "ext:GirlsBand/image/card/bingchuan.png",
            distance: { attackFrom: -3 },
            ai: {
                basic: {
                    equipValue: 3,
                },
            },
            skills: ["bingchuan_skill"],
        },
        gb_chuhua: {
            fullskin: true,
            type: "equip",
            subtype: "equip1",
            image: "ext:GirlsBand/image/card/chuhua.png",
            distance: { attackFrom: -4 },
            ai: {
                basic: {
                    equipValue: 3,
                },
            },
            skills: ["chuhua_skill"],
        },
        gb_daxi: {
            fullskin: true,
            type: "equip",
            subtype: "equip1",
            image: "ext:GirlsBand/image/card/daxi.png",
            distance: { attackFrom: -2 },
            ai: {
                equipValue(card, player) {
                    var num = 2.5 + (player.countCards("h") + player.countCards("e")) / 2.5;
                    return Math.min(num, 5);
                },
                basic: {
                    equipValue: 4.5,
                },
            },
            skills: ["daxi_skill"],
        },
        gb_feiniao: {
            fullskin: true,
            type: "equip",
            subtype: "equip1",
            image: "ext:GirlsBand/image/card/feiniao.png",
            distance: { attackFrom: -2 },
            ai: {
                equipValue(card, player) {
                    return Math.min(3.5 + player.countCards("h", "sha"), 6);
                },
                basic: {
                    equipValue: 5,
                },
            },
            skills: ["feiniao_skill", "feiniao_skill2"],
        },
        gb_guga: {
            fullskin: true,
            type: "equip",
            subtype: "equip1",
            image: "ext:GirlsBand/image/card/guga.png",
            distance: { attackFrom: -1 },
            ai: {
                basic: {
                    equipValue: 4,
                },
            },
            skills: ["guga_skill", "guga_skill2"],
        },
        gb_hexian: {
            fullskin: true,
            type: "equip",
            subtype: "equip1",
            distance: { attackFrom: -2 },
            image: "ext:GirlsBand/image/card/hexian.png",
            ai: {
                equipValue(card, player) {
                    var num = 3.5 + player.countCards("h") / 3
                    return Math.min(num, 5);
                },
                basic: {
                    equipValue: 4.5,
                },
            },
            skills: ["hexian_skill"],
        },
        gb_ruomai: {
            fullskin: true,
            type: "equip",
            subtype: "equip1",
            distance: { attackFrom: -1 },
            image: "ext:GirlsBand/image/card/ruomai.png",
            ai: {
                basic: {
                    equipValue: 3,
                },
            },
            skills: ["ruomai_skill"],
        },
        gb_xing: {
            fullskin: true,
            type: "equip",
            subtype: "equip1",
            distance: { attackFrom: -3 },
            image: "ext:GirlsBand/image/card/xing.png",
            ai: {
                basic: {
                    equipValue: 3,
                },
            },
            skills: ["xing_skill"],
        },
        gb_xuehong: {
            fullskin: true,
            type: "equip",
            subtype: "equip1",
            distance: { attackFrom: -1 },
            image: "ext:GirlsBand/image/card/xuehong.png",
            ai: {
                basic: {
                    equipValue: 2,
                },
            },
            skills: ["xing_skill"],
        },
        gb_poker: {
            derivation: "gb_huayuanduohui",
            type: "poker",
            fullskin: true,
            image: (card) => {
                return `image/card/lukai_${card.suit}.png`
            }
        },
        gb_joker: {
            derivation: "gb_huayuanduohui",
            type: "joker",
            fullskin: true,
            image: (card) => {
                return "ext:GirlsBand/image/card/king.png"
            }
        }
    },
    /** @type { importCharacterConfig['skill'] } */
    skill: {
        huanle_skill: {
            equipSkill: true,
            audio: true,
            trigger: { source: "damageBegin1" },
            filter(event) {
                if (event.parent.name == "_lianhuan" || event.parent.name == "_lianhuan2") {
                    return false;
                }
                if (event.card && event.card.name == "sha") {
                    if (event.player.countCards("h") == 0) {
                        return true;
                    }
                }
                return false;
            },
            forced: true,
            content() {
                trigger.num++;
            },
            ai: {
                effect: {
                    player(card, player, target, current, isLink) {
                        if (
                            card.name == "sha" &&
                            !isLink &&
                            target.countCards("h") == 0 &&
                            !target.hasSkillTag("filterDamage", null, {
                                player: player,
                                card: card,
                            })
                        ) {
                            return [1, 0, 1, -3];
                        }
                    },
                },
            },
        },
        _yibeizi_skill: {
            mod: {
                cardRecastable(card, player) {
                    if (card.name == "gb_yibeizi") return true
                }
            }
        },
        yibeizi_skill: {
            equipSkill: true,
            mod: {
                cardUsable(card, player, num) {
                    if (card.name === "sha") return num + 3
                },
            },
        },
        bingchuan_skill: {
            equipSkill: true,
            enable: ["chooseToRespond", "chooseToUse"],
            filter(event, player) {
                return player.isPhaseUsing()
            },
            usable: 1,
            position: "h",
            prompt: "将一张手牌视为火【杀】使用或打出",
            filterCard: true,
            viewAs: { name: "sha", nature: "fire" }
        },
        feiniao_skill: {
            equipSkill: true,
            trigger: { player: ["shaMiss", "eventNeutralized"] },
            direct: true,
            filter(event, player) {
                if (!event.card || event.card.name !== "sha") {
                    return false;
                }
                return event.target.isIn() && player.canUse("sha", event.target, false) && (player.hasSha() || (_status.connectMode && player.countCards("hs")));
            },
            async content(event, trigger, player) {
                player.chooseToUse(get.prompt("gb_feiniao", trigger.target), function (card, player, event) {
                    if (get.name(card) !== "sha") {
                        return false;
                    }
                    if (!player.hasSkill("feiniaog_skill", null, false)) {
                        var cards = player.getCards("e", card => get.name(card) == "gb_feiniao");
                        if (!cards.some(card2 => card2 !== card && !ui.selected.cards.includes(card2))) {
                            return false;
                        }
                    }
                    return lib.filter.filterCard.apply(this, arguments);
                },
                    trigger.target,
                    -1
                )
                    .set("addCount", false)
                    .set("logSkill", "feiniao_skill")
            },
        },
        feiniao_skill2: {
            equipSkill: true,
            forced: true,
            trigger: {
                source: "damageEnd",
            },
            filter(event, player) {
                return event.card && event.card.name === "sha" && event.player.isIn() && event.getParent(3).logSkill == "feiniao_skill";
            },
            async content(event, trigger, player) {
                await player.gainPlayerCard("he", trigger.player, true)
            }
        },
        guga_skill: {
            equipSkill: true,
            audio: true,
            trigger: {
                player: "useCardToPlayered",
            },
            filter(event) {
                return event.card.name === "sha";
            },
            forced: true,
            logTarget: "target",
            async content(event, trigger, player) {
                trigger.target.addTempSkill("qinggang2");
                trigger.target.storage.qinggang2.add(trigger.card);
                trigger.target.markSkill("qinggang2");
            },
            ai: {
                unequip_ai: true,
                skillTagFilter(player, tag, arg) {
                    if (arg && arg.name === "sha") {
                        return true;
                    }
                    return false;
                },
            },
        },
        guga_skill2: {
            equipSkill: true,
            trigger: { player: "shaHit" },
            forced: true,
            filter(event, player) {
                return event.card && event.target.isIn() && event.target.getEquips(2).length > 0;
            },
            async content(event, trigger, player) {
                trigger.target.discard(trigger.target.getEquip(2))
            }
        },
        hexian_skill: {
            equipSkill: true,
            enable: ["chooseToUse", "chooseToRespond"],
            filterCard: true,
            selectCard: 2,
            position: "hs",
            viewAs: { name: "sha" },
            complexCard: true,
            filter(event, player) {
                return player.countCards("hs") >= 2;
            },
            onuse(result, player) {
                player.when("shaMiss")
                    .filter((event, player) => event.skill == "hexian_skill")
                    .then(() => {
                        player.logSkill("hexian_skill");
                        player.draw()
                    })
            },
            prompt: "将两张手牌当杀使用或打出",
            check(card) {
                let player = _status.event.player;
                if (
                    player.hasCard(function (card) {
                        return get.name(card) === "sha";
                    })
                ) {
                    return 0;
                }
                if (
                    _status.event &&
                    _status.event.name === "chooseToRespond" &&
                    player.hp < 3 &&
                    !player.countCards("hs", function (card) {
                        return get.name(card) !== "tao" && get.name(card) !== "jiu";
                    })
                ) {
                    return (player.hp > 1 ? 10 : 8) - get.value(card);
                }
                return Math.max(5, 8 - 0.7 * player.hp) - get.value(card);
            },
            ai: {
                respondSha: true,
                skillTagFilter(player) {
                    return player.countCards("hs") >= 2;
                },
            },
        },
        ruomai_skill: {
            equipSkill: true,
            trigger: { player: "useCardToPlayered" },
            filter(event, player) {
                return event.card && event.card.name == "sha" && (player.countCards("h") || event.target.countCards("h"))
            },
            async content(event, trigger, player) {
                if (player.countCards("h")) {
                    let next = await player.chooseCard("h", true, "h").forResult()
                    if (next.bool) {
                        player.recast(next.cards)
                    }
                }
                if (trigger.target.countCards("h")) {
                    let result = await player.choosePlayerCard("h", trigger.target, true).set("logSkill", "ruomai_skill").forResult()
                    if (result.bool) {
                        trigger.target.recast(result.cards)
                    }
                }
            }
        },
        xing_skill: {
            equipSkill: true,
            trigger: { player: "shaBegin" },
            filter(event, player) {
                return event.isFirstTarget && player.countCards("he", card => card != player.getEquip("gb_xing")) && game.hasPlayer(target => player.canUse("sha", target, true) && !event.targets.includes(target));
            },
            async cost(event, trigger, player) {
                event.result = await player.chooseCardTarget("he")
                    .set("prompt", get.prompt2("xing_skill"))
                    .set("filterCard", card => card != player.getEquip("gb_xing"))
                    .set("filterTarget", (card, player, target) => player.canUse("sha", target, true) && !trigger.targets.includes(target))
                    .forResult()
            },
            async content(event, trigger, player) {
                player.discard(event.cards)
                trigger.targets.addArray(event.targets)
            }
        },
        chuhua_skill: {
            equipSkill: true,
            trigger: { source: "damageBegin2" },
            filter(event, player) {
                return event.card && event.card.name === "sha" && event.notLink() && event.player.getCards("e", { subtype: ["equip3", "equip4", "equip6"] }).length > 0;
            },
            direct: true,
            async content(event, trigger, player) {
                var att = get.attitude(player, trigger.player) <= 0;
                var next = await player.chooseButton()
                    .set("att", att)
                    .set("createDialog", ["是否发动【初华帽】，弃置" + get.translation(trigger.player) + "的一张坐骑牌？", trigger.player.getCards("e", { subtype: ["equip3", "equip4", "equip6"] })])
                    .set("ai", function (button) {
                        if (_status.event.att) {
                            return get.buttonValue(button);
                        }
                        return 0;
                    }).forResult()
                if (next.bool) {
                    player.logSkill("chuhua_skill", trigger.player);
                    trigger.player.discard(next.links);
                }
            },
        },
        daxi_skill: {
            equipSkill: true,
            trigger: {
                player: ["shaMiss", "eventNeutralized"],
            },
            direct: true,
            audio: true,
            filter(event, player) {
                if (event.type !== "card" || event.card.name !== "sha" || !event.target.isIn()) {
                    return false;
                }
                var min = 2;
                if (!player.hasSkill("daxi_skill", null, false)) {
                    min += get.sgn(player.getCards("e", card => get.name(card) == "gb_daxi").length);
                }
                return player.countCards("he") >= min;
            },
            content() {
                "step 0";
                var next = player
                    .chooseToDiscard(get.prompt("gb_daxi"), 2, "he", function (card, player) {
                        if (_status.event.ignoreCard) {
                            return true;
                        }
                        var cards = player.getCards("e", card => get.name(card) == "gb_daxi");
                        if (!cards.includes(card)) {
                            return true;
                        }
                        return cards.some(cardx => cardx !== card && !ui.selected.cards.includes(cardx));
                    })
                    .set("ignoreCard", player.hasSkill("daxi_skill", null, false))
                    .set("complexCard", true);
                next.logSkill = "daxi_skill";
                next.set("ai", function (card) {
                    var evt = _status.event.getTrigger();
                    if (get.attitude(evt.player, evt.target) < 0) {
                        if (evt.player.needsToDiscard()) {
                            return 15 - get.value(card);
                        }
                        if (evt.baseDamage + evt.extraDamage >= Math.min(2, evt.target.hp)) {
                            return 8 - get.value(card);
                        }
                        return 5 - get.value(card);
                    }
                    return -1;
                });
                "step 1";
                if (result.bool) {
                    if (event.triggername === "shaMiss") {
                        trigger.untrigger();
                        trigger.trigger("shaHit");
                        trigger._result.bool = false;
                        trigger._result.result = null;
                    } else {
                        trigger.unneutralize();
                    }
                }
            },
            ai: {
                directHit_ai: true,
                skillTagFilter(player, tag, arg) {
                    if (player._daxi_temp) {
                        return;
                    }
                    player._daxi_temp = true;
                    var bool =
                        get.attitude(player, arg.target) < 0 &&
                        arg.card &&
                        arg.card.name === "sha" &&
                        player.countCards("he", function (card) {
                            return card !== player.getEquip("gb_daxi") && card !== arg.card && (!arg.card.cards || !arg.card.cards.includes(card)) && get.value(card) < 5;
                        }) > 1;
                    delete player._daxi_temp;
                    return bool;
                },
            },
        },
        xuehong_skill: {
            equipSkill: true,
            trigger: { source: "damageBegin2" },
            audio: true,
            filter(event) {
                return event.card && event.card.name === "sha" && event.notLink() && event.player.getCards("he").length > 0;
            },
            check(event, player) {
                var target = event.player;
                var eff = get.damageEffect(target, player, player, event.nature);
                if (get.attitude(player, target) > 0) {
                    if (
                        eff >= 0 ||
                        (event.nature &&
                            target.isLinked() &&
                            game.hasPlayer(cur => {
                                return cur !== target && cur.isLinked() && get.damageEffect(cur, player, player, event.nature) > 0;
                            }))
                    ) {
                        return false;
                    }
                    return true;
                }
                if (eff <= 0) {
                    return true;
                }
                if (target.hp === 1 || player.hasSkill("tianxianjiu")) {
                    return false;
                }
                if (
                    !target.hasSkillTag("filterDamage", null, {
                        player: player,
                        card: event.card,
                        jiu: player.hasSkill("jiu"),
                    })
                ) {
                    if (
                        event.num > 1 ||
                        player.hasSkillTag("damageBonus", true, {
                            player: player,
                            card: event.card,
                        })
                    ) {
                        return false;
                    }
                }
                if (target.countCards("he") < 2) {
                    return false;
                }
                var num = 0;
                var cards = target.getCards("he");
                for (var i = 0; i < cards.length; i++) {
                    if (get.value(cards[i]) > 6) {
                        num++;
                    }
                }
                if (num >= 2) {
                    return true;
                }
                return false;
            },
            logTarget: "player",
            content() {
                "step 0";
                trigger.cancel();
                "step 1";
                if (trigger.player.countDiscardableCards(player, "he")) {
                    player.line(trigger.player);
                    player.discardPlayerCard("he", trigger.player, true);
                }
                "step 2";
                if (trigger.player.countDiscardableCards(player, "he")) {
                    player.line(trigger.player);
                    player.discardPlayerCard("he", trigger.player, true);
                }
            },
        },
    },
    translate: {
        gb_huanle: "欢乐时光",
        gb_huanle_info: "锁定技，当你使用的【杀】造成伤害时，若指定的目标没有手牌，该伤害+1。",
        huanle_skill: "欢乐时光",
        huanle_skill_info: "锁定技，当你使用的【杀】造成伤害时，若指定的目标没有手牌，该伤害+1。",
        gb_yibeizi: "一辈子",
        gb_yibeizi_info: "此牌可被重铸。锁定技，出牌阶段，你使用【杀】的次数+3。",
        yibeizi_skill: "一辈子",
        yibeizi_skill_info: "锁定技，出牌阶段，你使用【杀】的次数+3。",
        gb_bingchuan: "冰川打火机",
        bingchuan_skill: "冰川打火机",
        bingchuan_skill_info: "出牌阶段限一次，你可以将一张手牌视为火【杀】使用或打出。",
        gb_bingchuan_info: "出牌阶段限一次，你可以将一张手牌视为火【杀】使用或打出。",
        gb_chuhua: "初华帽",
        gb_chuhua_info: "当你使用【杀】对目标角色造成伤害时，你可以弃置其装备区里的一张坐骑牌。",
        chuhua_skill: "初华帽",
        chuhua_skill_info: "当你使用【杀】对目标角色造成伤害时，你可以弃置其装备区里的一张坐骑牌。",
        gb_daxi: "大希鼓",
        gb_daxi_info: "当你使用的【杀】被目标角色使用的【闪】抵消时，你可以弃置两张牌，令此【杀】依然对其造成伤害。",
        daxi_skill: "大希鼓",
        daxi_skill_info: "当你使用的【杀】被目标角色使用的【闪】抵消时，你可以弃置两张牌，令此【杀】依然对其造成伤害。",
        gb_feiniao: "飞鸟山贝斯",
        gb_feiniao_info: "当你使用的【杀】被目标角色使用的【闪】抵消时，你可以对其使用一张【杀】，若此【杀】造成伤害，你获得其一张牌。",
        feiniao_skill: "飞鸟山贝斯",
        feiniao_skill_info: "当你使用的【杀】被目标角色使用的【闪】抵消时，你可以对其使用一张【杀】，若此【杀】造成伤害，你获得其一张牌。",
        feiniao_skill2: "飞鸟山贝斯",
        feiniao_skill2_info: "当你因此使用的【杀】造成伤害，你获得目标一张牌。",
        gb_guga: "咕嘎笔记",
        gb_guga_info: "锁定技，当你使用【杀】指定一名目标角色后，你令其防具技能无效直到此【杀】被抵消或造成伤害。若此【杀】造成伤害，你弃置其装备区的防具牌。",
        guga_skill: "咕嘎笔记",
        guga_skill_info: "锁定技，当你使用【杀】指定一名目标角色后，你令其防具技能无效直到此【杀】被抵消或造成伤害。若此【杀】造成伤害，你弃置其装备区的防具牌。",
        guga_skill2: "咕嘎笔记",
        guga_skill2_info: "当你使用【杀】指定一名目标角色后，若此【杀】造成伤害，你弃置其装备区的防具牌。",
        gb_hexian: "和弦吉他",
        gb_hexian_info: "你可以将两张手牌当【杀】使用或打出。若你以此法使用的【杀】被【闪】抵消，你摸一张牌。",
        hexian_skill: "和弦吉他",
        hexian_skill_info: "你可以将两张手牌当【杀】使用或打出。若你以此法使用的【杀】被【闪】抵消，你摸一张牌。",
        gb_ruomai: "若麦双鼓棒",
        gb_ruomai_info: "当你使用【杀】指定一名目标角色后，你可以重铸你与其的各一张手牌。",
        ruomai_skill: "若麦双鼓棒",
        ruomai_skill_info: "当你使用【杀】指定一名目标角色后，你可以重铸你与其的各一张手牌。",
        gb_xing: "星之鼓动",
        gb_xing_info: "当你使用【杀】时，你可以弃置一张牌并额外选择一个目标。",
        xing_skill: "星之鼓动",
        xing_skill_info: "当你使用【杀】时，你可以弃置一张牌并额外选择一个目标。",
        gb_xuehong: "血红书记",
        gb_xuehong_info: "当你因执行【杀】的效果而造成伤害时，若目标角色有能被弃置的牌，则你可以防止此伤害，然后依次弃置目标角色的两张牌。",
        xuehong_skill: "血红书记",
        xuehong_skill_info: "当你因执行【杀】的效果而造成伤害时，若目标角色有能被弃置的牌，则你可以防止此伤害，然后依次弃置目标角色的两张牌。",
        gb_poker: "扑克",
        gb_poker_info: "扑克牌，牌名为扑克，无实际效果，类型为poker的牌。",
        gb_joker: "王",
        gb_joker_info: "王牌，牌名为王，无实际效果，无花色，类型为joker的牌。"
    },
    list: [
        ["spade", 1, "gb_huanle"],
        ["club", 1, "gb_yibeizi"],
        ["diamond", 1, "gb_yibeizi"],
        ["diamond", 1, "gb_bingchuan"],
        ["heart", 5, "gb_chuhua"],
        ["spade", 5, "gb_feiniao"],
        ["diamond", 5, "gb_daxi"],
        ["spade", 6, "gb_guga"],
        ["spade", 12, "gb_hexian"],
        ["spade", 2, "gb_ruomai"],
        ["diamond", 12, "gb_xing"],
        ["spade", 2, "gb_xuehong"],
    ]
}