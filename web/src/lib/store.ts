// 入力内容をブラウザの中（localStorage）だけに保存する。サーバーには送らない。
// 履歴書はいくつでも保存でき、一覧（名前と更新日時）と中身を別々のキーに持つ
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { emptyResume, toResume, type Resume } from "./resume";

export type Saved = { id: string; title: string; updatedAt: number };

const LIST_KEY = "career-hub:list";
const OLD_KEY = "career-hub"; // 1つだけ保存していたころのキー
const resumeKey = (id: string) => `career-hub:resume:${id}`;
const SERVER_RESUME = emptyResume(); // 書き出し時（サーバー側）の描画で使う空のデータ
const SERVER_LIST: Saved[] = [];
const listeners = new Set<() => void>();
const cache = new Map<string, Resume>();
let list: Saved[] | null = null;
let currentId: string | null = null;
let warned = false;

const newId = () => crypto.randomUUID().slice(0, 8);
const notify = () => listeners.forEach((l) => l());

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 容量不足やプライベートブラウズで保存できなくても、入力は続けられる。気づけるよう一度だけ知らせる
    if (!warned) {
      warned = true;
      toast.error("この端末に保存できませんでした", { description: "保存できる量を超えたかもしれません。使わない履歴書を削除してください" });
    }
  }
}

function getList(): Saved[] {
  if (!list) {
    list = [];
    try {
      const saved = localStorage.getItem(LIST_KEY);
      if (saved) list = JSON.parse(saved);
      else {
        // 前の版で保存していた1件を、一覧の1件目として引き継ぐ
        const old = localStorage.getItem(OLD_KEY);
        if (old) {
          const id = newId();
          localStorage.setItem(resumeKey(id), old);
          list = [{ id, title: "履歴書", updatedAt: Date.now() }];
          localStorage.setItem(LIST_KEY, JSON.stringify(list));
          localStorage.removeItem(OLD_KEY);
        }
      }
    } catch {
      // 読めないときは空の一覧から始める
    }
  }
  return list!;
}

function setList(next: Saved[]) {
  list = next;
  write(LIST_KEY, next);
  notify();
}

/** 中身を読む。一覧のカードで氏名を出すのにも使う */
export function getResume(id: string): Resume {
  let r = cache.get(id);
  if (!r) {
    try {
      r = toResume(JSON.parse(localStorage.getItem(resumeKey(id)) ?? "null"));
    } catch {
      r = emptyResume();
    }
    cache.set(id, r);
  }
  return r;
}

// 「履歴書 1」「履歴書 2」…のうち、使われていない一番小さい番号
function nextTitle() {
  const used = new Set(getList().map((s) => s.title));
  let n = 1;
  while (used.has(`履歴書 ${n}`)) n++;
  return `履歴書 ${n}`;
}

/** 編集する履歴書を選ぶ。見つからなければ false */
export function openResume(id: string) {
  if (!getList().some((s) => s.id === id)) return false;
  currentId = id;
  return true;
}

/** 開いている履歴書を書き換える */
export function setResume(next: Resume) {
  const id = currentId;
  if (!id) return;
  cache.set(id, next);
  write(resumeKey(id), next);
  setList(getList().map((s) => (s.id === id ? { ...s, updatedAt: Date.now() } : s)));
}

/** 一部だけ書き換える。fn には複製が渡るので、そのまま書き換えてよい */
export function updateResume(fn: (draft: Resume) => void) {
  if (!currentId) return;
  const draft = structuredClone(getResume(currentId));
  fn(draft);
  setResume(draft);
}

/** 新しく作って id を返す */
export function createResume(data: Resume = emptyResume(), title = nextTitle()) {
  const id = newId();
  cache.set(id, data);
  write(resumeKey(id), data);
  setList([...getList(), { id, title, updatedAt: Date.now() }]);
  return id;
}

export function duplicateResume(id: string) {
  const title = getList().find((s) => s.id === id)?.title ?? "履歴書";
  return createResume(structuredClone(getResume(id)), `${title} のコピー`);
}

export function renameResume(id: string, title: string) {
  setList(getList().map((s) => (s.id === id ? { ...s, title } : s)));
}

export function deleteResume(id: string) {
  cache.delete(id);
  try {
    localStorage.removeItem(resumeKey(id));
  } catch {
    // 消せなくても一覧からは外す
  }
  setList(getList().filter((s) => s.id !== id));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 開いている履歴書 */
export function useResume() {
  return useSyncExternalStore(subscribe, () => (currentId ? getResume(currentId) : SERVER_RESUME), () => SERVER_RESUME);
}

export function useResumeList() {
  return useSyncExternalStore(subscribe, getList, () => SERVER_LIST);
}
