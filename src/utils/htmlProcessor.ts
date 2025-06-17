// src/utils/htmlProcessor.ts

import type { ProcessOptions } from '../types';

export const processHtmlString = (htmlString: string, options: ProcessOptions = {}): string => {
  const parser = new DOMParser();
  // tempBody を作成する際に、必ずルート要素を持つように body タグで囲む
  const doc = parser.parseFromString(`<body>${htmlString}</body>`, 'text/html');
  const tempBody = doc.body;

  // フォーム要素の削除
  tempBody.querySelectorAll('form').forEach(form => form.remove());

  // 特定のaタグの解除
  tempBody.querySelectorAll('a[href^="http"], a[rel^="no"]').forEach(a => {
    const fragment = document.createDocumentFragment();
    while (a.firstChild) {
      fragment.appendChild(a.firstChild);
    }
    a.parentNode?.replaceChild(fragment, a);
  });

  // 特定のspanタグの解除
  tempBody.querySelectorAll('span[style^="width:100%"], span[style^="float"]').forEach(s => {
    const fragment = document.createDocumentFragment();
    while (s.firstChild) {
      fragment.appendChild(s.firstChild);
    }
    s.parentNode?.replaceChild(fragment, s);
  });

  // .post-header divの解除
  tempBody.querySelectorAll('.post-header div').forEach(s => {
    const fragment = document.createDocumentFragment();
    while (s.firstChild) {
      fragment.appendChild(s.firstChild);
    }
    s.parentNode?.replaceChild(fragment, s);
  });
  // .postusernameのテキストクリーンアップ
  if (options.stripPostUsernameParentheses) {
    tempBody.querySelectorAll('.postusername').forEach(el => {
      if (el.textContent) {
        el.textContent = el.textContent.replace(/\s*\([^)]*\)/g, '');
      }
    });
  }
  // .post-header 内のタグを取り除き、テキストだけにする処理
  if (options.stripPostHeaderTags) {
    tempBody.querySelectorAll('.post-header').forEach(header => {
      const walker = document.createTreeWalker(
          header,
          NodeFilter.SHOW_ELEMENT,
          null
      );

      const elementsToRemove: Element[] = [];

      while (walker.nextNode()) {
        const current = walker.currentNode as HTMLElement;

        // .postusername はスタイルを追加しつつタグの消去をスキップ
        if (current.classList.contains('postusername')) {
            current.style.fontWeight = 'bold';
            current.style.color = 'rgb(0, 128, 0)';
            current.textContent += ' ';
            continue;
        } else if (current.classList.contains('uid')) {
            // .uid はタグの消去をスキップ
            continue;
        };
        // 最も内側の要素（子要素を持たない）だけ処理
        if (!current.children.length) {
            current.textContent = (current.textContent || '') + ' ';
        }
        // タグを後で削除（中のテキストは保持）
        elementsToRemove.push(current);
      }

      // 要素を unwrap（中のテキストは残す）
      elementsToRemove.forEach(el => {
        const parent = el.parentNode;
        while (el.firstChild) {
            parent?.insertBefore(el.firstChild, el);
        }
        parent?.removeChild(el);
      });
    });
  }

  // .post-contentに対するスタイル適用と構造変更
  tempBody.querySelectorAll('.post-content').forEach(el => {
    el.classList.add('t_b'); // クラス追加
    if (options.parentId != null) {
      el.classList.add('t_i');
    }

    const styleEl = el as HTMLElement; // 型アサーション

    // 各オプションに基づいてスタイルを適用
    if (options.textColor) {
      styleEl.style.color = options.textColor;
    }
    if (options.isBold) {
      styleEl.style.fontWeight = 'bold';
    }
    if (options.hasBorder) {
      styleEl.style.margin = '5%';
      styleEl.style.padding = '5%';
      styleEl.style.border = 'solid 1px rgba(0,0,0, 0.5)';
      styleEl.style.background = 'rgba(240,240,240, 1)';
    }
    if (options.isAA) {
      styleEl.style.fontFamily = 'ＭＳ Ｐゴシック';
      styleEl.style.lineHeight = '1.2em';
      styleEl.style.fontSize = '0.7em';
    }
    if (!options.hasBorder && (options.saveWithAddBrTags || options.hasBr) ) {
      el.innerHTML = '<br/>' + el.innerHTML + '<br/><br/>';
    }
  });

  // .post-headerにクラス追加
  tempBody.querySelectorAll('.post-header').forEach(el => {
    el.classList.add('t_h');
    if (options.parentId != null) {
      el.classList.add('t_i');
    }
  });

  // .postにクラス追加 (isTextオプションによる)
  tempBody.querySelectorAll('.post').forEach(el => {
    if (options.isText) {
      el.classList.add('text_frame01');
    }
  });

  return tempBody.innerHTML;
};