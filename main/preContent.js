import { lib, game, ui, get, ai, _status } from "../../../noname.js";
export default function () {
    const minVer = "1.11.0";
    const currVer = lib.version.split('.').map(Number);
    const reqVer = minVer.split('.').map(Number);

    for (let i = 0; i < Math.max(currVer.length, reqVer.length); i++) {
        let curr = currVer[i] || 0
        let req = reqVer[i] || 0
        if (curr < req) {
            return alert(`当前版本：${lib.version}\n《少女乐队》需要版本：${minVer}\n请更新无名杀！`);
        } else if (curr > req) {
            break
        }
    }

    // Tip标记提示
    if (!lib.config.show_tip && !localStorage.getItem('gb_tipHint')) {
        game.saveConfig("show_tip", confirm("检测到未启用Tip标记！\n\n《少女乐队》扩展需要Tip标记功能\n\n是否启用？\n\n本询问仅显示一次！"));
        localStorage.setItem('gb_tipHint', true);
    }

    // 新增势力
    const groups = [
        { id: "gbmygo", name: "迷", color: "#3388BB", image: "ext:GirlsBand/image/mygo.png" },
        { id: "gbmujica", name: "偶", color: "#8b0000", image: "ext:GirlsBand/image/mujica.png" },
        { id: "gbmonica", name: "蝶", color: "#008bff", image: "ext:GirlsBand/image/monica.png" },
        { id: "gbroselia", name: "露", color: "#3344AA", image: "ext:GirlsBand/image/roselia.png" },
        { id: "gbafterglow", name: "阳", color: "#EE3344", image: "ext:GirlsBand/image/afterglow.png" },
        { id: "gbpastel", name: "彩", color: "#33DDAA", image: "ext:GirlsBand/image/pastel.png" },
        { id: "gbras", name: "幕", color: "#33cccc", image: "ext:GirlsBand/image/ras.png" },
        { id: "gbband", name: "束", color: "#ff2291", image: "ext:GirlsBand/image/band.png" },
        { id: "gbTOGETOGE", name: "刺", color: "#D90E2C" },
        { id: "gbkon", name: "轻", color: "#e71419" },
        { id: "gbhhw", name: "笑", color: "#FFDD00", image: "ext:GirlsBand/image/hhw.png" }
    ];

    groups.forEach(group => {
        game.addGroup(group.id, group.name, group.fullname, {
            color: group.color,
            image: group.image
        });
    });
    if (lib.config.extension_GirlsBand_add_bgm) {
        const bgmList = ["影色舞", "春日影", "KiLLKiSS", "ギターと孤独と蒼い惑星", "空之箱", "GO!GO!MANIAC", "fire bird", "Daylight -デイライト- (Instrumental)", "Hey-day狂騒曲(カプリチオ)", "劣等上等"];

        if (!lib.config.customBackgroundMusic) lib.config.customBackgroundMusic = {};
        bgmList.forEach(name => {
            lib.config.customBackgroundMusic[`ext:GirlsBand/audio/${name}.mp3`] = name;
        });
        game.saveConfig("customBackgroundMusic", lib.config.customBackgroundMusic);

    }
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