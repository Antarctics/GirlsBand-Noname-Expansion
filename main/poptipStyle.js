import { game, lib, ui } from "../../../noname.js";
/**
 * 注释样式自定义系统
 * 导入你所需要的位置
 * 调用poptipStyle()打开调色盘
 * 调用clearPoptipStyle()恢复默认样式
 * 初始样式为 #66ccff
 */
const ENABLE_ID = "customPoptipEnable";
const TIP_KEY = "customPoptipStyle";
const STYLE_ID = "custom-tip-style";
const PICKER_ID = "custom-tip-style-picker";
const LAYER_ID = "custom-tip-style-layer";

const INITIAL_STYLE = { color: "#66ccff", B: 1, I: 0, U: 0, S: 0 };

let activePickerClose = null;

const C = (n, a, b) => Math.min(b, Math.max(a, n));
const el = (t, c) => ui.create.node(t, c);
const h2r = (h, s, v) => {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    const r = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return r.map(n => Math.round((n + m) * 255));
};
const r2h = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    if (delta) {
        if (max === r) h = ((g - b) / delta + 6) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h *= 60;
    }
    return [h, max ? delta / max : 0, max];
};
const rgbToHex = (r, g, b) => "#" + [r, g, b].map(n => C(Math.round(n), 0, 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const arrow = '<svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4l3-3 3 3M2 6l3 3 3-3"/></svg>';

const cssColorToHex = value => {
    const nums = String(value || "").match(/\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 3) return null;
    return rgbToHex(Number(nums[0]), Number(nums[1]), Number(nums[2]));
};
const getBodyColor = () => cssColorToHex(window.getComputedStyle(document.body).color) || "#ffffff";
const normalizeColor = (color, fallback = getBodyColor()) => {
    let value = String(color || fallback).replace(/^#/, "");
    if (value.length === 3) value = value.split("").map(char => char + char).join("");
    return /^[0-9a-f]{6}$/i.test(value) ? `#${value.toLowerCase()}` : fallback;
};
const normalizeStyle = style => ({
    color: normalizeColor(style?.color),
    B: Number(style?.B) ? 1 : 0,
    I: Number(style?.I) ? 1 : 0,
    U: Number(style?.U) ? 1 : 0,
    S: Number(style?.S) ? 1 : 0,
});
const styleText = style => `#window noname-poptip{color:${style.color}!important;font-weight:${style.B ? "bold" : "normal"}!important;font-style:${style.I ? "italic" : "normal"}!important;text-decoration:${[style.U && "underline", style.S && "line-through"].filter(Boolean).join(" ") || "none"}!important}`;
const ensureStyleElement = () => {
    let st = document.getElementById(STYLE_ID);
    if (!st) {
        st = el("style");
        st.id = STYLE_ID;
        document.head.appendChild(st);
    }
    return st;
};

const applyStyle = (style, persist = false) => {
    const value = normalizeStyle(style);
    const css = styleText(value);
    const st = ensureStyleElement();
    if (st.textContent !== css) st.textContent = css;
    if (persist) {
        lib.config[TIP_KEY] = { ...value };
        game.saveConfig(TIP_KEY, lib.config[TIP_KEY]);
        game.saveConfig(ENABLE_ID, true);
    }
    return value;
};

function applyPoptipStyle() {
    if (activePickerClose) return;
    game.saveConfig(ENABLE_ID, true);
    const saved = lib.config[TIP_KEY];
    applyStyle(saved || INITIAL_STYLE);
}

function clearPoptipStyle() {
    activePickerClose?.();
    document.getElementById(LAYER_ID)?.remove();
    document.getElementById(PICKER_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    if (!lib.config[TIP_KEY]) {
        lib.config[TIP_KEY] = { ...INITIAL_STYLE };
        game.saveConfig(TIP_KEY, lib.config[TIP_KEY]);
    }
    game.saveConfig(ENABLE_ID, false);
}

function initPoptipStyle() {
    if (typeof document === "undefined") return;
    const saved = lib.config[TIP_KEY];
    const enable = lib.config[ENABLE_ID];
    if (!saved) {
        applyStyle(INITIAL_STYLE);
        return;
    }
    if (enable === false) {
        document.getElementById(STYLE_ID)?.remove();
        return;
    }
    applyStyle(saved);
}

function poptipStyle() {
    activePickerClose?.();
    document.getElementById(PICKER_ID)?.remove();
    document.getElementById(LAYER_ID)?.remove();

    const readCurrentStyle = () => {
        let probe;
        try {
            probe = el("noname-poptip", {
                position: "absolute",
                left: "-10000px",
                top: "-10000px",
                visibility: "hidden",
                pointerEvents: "none",
            });
            ui.window.appendChild(probe);
            probe.setAttribute("poptip", "rule_yishi");
            probe.textContent = "Poptip";
            const computed = window.getComputedStyle(probe);
            const color = cssColorToHex(computed.color);
            if (!color) return null;
            const decoration = computed.textDecorationLine || computed.textDecoration || "";
            return {
                color,
                B: computed.fontWeight === "bold" || computed.fontWeight === "bolder" || Number(computed.fontWeight) >= 600 ? 1 : 0,
                I: /italic|oblique/.test(computed.fontStyle) ? 1 : 0,
                U: /underline/.test(decoration) ? 1 : 0,
                S: /line-through/.test(decoration) ? 1 : 0,
            };
        } catch (error) {
            return null;
        } finally {
            probe?.remove();
        }
    };

    const saved = lib.config[TIP_KEY];
    let cur = readCurrentStyle() || (saved ? normalizeStyle(saved) : null) || {
        color: getBodyColor(),
        B: 0,
        I: 0,
        U: 0,
        S: 0,
    };
    cur = normalizeStyle(cur);

    let H;
    let S;
    let V;
    let M = 0;
    let F = [];
    let scheduled = 0;
    let dirty = false;
    let h = cur.color.replace("#", "");
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    [H, S, V] = r2h(...h.match(/../g).map(x => parseInt(x, 16)));

    const layer = el("div", {
        position: "absolute",
        left: "0",
        top: "0",
        width: "100%",
        height: "100%",
        zIndex: "20",
        background: "transparent",
        transition: "none",
    });
    layer.id = LAYER_ID;

    const app = el("div", {
        display: "block",
        width: "280px",
        background: "#3c3c3c",
        borderRadius: "8px",
        color: "#e0e0e0",
        fontFamily: "system-ui",
        userSelect: "none",
        overflow: "hidden",
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: "21",
        boxShadow: "0 10px 30px #000a",
        transition: "none",
        boxSizing: "border-box",
    });
    app.id = PICKER_ID;

    const sv = el("div", {
        width: "100%",
        display: "block",
        height: "150px",
        position: "relative",
        cursor: "crosshair",
        touchAction: "none",
        transition: "none",
    });
    const svp = el("div", {
        position: "absolute",
        width: "14px",
        height: "14px",
        border: "2px solid #fff",
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        boxShadow: "0 0 2px #000",
        transition: "none",
    });
    sv.appendChild(svp);

    const tb = el("div", {
        position: "relative",
        display: "flex",
        gap: "14px",
        alignItems: "center",
        padding: "16px 16px 12px",
        boxSizing: "border-box",
        transition: "none",
    });
    const p = el("div", {
        position: "relative",
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        background: "#fff",
        flexShrink: 0,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
        transition: "none",
    });
    const hue = el("div", {
        flex: 1,
        height: "12px",
        position: "relative",
        borderRadius: "6px",
        cursor: "pointer",
        touchAction: "none",
        background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
        transition: "none",
    });
    const hp = el("div", {
        position: "absolute",
        width: "14px",
        height: "14px",
        border: "2px solid #fff",
        borderRadius: "50%",
        transform: "translate(-50%,-50%)",
        pointerEvents: "none",
        boxShadow: "0 0 2px #000",
        top: "50%",
        transition: "none",
    });
    hue.appendChild(hp);
    tb.append(p, hue);

    const txt = el("div", {
        display: "block",
        position: "relative",
        boxSizing: "border-box",
        margin: "0 16px 8px",
        padding: "12px",
        textAlign: "left",
        borderRadius: "4px",
        fontSize: "13px",
        color: "#ddd",
        transition: "none",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
        lineHeight: "1.8",
        wordBreak: "break-all",
    });
    txt.innerHTML = `你可以将<noname-poptip poptip="sha"></noname-poptip>当<noname-poptip poptip="shan"></noname-poptip>使用或打出<br>你获得<noname-poptip poptip="yingzi"></noname-poptip>和<noname-poptip poptip="yinghun"></noname-poptip>。<br><noname-poptip poptip="rule_beishui"></noname-poptip>：受到1点伤害。`;

    const sRow = el("div", {
        position: "relative",
        display: "flex",
        gap: "8px",
        padding: "0 16px 12px",
        boxSizing: "border-box",
    });
    const btnBase = {
        background: "transparent",
        border: "1px solid #666",
        color: "#aaa",
        borderRadius: "4px",
        cursor: "pointer",
        padding: "4px 0",
        fontSize: "12px",
        flex: 1,
        fontFamily: "inherit",
        transition: "all 0.2s",
    };

    ["B", "I", "U", "S"].forEach(t => {
        const b = el("button", btnBase);
        b.textContent = t;
        if (t === "B") b.style.fontWeight = "bold";
        if (t === "I") b.style.fontStyle = "italic";
        if (t === "U") b.style.textDecoration = "underline";
        if (t === "S") b.style.textDecoration = "line-through";
        if (cur[t]) Object.assign(b.style, { color: "#fff", borderColor: "#fff", background: "#555" });
        b.onclick = () => {
            cur[t] = cur[t] ? 0 : 1;
            dirty = true;
            Object.assign(b.style, {
                color: cur[t] ? "#fff" : "#aaa",
                borderColor: cur[t] ? "#fff" : "#666",
                background: cur[t] ? "#555" : "transparent",
            });
            saveNow();
        };
        sRow.appendChild(b);
    });

    const inRow = el("div", {
        position: "relative",
        display: "flex",
        gap: "8px",
        padding: "0 16px",
        boxSizing: "border-box",
    });
    const botRow = el("div", {
        position: "relative",
        display: "flex",
        margin: "8px 16px 14px",
        padding: "8px 0",
        border: "1px solid #555",
        borderRadius: "20px",
        cursor: "pointer",
        fontSize: "12px",
        color: "#aaa",
        transition: "all 0.2s",
        boxSizing: "border-box",
    });
    botRow.onmouseenter = () => Object.assign(botRow.style, { borderColor: "#777", background: "#444", color: "#fff" });
    botRow.onmouseleave = () => Object.assign(botRow.style, { borderColor: "#555", background: "transparent", color: "#aaa" });
    botRow.onclick = () => {
        M = (M + 1) % 3;
        buildInputs();
    };

    app.append(sv, tb, txt, sRow, inRow, botRow);

    function renderNow(persist = false, applyToPage = true) {
        const [r, g, b] = h2r(H, S, V);
        const x = rgbToHex(r, g, b);
        const values = M === 0 ? [x] : M === 1 ? [r, g, b] : [Math.round(H), Math.round(S * 100), Math.round(V * 100)];
        sv.style.background = `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent),hsl(${H} 100% 50%)`;
        svp.style.left = `${S * 100}%`;
        svp.style.top = `${(1 - V) * 100}%`;
        hp.style.left = `${H / 3.6}%`;
        hp.style.background = `hsl(${H} 100% 50%)`;
        p.style.background = x;
        F.forEach((input, index) => {
            if (document.activeElement !== input) input.value = values[index];
        });
        cur.color = x;
        if (applyToPage) applyStyle(cur, persist);
    }

    function updateAll() {
        if (scheduled) return;
        scheduled = requestAnimationFrame(() => {
            scheduled = 0;
            renderNow(false);
        });
    }

    function saveNow() {
        if (scheduled) {
            cancelAnimationFrame(scheduled);
            scheduled = 0;
        }
        renderNow(true);
        dirty = false;
    }

    function buildInputs() {
        const labels = M === 0 ? ["HEX"] : M === 1 ? ["R", "G", "B"] : ["H", "S", "V"];
        inRow.innerHTML = "";
        botRow.innerHTML = "";
        labels.forEach((name, index) => {
            const input = el("input", {
                width: "100%",
                height: "34px",
                boxSizing: "border-box",
                background: "transparent",
                border: "1px solid #666",
                color: "#fff",
                textAlign: "center",
                fontSize: "14px",
                borderRadius: "4px",
                outline: "none",
                fontFamily: "monospace",
                transition: "border-color 0.2s",
            });
            input.type = "text";
            input.setAttribute("inputmode", M === 0 ? "text" : "numeric");
            input.oninput = () => {
                const current = F.map(item => item.value.trim());
                if (current.some(value => !value)) return;
                if (M === 0) {
                    let color = current[0].replace("#", "");
                    if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color)) return;
                    if (color.length === 3) color = color.split("").map(char => char + char).join("");
                    [H, S, V] = r2h(...color.match(/../g).map(value => parseInt(value, 16)));
                } else if (M === 1) {
                    const rgb = current.map(Number);
                    if (rgb.some(Number.isNaN)) return;
                    [H, S, V] = r2h(...rgb.map(value => C(value, 0, 255)));
                } else {
                    const hsv = current.map(Number);
                    if (hsv.some(Number.isNaN)) return;
                    H = C(hsv[0], 0, 360);
                    S = C(hsv[1], 0, 100) / 100;
                    V = C(hsv[2], 0, 100) / 100;
                }
                dirty = true;
                updateAll();
            };
            input.onfocus = () => {
                input.style.borderColor = "#fff";
            };
            input.onblur = () => {
                input.style.borderColor = "#666";
                if (dirty) saveNow();
            };
            inRow.appendChild(input);

            const bd = el("div", {
                position: "relative",
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "4px",
            });
            bd.innerHTML = `${name} ${index === labels.length - 1 ? arrow : ""}`;
            botRow.appendChild(bd);
        });
        F = [...inRow.children];
        renderNow(false, false);
    }

    const drag = (target, handler) => {
        let dragging = false;
        target.onpointerdown = event => {
            dragging = true;
            target.setPointerCapture?.(event.pointerId);
            handler(event);
            event.preventDefault();
        };
        target.onpointermove = event => {
            if (dragging) handler(event);
        };
        target.onpointerup = () => {
            dragging = false;
            if (dirty) saveNow();
        };
        target.onpointercancel = () => {
            dragging = false;
            if (dirty) saveNow();
        };
    };

    drag(sv, event => {
        const rect = sv.getBoundingClientRect();
        S = C((event.clientX - rect.left) / rect.width, 0, 1);
        V = 1 - C((event.clientY - rect.top) / rect.height, 0, 1);
        dirty = true;
        updateAll();
    });

    drag(hue, event => {
        const rect = hue.getBoundingClientRect();
        H = C((event.clientX - rect.left) / rect.width, 0, 1) * 360;
        dirty = true;
        updateAll();
    });

    const dispose = () => {
        if (scheduled) {
            cancelAnimationFrame(scheduled);
            scheduled = 0;
        }
        layer.remove();
        app.remove();
        if (activePickerClose === dispose) activePickerClose = null;
    };
    activePickerClose = dispose;

    const closePicker = () => {
        if (dirty) saveNow();
        dispose();
    };

    layer.onclick = closePicker;
    ui.window.append(layer, app);
    buildInputs();
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initPoptipStyle, { once: true });
    } else {
        setTimeout(initPoptipStyle, 0);
    }
}
export { poptipStyle, clearPoptipStyle };
