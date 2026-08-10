/* Copia os ícones pro dist (o tsc só cuida dos .ts). */
const fs = require("node:fs");
const path = require("node:path");

const pairs = [
  ["nodes/Salvia/salvia.svg", "dist/nodes/Salvia/salvia.svg"],
];

for (const [from, to] of pairs) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`copiado: ${from} -> ${to}`);
}
