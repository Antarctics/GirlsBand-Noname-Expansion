import { lib, game, ui, get, ai, _status } from "../../noname.js";
const dynamicTranslates = {
    gbchunying(player) {
        if (!player.storage.gbchunying) return `转换技，出牌阶段限一次，你可以展示一名其他角色的一张手牌，然后你令其使用此牌：<span class="bluetext">阳：与你拼点：若你赢，你获得拼点的牌；若你没赢，此技能视为未使用过；</span>阴：与你议事，若结果为：红色，你获得议事的牌；黑色，你摸一张牌且本回合手牌上限+1。`
        return `转换技，出牌阶段限一次，你可以展示一名其他角色的一张手牌，然后你令其使用此牌：阳：与你拼点：若你赢，你获得拼点的牌；若你没赢，此技能视为未使用过；<span class="bluetext">阴：与你议事，若结果为：红色，你获得议事的牌；黑色，你摸一张牌且本回合手牌上限+1。</span>`
    },
    gbdubai(player) {
        if (!player.storage.gbdubai) return `转换技，出牌阶段限两次，你可以展示一张手牌，<span class="bluetext">阳：横置或重置自身，然后横置一名其他角色。</span>阴：令一名未横置的其他角色选择一项：①令你摸一张牌，然后横置自身武将牌；②视为对你使用一张雷【杀】，若未造成伤害，你摸一张牌并弃置其一张牌。`
        return `转换技，出牌阶段限两次，你可以展示一张手牌，阳：横置或重置自身，然后横置一名其他角色。<span class="bluetext">阴：令一名未横置的其他角色选择一项：①令你摸一张牌，然后横置自身武将牌；②视为对你使用一张雷【杀】，若未造成伤害，你摸一张牌并弃置其一张牌。</span>`
    },
    gbkaimu(player) {
        let skill = player.storage["gbkaimu"]
        let num = skill ? skill - 1 : 0
        let str = "持恒技，游戏开始时或每轮开始时，你选择其中一项作为效果："
        let infos = ["<br>①明场：当【杀】造成伤害时，伤害来源需弃置一张基本牌，否则本次伤害-1；",
            "<br>②暗场：一名角色使用防具牌时，其需弃置一张装备牌，否则弃置此牌；所有角色的攻击范围+2；",
            "<br>③独语：使用【桃】时失去1点体力，使用【酒】时恢复1点体力；",
            "<br>④乱叙：当【南蛮入侵】或【万箭齐发】造成伤害时，改为回复体力；当【桃园结义】回复体力时，改为造成伤害。"]
        for (let i = 0; i < 4; i++) {
            if (i == num) {
                str += '<span class="bluetext">' + infos[i] + "</span>"
            } else {
                str += infos[i]
            }
        }
        return str
    },
    gbjianqiu(player) {
        if (!player.storage.gbjianqiu) return `转换技，每轮每名角色限一次，当你参与的拼点结束后，你可以展示一名其他角色的一张牌，<span class="bluetext">阳：你获得此牌，然后本轮你不能对其使用〖歧路〗；</span>阴：交给其一张牌，然后你可以获得此牌。`
        return `转换技，每轮每名角色限一次，当你参与的拼点结束后，你可以展示一名其他角色的一张牌，阳：你获得此牌，然后本轮你不能对其使用〖歧路〗；<span class="bluetext">阴：交给其一张牌，然后你可以获得此牌。</span>`
    },
    gbmoshe(player) {
        if (!player.storage.gbmoshe) return `转换技，一名角色的结束阶段，若你有『魔』，你可以将任意张『魔』置入弃牌堆，<span class="bluetext">阳：若此法置入弃牌堆的牌点数之和为14，你对一名其他角色造成1点雷属性伤害，然后你摸一张牌；</span>阴：若此法置入弃牌堆的牌花色均不相同且数量为四，你对一名其他角色造成2点伤害；</br>每轮结束时，若本轮你发动过〖魔射〗且未以此法杀死其他角色，你失去X点体力（X为本轮你发动〖魔射〗的次数-1）。`
        return `转换技，一名角色的结束阶段，若你有『魔』，你可以将任意张『魔』置入弃牌堆，阳：若此法置入弃牌堆的牌点数之和为14，你对一名其他角色造成1点雷属性伤害，然后你摸一张牌；<span class="bluetext">阴：若此法置入弃牌堆的牌花色均不相同且数量为四，你对一名其他角色造成2点伤害；</span></br>每轮结束时，若本轮你发动过〖魔射〗且未以此法杀死其他角色，你失去X点体力（X为本轮你发动〖魔射〗的次数-1）。`
    },
    gbcigu(player) {
        if (!player.storage.gbcigu) return `转换技，一名角色的判定阶段开始时，你可以展示任意张「志」，<span class="bluetext">阳：观看牌堆顶的X张牌，并获得其中任意张牌，然后将等量张手牌依次置入牌堆顶；</span>阴：展示牌堆顶X张牌，并令一名角色获得其中与你展示牌点数相同的牌，然后将剩余的牌以任意顺序置入牌堆顶或牌堆底<span class="bluetext">（X为你的体力上限）</span>。`
        return `转换技，一名角色的判定阶段开始时，你可以展示任意张「志」，阳：观看牌堆顶的X张牌，并获得其中任意张牌，然后将等量张手牌依次置入牌堆顶；<span class="bluetext">阴：展示牌堆顶X张牌，并令一名角色获得其中与你展示牌点数相同的牌，然后将剩余的牌以任意顺序置入牌堆顶或牌堆底（X为你的体力上限）</span>。`
    },
    gbwuyin(player) {
        let str = "限定技，出牌阶段限一次，你可以选择一项直到回合结束（每回合每项限一次）："
        let choiceList = [
            "①当你使用牌时，若你于本回合的出牌阶段内使用的所有牌的点数均为严格递增，你摸一张牌；",
            "②当你使用牌时，若此牌点数小于你使用的上一张牌，你可以重铸一名角色的一张牌；",
            "③当你使用【杀】或普通锦囊牌时，你可以令一名其他角色成为此牌的目标；",
            "④当你对其他角色造成伤害时，你可以防止此伤害并获得其一张牌（每回合每名角色限一次）；",
            "⑤弃置X张牌并摸3张牌（X为你本回合〖添彩〗发动的次数）。"
        ]
        for (let i = 1; i <= 5; i++) {
            let option = "选项" + get.cnNumber(i, true);
            if (player.getStorage("gbwuyin_used").includes(option)) {
                str += '<br><span class="bluetext">' + choiceList[i - 1] + '</span>'
            } else {
                str += "<br>" + choiceList[i - 1]
            }
        }
        return str
    },
    gbmeiying(player) {
        let str = "限定技，出牌阶段，你可以废除你的任意个装备栏，然后执行对应的选项："
        let list = [
            "①武器栏：你使用的下一张【杀】可以额外指定任意个目标；", "②防具栏：当你使用【杀】指定目标时，你可以取消此目标并弃置其各个区域一张牌，直到本回合结束；", "③防御马栏：摸三张牌；", "④进攻马栏：本回合你使用的实体【杀】无法被响应；", "⑤宝物栏：你可以将锦囊牌视为无次数与距离限制的【杀】使用或打出，直到本回合结束。"
        ]
        for (let i = 1; i <= 5; i++) {
            if (player.hasSkill("gbmeiying_" + i)) str += '<span class="bluetext">' + list[i - 1] + '</span>'
            else str += list[i - 1]
        }
        return str
    }
};

export default dynamicTranslates;
