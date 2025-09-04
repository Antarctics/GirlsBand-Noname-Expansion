import { lib, game, ui, get, ai, _status } from "../../noname.js";
import characters from "./character.js"; import { characterSubstitutes, characterTitles, characterIntros, characterReplaces, characterSort } from "./character.js";
import { createProgress } from "../../noname/library/update.js";
import skills1 from "./skill1.js";
import skills2 from "./skill2.js";
import translates from "./translate.js";
import { pinyins } from "./translate.js";
import dynamicTranslates from "./dynamicTranslate.js";
import "./mode.js";
/** @type { importExtensionConfig } */
export const type = "extension";
export default function () {
    return {
        name: "GirlsBand",
        content: function (config, pack) {
            /*
            * 特殊名词注释弹窗
            * 使用方法：
            * 于描述中使用 “ ”、【】、〖〗引用特殊名词，即可自动查询对应描述
            * 可用于引用卡牌、技能、特殊名词
            * 描述添加方法：
            * 确保lib.translate中包含对应的key与value即可
            * 如：lib.translate["合奏"]: "所有参与合奏的角色需选择任意一项：<br>①展示任意张手牌；<br>②展示牌堆顶的一张牌。<br>以此法展示的牌视为“合奏”牌"
            * 支持中英文，尽量100%对应，若使用中文且存在多个对应描述，则同时展示所有符合描述。
            * 
            * 此方法由GirlSBand扩展实现，拷贝请标注来源！
            * 
            */
            if (lib.config.extension_GirlsBand_gb_poptip) get.skillInfoTranslation = (name, player) => {
                let str = (() => {
                    if (player && lib.dynamicTranslate[name]) {
                        return lib.dynamicTranslate[name](player, name);
                    }
                    const str = lib.translate[name + "_info"];
                    if (!str) {
                        return "";
                    }
                    return str;
                })();

                if (typeof str !== "string") {
                    console.warn(`孩子，你${name}的翻译传的是什么？！`);
                    return "";
                }

                if (!window.name2KeywordMap || window.name2KeywordMap._lastUpdateLength !== Object.keys(lib.translate).length) {
                    window.name2KeywordMap = new Map();
                    window.name2KeywordMap._lastUpdateLength = Object.keys(lib.translate).length;
                    const tempMap = new Map();
                    for (const key in lib.translate) {
                        if (!key.endsWith('_info')) {
                            const nameValue = lib.translate[key]
                            if (!nameValue) continue
                            if (!tempMap.has(nameValue)) {
                                tempMap.set(nameValue, []);
                            }
                            tempMap.get(nameValue).push(key);
                        }
                    }
                    for (const [name, keywords] of tempMap.entries()) {
                        if (!name) continue;
                        if (keywords.length === 1) {
                            window.name2KeywordMap.set(name, keywords[0]);
                        } else {
                            const namePinyin = get.pinyin(name, false).join('');

                            let bestMatch = null;
                            let bestScore = -1;

                            for (const keyword of keywords) {
                                const keywordParts = keyword.split('_');
                                let maxPartScore = 0;
                                for (const part of keywordParts) {
                                    let matchLength = 0;
                                    for (let i = 0; i < Math.min(part.length, namePinyin.length); i++) {
                                        if (part[i] === namePinyin[i]) {
                                            matchLength++;
                                        } else {
                                            break;
                                        }
                                    }

                                    const score = matchLength / namePinyin.length;
                                    if (score > maxPartScore) {
                                        maxPartScore = score;
                                    }
                                }
                                if (maxPartScore > bestScore) {
                                    bestScore = maxPartScore;
                                    bestMatch = keyword;
                                }
                            }
                            window.name2KeywordMap.set(name, bestMatch);
                        }
                    }
                }

                let firstKeywords = new Set();
                return str.replace(/“(.*?)”|【(.*?)】|〖(.*?)〗/g, (match, quoted, card, skill) => {
                    let keyword, type;
                    if (quoted !== undefined) {
                        keyword = quoted;
                        type = 'quoted';
                    } else if (card !== undefined) {
                        keyword = card;
                        type = 'card';
                    } else if (skill !== undefined) {
                        keyword = skill;
                        type = 'skill';
                    } else {
                        return match;
                    }
                    let name = lib.translate[keyword];
                    let info = lib.translate[keyword + "_info"];

                    if (!name) {
                        if (window.name2KeywordMap.get(keyword)) {
                            name = keyword;
                            keyword = window.name2KeywordMap.get(keyword);
                            info = lib.translate[keyword + "_info"] || lib.translate[keyword]
                        } else {
                            return match
                        }
                    }

                    if (!info) {
                        name = keyword;
                        info = lib.translate[keyword];
                    }
                    if (info === name) return "“" + name + "”";
                    if (type === 'card' && (lib.cardPack.extra.includes(keyword) || lib.cardPack.standard.includes(keyword))) return match
                    let symbol, prefix;
                    if (type === 'card' || !!lib.card[keyword]) {
                        symbol = '】';
                        prefix = '【';
                    } else if (type === 'skill' || !!lib.skill[keyword]) {
                        symbol = '〗';
                        prefix = '〖';
                    } else {
                        symbol = '';
                        prefix = '';
                    }

                    if (!firstKeywords.has(keyword)) {
                        firstKeywords.add(keyword);
                        info = info.replace(/“(.*?)”|【(.*?)】|〖(.*?)〗/g, (m, q, c, s) => {
                            let kw, tp
                            if (q !== undefined) {
                                kw = q;
                                tp = 'quoted';
                            } else if (c !== undefined) {
                                kw = c;
                                tp = 'card';
                            } else if (s !== undefined) {
                                kw = s;
                                tp = 'skill';
                            } else {
                                return m;
                            }
                            let name = lib.translate[kw]
                            if (!name) {
                                if (window.name2KeywordMap.get(kw)) {
                                    name = kw
                                    kw = window.name2KeywordMap.get(kw);
                                } else {
                                    return m;
                                }
                            }

                            if (!!lib.card[kw]) return "【" + name + "】";
                            else if (!!lib.skill[kw]) return "〖" + name + "〗";
                            else return m
                        });
                        return `<span class="keyword-tooltip" style="text-decoration:underline;color:#FF6B00" data-keyword="${info}">${prefix}${name}${symbol}</span>`;
                    } else {
                        return prefix + name + symbol;
                    }
                });
            }
            document.addEventListener(lib.config.touchscreen ? "touchstart" : "mouseover", function (e) {
                if (e.target.classList && e.target.classList.contains('keyword-tooltip')) {
                    const tooltip = document.createElement('div');
                    let left = e.target.getBoundingClientRect().left,
                        top = e.target.getBoundingClientRect().top
                    tooltip.className = 'keyword-tooltip';
                    tooltip.innerHTML = e.target.getAttribute('data-keyword');
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
                    tooltip.style.left = left / game.documentZoom + 'px';
                    tooltip.style.top = top / game.documentZoom + 'px';
                    tooltip.style.visibility = 'hidden';
                    document.body.appendChild(tooltip);
                    const tooltipRect = tooltip.getBoundingClientRect();
                    if (left + tooltipRect.width > window.innerWidth) {
                        left = Math.max(0, window.innerWidth - tooltipRect.width);
                    }
                    if (top + tooltipRect.height > window.innerHeight) {
                        if (top - tooltipRect.height > 0) {
                            top = top - tooltipRect.height - 16;
                        } else {
                            top = window.innerHeight - tooltipRect.height - 16;
                        }
                    }
                    tooltip.style.left = left / game.documentZoom + 'px';
                    tooltip.style.top = top / game.documentZoom + 16 + 'px';
                    tooltip.style.visibility = 'visible';
                    e.target._tooltip = tooltip;
                }
            });
            document.addEventListener(lib.config.touchscreen ? "touchend" : "mouseout", function (e) {
                if (e.target.classList && e.target.classList.contains('keyword-tooltip')) {
                    document.body.removeChild(e.target._tooltip);
                    delete e.target._tooltip
                }
            });
            if (lib.config.extension_GirlsBand_gb_check_update && window.navigator.onLine) update(false)
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
                name: `<font color="#E661A0">场内BGM<span>（重启生效）`,
                init: true,
                intro: "场上存在本扩展角色时是否播放BGM<br>下局游戏生效",
            },
            "gb_poptip": {
                name: `<font color="#84f5c8ff">名词注释<span>（重启生效）`,
                init: true,
                intro: "对特有名词、卡牌、技能进行自动注释<br>特点：<br>自动匹配注释<br>自动更新词库<br>同一描述中避免多次注释<br>跳过基础卡牌",
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
                name: `<font color="#ff2676ff">自动检测更新<span>`,
                init: true,
                intro: "每次启动游戏后自动检测扩展更新",
            },
            "gb_update": {
                name: `<font color="#34faabff"><span style="text-decoration: underline;">检查更新<span>`,
                clear: true,
                onclick() {
                    update(true);
                }
            },
        },
        package: {
            intro: `
            <div style="color:#ffa348">• 有问题可加群：</div><br>
            <div style="color:#ffa348">&nbsp;&nbsp;Q:1001742343</div><br>
            <div style="color:#ffa348">• 角色设计：文茄</div><br>
            <div style="color:#ffa348">• 版本号：v2.0.8</div><br>
            `,
            author: "Rin",
            diskURL: "",
            forumURL: "",
            version: "2.0.8",
        },
        files: {},
        connect: true
    }
}
const update = async (bool) => {
    try {
        game.importedPack = true;
        const proxyList = {
            0: "",
            1: "https://gh-proxy.com/",
            2: "https://hk.gh-proxy.com/",
            3: "https://tvv.tw/"
        };
        var proxy = proxyList[lib.config.extension_GirlsBand_gb_update_web] || "",
            lastError,
            manifestResponse,
            remoteManifest
        try {
            manifestResponse = await fetch(`${proxy}https://raw.githubusercontent.com/Antarctics/GirlsBand-Noname-Expansion/refs/heads/main/manifest.json`);
            if (!manifestResponse.ok) throw new Error(`HTTP ${manifestResponse.status}`);
            remoteManifest = await manifestResponse.json();
            console.log(`使用默认镜像成功获取清单`);
        } catch (error) {
            console.warn(`获取清单失败:`, error);
            lastError = error;
            for (const [key, proxyUrl] of Object.entries(proxyList)) {
                if (proxyUrl === proxy) continue;

                try {
                    manifestResponse = await fetch(`${proxyUrl}https://raw.githubusercontent.com/Antarctics/GirlsBand-Noname-Expansion/refs/heads/main/manifest.json`);
                    if (!manifestResponse.ok) throw new Error(`HTTP ${manifestResponse.status}`);
                    remoteManifest = await manifestResponse.json();
                    proxy = proxyUrl;
                    lastError = null;
                    console.log(`使用备用镜像 ${proxyUrl} 成功获取清单`);
                    break;
                } catch (error) {
                    lastError = error;
                    console.warn(`备用镜像 ${proxyUrl} 获取清单失败:`, error);
                }
            }
        }
        if (lastError) {
            throw new Error('所有镜像尝试均失败，请检查网络连接');
        }

        const filesToUpdate = [];
        for (const [filePath, remoteHash] of Object.entries(remoteManifest.files)) {
            const fileExists = await game.promises.checkFile(`extension/GirlsBand/${filePath}`)
            if (fileExists !== 1) {
                filesToUpdate.push(filePath);
            } else {
                try {
                    const fileData = await game.promises.readFile(`extension/GirlsBand/${filePath}`);
                    const localHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', fileData))).map(b => b.toString(16).padStart(2, '0')).join('')
                    if (localHash !== remoteHash) {
                        filesToUpdate.push(filePath);
                    }
                } catch (error) {
                    console.error(`计算文件 ${filePath} 哈希值时出错:`, error);
                    filesToUpdate.push(filePath);
                }
            }
        }
        delete game.importedPack
        if (filesToUpdate.length == 0) {
            if (bool) alert('已经是最新版本，无需更新');
            return;
        }
        if (confirm(`《GirlsBand》发现新版本 ${remoteManifest.version}\n当前共有 ${filesToUpdate.length} 个文件需要更新，是否继续？\n更新说明:\n${remoteManifest.update || '无'}`)) {
            await performUpdate(proxy, remoteManifest, filesToUpdate);
            alert('更新完成！');
            game.reload()
        }
    } catch (error) {
        delete game.importedPack;
        console.error('《GirlsBand》扩展更新失败:', error);
        if (bool) alert(`更新失败: ${error.message}`);
    }
};

async function performUpdate(proxy, remoteManifest, filesToUpdate) {
    const progress = createProgress("正在更新 GirlsBand 扩展", filesToUpdate.length);
    try {
        game.importedPack = true;
        for (let i = 0; i < filesToUpdate.length; i++) {
            const filePath = filesToUpdate[i];
            progress.setProgressValue(i + 1);
            progress.setFileName(`正在下载：${filePath} （${i + 1} / ${filesToUpdate.length}）`);
            const fileUrl = `${proxy}https://raw.githubusercontent.com/Antarctics/GirlsBand-Noname-Expansion/refs/heads/main/${filePath}`;
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error(`下载文件失败: ${filePath}`);

            const fileData = await response.arrayBuffer();
            const fullPath = `extension/GirlsBand/${filePath}`;
            const [dirPath, fileName] = [fullPath.split("/").slice(0, -1).join("/"), fullPath.split("/").pop()];

            await game.promises.createDir(dirPath);
            await game.promises.writeFile(fileData, dirPath, fileName);
        }

        const manifestData = new TextEncoder().encode(JSON.stringify(remoteManifest, null, 2));
        await game.promises.writeFile(manifestData, "extension/GirlsBand", "manifest.json");
    } finally {
        progress.remove();
        delete game.importedPack;
    }
}