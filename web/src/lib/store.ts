// 入力内容をブラウザの中（localStorage）だけに保存する。サーバーには送らない
import { useSyncExternalStore } from "react";
import { emptyResume, toResume, type Resume } from "./resume";

const KEY = "career-hub";
const SERVER = emptyResume(); // 書き出し時（サーバー側）の描画で使う空のデータ
const listeners = new Set<() => void>();
let current: Resume | null = null;

function get(): Resume {
  if (!current) {
    try {
      current = toResume(JSON.parse(localStorage.getItem(KEY) ?? "null"));
    } catch {
      current = emptyResume();
    }
  }
  return current;
}

export function setResume(next: Resume) {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 保存できない環境（プライベートブラウズや容量不足）でも作成は続けられる
  }
  listeners.forEach((l) => l());
}

/** 一部だけ書き換える。fn には複製が渡るので、そのまま書き換えてよい */
export function updateResume(fn: (draft: Resume) => void) {
  const draft = structuredClone(get());
  fn(draft);
  setResume(draft);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useResume() {
  return useSyncExternalStore(subscribe, get, () => SERVER);
}
