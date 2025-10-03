
import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import { menuUpdates } from '../../../noname/ui/create/menu/index.js';
/** @type { importModeConfig } */
const bandMode = {
    name: "band",
    splash: "ext:GirlsBand/image/band.jpg",
    skill: {
        _gbdiehard: {
            trigger: {
                global: "phaseEnd"
            },
            forced: true,
            charlotte: true,
            filter(event, player) {
                return player.identity == "diehard" && !player.identityShown && game.countPlayer(player => player.identityShown && player.identity != "bass") == 1
            },
            async content(event, trigger, player) {
                game.showIdentityCards([player])
            }
        },
        _gbvocalist: {
            forced: true,
            trigger: {
                global: "phaseBefore",
            },
            firstDo: true,
            filter(event, player) {
                return game.phaseNumber == 0 && player.identity == "vocalist"
            },
            async content(event, trigger, player) {
                var result = await player.chooseTarget("主唱", "请明置至少两名其他角色的身份牌", true, [1, 2], lib.filter.notMe).set("ai", (target) => Math.random()).forResult()
                if (result) {
                    let targets = result.targets.sortBySeat()
                    game.showIdentityCards(targets)
                }
            }
        },
        _gbShowIdentity: {
            trigger: {
                global: "showIdentityCards"
            },
            forced: true,
            filter(event, player) {
                return _status.event.targets.includes(player)
            },
            async content(event, trigger, player) {
                switch (player.identity) {
                    case "durmmer":
                        player.draw(1)
                        break
                    case "guitar":
                        player.when("phaseUseBegin")
                            .then(() => { player.chooseCard("h", 1, "吉他", "你可以重铸一张手牌") })
                            .then(() => { if (result && result.bool) { player.recast(result.cards) } })
                        break
                    case "keys":
                        game.zhu.draw(1)
                        player.draw(1)
                        break
                    case "bass":
                        player.draw(1)
                        break
                    case "guitar2":
                        let next = await player.chooseToDiscard("主音", "是否弃置两张手牌并与主唱进行议事", "h", 2).set("ai", card => {
                            if (get.color(card) == "red") return 0
                            return get.value(card)
                        }).forResult()
                        if (next && next.bool) {
                            player.chooseToDebate([player, game.zhu])
                                .set("ai", card => {
                                    if (get.color(card) == "red") return 10
                                    return 1
                                })
                                .set("callback", () => {
                                    const {
                                        bool,
                                        opinion } = _status.event.debateResult;
                                    if (bool && opinion == "red") {
                                        game.broadcastAll((game, player) => {
                                            game.zhu.identity = player.identity
                                            game.zhu.isZhu = false
                                            game.zhu.setIdentity()
                                            game.zhu.maxHp--
                                            game.zhu.getOriginalSkills().forEach(skill => lib.skill[skill].zhuSkill ? game.zhu.removeSkill(skill) : [])
                                            game.zhu.update()
                                            player.identity = "vocalist"
                                            game.zhu = player;
                                            player.isZhu = true;
                                            player.identityShown = true;
                                            player.ai.shown = 1
                                            player.maxHp++
                                            player.hp++
                                            player.getOriginalSkills().forEach(skill => lib.skill[skill].zhuSkill ? player.addSkill(skill) : [])
                                            player.update()
                                            player.setIdentity();
                                        }, game, player)
                                        player.when("phaseEnd")
                                            .filter((event, player) => game.phaseNumber == 1)
                                            .then(() => { player.chooseTarget("主音", "是否明置一名角色的身份牌").set("filterTarget", (card, player, target) => !target.identityShown).set("ai", target => Math.random()) })
                                            .then(() => { if (result && result.bool) { game.showIdentityCards(result.targets) } })
                                    }
                                })
                        }
                        break
                    case "guitar3":
                        player.when("phaseEnd")
                            .then(() => { player.chooseTarget(1, "节奏", "你可以令一名其他角色摸一张牌", lib.filter.notMe).set("ai", target => get.attitude(_status.event.player, target)) })
                            .then(() => { if (result && result.bool) { result.targets[0].draw() } })
                        break
                }
            }
        }
    },
    start() {
        "step 0"
        _status.mode = get.config("band_mode");
        if (_status.connectMode) {
            _status.mode = lib.configOL.band_mode
            game.waitForPlayer(function () {
                lib.configOL.number = get.identityList().length
            })
        } else {
            if (_status.mode == "normal") {
                game.prepareArena(5)
            } else {
                game.prepareArena(8)
            }
        }
        "step 1"
        if (_status.connectMode) {
            game.randomMapOL();
        } else {
            for (var i = 0; i < game.players.length; i++) {
                game.players[i].getId();
            }
            game.chooseCharacter();
        }
        "step 2"
        for (var i = 0; i < game.players.length; i++) {
            game.players[i].ai.shown = 0;
        }
        game.syncState();
        event.trigger("gameStart");
        var players = get.players(lib.sort.position);
        var info = [];
        for (var i = 0; i < players.length; i++) {
            var ifo = {
                name: players[i].name1,
                name2: players[i].name2,
                identity: players[i].identity,
                nickname: players[i].node.nameol.innerHTML,
            };
            info.push(ifo);
        }
        _status.videoInited = true;
        game.addVideo("init", null, info);
        "step 3"
        event.beginner = _status.firstAct2 || game.zhong || game.zhu || _status.firstAct
        game.gameDraw(event.beginner, 4);
        if (_status.connectMode && lib.configOL.change_card) {
            game.replaceHandcards(game.players.slice(0));
        }
        "step 4"
        game.phaseLoop(event.beginner)
    },
    game: {
        getRoomInfo: function (uiintro) {
            uiintro.add('<div class="text chat">游戏模式：' + {
                "normal": "标准乐队",
                "impart": "合奏乐队",
                "girls": "少女乐队",
                "soyo": "素世の野望乐队",
                "mortis": "全都不会乐队"
            }[lib.configOL.band_mode]);
            var last = uiintro.add('<div class="text chat">出牌时限：' + lib.configOL.choose_timeout + "秒");
            if (lib.configOL.banned.length) {
                last = uiintro.add('<div class="text chat">禁用武将：' + get.translation(lib.configOL.banned));
            }
            if (lib.configOL.bannedcards.length) {
                last = uiintro.add('<div class="text chat">禁用卡牌：' + get.translation(lib.configOL.bannedcards));
            }
            last.style.paddingBottom = "8px";
        },
        createIdentityCard: (player, identity) => {
            const card = ui.create.card();
            card.removeEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.card);
            card.classList.add("button");
            card._customintro = uiintro => uiintro.add(`${get.translation(player)}的身份牌`);
            const fileName = `extension/GirlsBand/image/${identity}.jpg`;
            card.classList.add("fullskin");
            card.node.image.setBackgroundImage(fileName);
            return card;
        },
        showIdentityCards: (targets) => {
            if (!targets || targets.length === 0) return;
            game.broadcastAll((targets, createIdentityCard) => {
                if (!document.getElementById('gb-shake-style')) {
                    var style = document.createElement('style');
                    style.id = 'gb-shake-style';
                    style.textContent = `
                    @keyframes shake {
                        0%, 100% {
                            transform: translateX(0);
                        }
                        10%, 30%, 50%, 70%, 90% {
                            transform: translateX(-5px);
                        }
                        20%, 40%, 60%, 80% {
                            transform: translateX(5px);
                        }
                    }
                    @-webkit-keyframes shake {
                        0%, 100% {
                            transform: translateX(0);
                        }
                        10%, 30%, 50%, 70%, 90% {
                            transform: translateX(-5px);
                        }
                        20%, 40%, 60%, 80% {
                            transform: translateX(5px);
                        }
                    }
                `;
                    document.head.appendChild(style);
                }
                var dialog = ui.create.dialog("身份牌展示", "forcebutton");
                var container = ui.create.div(".buttons", dialog.content);
                container.style.display = "flex";
                container.style.justifyContent = "center";
                container.style.alignItems = "center";
                container.style.gap = "20px";
                container.style.flexWrap = "wrap";

                var cards = [];
                var completedCount = 0;
                targets.forEach((target, index) => {
                    target.node.identity.removeEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.identity)
                    var identity = target.identity;
                    var card = createIdentityCard(target, identity);
                    card.style.margin = "10px";
                    var nameDiv = ui.create.div(".player-name");
                    nameDiv.style.position = "absolute";
                    nameDiv.style.textAlign = "center";
                    nameDiv.style.fontSize = "16px";
                    nameDiv.style.fontWeight = "bold";
                    nameDiv.style.color = "#fff";
                    nameDiv.style.width = "100%";
                    nameDiv.style.top = "-10px";
                    nameDiv.style.left = "0";
                    nameDiv.style.pointerEvents = "none";
                    nameDiv.textContent = get.translation(target);
                    var cardContainer = ui.create.div(".card-container");
                    cardContainer.style.position = "relative";
                    cardContainer.style.display = "inline-block";
                    cardContainer.style.margin = "10px";
                    card.classList.add("infohidden");
                    card.style.transition = "all 0s";
                    card.style.transform = "perspective(600px) rotateY(180deg) translateX(0)";

                    cards.push(card);
                    container.appendChild(cardContainer);
                    cardContainer.appendChild(nameDiv);
                    cardContainer.appendChild(card);
                    ui.refresh(card);
                    setTimeout(() => {
                        card.style.transition = "all ease-in 0.3s";
                        card.style.transform = "perspective(600px) rotateY(270deg) translateX(52px)";

                        setTimeout(() => {
                            card.classList.remove("infohidden");
                            card.style.transition = "all 0s";
                            ui.refresh(card);
                            card.style.transform = "perspective(600px) rotateY(-90deg) translateX(52px)";
                            ui.refresh(card);
                            card.style.transition = "";
                            ui.refresh(card);
                            card.style.transform = "";
                            target.setIdentity(target.identity);
                            target.identityShown = true;
                            target.ai.shown = 1
                            game.log(target, "展示了", "#g身份牌")
                            completedCount++;
                            if (completedCount === targets.length) {
                                setTimeout(() => {
                                    dialog.close();
                                    game.resume()
                                }, 3000);
                            }
                        }, 300);
                    }, index * 500);
                });
                dialog.open();
                game.pause()
            }, targets, game.createIdentityCard)
            get.event().trigger("showIdentityCards").targets = targets
        },
        showIdentity() {
            if (game.phaseNumber == 0 && !started) return;
            for (var i = 0; i < game.players.length; i++) {
                game.players[i].node.identity.classList.remove("guessing");
                game.players[i].identityShown = true;
                game.players[i].ai.shown = 1;
                game.players[i].setIdentity(game.players[i].identity);
            }
        },
        checkResult: function () {
            var me = game.me._trueMe || game.me;
            var mingAlive = game.hasPlayer(player => player.identity == "drummer" || (player.identityShown && player.identity != "bass"))
            var anAlive = game.hasPlayer(player => player.identity == "bass" || (!player.identityShown && player.identity != "drummer"))
            if (!mingAlive) {
                var meMing = me.identity === "drummer" || (me.identityShown && me.identity !== "bass");
                game.over(meMing ? false : true);
            }
            if (!anAlive) {
                var meAn = me.identity == "bass" || (!me.identityShown && me.identity !== "drummer");
                game.over(meAn ? false : true);
            }
        },
        checkOnlineResult: function (player) {
            var mingAlive = game.hasPlayer(player => player.identity == "drummer" || (player.identityShown && player.identity != "bass"))
            var anAlive = game.hasPlayer(player => player.identity == "bass" || (!player.identityShown && player.identity != "drummer"))
            if (!mingAlive) {
                return player.identity == "bass" || (!player.identityShown && player.identity !== "drummer")
            }
            if (!anAlive) {
                return player.identity === "drummer" || (player.identityShown && player.identity !== "bass");
            }
        },
        chooseCharacter: function () {
            var next = game.createEvent("chooseCharacter");
            next.showConfig = true;
            next.addPlayer = function (player) {
                var list = get.identityList(game.players.length - 1);
                var list2 = get.identityList(game.players.length);
                for (var i = 0; i < list.length; i++) list2.remove(list[i]);
                player.identity = list2[0];
                player.setIdentity("cai");
            };
            next.removePlayer = function () {
                return game.players.randomGet(game.me, game.zhu);
            };
            next.ai = function (player, list, list2, back) {
                var listc = list.slice(0, 2);
                for (var i = 0; i < listc.length; i++) {
                    var listx = lib.characterReplace[listc[i]];
                    if (listx && listx.length) listc[i] = listx.randomGet();
                }
                if (get.config("double_character")) {
                    player.init(listc[0], listc[1]);
                } else {
                    player.init(listc[0]);
                }
                if (player == game.zhu) {
                    if (!player.isInitFilter("noZhuHp")) {
                        player.maxHp++;
                        player.hp++;
                        player.update();
                    }
                }
                if (back) {
                    list.remove(get.sourceCharacter(player.name1));
                    list.remove(get.sourceCharacter(player.name2));
                    for (var i = 0; i < list.length; i++) {
                        back.push(list[i]);
                    }
                }
                if (typeof lib.config.test_game == "string" && player == game.me.next) {
                    if (lib.config.test_game != "_") player.init(lib.config.test_game);
                }
                if (lib.selectGroup.includes(player.group) && !player.isUnseen(0)) {
                    player._groupChosen = "kami";
                    var list = lib.group.slice(0);
                    list.remove("shen");
                    player.group = (function () {
                        if (game.zhu && game.zhu.group) {
                            if (["re_zhangjiao", "liubei", "re_liubei", "caocao", "re_caocao", "sunquan", "re_sunquan", "zhangjiao", "sp_zhangjiao", "caopi", "re_caopi", "liuchen", "caorui", "sunliang", "sunxiu", "sunce", "re_sunben", "ol_liushan", "re_liushan", "key_akane", "dongzhuo", "re_dongzhuo", "ol_dongzhuo", "jin_simashi", "caomao"].includes(game.zhu.name)) {
                                return game.zhu.group;
                            }
                            if (game.zhu.name == "yl_yuanshu") {
                                if (player.identity == "drummer") {
                                    list.remove("qun");
                                } else {
                                    return "qun";
                                }
                            }
                            if (["sunhao", "xin_yuanshao", "re_yuanshao", "re_sunce", "ol_yuanshao", "yuanshu", "jin_simazhao", "liubian"].includes(game.zhu.name)) {
                                if (player.identity != "drummer") {
                                    list.remove(game.zhu.group);
                                } else {
                                    return game.zhu.group;
                                }
                            }
                        }
                        return list.randomGet()
                    })()
                }
                player.node.name.dataset.nature = get.groupnature(player.group);
            };
            next.setContent(function () {
                "step 0";
                ui.arena.classList.add("choose-character");
                var i;
                var list;
                var list2 = [];
                var list3 = [];
                var list4 = [];
                var identityList = get.identityList()
                var chosen = lib.config.continue_name || [];
                game.saveConfig("continue_name");
                event.chosen = chosen;
                var addSetting = function (dialog) {
                    dialog.add("选择身份").classList.add("add-setting");
                    var table = document.createElement("div");
                    table.classList.add("add-setting");
                    table.style.margin = "0";
                    table.style.width = "100%";
                    table.style.position = "relative";
                    for (var i = 0; i < get.identityList2().length; i++) {
                        var td = ui.create.div(".shadowed.reduce_radius.pointerdiv.tdnode");
                        td.link = get.identityList2()[i];
                        if (td.link === game.me.identity) {
                            td.classList.add("bluebg");
                        }
                        table.appendChild(td);
                        td.innerHTML = "<span>" + get.translation(get.identityList2()[i]) + "</span>";
                        td.addEventListener(lib.config.touchscreen ? "touchend" : "click", function () {
                            if (_status.dragged) return;
                            if (_status.justdragged) return;
                            _status.tempNoButton = true;
                            setTimeout(function () {
                                _status.tempNoButton = false;
                            }, 500);
                            var link = this.link;
                            if (game.zhu) {
                                if (link != "random") {
                                    _status.event.parent.fixedseat = get.distance(game.me, game.zhu, "absolute");
                                }
                                if (game.zhu.name) game.zhu.uninit();
                                delete game.zhu.isZhu;
                                delete game.zhu.identityShown;
                            }
                            var current = this.parentNode.querySelector(".bluebg");
                            if (current) {
                                current.classList.remove("bluebg");
                            }
                            current = _status.cheat_seat || seats.querySelector(".bluebg");
                            if (current) {
                                current.classList.remove("bluebg");
                            }
                            if (link == "random") {
                                link = get.identityList2().randomGet();
                                for (var i = 0; i < this.parentNode.childElementCount; i++) {
                                    if (this.parentNode.childNodes[i].link == link) {
                                        this.parentNode.childNodes[i].classList.add("bluebg");
                                    }
                                }
                            } else {
                                this.classList.add("bluebg");
                            }
                            num = get.config("choice_" + link) || 3;
                            _status.event.parent.swapnodialog = function (dialog, list) {
                                var buttons = ui.create.div(".buttons");
                                var node = dialog.buttons[0].parentNode;
                                dialog.buttons = ui.create.buttons(list, "characterx", buttons);
                                dialog.content.insertBefore(buttons, node);
                                buttons.addTempClass("start");
                                node.remove();
                                game.uncheck();
                                game.check();
                                for (var i = 0; i < seats.childElementCount; i++) {
                                    if (get.distance(game.zhu, game.me, "absolute") === seats.childNodes[i].link) {
                                        seats.childNodes[i].classList.add("bluebg");
                                    }
                                }
                            };
                            _status.event = _status.event.parent;
                            _status.event.step = 0;
                            _status.event.identity = link;
                            if (link != "vocalist") {
                                seats.previousSibling.style.display = "";
                                seats.style.display = "";
                            } else {
                                seats.previousSibling.style.display = "none";
                                seats.style.display = "none";
                            }
                            game.resume();
                        });
                    }
                    dialog.content.appendChild(table);

                    dialog.add("选择座位").classList.add("add-setting");
                    var seats = document.createElement("div");
                    seats.classList.add("add-setting");
                    seats.style.margin = "0";
                    seats.style.width = "100%";
                    seats.style.position = "relative";
                    for (var i = 2; i <= game.players.length; i++) {
                        var td = ui.create.div(".shadowed.reduce_radius.pointerdiv.tdnode");
                        td.innerHTML = get.cnNumber(i, true);
                        td.link = i - 1;
                        seats.appendChild(td);
                        if (get.distance(game.zhu, game.me, "absolute") === i - 1) {
                            td.classList.add("bluebg");
                        }
                        td.addEventListener(lib.config.touchscreen ? "touchend" : "click", function () {
                            if (_status.dragged) return;
                            if (_status.justdragged) return;
                            if (_status.cheat_seat) {
                                _status.cheat_seat.classList.remove("bluebg");
                                if (_status.cheat_seat == this) {
                                    delete _status.cheat_seat;
                                    return;
                                }
                            }
                            if (get.distance(game.zhu, game.me, "absolute") == this.link) return;
                            var current = this.parentNode.querySelector(".bluebg");
                            if (current) {
                                current.classList.remove("bluebg");
                            }
                            this.classList.add("bluebg");
                            for (var i = 0; i < game.players.length; i++) {
                                if (get.distance(game.players[i], game.me, "absolute") == this.link) {
                                    game.swapSeat(game.zhu, game.players[i], false);
                                    return;
                                }
                            }
                        });
                    }
                    dialog.content.appendChild(seats);
                    if (game.me == game.zhu) {
                        seats.previousSibling.style.display = "none";
                        seats.style.display = "none";
                    }

                    dialog.add(ui.create.div(".placeholder.add-setting"));
                    dialog.add(ui.create.div(".placeholder.add-setting"));
                    if (get.is.phoneLayout()) dialog.add(ui.create.div(".placeholder.add-setting"));
                };
                var removeSetting = function () {
                    var dialog = _status.event.dialog;
                    if (dialog) {
                        dialog.style.height = "";
                        delete dialog._scrollset;
                        var list = Array.from(dialog.querySelectorAll(".add-setting"));
                        while (list.length) {
                            list.shift().remove();
                        }
                        ui.update();
                    }
                };
                event.addSetting = addSetting;
                event.removeSetting = removeSetting;
                event.list = [];
                identityList.randomSort();
                if (event.identity) {
                    identityList.remove(event.identity);
                    identityList.unshift(event.identity);
                    if (event.fixedseat) {
                        var zhuIdentity = "vocalist";
                        if (zhuIdentity != event.identity) {
                            identityList.remove(zhuIdentity);
                            identityList.splice(event.fixedseat, 0, zhuIdentity);
                        }
                        delete event.fixedseat;
                    }
                    delete event.identity;
                }
                for (let index = 0; index < game.players.length; index++) {
                    game.players[index].node.identity.addEventListener(lib.config.touchscreen ? "touchstart" : "mouseover", e => {
                        ui.click.poptip(e.target, get.winConditions(e.target.closest('.player')))
                    })
                    game.players[index].identity = identityList[index];
                    game.players[index].setIdentity("cai");
                    if (identityList[index] == "vocalist") {
                        game.zhu = game.players[index];
                    }
                    game.players[index].identityShown = false;
                }

                if (!game.zhu) game.zhu = game.me;
                else {
                    game.zhu.setIdentity();
                    game.zhu.identityShown = true;
                    game.zhu.isZhu = game.zhu.identity == "vocalist";
                    game.zhu.node.identity.removeEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.identity)
                    game.me.setIdentity();
                    game.me.node.identity.removeEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.identity)
                }
                for (i in lib.characterReplace) {
                    var ix = lib.characterReplace[i];
                    for (var j = 0; j < ix.length; j++) {
                        if (chosen.includes(ix[j]) || lib.filter.characterDisabled(ix[j])) ix.splice(j--, 1);
                    }
                    if (ix.length) {
                        event.list.push(i);
                        list4.addArray(ix);
                        var bool = false;
                        for (var j of ix) {
                            if (lib.character[j].isZhugong) {
                                bool = true;
                                break;
                            }
                        }
                        (bool ? list2 : list3).push(i);
                    }
                }
                for (i in lib.character) {
                    if (list4.includes(i)) continue;
                    if (chosen.includes(i)) continue;
                    if (lib.filter.characterDisabled(i)) continue;
                    event.list.push(i);
                    list4.push(i);
                    if (lib.character[i].isZhugong) {
                        list2.push(i);
                    } else {
                        list3.push(i);
                    }
                }
                var getZhuList = function () {
                    return list2.filter(char => char in lib.characterPack['GirlsBand']).sort(lib.sort.character);
                };
                event.list.randomSort();
                _status.characterlist = list4.slice(0).randomSort();
                list3.randomSort();
                var num = 5;
                if (game.zhu != game.me) {
                    event.ai(game.zhu, event.list, getZhuList().randomGets(3));
                    event.list.remove(get.sourceCharacter(game.zhu.name1));
                    event.list.remove(get.sourceCharacter(game.zhu.name2));
                    list = event.list.slice(0, num);
                } else {
                    list = getZhuList().randomGets(3).concat(list3.slice(0, 3));
                }
                delete event.swapnochoose;
                var dialog;
                if (event.swapnodialog) {
                    dialog = ui.dialog;
                    event.swapnodialog(dialog, list);
                    delete event.swapnodialog;
                } else {
                    var str = "选择角色";
                    dialog = ui.create.dialog(str, "hidden", [list, "characterx"]);
                    if (get.config("change_identity")) {
                        addSetting(dialog);
                    }
                }
                dialog.setCaption("选择角色");
                game.me.setIdentity();
                if (!event.chosen.length) {
                    game.me.chooseButton(dialog, true).set("onfree", true).selectButton = function () {
                        return get.config("double_character") ? 2 : 1;
                    };
                } else {
                    lib.init.onfree();
                }
                event.changeChoice = get.config("change_choice")
                ui.create.cheat = function () {
                    _status.createControl = ui.cheat2;
                    ui.cheat = ui.create.control("换将", function () {
                        if (ui.cheat2 && ui.cheat2.dialog == _status.event.dialog) {
                            return;
                        }
                        event.changeChoice--
                        if (event.changeChoice <= 0) {
                            ui.cheat.close();
                            delete ui.cheat;
                        }
                        if (game.zhu != game.me) {
                            event.list.randomSort();
                            list = event.list.slice(0, num);
                        } else {
                            getZhuList().sort(lib.sort.character);
                            list3.randomSort();
                            list = getZhuList().randomGets(3).concat(list3.slice(0, 3));
                        }
                        var buttons = ui.create.div(".buttons");
                        var node = _status.event.dialog.buttons[0].parentNode;
                        _status.event.dialog.buttons = ui.create.buttons(list, "characterx", buttons);
                        _status.event.dialog.content.insertBefore(buttons, node);
                        buttons.addTempClass("start");
                        node.remove();
                        game.uncheck();
                        game.check();
                    });
                    delete _status.createControl;
                };
                if (lib.onfree) {
                    lib.onfree.push(function () {
                        event.dialogxx = ui.create.characterDialog("heightset");
                        if (ui.cheat2) {
                            ui.cheat2.addTempClass("controlpressdownx", 500);
                            ui.cheat2.classList.remove("disabled");
                        }
                    });
                } else {
                    event.dialogxx = ui.create.characterDialog("heightset");
                }

                ui.create.cheat2 = function () {
                    ui.cheat2 = ui.create.control("自由选将", function () {
                        if (this.dialog == _status.event.dialog) {
                            this.dialog.close();
                            _status.event.dialog = this.backup;
                            this.backup.open();
                            delete this.backup;
                            game.uncheck();
                            game.check();
                            if (ui.cheat) {
                                ui.cheat.addTempClass("controlpressdownx", 500);
                                ui.cheat.classList.remove("disabled");
                            }
                        } else {
                            this.backup = _status.event.dialog;
                            _status.event.dialog.close();
                            _status.event.dialog = _status.event.parent.dialogxx;
                            this.dialog = _status.event.dialog;
                            this.dialog.open();
                            game.uncheck();
                            game.check();
                            if (ui.cheat) {
                                ui.cheat.classList.add("disabled");
                            }
                        }
                    });
                    if (lib.onfree) {
                        ui.cheat2.classList.add("disabled");
                    }
                };
                if (!ui.cheat && get.config("change_choice") != 0) ui.create.cheat();
                if (!ui.cheat2 && get.config("free_choose")) ui.create.cheat2();
                "step 1";
                if (ui.cheat) {
                    ui.cheat.close();
                    delete ui.cheat;
                }
                if (ui.cheat2) {
                    ui.cheat2.close();
                    delete ui.cheat2;
                }
                if (event.chosen.length) {
                    event.choosed = event.chosen;
                } else if (event.modchosen) {
                    if (event.modchosen[0] == "random") event.modchosen[0] = result.buttons[0].link;
                    else event.modchosen[1] = result.buttons[0].link;
                    event.choosed = event.modchosen;
                } else if (result.buttons.length == 2) {
                    event.choosed = [result.buttons[0].link, result.buttons[1].link];
                    game.addRecentCharacter(result.buttons[0].link, result.buttons[1].link);
                } else {
                    event.choosed = [result.buttons[0].link];
                    game.addRecentCharacter(result.buttons[0].link);
                }
                var name = event.choosed[0];
                if (get.is.double(name)) {
                    game.me._groupChosen = "double";
                    game.me.chooseControl(get.is.double(name, true)).set("prompt", "请选择你的势力");
                } else if ((lib.character[name].group == "shen" || lib.character[name].group == "western")) {
                    game.me._groupChosen = "kami";
                    var list = lib.group.slice(0);
                    list.remove("shen");
                    game.me.chooseControl(list).set("prompt", "请选择你的势力");
                }
                "step 2";
                event.group = result.control || false;
                if (event.choosed.length == 2) {
                    game.me.init(event.choosed[0], event.choosed[1]);
                } else {
                    game.me.init(event.choosed[0]);
                }
                event.list.remove(get.sourceCharacter(game.me.name1));
                event.list.remove(get.sourceCharacter(game.me.name2));
                if (game.me == game.zhu && game.players.length > 4) {
                    if (!game.me.isInitFilter("noZhuHp")) {
                        game.me.hp++;
                        game.me.maxHp++;
                        game.me.update();
                    }
                }
                for (var i = 0; i < game.players.length; i++) {
                    if (game.players[i] != game.zhu && game.players[i] != game.me) {
                        event.list.randomSort();
                        event.ai(game.players[i], event.list.splice(0, 3), null, event.list);
                    }
                }
                "step 3";
                if (event.group) {
                    game.me.group = event.group;
                    game.me.node.name.dataset.nature = get.groupnature(game.me.group);
                    game.me.update();
                }
                "step 4";
                for (var i = 0; i < game.players.length; i++) {
                    _status.characterlist.remove(game.players[i].name);
                    _status.characterlist.remove(game.players[i].name1);
                    _status.characterlist.remove(game.players[i].name2);
                }
                setTimeout(function () {
                    ui.arena.classList.remove("choose-character");
                }, 500);
            });
        },
        chooseCharacterOL: function () {
            var next = game.createEvent("chooseCharacter")
            next.setContent(function () {
                "step 0";
                ui.arena.classList.add("choose-character");
                var i;
                var identityList = get.identityList()
                identityList.randomSort();
                for (i = 0; i < game.players.length; i++) {
                    game.broadcastAll((list, i, game) => {
                        game.players[i].identity = list[i];
                        game.players[i].node.identity.addEventListener(lib.config.touchscreen ? "touchstart" : "mouseover", e => {
                            ui.click.poptip(e.target, get.winConditions(e.target.closest('.player')))
                        })
                        game.players[i].setIdentity("cai");
                        game.players[i].identityShown = false;
                        if (list[i] == "vocalist") {
                            game.zhu = game.players[i];
                        }
                    }, identityList, i, game)
                }
                game.zhu.setIdentity();
                game.zhu.identityShown = true;
                game.zhu.isZhu = game.zhu.identity == "vocalist";
                game.zhu.node.identity.removeEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.identity)
                game.me.setIdentity();
                game.me.node.identity.removeEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.identity)
                for (var i = 0; i < game.players.length; i++) {
                    game.players[i].send(
                        function (zhu, zhuid, me, identity) {
                            for (var i in lib.playerOL) {
                                lib.playerOL[i].setIdentity("cai");
                            }
                            zhu.identityShown = true;
                            zhu.identity = zhuid;
                            if (zhuid == "vocalist") {
                                zhu.isZhu = true;
                            }
                            zhu.setIdentity();
                            me.setIdentity(identity);
                            ui.arena.classList.add("choose-character");
                        },
                        game.zhu,
                        game.zhu.identity,
                        game.players[i],
                        game.players[i].identity
                    );
                }
                var list;
                var list2 = [];
                var list3 = [];
                var list4 = [];
                event.list = [];
                event.list2 = [];
                var libCharacter = {};
                for (var i = 0; i < lib.configOL.characterPack.length; i++) {
                    var pack = lib.characterPack[lib.configOL.characterPack[i]];
                    for (var j in pack) {
                        if (lib.character[j]) {
                            libCharacter[j] = lib.character[j];
                        }
                    }
                }
                for (i in lib.characterReplace) {
                    var ix = lib.characterReplace[i];
                    for (var j = 0; j < ix.length; j++) {
                        if (!libCharacter[ix[j]] || lib.filter.characterDisabled(ix[j])) {
                            ix.splice(j--, 1);
                        }
                    }
                    if (ix.length) {
                        event.list.push(i);
                        event.list2.push(i);
                        list4.addArray(ix);
                        var bool = false;
                        for (var j of ix) {
                            if (lib.character[j].isZhugong) {
                                bool = true;
                                break;
                            }
                        }
                        (bool ? list2 : list3).push(i);
                    }
                }
                game.broadcast(function (list) {
                    for (var i in lib.characterReplace) {
                        var ix = lib.characterReplace[i];
                        for (var j = 0; j < ix.length; j++) {
                            if (!list.includes(ix[j])) {
                                ix.splice(j--, 1);
                            }
                        }
                    }
                }, list4);
                for (i in libCharacter) {
                    if (list4.includes(i)) continue;
                    if (lib.filter.characterDisabled(i, libCharacter)) continue;
                    event.list.push(i);
                    event.list2.push(i);
                    list4.push(i);
                    if (lib.character[i].isZhugong) {
                        list2.push(i);
                    } else {
                        list3.push(i);
                    }
                }
                _status.characterlist = list4.slice(0);
                var getZhuList = function () {
                    return list2.filter(char => char in lib.characterPack['GirlsBand']).sort(lib.sort.character);
                };
                list = getZhuList().randomGets(3).concat(list3.randomGets(3));
                var next = game.zhu.chooseButton(true);
                next.set("createDialog", ["选择角色（主唱）", [list, "characterx"]]);
                next.set("ai", function (button) {
                    return Math.random();
                })
                "step 1"
                if (!game.zhu.name) {
                    game.zhu.init(result.links[0], result.links[1]);
                }
                event.list.remove(get.sourceCharacter(game.zhu.name1));
                event.list.remove(get.sourceCharacter(game.zhu.name2));
                event.list2.remove(get.sourceCharacter(game.zhu.name1));
                event.list2.remove(get.sourceCharacter(game.zhu.name2));
                if (!game.zhu.isInitFilter("noZhuHp")) {
                    game.zhu.maxHp++;
                    game.zhu.hp++;
                    game.zhu.update();
                }
                game.broadcast(
                    function (zhu, name, name2) {
                        if (!zhu.name) {
                            zhu.init(name, name2);
                        }
                        if (!zhu.isInitFilter("noZhuHp")) {
                            zhu.maxHp++;
                            zhu.hp++;
                            zhu.update();
                        }
                    },
                    game.zhu,
                    result.links[0],
                    result.links[1],
                );
                if (lib.selectGroup.includes(game.zhu.group) && !game.zhu.isUnseen(0)) {
                    var list = lib.group.slice()
                    list.remove("shen")
                    game.zhu.chooseButton(["请选择你的势力", [list, "vcard"]], true).set("ai", function () {
                        return Math.random();
                    });
                } else {
                    event.goto(3);
                }
                "step 2";
                var name = result.links[0][2]
                game.zhu.changeGroup(name);
                "step 3";
                var list = [];
                var num = Math.floor(event.list.length / (game.players.length - 1))
                for (let i = 0; i < game.players.length; i++) {
                    if (game.players[i] != game.zhu) {
                        let str = "选择角色";
                        str += "（" + get.translation(game.players[i].identity) + "）";
                        list.push([game.players[i], [str, [event.list.randomRemove(Math.min(num, 5)), "characterx"]], 1, true]);
                    }
                }
                game.me.chooseButtonOL(list, function (player, result) {
                    if (game.online || player == game.me) {
                        player.init(result.links[0], result.links[1]);
                    }
                })
                "step 4";
                var shen = [];
                for (var i in result) {
                    if (result[i] && result[i].links) {
                        for (var j = 0; j < result[i].links.length; j++) {
                            event.list2.remove(get.sourceCharacter(result[i].links[j]));
                        }
                    }
                }
                for (var i in result) {
                    if (result[i] == "ai") {
                        result[i] = event.list2.randomRemove();
                        for (var j = 0; j < result[i].length; j++) {
                            var listx = lib.characterReplace[result[i][j]];
                            if (listx && listx.length) {
                                result[i][j] = listx.randomGet();
                            }
                        }
                    } else {
                        result[i] = result[i].links;
                    }
                    if (get.is.double(result[i][0]) || (lib.character[result[i][0]] && lib.selectGroup.includes(lib.character[result[i][0]].group) && !lib.character[result[i][0]].hasHiddenSkill)) {
                        shen.push(lib.playerOL[i]);
                    }
                }
                event.result2 = result;
                if (shen.length) {
                    var list = lib.group.slice()
                    list.remove("shen")
                    for (var i = 0; i < shen.length; i++) {
                        shen[i] = [shen[i], ["请选择你的势力", [list, "vcard"]], 1, true];
                    }
                    game.me
                        .chooseButtonOL(shen, function (player, result) {
                            if (player == game.me) {
                                player.changeGroup(result.links[0][2], false, false);
                            }
                        })
                        .set("switchToAuto", function () {
                            _status.event.result = "ai";
                        })
                        .set("processAI", function () {
                            return {
                                bool: true,
                                links: [_status.event.dialog.buttons.randomGet().link],
                            };
                        });
                } else {
                    event._result = {};
                }
                "step 5";
                if (!result) {
                    result = {};
                }
                for (var i in result) {
                    if (result[i] && result[i].links) {
                        result[i] = result[i].links[0][2]
                    } else if (result[i] == "ai") {
                        result[i] = (function () {
                            var player = lib.playerOL[i];
                            var list = lib.group.slice()
                            list.remove("shen")
                            if (game.zhu && game.zhu.group) {
                                if (["re_zhangjiao", "liubei", "re_liubei", "caocao", "re_caocao", "sunquan", "re_sunquan", "zhangjiao", "sp_zhangjiao", "caopi", "re_caopi", "liuchen", "caorui", "sunliang", "sunxiu", "sunce", "re_sunben", "ol_liushan", "re_liushan", "key_akane", "dongzhuo", "re_dongzhuo", "ol_dongzhuo", "jin_simashi", "caomao"].includes(game.zhu.name)) {
                                    return game.zhu.group;
                                }
                                if (game.zhu.name == "yl_yuanshu") {
                                    if (player.identity == "drummer") {
                                        list.remove("qun");
                                    } else {
                                        return "qun";
                                    }
                                }
                                if (["sunhao", "xin_yuanshao", "re_yuanshao", "re_sunce", "ol_yuanshao", "yuanshu", "jin_simazhao", "liubian"].includes(game.zhu.name)) {
                                    if (player.identity != "drummer") {
                                        list.remove(game.zhu.group);
                                    } else {
                                        return game.zhu.group;
                                    }
                                }
                            }
                            return list.randomGet();
                        })();
                    }
                }
                var result2 = event.result2;
                game.broadcast(
                    function (result, result2) {
                        for (var i in result) {
                            if (!lib.playerOL[i].name) {
                                lib.playerOL[i].init(result[i][0], result[i][1]);
                            }
                            if (result2[i] && result2[i].length) {
                                lib.playerOL[i].changeGroup(result2[i], false, false);
                            }
                        }
                        setTimeout(function () {
                            ui.arena.classList.remove("choose-character");
                        }, 500);
                    },
                    result2,
                    result
                );
                for (var i in result2) {
                    if (!lib.playerOL[i].name) {
                        lib.playerOL[i].init(result2[i][0], result2[i][1]);
                    }
                    if (result[i] && result[i].length) {
                        lib.playerOL[i].changeGroup(result[i], false, false);
                    }
                }
                for (var i = 0; i < game.players.length; i++) {
                    _status.characterlist.remove(game.players[i].name);
                    _status.characterlist.remove(game.players[i].name1);
                    _status.characterlist.remove(game.players[i].name2);
                }
                setTimeout(function () {
                    ui.arena.classList.remove("choose-character");
                }, 500);
            })
        },
        getIdentityList: () => {
            switch (_status.mode) {
                case "normal":
                    return { diehard: "遗", bass: "贝", guitar: "吉", cai: "猜" }
                case "impart":
                    return { drummer: "鼓", diehard: "遗", bass: "贝", guitar: "吉", cai: "猜" }
                case "girls":
                    return { guitar2: "音", keys: "键", guitar3: "奏", diehard: "遗", bass: "贝", cai: "猜" }
                case "soyo":
                    return { keys: "键", diehard: "遗", cai: "猜" }
                case "mortis":
                    return { keys: "键", drummer: "鼓", diehard: "遗", bass: "贝", cai: "猜" }
            }
        }
    },
    get: {
        winConditions: function (player) {
            if (!player.identityShown && player != game.me && player.isAlive()) { return "未知·暗置" }
            let str = `<span style="display: block; text-align: center;">` + get.translation(player.identity) + "·" + (player.identityShown && player.identity != "bass" ? "已明置" : "暗置") + "</span>"
            str += player.identityShown && player.identity != "bass" ? "·击杀所有的暗置身份牌的其他角色（鼓手除外）" : "·击杀所有明置身份牌的其他角色（包含鼓手）"
            let Conditions = {
                "vocalist": str + "<br>" + "·游戏开始时，明置至多两名其他角色的身份牌" + "<br>" + "·击杀者摸一张牌、增加一点体力上限并回复一点体力",
                "drummer": str + "<br>" + "·明置身份时摸一张牌",
                "guitar": str + "<br>" + "·出牌阶段开始时，若已明置身份牌，可重铸一张手牌" + "<br>" + "·击杀者摸三张牌",
                "bass": str + "<br>" + "·你始终暗置身份牌" + "<br>" + "·明置身份牌时摸一张牌" + "<br>" + "·击杀者摸三张牌",
                "keys": str + "<br>" + "·明置身份牌时，与主唱各摸一张牌" + "<br>" + "·击杀者摸三张牌",
                "guitar2": str + "<br>" + "·明置身份牌时，可弃置两张手牌与主唱进行议事，若结果为红色，执行以下效果：" + "<br>" + "   - 与主唱交换身份牌" + "<br>" + "   - 获得武将牌上的主公技" + "<br>" + "   - 第一轮回合结束时，可以明置一名其他角色的身份牌" + "<br>" + "·击杀者摸三张牌",
                "guitar3": str + "<br>" + "·回合结束时，若已明置身份牌，可令一名其他角色摸一张牌" + "<br>" + "·击杀者摸三张牌",
                "diehard": str + "<br>" + "·任意角色回合结束时，若场上仅有一名明置身份牌的角色，明置自身的身份牌" + "<br>" + "·击杀者摸三张牌",
            }
            return Conditions[player.identity]
        },
        rawAttitude: function (from, to) {
            if (from == to) return 10;

            var difficulty = 0;
            if (to == game.me) {
                difficulty = 2 - get.difficulty();
            }
            if (to.identityShown || from.storage.dongcha == to ||
                (from.storage.zhibi && from.storage.zhibi.includes(to))) {
                if (to.identity == "bass") {
                    return get.realAttitude(from, to) * 1.2 + difficulty * 1.5;
                }
                return get.realAttitude(from, to) + difficulty * 1.5;
            }

            var aishown = to.ai.shown;
            if (to.identity === "drummer" && !to.identityShown) {
                var realAttitude = get.realAttitude(from, to);
                var fromMing = from.identity === "drummer" || (from.identityShown && from.identity !== "bass");

                if (fromMing) {
                    return -6 * (1 - aishown) + realAttitude * aishown + difficulty * 1.5;
                } else {
                    return 6 * (1 - aishown) + realAttitude * aishown + difficulty * 1.5;
                }
            }
            if (to.identity == "bass" && to.identityShown) {
                return get.realAttitude(from, to) * 1.2 + difficulty * 1.5;
            }
            return get.realAttitude(from, to) + difficulty * 1.5;
        },
        realAttitude: function (from, to) {
            if (from == to) return 10;
            let fromMing = from.identity === "drummer" || (from.identityShown && from.identity !== "bass");
            let toMing = to.identity === "drummer" || (to.identityShown && to.identity !== "bass");
            let fromAn = from.identity == "bass" || (!from.identityShown && from.identity !== "drummer");
            let toAn = to.identity == "bass" || (!to.identityShown && to.identity !== "drummer");
            if ((fromMing && toMing) || (fromAn && toAn)) {
                return 6
            }
            else if ((fromMing && toAn) || (fromAn && toMing)) {
                return -6
            }
        },
        situation: function (absolute) {
            var i, player;
            var ming = 0, an = 0, total = 0;

            for (i = 0; i < game.players.length; i++) {
                player = game.players[i];
                var strength = get.condition(player);
                var threat = get.threaten(player, game.me, true);
                var power = strength * threat;
                if (player.identityShown && player.identity != "bass" || player.identity == "drummer") {
                    ming += power + 4;
                    total += power + 4;
                }
                else {
                    an += power + 4;
                    total += power + 4;
                }
            }
            if (absolute) return ming - an;
            var result = parseInt(10 * Math.abs((ming - an) / total));
            if (ming < an) result = -result;

            return result;
        },
        identityList: () => {
            switch (_status.mode) {
                case "normal":
                    return ["vocalist", "diehard", "bass", "bass", "guitar"]
                case "impart":
                    return ["vocalist", "drummer", "diehard", "bass", "guitar", "guitar", "guitar", "guitar"]
                case "girls":
                    return ["vocalist", "guitar2", "keys", "bass", "guitar3", "guitar3", "guitar3", "diehard"]
                case "soyo":
                    return ["vocalist", "keys", "keys", "keys", "keys", "keys", "keys", "diehard"]
                case "mortis":
                    return ["vocalist", "keys", "drummer", "drummer", "bass", "bass", "bass", "diehard"]
            }
        },
        identityList2: () => {
            switch (_status.mode) {
                case "normal":
                    return ["random", "vocalist", "diehard", "bass", "guitar"]
                case "impart":
                    return ["random", "vocalist", "drummer", "diehard", "bass", "guitar"]
                case "girls":
                    return ["random", "vocalist", "guitar2", "keys", "guitar3", "diehard", "bass"]
                case "soyo":
                    return ["random", "vocalist", "keys", "diehard"]
                case "mortis":
                    return ["random", "vocalist", "keys", "drummer", "bass", "diehard"]
            }
        }
    },
    element: {
        player: {
            getFriends(func, includeDie) {
                var player = this;
                var self = false;
                if (func === true) {
                    func = null;
                    self = true;
                }
                let method = includeDie ? "filterPlayer2" : "filterPlayer";

                var targets = game[method](target => {
                    if (func && !func(target)) {
                        return false;
                    }
                    if (target === player) return false;
                    let playerMing = player.identity === "drummer" || (player.identityShown && player.identity !== "bass");
                    let targetMing = target.identity === "drummer" || (target.identityShown && target.identity !== "bass");
                    let playerAn = player.identity == "bass" || (!player.identityShown && player.identity !== "drummer");
                    let targetAn = target.identity == "bass" || (!target.identityShown && target.identity !== "drummer");
                    return (playerMing && targetMing) || (playerAn && targetAn);
                });

                if (self) {
                    targets.add(player);
                }
                return targets;
            },

            getEnemies(func, includeDie) {
                var player = this;
                let method = includeDie ? "filterPlayer2" : "filterPlayer";

                var targets = game[method](target => {
                    if (func && !func(target)) {
                        return false;
                    }
                    if (target === player) return false;
                    let playerMing = player.identity === "drummer" || (player.identityShown && player.identity !== "bass");
                    let targetMing = target.identity === "drummer" || (target.identityShown && target.identity !== "bass");
                    let playerAn = player.identity == "bass" || (!player.identityShown && player.identity !== "drummer");
                    let targetAn = target.identity == "bass" || (!target.identityShown && target.identity !== "drummer");
                    return (playerMing && targetAn) || (playerAn && targetMing);
                });
                return targets;
            },
            dieAfter: function (source) {
                if (!this.identityShown) {
                    game.broadcastAll(
                        function (player, identity) {
                            player.setIdentity(player.identity);
                            if (identity) {
                                game.log(player, "的身份是", "#g" + get.translation(identity));
                            }
                        },
                        this,
                        this.identity
                    );
                }
                game.checkResult()
            },
            logAi: function (targets, card) {
                if (this.ai.shown == 1 || this.isMad()) return;
                if (typeof targets == "number") {
                    this.ai.shown += targets;
                } else {
                    var effect = 0,
                        c,
                        shown;
                    var info = get.info(card);
                    if (info.ai && info.ai.expose) {
                        if (_status.event.name == "_wuxie" && card.name == "wuxie") {
                            const infomap = _status.event._info_map;
                            if (infomap) {
                                if (this != infomap.target && infomap.player && infomap.player.ai.shown) {
                                    this.ai.shown += 0.2;
                                }
                            }
                        } else {
                            this.ai.shown += info.ai.expose;
                        }
                    }
                    if (targets.length > 0) {
                        for (var i = 0; i < targets.length; i++) {
                            shown = Math.abs(targets[i].ai.shown);
                            if (shown < 0.2 || targets[i].identity == "diehard") c = 0;
                            else if (shown < 0.4) c = 0.5;
                            else if (shown < 0.6) c = 0.8;
                            else c = 1;
                            var eff = get.effect(targets[i], card, this);
                            effect += eff * c;
                            if (eff == 0 && shown == 0 && ["drummer"].includes(this.identity) && targets[i] != this) {
                                effect += 0.1;
                            }
                        }
                    }
                    if (effect > 0) {
                        if (effect < 1) c = 0.5;
                        else c = 1;
                        if (targets.length == 1 && targets[0] == this);
                        else if (targets.length == 1) this.ai.shown += 0.2 * c;
                        else this.ai.shown += 0.1 * c;
                    } else if (effect < 0 && this == game.me && game.me.identity == "diehard") {
                        if (targets.length == 1 && targets[0] == this);
                        else if (targets.length == 1) this.ai.shown -= 0.2;
                        else this.ai.shown -= 0.1;
                    }
                    if (this != game.me) this.ai.shown *= 2;
                    if (this.ai.shown > 0.95) this.ai.shown = 0.95;
                    if (this.ai.shown < -0.5) this.ai.shown = -0.5;
                }
            },
            dieAfter2: function (source) {
                if (this.identity == "vocalist" && source) {
                    source.draw(1)
                    source.gainMaxHp()
                    source.recover()
                } else if (this.identity != "drummer" && source) source.draw(3)
            },
            isZhu2() {
                var player = this
                if (player.identity == "vocalist") return true;
            },
            hasZhuSkill(skill, player) {
                if (!this.hasSkill(skill)) return false;
                if (this.identity == "vocalist") return true;
            }
        }
    },
    ui: {
        click: {
            target(e) {
                if (_status.dragged) {
                    return;
                }
                if (_status.clicked) {
                    return;
                }
                if (ui.intro) {
                    return;
                }
                if (this.classList.contains("connect")) {
                    if (this.playerid) {
                        if (this.ws) {
                            if (confirm("是否踢出" + this.nickname + "？")) {
                                var onlineKey = this.ws.onlineKey;
                                if (onlineKey) {
                                    if (confirm("是否永久踢出(加入黑名单)？")) {
                                        var banBlacklist = lib.config.banBlacklist === undefined ? [] : lib.config.banBlacklist;
                                        banBlacklist.push(onlineKey);
                                        game.saveConfig("banBlacklist", banBlacklist);
                                    }
                                }
                                var id = get.id();
                                this.ws.send(function (id) {
                                    if (game.ws) {
                                        game.ws.close();
                                        game.saveConfig("reconnect_info");
                                        game.saveConfig("banned_info", id);
                                    }
                                }, id);
                                lib.node.banned.push(id);
                            }
                        }
                    }
                    return;
                }
                _status.clicked = true;
                var custom = _status.event.custom;
                if (custom && custom.replace.target) {
                    custom.replace.target(this, e);
                    return;
                }
                if (this.classList.contains("selectable") == false) {
                    return;
                }
                this.unprompt();
                if (this.classList.contains("selected")) {
                    ui.selected.targets.remove(this);
                    if (_status.multitarget || _status.event.complexSelect) {
                        game.uncheck();
                        game.check();
                    } else {
                        this.classList.remove("selected");
                    }
                } else {
                    ui.selected.targets.add(this);
                    if (["chooseTarget", "chooseToUse", "chooseCardTarget", "chooseButtonTarget"].includes(_status.event.name)) {
                        var targetprompt = null;
                        if (_status.event.targetprompt) {
                            targetprompt = _status.event.targetprompt;
                        } else if (_status.event.skill && !get.info(_status.event.skill).viewAs) {
                            targetprompt = get.info(_status.event.skill).targetprompt;
                        } else if (_status.event.name == "chooseToUse") {
                            var currentcard = get.card();
                            if (currentcard) {
                                targetprompt = get.info(currentcard).targetprompt;
                            }
                        }
                        if (targetprompt) {
                            if (Array.isArray(targetprompt)) {
                                const targets = ui.selected.targets.slice();
                                let index = ui.selected.targets.indexOf(this);
                                for (let i = 0; i < targetprompt.length; i++) {
                                    const target = targets.find(cur => cur.node.prompt && cur.node.prompt.innerHTML === targetprompt[i]);
                                    if (target) {
                                        targets.remove(target);
                                    } else {
                                        index = i;
                                        break;
                                    }
                                }
                                targetprompt = targetprompt[Math.min(targetprompt.length - 1, index)];
                            } else if (typeof targetprompt == "function") {
                                targetprompt = targetprompt(this);
                            }
                            if (targetprompt && typeof targetprompt == "string") {
                                this.prompt(targetprompt);
                            }
                        }
                    }
                    this.classList.add("selected");
                }
                if (custom.add.target) {
                    custom.add.target();
                }
                game.check();
            }
        },
    },
    help: {}
};

game.addMode("band", bandMode, {
    translate: "乐队",
    extension: "GirlsBand",
    config: {
        update: function (config, map) {
        },
        band_mode: {
            name: "乐队模式",
            init: "normal",
            frequent: true,
            restart: true,
            item: {
                "normal": "标准",
                "impart": "合奏",
                "girls": "少女",
                "soyo": "素世の野望",
                "mortis": "全都不会"
            }
        },
        change_identity: {
            name: "自选身份",
            init: true,
            frequent: true,
            restart: true,
        },
        change_choice: {
            name: "开启换将卡",
            init: 0,
            item: {
                0: "禁用",
                1: "一",
                2: "二",
                3: "三",
            },
            frequent: false,
            restart: true,
        },
        free_choose: {
            name: "自由选将",
            init: true,
            frequent: true,
            restart: true,
        },
        info: {
            name: "可前往 其他->帮助->乐队模式 查看模式信息",
            clear: true,
            frequent: true,
        }
    },
});
lib.mode["band"].connect = {
    connect_band_mode: {
        name: "游戏模式",
        init: "normal",
        frequent: true,
        item: {
            "normal": "标准",
            "impart": "合奏",
            "girls": "少女",
            "soyo": "素世の野望",
            "mortis": "全都不会"
        }
    },
    connect_change_choice: {
        name: "开启换将卡",
        init: 0,
        item: {
            0: "禁用",
            1: "一",
            2: "二",
            3: "三",
        },
        frequent: false,
    },
    connect_choose_timeout: {
        name: "出牌时限",
        init: "30",
        item: {
            10: "10秒",
            15: "15秒",
            30: "30秒",
            60: "60秒",
            90: "90秒"
        },
        connect: true,
        frequent: true
    },
    connect_observe: {
        name: "允许旁观",
        init: true,
        connect: true,
    },
    connect_observe_handcard: {
        name: "允许观看手牌",
        init: false,
        connect: true,
    },
    connect_mount_combine: {
        name: "合并坐骑栏",
        init: false,
        connect: true,
    },
}
var updateConnectDisplayMap = function () {
    if (_status.waitingForPlayer && lib.configOL.mode == "band") {
        let band_mode = Array.from(document.querySelectorAll(".config.switcher")).find(element =>
            element.textContent.includes("游戏模式"))
        if (band_mode) {
            band_mode.style.display = "none";
        }
    }
};
menuUpdates.push(updateConnectDisplayMap)
game.readFile("extension/GirlsBand/main/mode.js", (data) => { game.writeFile(data, "mode", "band.js", () => { }) })
export default bandMode