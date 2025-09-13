import { lib, game, ui, get, ai, _status } from "../../../noname.js";
export default function () {
    const minVer = "1.10.17.2";
    const currVer = lib.version.split('.').map(Number);
    const reqVer = minVer.split('.').map(Number);

    for (let i = 0; i < Math.max(currVer.length, reqVer.length); i++) {
        if ((currVer[i] || 0) < (reqVer[i] || 0)) {
            return alert(`当前版本：${lib.version}\n《少女乐队》需要版本：${minVer}\n请更新无名杀！`);
        }
    }

    // Tip标记提示
    if (!lib.config.show_tip && !localStorage.getItem('gb_tipHint')) {
        game.saveConfig("show_tip", confirm("检测到未启用Tip标记！\n\n《少女乐队》扩展需要Tip标记功能\n\n是否启用？\n\n本询问仅显示一次！"));
        localStorage.setItem('gb_tipHint', true);
    }

    // 新增势力
    const groups = [
        { id: "gbmygo", name: "迷", fullname: "迷途之子", color: "#3388BB", image: "ext:GirlsBand/image/mygo.png" },
        { id: "gbmujica", name: "偶", fullname: "颂乐人偶", color: "#8b0000", image: "ext:GirlsBand/image/mujica.png" },
        { id: "gbmonica", name: "蝶", fullname: "Morfonica", color: "#008bff", image: "ext:GirlsBand/image/monica.jpg" },
        { id: "gbroselia", name: "露", fullname: "Roselia", color: "#3344AA", image: "ext:GirlsBand/image/roselia.jpg" },
        { id: "gbafterglow", name: "阳", fullname: "Afterglow", color: "#EE3344", image: "ext:GirlsBand/image/afterglow.jpg" },
        { id: "gbpastel", name: "彩", fullname: "Pastel*Palettes", color: "#33DDAA", image: "ext:GirlsBand/image/pastel.jpg" },
        { id: "gbras", name: "幕", fullname: "RAISE A SUILEN", color: "#33cccc", image: "ext:GirlsBand/image/ras.jpg" },
        { id: "gbband", name: "束", fullname: "結束バンド", color: "#ff2291", image: "ext:GirlsBand/image/band.png" },
        { id: "gbTOGETOGE", name: "刺", fullname: "无刺有刺", color: "#D90E2C", image: "ext:GirlsBand/image/TOGETOGE.png" },
        { id: "gbkon", name: "轻", fullname: "轻音少女", color: "#e71419", image: "ext:GirlsBand/image/kon.jpg" }
    ];

    groups.forEach(group => {
        game.addGroup(group.id, group.name, group.fullname, {
            color: group.color,
            image: group.image
        });
    });

    // 提示框功能
    ui.click.poptip = function (elem, text) {
        const tip = document.createElement('div');
        const rect = elem.getBoundingClientRect();
        let left = rect.left;
        let top = rect.top;
        let height = rect.height;
        let width = rect.width;
        tip.className = 'keyword-poptip';
        tip.innerHTML = text;
        tip.style.cssText = `
            z-index: 9999;
            background: rgba(71, 52, 0, 0.8);
            color: #ffeea9;
            padding: 10px;
            border-radius: 8px;
            border: 2px solid #e3ab67;
            box-shadow: 0 4px 16px rgba(0,0,0,0.18);
            line-height: 1.6;
            font-size: 16px;
            max-width: 360px;
            word-break: break-word;
            position: fixed;
        `;

        document.body.appendChild(tip);
        const tipRect = tip.getBoundingClientRect();

        if (left + tipRect.width > window.innerWidth) {
            left = Math.max(10, window.innerWidth - tipRect.width - width);
        }
        if (top + height + tipRect.height > window.innerHeight) {
            top = top - tipRect.height > 0 ? top - tipRect.height : Math.max(10, window.innerHeight - tipRect.height - height);
        } else {
            top = top + height + 5;
        }

        tip.style.left = left / game.documentZoom + 'px';
        tip.style.top = top / game.documentZoom + 'px';

        const removeTip = () => {
            if (tip.parentNode) document.body.removeChild(tip);
            elem.removeEventListener('mouseout', removeTip);
            elem.removeEventListener('touchend', removeTip);
        };

        elem.addEventListener('mouseout', removeTip);
        elem.addEventListener('touchend', removeTip);
        return tip;
    };

    // 背景音乐
    const bgmList = ["影色舞", "春日影", "KiLLKiSS", "ギターと孤独と蒼い惑星", "空之箱", "GO!GO!MANIAC", "fire bird", "Daylight -デイライト- (Instrumental)", "Hey-day狂騒曲(カプリチオ)", "劣等上等"];

    if (!lib.config.customBackgroundMusic) lib.config.customBackgroundMusic = {};
    bgmList.forEach(name => {
        lib.config.customBackgroundMusic[`ext:GirlsBand/audio/${name}.mp3`] = name;
    });
    game.saveConfig("customBackgroundMusic", lib.config.customBackgroundMusic);

    // 自动播放音乐
    lib.skill._gbmusic = {
        trigger: { global: ["gameStart"] },
        direct: true,
        filter(event, player) {
            return game.hasPlayer(p => p.name in lib.characterPack['GirlsBand']) && lib.config.extension_GirlsBand_bgm;
        },
        content() {
            const bgmList = ["影色舞", "春日影", "KiLLKiSS", "ギターと孤独と蒼い惑星", "空之箱", "GO!GO!MANIAC", "fire bird", "Daylight -デイライト- (Instrumental)", "Hey-day狂騒曲(カプリチオ)", "劣等上等"];
            if (!_status.tempMusic) _status.tempMusic = [];
            bgmList.forEach(name => {
                _status.tempMusic.add(`ext:GirlsBand/audio/${name}.mp3`);
            });
            game.playBackgroundMusic();
        }
    };

    // 修复装备栏bug
    lib.skill._gbBugFix = {
        trigger: { player: "disableEquipAfter" },
        direct: true,
        async content(event, trigger, player) {
            trigger.slots.forEach(slot => {
                player.discard(player.getEquip(slot));
            });
        }
    };

    const oldModetrans = get.modetrans
    get.modetrans = new Proxy(oldModetrans, {
        apply: function (target, thisArg, argumentsList) {
            const [config, server] = argumentsList;
            if (config && config.mode === "band") {
                const bandModes = {
                    normal: "标准乐队",
                    impart: "合奏乐队",
                    girls: "少女乐队",
                    soyo: "素世の野望乐队",
                    mortis: "全都不会乐队"
                };
                return bandModes[config.band_mode] || "未知乐队模式";
            }
            return target.apply(thisArg, argumentsList);
        }
    });
};