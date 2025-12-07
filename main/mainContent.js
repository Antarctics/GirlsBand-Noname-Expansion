import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import update from "./update.js";
export default function () {
    game.showExtensionChangeLog([
        { type: "text", data: "本次更新说明" },
        {
            type: "players",
            data: ["gb_songyuanhuayin", "gb_beizeyumei", "gb_laitianxun"],
        },
        {
            type: "text",
            data: `新增配套技能语音`,
        },
        {
            type: "text",
            data: `修复${get.poptip("gbsiwang")}描述与实际不符的问题`,
        },
        {
            type: "text",
            data: ``,
        },
        {
            type: "text",
            data: `调整【注释】功能，修复对部分技能无效的情况，提高加载性能。`,
        },
        {
            type: "text",
            data: `清除势力全称，以适配左慈等角色。`,
        },
        {
            type: "text",
            data: `优化势力图标。`,
        },
    ], 'GirlsBand');
    /**
     * 合奏机制 - 让玩家选择展示手牌或从牌堆展示牌
     * @param {Array|Player} players - 参与玩家
     * @param {Function} [callback] - 回调函数
     * @param {Function} [filter] - 卡牌过滤函数
     * 
     * @example
     * // 令targets进行合奏，合奏结束后各摸一张牌
     * player.chooseToEnsemble(targets，()=>{
     * let {bool,targets}= _status.event.ensembleResult
     * if(bool) targets.forEach(target=>target.draw())
     * })
     * 
     */
    lib.element.player.chooseToEnsemble = function () {
        const next = game.createEvent("chooseToEnsemble");
        next.player = this;
        for (let arg of arguments) {
            const type = get.itemtype(arg);
            if (type === "players" || type === "player") {
                next.list = Array.isArray(arg) ? arg : [arg];
            } else if (typeof arg === 'function') {
                next.callback ? next.filterCard = arg : next.callback = arg;
            }
        }
        next.setContent("chooseToEnsemble");
        return next;
    }

    lib.element.content.chooseToEnsemble = async function () {
        const event = _status.event;
        if (!event.list) return event.result = { bool: false };

        const results = [], allCards = [];
        event.videoId = lib.status.videoId++;
        const targets = event.list.filter(target => !event.fixedResult?.[target.playerid]);
        if (targets.length) {
            var next = event.player
                .chooseCardOL(targets, `${get.translation(event.player)}发起了合奏，请选择展示的牌`)
                .set("type", "ensemble")
                .set("source", event.player)
                .set("targets", event.list)
                .set("filterCard", event.filterCard || (() => true))
                .set("ai", event.ai || (card => event.player.countCards("h") > 3 && (6 - get.value(card) ? Math.random() < 0.3 : false)))
                .set("selectCard", [1, Infinity])
            next._args.remove("glow_result");
            next = await next.forResult()
        }
        let idx = 0;
        for (var i = 0; i < event.list.length; i++) {
            let target = event.list[i]
            if (event.fixedResult?.[target.playerid]) {
                const cards = Array.isArray(event.fixedResult[target.playerid]) ? event.fixedResult[target.playerid] : [event.fixedResult[target.playerid]]
                game.log(target, "展示了", "#y", cards);
                results.push([target, cards]);
                allCards.push(cards);
                continue;
            }

            const result = next[idx++];
            if (result.bool) {
                game.log(target, "从", "#g手牌中", "展示了", "#y", result.cards);
                target.popup("手牌");
                results.push([target, result.cards]);
                allCards.push(result.cards);
            } else {
                const card = get.cards(1);
                game.cardsGotoOrdering(card);
                game.log(target, "从", "#g牌堆中", "展示了", "#y", card);
                target.popup("牌堆");
                results.push([target, card]);
                allCards.push(card);
            }
        }
        event.trigger("EnsembleShow");
        game.broadcastAll((player, id, results) => {
            game.pause();
            const dialog = ui.create.dialog(`${get.translation(player)}发起了合奏`, "hidden");
            dialog.videoId = id;

            const names = results.map(([target]) => ({ item: get.translation(target), ratio: results.length }));
            const cards = results.map(([_, cardList]) => ({ item: cardList, ratio: results.length }));

            if (results.length >= 4) {
                const half = Math.ceil(results.length / 2);
                dialog.addNewRow(...names.slice(0, half), ...names.slice(half));
                dialog.addNewRow(...cards.slice(0, half), ...cards.slice(half));
                dialog.css({ height: "60%" });
            } else {
                dialog.addNewRow(...names);
                dialog.addNewRow(...cards);
                dialog.css({ height: "30%" });
            }

            dialog.open();
            setTimeout(() => { game.resume(); dialog.close(); }, 2000);
        }, event.player, event.videoId, results);
        event.result = { bool: true, cards: allCards, targets: event.list, list: results, player: event.player };
        if (event.callback) {
            const cbEvent = game.createEvent("ensembleCallback");
            cbEvent.player = event.player;
            cbEvent.ensembleResult = get.copy(event.result);
            cbEvent.setContent(event.callback);
        }
    }
    if (lib.config.extension_GirlsBand_auto_update && navigator.onLine) update(false);
};