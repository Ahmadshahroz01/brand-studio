import { hexFromArgb, argbFromHex, themeFromSourceColor } from "@material/material-color-utilities";

// Seed color drives the entire M3 tonal palette (HCT color space), per spec.
const SEED = "#3457D5";

const theme = themeFromSourceColor(argbFromHex(SEED));

// M3 surface-container roles aren't in the base Scheme object from this
// package version; derive them from the neutral tonal palette at the tones
// the M3 spec defines (https://m3.material.io/styles/color/roles).
const SURFACE_CONTAINER_TONES = {
  light: {
    "surface-dim": 87,
    "surface-bright": 98,
    "surface-container-lowest": 100,
    "surface-container-low": 96,
    "surface-container": 94,
    "surface-container-high": 92,
    "surface-container-highest": 90,
  },
  dark: {
    "surface-dim": 6,
    "surface-bright": 24,
    "surface-container-lowest": 4,
    "surface-container-low": 10,
    "surface-container": 12,
    "surface-container-high": 17,
    "surface-container-highest": 22,
  },
};

function schemeToVars(scheme, neutralPalette, tones) {
  const obj = scheme.toJSON ? scheme.toJSON() : scheme;
  const lines = [];
  for (const [key, value] of Object.entries(obj)) {
    const kebab = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    lines.push(`  --md-${kebab}: ${hexFromArgb(value)};`);
  }
  for (const [name, tone] of Object.entries(tones)) {
    lines.push(`  --md-${name}: ${hexFromArgb(neutralPalette.tone(tone))};`);
  }
  return lines.join("\n");
}

console.log(
  "/* Light scheme */\n:root {\n" +
    schemeToVars(theme.schemes.light, theme.palettes.neutral, SURFACE_CONTAINER_TONES.light) +
    "\n}\n",
);
console.log(
  "/* Dark scheme */\n:root[data-theme='dark'] {\n" +
    schemeToVars(theme.schemes.dark, theme.palettes.neutral, SURFACE_CONTAINER_TONES.dark) +
    "\n}\n",
);
