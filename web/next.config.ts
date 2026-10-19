import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // サーバーを使わない静的なページとして書き出す。入力内容はブラウザの外に出さない
  output: "export",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
