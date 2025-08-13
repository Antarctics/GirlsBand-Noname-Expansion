import { lib, game, ui, get, ai, _status } from "../../noname.js";
import characters from "./character.js"; import { characterSubstitutes, characterTitles, characterIntros, characterReplaces, characterSort } from "./character.js";
import { createProgress } from "../../noname/library/update.js";
import skills1 from "./skill1.js";
import skills2 from "./skill2.js";
import translates from "./translate.js";
import { pinyins, keywordInfo } from "./translate.js";
import dynamicTranslates from "./dynamicTranslate.js";
import "./mode.js";
/** @type { importExtensionConfig } */
game.import("extension", function (lib, game, ui, get, ai, _status) {
    return {
        name: "GirlsBand",
        content: function (config, pack) {
            /*
            * 特殊名词弹窗
            * 使用方法：
            * 技能描述中使用中文双引号引用特殊名词
            * 于translate.js下keyworInfo函数中填写对应的key与value即可
            * 
            * 此方法由GirlSBand扩展实现，拷贝请标注来源！
            * 
            */
            if (!lib.keywordInfo) lib.keywordInfo = { ...keywordInfo }
            var oldInfo = get.skillInfoTranslation;
            get.skillInfoTranslation = (name, player) => {
                let str = oldInfo.call(get, name, player)
                str = str.replace(/“(.*?)”/g, (match, keyword) => {
                    if (lib.keywordInfo && lib.keywordInfo[keyword]) {
                        return `<span class="keyword-tooltip" style="text-decoration:underline;color:#ffeea9ff" data-keyword="${keyword}">${keyword}※</span>`;
                    }
                    return match;
                });
                return str;
            };
            document.addEventListener(lib.config.touchscreen ? "touchstart" : "mouseover", function (e) {
                if (e.target.classList && e.target.classList.contains('keyword-tooltip')) {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'keyword-tooltip';
                    tooltip.innerHTML = lib.keywordInfo[e.target.getAttribute('data-keyword')];
                    tooltip.style.position = 'fixed';
                    tooltip.style.zIndex = 9999;
                    tooltip.style.background = 'rgba(71, 52, 0, 0.95)';
                    tooltip.style.color = '#ffeea9ff';
                    tooltip.style.padding = '10px 16px';
                    tooltip.style.borderRadius = '8px';
                    tooltip.style.pointerEvents = 'none';
                    tooltip.style.border = `2px solid #e3ab67ff`;
                    tooltip.style.boxShadow = `0 4px 16px rgba(0,0,0,0.18)`;
                    tooltip.style.lineHeight = `1.6`
                    tooltip.style.fontSize = '16px';
                    tooltip.style.maxWidth = '320px';
                    tooltip.style.wordBreak = 'break-word';
                    tooltip.style.left = e.target.getBoundingClientRect().left / game.documentZoom + 'px'
                    tooltip.style.top = e.target.getBoundingClientRect().top / game.documentZoom + 16 + 'px'
                    document.body.appendChild(tooltip);
                    e.target._tooltip = tooltip;
                }
            });
            document.addEventListener(lib.config.touchscreen ? "touchend" : "mouseout", function (e) {
                if (e.target.classList && e.target.classList.contains('keyword-tooltip')) {
                    document.body.removeChild(e.target._tooltip);
                    delete e.target._tooltip
                }
            });
        },
        precontent: function () {
            // 检查版本
            let version = "1.10.17.2"
            const cur = lib.version.split('.').map(Number);
            const req = version.split('.').map(Number);
            for (let i = 0; i < Math.max(cur.length, req.length); i++) {
                const c = cur[i] || 0;
                const r = req[i] || 0;
                if (c < r) return alert(`当前无名杀版本为：${lib.version}\n\n可能导致本扩展出现BUG！\n\n《少女乐队》扩展所支持的最低版本为: ${version}\n\n请更新无名杀资源包至新版！`)
            }
            if (!lib.config["show_tip"] && !localStorage.getItem('gb_tipInt')) {
                game.saveConfig("show_tip", confirm("检测到未启用Tip标记！\n\n《少女乐队》扩展部分角色使用Tip标记作为提示\n\n是否启用Tip标记以获得完整体验？\n\n本询问仅显示一次！\n\n后续可前往 选项->显示->显示tip标记 处修改"))
                localStorage.setItem('gb_tipInt', true)
            }
            if (lib.config.extension_GirlsBand_gb_check_update && window.navigator.onLine) checkForUpdate()
            // 新增势力
            game.addGroup("gbmygo", "迷", "迷途之子", {
                color: "#3388BB",
                image: "ext:GirlsBand/image/mygo.png"
            })
            game.addGroup("gbmujica", "偶", "颂乐人偶", {
                color: "#8b0000",
                image: "ext:GirlsBand/image/mujica.png"
            })
            game.addGroup("gbmonica", "蝶", "Morfonica", {
                color: "#008bff",
                image: "ext:GirlsBand/image/monica.jpg"
            })
            game.addGroup("gbroselia", "露", "Roselia", {
                color: "#3344AA",
                image: "ext:GirlsBand/image/roselia.jpg"
            })
            game.addGroup("gbafterglow", "阳", "Afterglow", {
                color: "#EE3344",
                image: "ext:GirlsBand/image/afterglow.jpg"
            })
            game.addGroup("gbpastel", "彩", "Pastel*Palettes", {
                color: "#33DDAA",
                image: "ext:GirlsBand/image/pastel.jpg"
            })
            game.addGroup("gbras", "幕", "RAISE A SUILEN", {
                color: "#33cccc",
                image: "ext:GirlsBand/image/ras.jpg"
            })
            game.addGroup("gbband", "束", "結束バンド", {
                color: "#ff2291",
                image: "ext:GirlsBand/image/band.png"
            })
            game.addGroup("gbTOGETOGE", "刺", "无刺有刺", {
                color: "#D90E2C",
                image: "ext:GirlsBand/image/TOGETOGE.png"
            })
            game.addGroup("gbkon", "轻", "轻音少女", {
                color: "#e71419",
                image: "ext:GirlsBand/image/kon.jpg"
            })
            // 背景音乐
            let list = ["影色舞", "春日影", "KiLLKiSS", "ギターと孤独と蒼い惑星", "空之箱", "GO!GO!MANIAC", "fire bird", "Daylight -デイライト- (Instrumental)", "Hey-day狂騒曲(カプリチオ)", "劣等上等"]
            for (let name of list) {
                if (!lib.config.customBackgroundMusic) lib.config.customBackgroundMusic = {};
                lib.config.customBackgroundMusic[`ext:GirlsBand/audio/${name}.mp3`] = name
            }
            game.saveConfig("customBackgroundMusic", lib.config.customBackgroundMusic)
            // 播放音乐
            lib.skill._gbmusic = {
                trigger: {
                    global: ["gameStart"],
                },
                direct: true,
                superCharlotte: true,
                filter(event, player) {
                    return game.hasPlayer(p => p.name in lib.characterPack['GirlsBand']) && lib.config.extension_GirlsBand_gb_bgm
                },
                content() {
                    let list = ["影色舞", "春日影", "KiLLKiSS", "ギターと孤独と蒼い惑星", "空之箱", "GO!GO!MANIAC", "fire bird", "Daylight -デイライト- (Instrumental)", "Hey-day狂騒曲(カプリチオ)", "劣等上等"]
                    if (!_status.tempMusic) _status.tempMusic = []
                    for (let i of list) {
                        _status.tempMusic.add(`ext:GirlsBand/audio/${i}.mp3`)
                    }
                    game.playBackgroundMusic()
                }
            }
            // 修理本体“废除装备栏时不会弃置虚拟装备牌”的bug
            lib.skill._gbBugFix1 = {
                trigger: {
                    player: "disableEquipAfter"
                },
                direct: true,
                superCharlotte: true,
                async content(event, trigger, player) {
                    for (let slot of trigger.slots) {
                        player.discard(player.getEquip(slot))
                    }
                }
            }
            // 导入角色
            game.import('character', function () {
                var GB = {
                    name: 'GirlsBand',
                    connect: true,
                    character: {
                        ...characters
                    },
                    characterIntro: {
                        ...characterIntros
                    },
                    characterSubstitute: {
                        ...characterSubstitutes
                    },
                    characterTitle: {
                        ...characterTitles
                    },
                    characterSort: {
                        GirlsBand: {
                            ...characterSort
                        }
                    },
                    characterReplace: {
                        ...characterReplaces
                    },
                    dynamicTranslate: {
                        ...dynamicTranslates
                    },
                    skill: {
                        ...skills1,
                        ...skills2,
                    },
                    translate: {
                        ...translates,
                    },
                    pinyins: {
                        ...pinyins
                    },
                };
                return GB;
            });
        },
        help: {},
        config: {
            "gb_bgm": {
                name: `<font color="#E661A0">场内BGM`,
                init: true,
                intro: "场上存在本扩展角色时是否播放BGM<br>下局游戏生效",
            },
            "gb_update_web": {
                name: `<font color="#f9b2d3ff">更新镜像`,
                init: "0",
                item: {
                    0: "Github官方",
                    1: "gh-proxy全球镜像",
                    2: "gh-proxy国内镜像",
                    3: "tvv.tw镜像",
                }
            },
            "gb_check_update": {
                name: `<font color="#ff2676ff">自动检测更新`,
                init: false,
                intro: "每次启动游戏后自动检测扩展更新",
            },
            "gb_update": {
                name: `<font color="#34faabff"><span style="text-decoration: underline;">检查更新<span>`,
                clear: true,
                onclick() {
                    checkForUpdate();
                }
            }
        },
        package: {
            intro: `
            <div style="color:#ffa348">• 有问题可加群：</div><br>
            <div style="color:#ffa348">&nbsp;&nbsp;Q:1001742343</div><br>
            <div style="color:#ffa348">• 角色设计：文茄</div><br>
            <div style="color:#ffa348">• 版本号：v2.0.3</div><br>
            `,
            author: "Rin",
            diskURL: "",
            forumURL: "",
            version: "2.0.3",
        },
        files: {},
        connect: true
    }
})
const checkForUpdate = async () => {
    try {
        var list = {
            0: "",
            1: "https://gh-proxy.com/",
            2: "https://hk.gh-proxy.com/",
            3: "https://tvv.tw/"
        }
        let proxy = list[lib.config.extension_GirlsBand_gb_update_web]
        const response = await fetch(`${proxy}https://raw.githubusercontent.com/Antarctics/GirlsBand-Noname-Expansion/refs/heads/main/info.json`);
        if (!response.ok) throw new Error('获取更新失败');

        const latestRelease = await response.json();
        const latestVersion = latestRelease.version;
        const currentVersion = lib.extensionPack.GirlsBand.version || 'v0.0.0';
        if (currentVersion != latestVersion) {
            if (confirm(`发现新版本 ${latestVersion}，是否更新？\n更新说明:\n${latestRelease.update || '无更新说明'}`)) {
                let bool = game.getExtensionConfig('应用配置', 'watchExt')
                game.importedPack = true
                await downloadAndUpdate(`${proxy}https://github.com/Antarctics/GirlsBand-Noname-Expansion/archive/refs/heads/main.zip`);
                delete game.importedPack
                game.reload()
            }
        }
    } catch (error) {
        alert('检查更新失败: ' + error.message);
    }
}
const downloadAndUpdate = async (zipUrl) => {
    const progress = createProgress("正在更新 GirlsBand 扩展", 1, "GirlsBand-Noname-Expansion.zip");
    try {
        const response = await fetch(zipUrl);
        if (!response.ok) {
            throw new Error(`下载失败: HTTP ${response.status}`);
        }
        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length') || 200 * 1024 * 1024
        let receivedBytes = 0;
        let chunks = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            receivedBytes += value.length;
            const receivedMB = (receivedBytes / (1024 * 1024)).toFixed(1);
            const totalMB = (contentLength / (1024 * 1024)).toFixed(1);
            progress.setProgressValue(parseFloat(receivedMB));
            progress.setProgressMax(parseFloat(totalMB));
            progress.setFileName(`下载中: ${receivedMB}MB / ${totalMB}MB`);
        }
        const blob = new Blob(chunks);
        const zip = await get.promises.zip();
        zip.load(await blob.arrayBuffer());
        const unzipProgress = createProgress("正在解压更新", Object.keys(zip.files).length);
        let i = 0;

        for (const [path, file] of Object.entries(zip.files)) {
            if (file.dir) continue;
            i++;
            unzipProgress.setProgressValue(i);
            unzipProgress.setFileName(path);
            const relativePath = path.replace(/^[^\/]+\//, "");
            const fullPath = `extension/GirlsBand/${relativePath}`;
            const [dirPath, fileName] = [fullPath.split("/").slice(0, -1).join("/"), fullPath.split("/").pop()];
            await game.promises.createDir(dirPath);
            await game.promises.writeFile(file.asArrayBuffer(), dirPath, fileName)
                .catch(err => console.warn(`文件写入失败: ${fullPath}`, err));
        }
        unzipProgress.remove();
        progress.remove();
        alert("更新完成！");
    } catch (error) {
        progress.remove();
        console.error("更新失败:", error);
        alert(`更新失败: ${error.message}`);
    }
};