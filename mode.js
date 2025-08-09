
import { lib, game, ui, get, ai, _status } from "../../noname.js";

/** @type { importModeConfig } */
const bandMode = {
    name: "band",
    splash: "ext:GirlsBand/image/band.jpg",
    skill: {
        _gbShowIdentity: {
            trigger: {
                global: "showIdentityCards"
            },
            forced: true,
            filter(event, player) {
                return event._result.targets?.includes(player) || event.targets?.includes(player)
            },
            async content(event, trigger, player) {
                switch (player.identity) {
                    case "drummer":
                        player.draw(1)
                        break
                    case "guitar":
                        player.when("phaseUseBegin")
                            .then(() => { player.chooseCard("h", 1, "吉他", "你可以重铸一张手牌") })
                            .then(() => { if (result && result.bool) { player.recast(result.cards) } })
                        break
                    case "bass":
                        player.draw(1)
                        break
                    case "keys":
                        game.zhu.draw(1)
                        player.draw(1)
                        break
                    case "guitar2":
                        player.chooseToDebate([player, game.zhu])
                            .set("ai", card => {
                                if (get.color(card) == "red") return 10
                                return 1
                            })
                            .set("callback", () => {
                                const {
                                    bool,
                                    opinion } = event.debateResult;
                                if (bool && opinion == "red") {
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
                                    player.node.identity.classList.remove("guessing");
                                    player.when("phaseEnd")
                                        .filter((event, player) => game.phaseNumber == 1)
                                        .then(() => { player.chooseTarget("主音", "是否明置一名角色的身份牌").set("filterTarget", (card, player, target) => !target.identityShown).set("ai", target => Math.random()) })
                                        .then(() => { if (result && result.bool) { game.showIdentityCards(result.targets) } })
                                }
                            })
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
            _status.mode = lib.configOL.versus_mode;
            game.waitForPlayer(function () {
                if (lib.configOL.band_mode == "normal") {
                    lib.configOL.number = 5
                } else {
                    lib.configOL.number = 8
                }
            })
        }
        "step 1"
        if (_status.mode == "normal") {
            game.prepareArena(5)
        } else {
            game.prepareArena(8)
        }
        "step 2"
        game.assignIdentity();
        "step 3"
        for (var i = 0; i < game.players.length; i++) {
            game.players[i].ai.shown = 0.01
            game.players[i].getId();
        }
        game.chooseCharacter();
        "step 4"
        event.trigger("gameStart");
        var players = get.players(lib.sort.position);
        var drummer = players.find(player => player.identity == "drummer")
        if (!game.ming) game.ming = []
        game.ming.push(game.zhu)
        game.ming.push(drummer)
        game.checkResult()
        game.updateIdentity()
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
        game.gameDraw(players[0], 4);
        "step 5"
        var result = game.zhu.chooseTarget("主唱", "请明置至少两名其他角色的身份牌", true, [1, 2], lib.filter.notMe).set("ai", (target) => Math.random())
        "step 6"
        if (result && result.bool) {
            let targets = result.targets.sortBySeat()
            game.showIdentityCards(targets)
        }
        "step 7"
        game.phaseLoop(game.zhu || _status.firstAct || game.me)
    },
    game: {
        assignIdentity: () => {
            var players = game.players.slice(0);
            players.randomSort();
            var identities = get.identityList();
            for (var i = 0; i < players.length; i++) {
                players[i].identity = identities.randomRemove();
                players[i].setIdentity("an");
                players[i].node.identity.classList.add("guessing");
                players[i].identityShown = false;
            }
            var vocalist = players.find(player => player.identity == "vocalist")
            if (vocalist) {
                game.zhu = vocalist;
                vocalist.isZhu = true;
                vocalist.identityShown = true;
                vocalist.ai.shown = 1
                vocalist.node.identity.classList.remove("guessing");
            }
            game.me.setIdentity();
            game.me.node.identity.classList.remove("guessing");
        },
        createIdentityCard: (player, identity) => {
            const card = ui.create.card();
            card.removeEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.card);
            card.classList.add("button");
            card._customintro = uiintro => uiintro.add(`${get.translation(player)}的身份牌`);
            const fileName = `extension/GirlsBand/image/${identity}.jpg`;
            new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = resolve;
                image.onerror = reject;
                image.src = `${lib.assetURL}${fileName}`;
            }).then(
                () => {
                    card.classList.add("fullskin");
                    card.node.image.setBackgroundImage(fileName);
                },
                () => {
                    const defaultFileName = `image/card/identity_${identity}.jpg`;
                    new Promise((resolve, reject) => {
                        const image = new Image();
                        image.onload = resolve;
                        image.onerror = reject;
                        image.src = `${lib.assetURL}${defaultFileName}`;
                    }).then(
                        () => {
                            card.classList.add("fullskin");
                            card.node.image.setBackgroundImage(defaultFileName);
                        },
                        () => (card.node.background.innerHTML = get.translation(identity)[0])
                    );
                }
            );
            return card;
        },
        updateIdentity: () => {
            let players = get.players()
            players.forEach(player => {
                if (game.me.identity == "drummer") {
                    if (game.ming.includes(player)) player.node.identity.setAttribute("data-color", "wu")
                    else player.node.identity.setAttribute("data-color", "truezhu")
                } else {
                    if (game.ming.includes(game.me)) {
                        if (game.ming.includes(player) && player.identityShown) player.node.identity.setAttribute("data-color", "wu")
                        else player.node.identity.setAttribute("data-color", "truezhu")
                    } else {
                        if (!player.identityShown || player.identity == "bass") player.node.identity.setAttribute("data-color", "wu")
                        else player.node.identity.setAttribute("data-color", "truezhu")
                    }
                }
            })
        },
        showIdentityCards: (targets) => {
            if (!targets || targets.length === 0) return;
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
                var identity = target.identity;
                var card = game.createIdentityCard(target, identity);
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

                        if (identity == "bass") {
                            target.setIdentity(target.identity);
                            target.node.identity.classList.remove("guessing");
                            target.identityShown = true;
                            target.ai.shown = 1
                            setTimeout(() => {
                                card.style.animation = "shake 0.5s ease-in-out";
                                setTimeout(() => {
                                    card.style.animation = "";
                                    card.classList.add("infohidden");
                                    card.style.transition = "all ease-in 0.3s";
                                    ui.refresh(card);
                                    card.style.transform = "perspective(600px) rotateY(180deg) translateX(0)";
                                }, 500);
                            }, (targets.length - index + 1) * 500);
                        } else {
                            if (!game.ming) game.ming = []
                            game.ming.push(target)
                            target.setIdentity(target.identity);
                            target.node.identity.classList.remove("guessing");
                            target.identityShown = true;
                            target.ai.shown = 1
                        }
                        game.log(target, "展示了", "#g身份牌")
                        completedCount++;
                        if (completedCount === targets.length) {
                            game.updateIdentity()
                            setTimeout(() => {
                                dialog.close();
                                game.resume()
                                game.checkResult()
                            }, 3000);
                        }
                    }, 300);
                }, index * 500);
            });
            dialog.open();
            game.pause()
            get.event().trigger("showIdentityCards").targets = targets
        },
        chooseCharacter: function () {
            var next = game.createEvent("chooseCharacter");
            next.showConfig = true;
            next.addPlayer = function (player) {
                var list = get.identityList(game.players.length - 1);
                var list2 = get.identityList(game.players.length);
                for (var i = 0; i < list.length; i++) list2.remove(list[i]);
                player.identity = list2[0];
                player.setIdentity("an");
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
                for (i = 0; i < game.players.length; i++) {
                    game.players[i].node.identity.classList.add("guessing");
                    game.players[i].identity = identityList[i];
                    game.players[i].setIdentity("an");
                    if (identityList[i] == "vocalist") {
                        game.zhu = game.players[i];
                    }
                    game.players[i].identityShown = false;
                }

                if (!game.zhu) game.zhu = game.me;
                else {
                    game.zhu.setIdentity();
                    game.zhu.identityShown = true;
                    game.zhu.isZhu = game.zhu.identity == "vocalist";
                    game.zhu.node.identity.classList.remove("guessing");
                    game.me.setIdentity();
                    game.me.node.identity.classList.remove("guessing");
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
                    var limit_zhu = get.config("limit_zhu");
                    if (!limit_zhu || limit_zhu == "off") return list2.slice(0).sort(lib.sort.character);
                    if (limit_zhu != "group") {
                        var num = parseInt(limit_zhu) || 6;
                        return list2.randomGets(num).sort(lib.sort.character);
                    }
                    var getGroup = function (name) {
                        var characterReplace = lib.characterReplace[name];
                        if (characterReplace && characterReplace[0] && lib.character[characterReplace[0]]) return lib.character[characterReplace[0]][1];
                        return lib.character[name][1];
                    };
                    var list2x = list2.slice(0);
                    list2x.randomSort();
                    for (var i = 0; i < list2x.length; i++) {
                        for (var j = i + 1; j < list2x.length; j++) {
                            if (getGroup(list2x[i]) == getGroup(list2x[j])) {
                                list2x.splice(j--, 1);
                            }
                        }
                    }
                    list2x.sort(lib.sort.character);
                    return list2x;
                };
                event.list.randomSort();
                _status.characterlist = list4.slice(0).randomSort();
                list3.randomSort();
                var num = get.config("choice_" + game.me.identity) || 3;
                if (game.zhu != game.me) {
                    event.ai(game.zhu, event.list, getZhuList());
                    event.list.remove(get.sourceCharacter(game.zhu.name1));
                    event.list.remove(get.sourceCharacter(game.zhu.name2));
                    list = event.list.slice(0, num);
                } else {
                    list = getZhuList().concat(list3.slice(0, num));
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
                ui.create.cheat = function () {
                    _status.createControl = ui.cheat2;
                    ui.cheat = ui.create.control("更换", function () {
                        if (ui.cheat2 && ui.cheat2.dialog == _status.event.dialog) {
                            return;
                        }
                        if (game.zhu != game.me) {
                            event.list.randomSort();
                            list = event.list.slice(0, num);
                        } else {
                            getZhuList().sort(lib.sort.character);
                            list3.randomSort();
                            list = getZhuList().concat(list3.slice(0, num));
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
                if (!ui.cheat && get.config("change_choice")) ui.create.cheat();
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
                } else if ((lib.character[name].group == "shen" || lib.character[name].group == "western") && !lib.character[name].hasHiddenSkill && get.config("choose_group")) {
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
                        event.ai(game.players[i], event.list.splice(0, get.config("choice_" + game.players[i].identity) || 3), null, event.list);
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
        checkResult: () => {
            var me = game.me._trueMe || game.me
            var ming = game.hasPlayer((current) => game.ming.includes(current))
            var an = game.hasPlayer((current) => !game.ming.includes(current))
            if (!ming) {
                if (game.ming.includes(me)) game.over(false)
                else game.over(true)
            }
            if (!an) {
                if (!game.ming.includes(me)) game.over(false)
                else game.over(true)
            }
        }
    },
    get: {
        rawAttitude: function (from, to) {
            return get.realAttitude(from, to)
        },
        realAttitude: function (from, to) {
            if (from == to) return 10
            if (from.identity == "drummer") {
                if (to.identityShown && to.identity != "bass") return 6
                return -6
            }
            if (from.identity == "bass") {
                if (to.identityShown && to.identity != "bass") return -6
                return 6
            }
            if (from.identityShown) {
                if (to.identityShown && to.identity != "bass") return 6
                return -6
            }
            if (!from.identityShown) {
                if (!to.identityShown || to.identity == "bass") return 6
                return -6
            }
        },
        situation: function (absolute) {
            var i, j, player;
            var ming = 0, an = 0, total = 0;

            for (i = 0; i < game.players.length; i++) {
                player = game.players[i];
                var php = player.hp;
                if (player.hasSkill("benghuai") && php > 4) {
                    php = 4;
                } else if (php > 6) {
                    php = 6;
                }
                j = player.countCards("h") + player.countCards("e") * 1.5 + php * 2;

                if (game.ming.includes(player)) {
                    ming += j + 4;
                    total += j + 4;
                } else {
                    an += j + 4;
                    total += j + 4;
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
                    return ["vocalist", "drummer", "diehard", "bass", "guitar"]
                case "impart":
                    return ["vocalist", "drummer", "diehard", "bass", "guitar", "guitar", "guitar", "guitar"]
                case "girls":
                    return ["vocalist", "guitar2", "keys", "keys", "guitar3", "guitar3", "guitar3", "diehard"]
                case "soyo":
                    return ["vocalist", "keys", "keys", "keys", "keys", "keys", "keys", "diehard"]
                case "mortis":
                    return ["vocalist", "keys", "drummer", "drummer", "bass", "bass", "bass", "diehard"]
            }
        },
        identityList2: () => {
            switch (_status.mode) {
                case "normal":
                    return ["random", "vocalist", "drummer", "diehard", "bass", "guitar"]
                case "impart":
                    return ["random", "vocalist", "drummer", "diehard", "bass", "guitar"]
                case "girls":
                    return ["random", "vocalist", "guitar2", "keys", "guitar3", "diehard"]
                case "soyo":
                    return ["random", "vocalist", "keys", "diehard"]
                case "mortis":
                    return ["random", "vocalist", "keys", "drummer", "bass", "diehard"]
            }
        }
    },
    element: {
        player: {
            dieAfter: function (source) {
                if (!this.identityShown) {
                    game.broadcastAll(
                        function (player, identity) {
                            player.setIdentity(player.identity);
                            player.identityShown = true;
                            player.node.identity.classList.remove("guessing")
                            if (identity) {
                                game.log(player, "的身份是", "#g" + get.translation(identity));
                            }
                        },
                        this,
                        this.identity
                    );
                }
                if (game.countPlayer(player => player.identityShown) == 1) {
                    game.filterPlayer(player => player.identity == "diehard" && !player.identityShown).forEach(player => player.when("phaseBegin").then(() => game.showIdentityCards([player])))
                }
                game.checkResult()
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
                if (player.identity == "vocalist") return true;
            }
        }
    },
    help: {
        乐队模式: `乐队模式身份牌：
        <br>基础身份牌：
        <br>主唱 鼓手 吉他 贝斯 遗老贝斯
<br>
        <br>可扩充身份牌：
        <br>键盘 主音吉他 节奏吉他
<br>
        <br>五人标准乐队场：1主唱 1贝斯 2吉他 1遗老贝斯
        <br>八人标准乐队场：1主唱 1鼓手  1贝斯 4吉他 1遗老贝斯
        <br>大少女乐队场（八人）：1主唱 1主音吉他 2键盘 3节奏吉他 1遗老贝斯
        <br>素世的野望场（八人）：1主唱 6键盘 1遗老贝斯
        <br>全部不会弹场（八人）：1主唱 1键盘 2鼓手 3贝斯 1遗老贝斯
<br>
        <br>【主唱】（主公变种）
        <br>1.增加1点体力上限，并获得武将牌上的主公技。
        <br>2.游戏开始时，你可以指定至多两名其他角色并明置其的身份牌。
        <br>3.你的胜利目标为击杀所有除鼓手以外的所有未展示身份牌的其他角色。
        <br>4.当所有展示身份牌的绝嗣死亡后，所有未展示身份牌的角色视为胜利。
        <br>5.击杀你的角色摸一张牌，然后恢复一点体力并增加1点体力上限。
<br>
        <br>【鼓手】
        <br>·你的胜利目标始终与主唱相同。
        <br>·当你的身份牌被展示时时，若你存活，你摸一张牌。
        <br>·击杀你的角色不进行任何奖惩。
<br>
        <br>【吉他】
        <br>·当你的身份牌被展示时，出牌阶段开始时，你可以重铸自己的一张手牌。
        <br>·击杀你的角色摸三张牌。
<br>
        <br>【贝斯】
        <br>·当你的身份牌被展示时，你暗置你的身份牌。
        <br>·当你的身份牌被展示时，若你存活，你摸一张牌。
        <br>·击杀你的角色摸三张牌。
<br>
        <br>【键盘】
        <br>·当你的身份牌被展示时，若你存活，你令主唱与你各摸一张牌。
        <br>·击杀你的角色摸三张牌。
<br>
        <br>【主唱吉他】
        <br>·当你的身份牌被展示时，若你存活，你可以弃置两张手牌并与主唱进行一次议事。若议事结果为：红色，你与主唱交换身份牌并获得自己武将牌上的主公技。（不会因此改变坐次）然后，你的第一轮回合结束时，你可以明置一名其<br>他角色的身份牌。
        <br>·击杀你的角色摸三张牌。
<br>
        <br>【节奏吉他】
        <br>·当你的身份牌被展示时，若你存活，你的回合结束可以令一名其他角色摸一张牌。
        <br>·击杀你的角色摸三张牌
<br>
        <br>【遗老贝斯】
        <br>·锁定技，若场上存活角色中只有一名角色的身份牌明置，你的回合开始时你主动展示自己的身份牌，然后你的胜利目标与主唱相同。
        <br>·击杀你的角色摸三张牌。`
    }
};

game.addMode("band", bandMode, {
    translate: "乐队",
    config: {
        band_mode: {
            name: "乐队模式",
            init: "normal",
            frequent: true,
            restart: true,
            item: {
                "normal": "标准模式",
                "impart": "合奏模式",
                "girls": "女乐模式",
                "soyo": "素世の野望",
                "morits": "全都不会"
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
            init: true,
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
            name: "乐队模式下可前往 <br>其他->帮助->乐队模式 <br>查看模式信息",
            clear: true,
            frequent: true,
        }
    },
});
