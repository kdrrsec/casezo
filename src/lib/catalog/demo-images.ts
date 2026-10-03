import type { DemoImageKind } from "./demo-data";

/**
 * Tekent eenvoudige, rustige productillustraties als SVG voor de
 * voorbeeldcatalogus. Met Shopify worden echte productfoto's gebruikt.
 */

function adjust(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const mix = (c: number) => clamp(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

const shadow = (cx = 400, cy = 720, rx = 210) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="18" fill="#000" opacity="0.07"/>`;

function cameraApple(x: number, y: number, body: string, lens = "#2a2d33") {
  const bump = adjust(body, luminance(body) > 0.5 ? -0.08 : 0.12);
  return `<rect x="${x}" y="${y}" width="150" height="150" rx="38" fill="${bump}"/>
    <circle cx="${x + 45}" cy="${y + 45}" r="28" fill="${lens}"/><circle cx="${x + 45}" cy="${y + 45}" r="12" fill="#4b5563"/>
    <circle cx="${x + 45}" cy="${y + 108}" r="28" fill="${lens}"/><circle cx="${x + 45}" cy="${y + 108}" r="12" fill="#4b5563"/>
    <circle cx="${x + 108}" cy="${y + 76}" r="28" fill="${lens}"/><circle cx="${x + 108}" cy="${y + 76}" r="12" fill="#4b5563"/>
    <circle cx="${x + 112}" cy="${y + 30}" r="8" fill="#f3e3b5"/>`;
}

function cameraSamsung(x: number, y: number, body: string) {
  const ring = adjust(body, luminance(body) > 0.5 ? -0.25 : 0.25);
  return [0, 1, 2]
    .map(
      (i) => `<circle cx="${x + 34}" cy="${y + 34 + i * 78}" r="32" fill="${ring}"/>
      <circle cx="${x + 34}" cy="${y + 34 + i * 78}" r="24" fill="#23262b"/>
      <circle cx="${x + 34}" cy="${y + 34 + i * 78}" r="10" fill="#4b5563"/>`,
    )
    .join("") + `<circle cx="${x + 92}" cy="${y + 40}" r="8" fill="#f3e3b5"/>`;
}

function phoneBack(color: string, brand: string, opts: { magsafe?: boolean; clear?: boolean } = {}) {
  const fill = opts.clear ? "#ffffff" : color;
  const edge = adjust(color, luminance(color) > 0.5 ? -0.12 : 0.15);
  const inner = opts.clear
    ? `<rect x="268" y="118" width="264" height="564" rx="40" fill="#c9ced6"/>`
    : "";
  const camera = brand === "samsung" ? cameraSamsung(290, 140, opts.clear ? "#c9ced6" : color) : cameraApple(282, 132, opts.clear ? "#c9ced6" : color);
  const ring = opts.magsafe
    ? `<circle cx="400" cy="430" r="92" fill="none" stroke="${opts.clear ? "#9aa3ad" : edge}" stroke-width="6" opacity="0.7"/>`
    : "";
  return `${shadow()}
    <rect x="250" y="100" width="300" height="600" rx="52" fill="${fill}" ${opts.clear ? 'fill-opacity="0.55"' : ""} stroke="${edge}" stroke-width="6"/>
    ${inner}${camera}${ring}
    <rect x="262" y="112" width="18" height="576" rx="9" fill="#fff" opacity="${opts.clear ? 0.5 : 0.12}"/>`;
}

function phoneFront(frame: string, tint = "#20242b") {
  return `${shadow()}
    <rect x="250" y="100" width="300" height="600" rx="52" fill="${frame}"/>
    <rect x="264" y="114" width="272" height="572" rx="42" fill="${tint}"/>
    <rect x="365" y="132" width="70" height="20" rx="10" fill="#0d0f12"/>`;
}

function glass(tint: string, opacity: number) {
  return `<rect x="232" y="84" width="300" height="600" rx="50" fill="${tint}" fill-opacity="${opacity}" stroke="#9fb3c8" stroke-width="3"/>
    <path d="M300 84 L420 84 L232 420 L232 260 Z" fill="#fff" opacity="0.35"/>
    <path d="M470 84 L500 84 L232 560 L232 510 Z" fill="#fff" opacity="0.25"/>`;
}

function cableLoop(color: string, headA: string, headB: string) {
  const edge = adjust(color, luminance(color) > 0.5 ? -0.2 : 0.2);
  return `${shadow(400, 700, 240)}
    <path d="M250 560 C120 520 140 300 320 280 C520 260 660 360 600 480 C540 600 330 590 330 470 C330 380 470 360 520 420"
      fill="none" stroke="${edge}" stroke-width="26" stroke-linecap="round"/>
    <path d="M250 560 C120 520 140 300 320 280 C520 260 660 360 600 480 C540 600 330 590 330 470 C330 380 470 360 520 420"
      fill="none" stroke="${color}" stroke-width="20" stroke-linecap="round"/>
    ${connector(headA, 250, 560, -20)}${connector(headB, 520, 420, 40)}`;
}

function connector(type: string, x: number, y: number, rotate: number) {
  const metal = type === "lightning" ? "#e5e7eb" : "#b9bec6";
  const tipW = type === "usb-a" ? 54 : 40;
  return `<g transform="translate(${x} ${y}) rotate(${rotate})">
    <rect x="-34" y="-24" width="90" height="48" rx="12" fill="#3a3f47"/>
    <rect x="56" y="${-tipW / 4}" width="${type === "lightning" ? 46 : 38}" height="${tipW / 2}" rx="${type === "usb-a" ? 2 : 9}" fill="${metal}"/>
  </g>`;
}

function brick(color: string, ports: number) {
  const edge = adjust(color, luminance(color) > 0.5 ? -0.15 : 0.18);
  const port = luminance(color) > 0.5 ? "#2f343b" : "#0b0d10";
  return `${shadow(400, 690, 170)}
    <rect x="300" y="160" width="40" height="110" rx="10" fill="#c3c7cd"/>
    <rect x="460" y="160" width="40" height="110" rx="10" fill="#c3c7cd"/>
    <rect x="250" y="250" width="300" height="420" rx="60" fill="${color}" stroke="${edge}" stroke-width="6"/>
    ${Array.from({ length: ports }, (_, i) => `<rect x="${360}" y="${520 - i * 90}" width="80" height="26" rx="13" fill="${port}"/>`).join("")}
    <rect x="266" y="270" width="18" height="380" rx="9" fill="#fff" opacity="0.18"/>`;
}

function powerbank(color: string, slim = false) {
  const edge = adjust(color, luminance(color) > 0.5 ? -0.15 : 0.18);
  const w = slim ? 240 : 300;
  const h = slim ? 360 : 520;
  const x = 400 - w / 2;
  const y = 400 - h / 2;
  return `${shadow(400, y + h + 30, w / 2 + 40)}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="40" fill="${color}" stroke="${edge}" stroke-width="6"/>
    ${[0, 1, 2, 3].map((i) => `<circle cx="${400 - 45 + i * 30}" cy="${y + h - 60}" r="8" fill="${i < 3 ? "#3b82f6" : edge}"/>`).join("")}
    <rect x="${400 - 40}" y="${y + 24}" width="80" height="20" rx="10" fill="#1f2328" opacity="0.8"/>`;
}

function draw(kind: DemoImageKind, brand: string, color: string, view: number): string {
  switch (kind) {
    case "case":
      return view === 1
        ? phoneBack(color, brand, { magsafe: brand === "apple" })
        : `<g transform="rotate(-10 400 400)">${phoneFront("#3a3f47")}</g><g transform="translate(60 20) rotate(8 400 400)">${phoneBack(color, brand)}</g>`;
    case "clear":
      return view === 1
        ? phoneBack("#dfe6ee", brand, { clear: true, magsafe: brand === "apple" })
        : `<g transform="rotate(-8 400 400)">${phoneBack("#dfe6ee", brand, { clear: true })}</g>`;
    case "rugged": {
      const dark = adjust(color, -0.35);
      return `${phoneBack(color, brand, { magsafe: brand === "apple" })}
        ${[
          [240, 90],
          [490, 90],
          [240, 640],
          [490, 640],
        ]
          .map(([x, y]) => `<rect x="${x}" y="${y}" width="70" height="70" rx="26" fill="${dark}"/>`)
          .join("")}
        ${view === 2 ? [0, 1, 2, 3, 4].map((i) => `<rect x="330" y="${520 + i * 24}" width="140" height="8" rx="4" fill="${dark}"/>`).join("") : ""}`;
    }
    case "book":
      return view === 1
        ? `${shadow()}<rect x="240" y="100" width="320" height="600" rx="34" fill="${color}"/>
           <rect x="258" y="118" width="284" height="564" rx="24" fill="none" stroke="${adjust(color, 0.3)}" stroke-width="3" stroke-dasharray="10 8"/>
           <rect x="520" y="360" width="40" height="80" rx="10" fill="${adjust(color, -0.2)}"/>`
        : `${shadow(400, 720, 300)}
           <rect x="110" y="140" width="290" height="540" rx="26" fill="${color}"/>
           <rect x="400" y="140" width="290" height="540" rx="26" fill="${adjust(color, -0.1)}"/>
           ${[0, 1, 2].map((i) => `<rect x="150" y="${240 + i * 70}" width="210" height="80" rx="10" fill="${adjust(color, 0.12)}" stroke="${adjust(color, -0.2)}" stroke-width="2"/>`).join("")}
           <rect x="440" y="170" width="210" height="480" rx="34" fill="#2b2f36"/>`;
    case "wallet":
      return `${phoneBack(color, brand)}
        <rect x="290" y="470" width="220" height="170" rx="18" fill="${adjust(color, -0.18)}"/>
        <rect x="310" y="${view === 1 ? 440 : 400}" width="180" height="60" rx="8" fill="#e8d9a8"/>`;
    case "glass":
    case "privacy":
    case "film": {
      const tint = kind === "privacy" ? "#111827" : "#dbeafe";
      const opacity = kind === "privacy" ? 0.55 : kind === "film" ? 0.15 : 0.28;
      const frame = brand === "samsung" ? "#30343a" : "#3a3f47";
      return view === 1
        ? `${phoneFront(frame)}${glass(tint, opacity)}`
        : `<g transform="rotate(-6 400 400)">${glass(tint, opacity + 0.1)}</g>`;
    }
    case "lens":
      return view === 1
        ? `${phoneBack("#9ea3ab", brand)}${[0, 1, 2]
            .map((i) => {
              const [cx, cy] = [
                [327, 177],
                [327, 240],
                [390, 208],
              ][i];
              return `<circle cx="${cx}" cy="${cy}" r="33" fill="none" stroke="${color}" stroke-width="7"/>`;
            })
            .join("")}`
        : `${shadow(400, 600, 200)}${[0, 1, 2]
            .map(
              (i) =>
                `<circle cx="${250 + i * 150}" cy="420" r="70" fill="#1f2328" stroke="${color}" stroke-width="16"/><circle cx="${250 + i * 150}" cy="420" r="30" fill="#4b5563"/><path d="M${215 + i * 150} 390 a50 50 0 0 1 50 -25" stroke="#fff" stroke-width="6" fill="none" opacity="0.4"/>`,
            )
            .join("")}`;
    case "charger":
      return brick(color, 1);
    case "dual":
      return brick(color, 2);
    case "pps":
      return view === 1 ? brick(color, 1) : cableLoop(color, "usb-c", "usb-c");
    case "wireless":
      return `${shadow(400, 640, 220)}
        <path d="M400 560 C400 640 560 640 640 690" stroke="${color}" stroke-width="18" fill="none" stroke-linecap="round"/>
        <ellipse cx="400" cy="${view === 1 ? 420 : 470}" rx="200" ry="${view === 1 ? 200 : 110}" fill="${color}" stroke="${adjust(color, -0.15)}" stroke-width="6"/>
        <ellipse cx="400" cy="${view === 1 ? 420 : 460}" rx="120" ry="${view === 1 ? 120 : 64}" fill="none" stroke="${adjust(color, -0.12)}" stroke-width="5"/>`;
    case "stand":
      return `${shadow(400, 690, 220)}
        <path d="M260 680 L540 680 L470 220 L380 210 Z" fill="${color}"/>
        <rect x="300" y="200" width="220" height="400" rx="30" fill="${adjust(color, 0.1)}" transform="rotate(-8 400 400)"/>
        <circle cx="410" cy="380" r="40" fill="none" stroke="${adjust(color, 0.35)}" stroke-width="5"/>`;
    case "carcharger":
      return `${shadow(400, 690, 120)}
        <rect x="330" y="180" width="140" height="480" rx="60" fill="${color}"/>
        <rect x="340" y="180" width="120" height="120" rx="40" fill="${adjust(color, 0.15)}"/>
        <rect x="370" y="210" width="60" height="20" rx="10" fill="#0b0d10"/>
        <rect x="380" y="250" width="40" height="26" rx="4" fill="#0b0d10"/>
        <circle cx="400" cy="640" r="20" fill="#c3c7cd"/>`;
    case "cable":
      return cableLoop(color, view === 1 ? "usb-c" : "usb-a", "usb-c");
    case "lightning":
      return cableLoop(color, "usb-c", "lightning");
    case "multi":
      return `${cableLoop(color, "usb-a", "usb-c")}${connector("lightning", 560, 520, 60)}${connector("usb-c", 600, 340, 10)}`;
    case "vent":
      return `${shadow(400, 640, 180)}
        <rect x="350" y="430" width="100" height="160" rx="20" fill="${adjust(color, 0.2)}"/>
        <circle cx="400" cy="340" r="170" fill="${color}"/>
        <circle cx="400" cy="340" r="110" fill="none" stroke="${adjust(color, 0.25)}" stroke-width="8"/>
        ${view === 2 ? `<rect x="320" y="560" width="160" height="40" rx="12" fill="${adjust(color, 0.3)}"/>` : ""}`;
    case "clamp":
      return `${shadow(400, 700, 180)}
        <ellipse cx="400" cy="660" rx="140" ry="40" fill="${adjust(color, 0.15)}"/>
        <rect x="385" y="380" width="30" height="280" rx="12" fill="${color}"/>
        <rect x="230" y="220" width="340" height="190" rx="20" fill="${color}"/>
        <rect x="200" y="240" width="40" height="150" rx="12" fill="${adjust(color, 0.25)}"/>
        <rect x="560" y="240" width="40" height="150" rx="12" fill="${adjust(color, 0.25)}"/>`;
    case "bike":
      return `${shadow(400, 690, 220)}
        <rect x="80" y="520" width="640" height="56" rx="28" fill="#4b5563"/>
        <rect x="360" y="470" width="80" height="130" rx="16" fill="${color}"/>
        <rect x="260" y="140" width="280" height="360" rx="34" fill="none" stroke="${color}" stroke-width="22"/>
        <path d="M250 150 L550 490 M550 150 L250 490" stroke="#ef4444" stroke-width="10" opacity="0.7"/>`;
    case "desk":
      return `${shadow(400, 700, 200)}
        <rect x="270" y="650" width="260" height="40" rx="16" fill="${color}"/>
        <rect x="385" y="300" width="30" height="360" rx="12" fill="${adjust(color, 0.1)}"/>
        <circle cx="400" cy="260" r="110" fill="${color}"/>
        <circle cx="400" cy="260" r="70" fill="none" stroke="${adjust(color, 0.3)}" stroke-width="6"/>`;
    case "magpack":
      return view === 1
        ? `${powerbank(color, true)}<circle cx="400" cy="380" r="80" fill="none" stroke="${adjust(color, -0.2)}" stroke-width="6"/>`
        : `<g transform="rotate(-8 400 400)">${phoneBack("#3a3f47", "apple")}</g><g transform="translate(30 90)">${powerbank(color, true)}</g>`;
    case "powerbank":
      return powerbank(color);
    case "minipack":
      return `${powerbank(color, true)}<rect x="384" y="190" width="32" height="40" rx="6" fill="#e5e7eb"/>`;
  }
}

export function renderDemoImage(kind: DemoImageKind, brand: string, hex: string, view: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#f3f4f6"/>
  ${draw(kind, brand, `#${hex}`, view)}
</svg>`;
}
