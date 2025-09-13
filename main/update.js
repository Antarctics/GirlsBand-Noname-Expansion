import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import { createProgress } from "../../../noname/library/update.js";
export default async (b) => {
    try {
        if (!localStorage.gb_clean) {
            game.importedPack = true
            let m = JSON.parse(await game.promises.readFile("extension/GirlsBand/manifest.json"))
            const clean = async (path, pre = '') => {
                const [dirs, files] = await game.promises.getFileList(path);
                let list = files.map(file => pre ? `${pre}/${file}` : file);
                for (const d of dirs) list = list.concat(await clean(`${path}/${d}`, pre ? `${pre}/${d}` : d));
                return list;
            };
            const f = (await clean("extension/GirlsBand")).filter(f => !m.files[f] && f !== "manifest.json");
            if (f.length) {
                const p = createProgress("清理文件", f.length);
                for (let i = 0; i < f.length; i++) {
                    p.setProgressValue(i + 1);
                    await game.promises.removeFile(`extension/GirlsBand/${f[i]}`)
                }
                p.remove();
            }
            delete game.importedPack
            localStorage.gb_clean = true
        }
        if (_status.connectMode) if (b) {
            alert("联机状态下无法更新");
            throw new Error("联机状态下无法更新");
        }
        if (!window.navigator.onLine) if (b) {
            alert("断网状态下无法检查更新，请检查网络连接")
            throw new Error("网络连接失败");
        }
        if (!b && sessionStorage.gb_check) return;

        game.importedPack = true;
        const pList = ["https://proxy.schariac.one/", "", "https://gh-proxy.com/", "https://hk.gh-proxy.com/", "https://tvv.tw/"];
        let p = pList[lib.config.extension_GirlsBand_update_source] || "";
        let m;
        let success = false;
        for (const u of [p, ...pList.filter(x => x !== p)]) {
            try {
                const r = await fetch(`${u}https://raw.githubusercontent.com/Antarctics/GirlsBand-Noname-Expansion/refs/heads/main/manifest.json`);
                if (r.ok) {
                    m = await r.json();
                    p = u;
                    console.log(`使用${u || '默认'}镜像获取清单成功`);
                    success = true;
                    break;
                }
            } catch { }
        }

        if (!success) {
            const msg = '清单文件获取失败，请检查网络连接';
            if (b) alert(msg);
            throw new Error(msg);
        }

        const updateFiles = [];
        const hex = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
        const entries = Object.entries(m.files);
        for (let i = 0; i < entries.length; i += 5) {
            const batch = entries.slice(i, i + 5);
            await Promise.all(batch.map(async ([f, h]) => {
                const path = `extension/GirlsBand/${f}`;
                if (await game.promises.checkFile(path) !== 1) {
                    updateFiles.push(f);
                    return;
                }
                try {
                    const buf = await crypto.subtle.digest('SHA-1', await game.promises.readFile(path));
                    const localHash = Array.from(new Uint8Array(buf), x => hex[x]).join('');
                    if (localHash !== h) updateFiles.push(f);
                } catch {
                    updateFiles.push(f);
                }
            }));
        }

        delete game.importedPack;
        sessionStorage.gb_check = true;

        if (updateFiles.length === 0) return b && alert('已经是最新版本，无需更新');
        if (!confirm(`《GirlsBand》发现新版本 ${m.version}\n${updateFiles.length}个文件需更新，是否继续？\n更新说明:\n${m.update || '无'}`)) return

        const prog = createProgress("更新 GirlsBand 扩展", updateFiles.length);
        game.importedPack = true;

        try {
            for (let i = 0; i < updateFiles.length; i++) {
                const f = updateFiles[i];
                prog.setProgressValue(i + 1);
                prog.setFileName(`正在下载：${f}`);

                const r = await fetch(`${p}https://raw.githubusercontent.com/Antarctics/GirlsBand-Noname-Expansion/refs/heads/main/${f}`);
                if (!r.ok) throw new Error(`下载失败: ${f}`);

                const data = await r.arrayBuffer();
                const fullPath = `extension/GirlsBand/${f}`;
                const dir = fullPath.split("/").slice(0, -1).join("/");

                await game.promises.createDir(dir);
                await game.promises.writeFile(data, dir, fullPath.split("/").pop());
            }
            await game.promises.writeFile(JSON.stringify(m, null, 2), "extension/GirlsBand", "manifest.json");
            const clean = async (path, pre = '') => {
                const [dirs, files] = await game.promises.getFileList(path);
                let list = files.map(file => pre ? `${pre}/${file}` : file);
                for (const d of dirs) list = list.concat(await clean(`${path}/${d}`, pre ? `${pre}/${d}` : d));
                return list;
            };
            const f = (await clean("extension/GirlsBand")).filter(f => !m.files[f] && f !== "manifest.json");
            if (f.length) {
                const p = createProgress("清理文件", f.length);
                for (let i = 0; i < f.length; i++) {
                    p.setProgressValue(i + 1);
                    await game.promises.removeFile(`extension/GirlsBand/${f[i]}`)
                }
                p.remove();
            }
            localStorage.gb_clean = true
        }
        finally {
            prog.remove();
            alert('更新完成！');
            delete game.importedPack;
            game.reload();
        }
    } catch (e) {
        if (b) alert(e)
        console.warn(e)
        delete game.importedPack;
    }
};