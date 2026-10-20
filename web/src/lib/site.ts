// 本番の URL（正規 URL・OGP・サイトマップで使う）。Vercel では本番のドメインが渡るので、独自ドメインにしても追従する
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://career-hub-one-dusky.vercel.app";

export const SITE_TITLE = "厚生労働省様式の履歴書を無料で作成・PDF保存｜ResumeDocs";
export const SITE_DESCRIPTION =
  "厚生労働省の履歴書様式例どおりの履歴書を、ブラウザで入力するだけで作成し、PDF で保存できます。無料・登録不要でスマホにも対応。入力内容は外部に送信しません。";
