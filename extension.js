import { lib, game, ui, get, ai, _status } from "../../noname.js";
import mainContent from "./main/mainContent.js";
import preContent from "./main/preContent.js"
import "./main/mode.js";
import update from "./main/update.js"
import info from "./main/package.js"
/** @type { importExtensionConfig } */
export const type = "extension";
export default function () {
    return {
        name: "GirlsBand",
        connect: true,
        editable: false,
        precontent: preContent,
        content: mainContent,
        package: info("2.1.7"),
        config: {
            bgm: {
                name: `<font color="#e91e63">场内BGM <small>(下局生效)</small>`,
                init: true,
                intro: "存在女乐角色时自动播放BGM",
            },
            poptip: {
                name: `<font color="#46e226ff">名词注释 <small>(重启生效)</small>`,
                init: true,
                intro: "自动为特有名词、卡牌、技能添加注释",
            },
            update_source: {
                name: `<font color="#9c27b0">更新镜像源`,
                init: "0",
                item: {
                    0: "扩展官方源",
                    1: "GitHub官方源",
                    2: "gh-proxy全球镜像",
                    3: "gh-proxy国内镜像",
                    4: "tvv.tw镜像源",
                }
            },
            auto_update: {
                name: `<font color="#ff9800">自动检测更新`,
                init: true,
                intro: "启动游戏时自动检查更新",
            },
            check_update: {
                name: `<span style="color:#4caf50;text-decoration: underline">检查更新`,
                clear: true,
                onclick: async function () {
                    this.innerHTML = `<span style="color:#f61515ff;text-decoration: underline">正在检测更新...`;
                    try {
                        await update(true);
                        this.innerHTML = `<span style="color:#4caf50;text-decoration: underline">更新完成`;
                    } catch {
                        this.innerHTML = `<span style="color:#f44336;text-decoration: underline">更新失败`;
                    }
                    setTimeout(() => {
                        this.innerHTML = `<span style="color:#4caf50;text-decoration: underline">检查更新`;
                    }, 2000);
                }
            }
        },
        help: {
            乐队模式:
                `
            <h3>基础身份牌：</h3>
            <ul>
                <li>主唱</li>
                <li>鼓手</li>
                <li>吉他</li>
                <li>贝斯</li>
                <li>遗老贝斯</li>
            </ul>
            <h3>扩充身份牌：</h3>
            <ul>
                <li>键盘</li>
                <li>主音吉他</li>
                <li>节奏吉他</li>
            </ul>
            <h3>标准配置：</h3>
            <ul>
                <li>五人标准乐队场：
                    <ul>
                        <li>主唱 ×1</li>
                        <li>贝斯 ×1</li>
                        <li>吉他 ×2</li>
                        <li>遗老贝斯 ×1</li>
                    </ul>
                </li>
                <li>八人合奏乐队场：
                    <ul>
                        <li>主唱 ×1</li>
                        <li>鼓手 ×1</li>
                        <li>贝斯 ×1</li>
                        <li>吉他 ×4</li>
                        <li>遗老贝斯 ×1</li>
                    </ul>
                </li>
                <li>少女乐队场（八人）：
                    <ul>
                        <li>主唱 ×1</li>
                        <li>主音吉他 ×1</li>
                        <li>键盘 ×1</li>
                        <li>节奏吉他 ×3</li>
                        <li>贝斯 ×1</li>
                        <li>遗老贝斯 ×1</li>
                    </ul>
                </li>
                <li>素世の野望场（八人）：
                    <ul>
                        <li>主唱 ×1</li>
                        <li>键盘 ×6</li>
                        <li>遗老贝斯 ×1</li>
                    </ul>
                </li>
                <li>全部不会弹场（八人）：
                    <ul>
                        <li>主唱 ×1</li>
                        <li>键盘 ×1</li>
                        <li>鼓手 ×2</li>
                        <li>贝斯 ×3</li>
                        <li>遗老贝斯 ×1</li>
                    </ul>
                </li>
            </ul>
            <h3>身份规则：</h3>
            <h4>【主唱】</h4>
            <ul>
                <li>你的胜利目标为击杀除鼓手以外所有的未展示身份牌的其他角色。</li>
                <li>增加1点体力上限，并获得主公技。</li>
                <li>游戏开始时，你可以明置至多两名其他角色的身份牌。</li>
                <li>击杀你的角色摸一张牌，然后恢复一点体力并增加1点体力上限。</li>
            </ul>
            <h4>【鼓手】</h4>
            <ul>
                <li>你的胜利目标始终与主唱相同。</li>
                <li>当你的身份牌被展示时，若你存活，你摸一张牌。</li>
                <li>击杀你的角色不进行任何奖惩。</li>
            </ul>
            <h4>【吉他】</h4>
            <ul>
                <li>当你的身份牌被展示时，出牌阶段开始时，你可以重铸自己的一张手牌。</li>
                <li>击杀你的角色摸三张牌。</li>
            </ul>
            <h4>【贝斯】</h4>
            <ul>
                <li>当你的身份牌被展示时，你暗置你的身份牌。</li>
                <li>当你的身份牌被展示时，若你存活，你摸一张牌。</li>
                <li>击杀你的角色摸三张牌。</li>
            </ul>
            <h4>【键盘】</h4>
            <ul>
                <li>当你的身份牌被展示时，若你存活，你令主唱与你各摸一张牌。</li>
                <li>击杀你的角色摸三张牌。</li>
            </ul>
            <h4>【主音吉他】</h4>
            <ul>
                <li>当你的身份牌被展示时，若你存活，你可以弃置两张手牌并与主唱进行一次议事。</li>
                <li>若议事结果为红色：你与主唱交换身份牌并获得自己武将牌上的主公技（不会因此改变坐次）。</li>
                <li>你的第一轮回合结束时，你可以明置一名其他角色的身份牌。</li>
                <li>击杀你的角色摸三张牌。</li>
            </ul>
            <h4>【节奏吉他】</h4>
            <ul>
                <li>当你的身份牌被展示时，若你存活，你的回合结束可以令一名其他角色摸一张牌。</li>
                <li>击杀你的角色摸三张牌。</li>
            </ul>
            <h4>【遗老贝斯】</h4>
            <ul>
                <li>锁定技：若场上存活角色中只有一名角色的身份牌明置，你的回合开始时你主动展示自己的身份牌，然后你的胜利目标与主唱相同。</li>
                <li>击杀你的角色摸三张牌。</li>
            </ul>
            `
        },
        files: {},
    }
}