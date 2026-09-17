'use client';
import { useState } from 'react';

const track = (method) => {
  try { window.gtag?.('event', 'share', { method }); } catch { /* noop */ }
};

// X / LINE / リンクコピー のシェアボタン。スクリプト読込なし（<a>＋clipboardのみ）でCSP追加不要。
export default function ShareButtons({ url, text, className = '' }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const xUrl = `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${enc(url)}&text=${enc(text)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard 不可環境は無視 */ }
    track('copy');
  };

  const base =
    'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black active:scale-95 transition-transform whitespace-nowrap';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track('x')}
        className={`${base} bg-black text-white`}
      >
        𝕏 で共有
      </a>
      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track('line')}
        className={`${base} bg-[#06C755] text-white`}
      >
        LINE
      </a>
      <button type="button" onClick={copyLink} className={`${base} bg-[#F0EBE6] text-[#7B8E76]`}>
        {copied ? 'コピーしました' : 'リンクをコピー'}
      </button>
    </div>
  );
}

// 投稿用テキストを表示＋コピーする枠（Instagram/Threads等へ貼り付け用）。
export function CopyBox({ text, label = 'SNS投稿用テキスト（コピーして貼るだけ）' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* noop */ }
    track('copy_post');
  };
  return (
    <details className="mt-6 bg-white border border-[#F4EFEB] rounded-2xl p-4">
      <summary className="text-xs font-black text-[#7B8E76] cursor-pointer list-none flex items-center justify-between">
        <span>📣 {label}</span>
        <span className="text-[10px] text-[#A5A19E] font-bold">開く</span>
      </summary>
      <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-[#5A4C4C] bg-[#FBF9F7] rounded-xl p-3 mt-3 font-sans">
        {text}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-[#7B8E76] text-white active:scale-95 transition-transform"
      >
        {copied ? 'コピーしました' : '投稿文をコピー'}
      </button>
    </details>
  );
}
