// リポジトリの form/ にある公式 PDF と文字の配置データ、pdf.js の作業用スクリプトを public/ に写す。
// 元はコマンド版と共通なので、ここには置かずに dev と build の前に毎回写す
import { cpSync, mkdirSync } from "node:fs";

const form = new URL("../../form/", import.meta.url);
const pub = new URL("../public/", import.meta.url);

mkdirSync(new URL("form/", pub), { recursive: true });
for (const name of ["kouroushourirekisho.pdf", "kouroushourirekishoA4.pdf", "layout.json"]) {
  cpSync(new URL(name, form), new URL(`form/${name}`, pub));
}
cpSync(new URL("../node_modules/pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url), new URL("pdf.worker.min.mjs", pub));
