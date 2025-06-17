// src/App.tsx

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';
import DOMPurify from 'dompurify';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

// ----------------------
// インポートの追加
// ----------------------
import type { ExtractedElement, ElementUpdatePayload, ProcessOptions } from './types';
import { processHtmlString } from './utils/htmlProcessor';
import Modal from './components/Modal';
import ElementItem from './components/ElementItem';

function App() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedElements, setExtractedElements] = useState<ExtractedElement[]>([]);
  const [parsedElements, setParsedElements] = useState<ExtractedElement[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveTargetElementId, setMoveTargetElementId] = useState<string | null>(null);
  const [moveDestIdInput, setMoveDestIdInput] = useState('');

  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
  const [addTagTargetParentId, setAddTagTargetParentId] = useState<string | null>(null);
  const [newTagContentInput, setNewTagContentInput] = useState('');
  const [addTagAsRoot, setAddTagAsRoot] = useState(false);
  const [moveAsRoot, setMoveAsRoot] = useState(false);
  // 削除機能
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetElementId, setDeleteTargetElementId] = useState<string | null>(null);
  // ダウンロード確認モーダル
  const [isDownloadConfirmModalOpen, setIsDownloadConfirmModalOpen] = useState(false);
  const [htmlToDownload, setHtmlToDownload] = useState<string | null>(null);

  // processHtmlString は外部ファイルからインポート
  // TEXT_COLORS も外部ファイルからインポート

  // Virtuoso スクロール先のインデックスの状態
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [scrollToIndexInput, setScrollToIndexInput] = useState('');

  // クリーニングオプションの状態
  const [stripPostHeaderTags, setStripPostHeaderTags] = useState(true);
  const [stripPostUsernameParentheses, setStripPostUsernameParentheses] = useState(true);
  const [saveWithAddBrTags, setSaveWithAddBrTags] = useState(false);

  const cleaningOptionsConfig = useMemo(() => [
    {
      key: 'stripPostHeaderTags', // processHtmlString に渡すオプションのキーと合わせる
      label: '`post-header`内のタグを除去してテキストのみにする',
      state: stripPostHeaderTags,
      setter: setStripPostHeaderTags,
    },
    {
      key: 'stripPostUsernameParentheses',
      label: '書き込みUserのIPアドレスを削除',
      state: stripPostUsernameParentheses,
      setter: setStripPostUsernameParentheses,
    },
    {
      key: 'saveWithAddBrTags',
      label: '`post-contents`全体に改行を加える',
      state: saveWithAddBrTags,
      setter: setSaveWithAddBrTags,
    },
    // 新しいクリーニングオプションを追加する際は、ここにオブジェクトを追加します。
    // 例:
    // １．state追加
    // ２．オプション追加
    // {
    //   key: 'someNewOption',
    //   label: '新しいオプションの説明',
    //   state: someNewOptionState,
    //   setter: setSomeNewOptionState,
    // },
    // ３．依存配列に追加
    // ４．ProcessOptionsに　key　の値を追加設定する
  ], [
    stripPostHeaderTags, setStripPostHeaderTags,
    stripPostUsernameParentheses, setStripPostUsernameParentheses,
    saveWithAddBrTags, setSaveWithAddBrTags
  ]); // 依存配列にすべての state と setter を含める

  // 全てのクリーニングオプションの状態をまとめて取得するヘルパー関数
  const getProcessingOptions = useCallback((): ProcessOptions => {
    const options: ProcessOptions = {};
    cleaningOptionsConfig.forEach(config => {
      // config.key が ProcessOptions のプロパティとして型安全に存在することを確認
      // この cast が安全であることを保証するには ProcessOptions 型も拡張する必要があります
      (options as any)[config.key] = config.state;
    });
    return options;
  }, [cleaningOptionsConfig]);


  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(null);
      setExtractedElements([]);
      setParsedElements([]);
      setParseError(null);
      setIsLoading(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          const content = e.target.result;

          try {
            const cleanHtmlString = DOMPurify.sanitize(content, {
              USE_PROFILES: { html: true }, // HTMLプロファイルを有効にする
              FORBID_TAGS: ['script', 'iframe', 'object', 'embed'], // 特定の危険なタグを禁止
              FORBID_ATTR: ['onerror', 'onload'], // 特定の危険な属性を禁止
            });
            const parser = new DOMParser();
            const doc = parser.parseFromString(cleanHtmlString, 'text/html');

            const errorNode = doc.querySelector('parsererror');
            if (errorNode) {
              setParseError(`HTMLパースエラー: ${errorNode.textContent}`);
              return;
            }

            const canonicalLink = doc.querySelector('link[rel="canonical"]');
            if (canonicalLink) {
              setFileName(canonicalLink.getAttribute('href'));
            }
            const divsWithNumericId: ExtractedElement[] = [];
            const divElements = doc.querySelectorAll('div[id]');

            const currentProcessingOptions = getProcessingOptions();

            divElements.forEach(div => {
              const id = div.id;
              if (/^\d+$/.test(id)) {
                const originalHtml = div.outerHTML;
                const processedHtml = processHtmlString(originalHtml, currentProcessingOptions);

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = processedHtml;
                const postContent = tempDiv.querySelector('.post-content');
                let referencedId: string | null = null;
                if (postContent && postContent.textContent) {
                  const match = postContent.textContent.match(/>>(\d+)/);
                  if (match && match[1]) {
                    const numId = parseInt(match[1], 10);
                    if (numId < parseInt(id, 10)) {
                      referencedId = match[1];
                    }
                  }
                }

                divsWithNumericId.push({
                  id: id,
                  originalHtml: originalHtml,
                  processedHtml: processedHtml,
                  isSelected: false,
                  parentId: null,
                  referencedId: referencedId,
                  isManuallyMoved: false,
                  isNewTag: false,
                  children: [],
                  appliedTextColor: null,
                  isBold: false,
                  hasBorder: false,
                  isAA: false,
                  isText: false,
                  hasBr: false,
                });
              }
            });
            setExtractedElements(divsWithNumericId);

          } catch (error) {
            console.error("HTMLパースまたは抽出中にエラーが発生しました:", error);
            setParseError("HTMLの解析中に予期せぬエラーが発生しました。");
          } finally {
            setIsLoading(false); // ローディング画面終了処理
          }
        }
      };
      reader.readAsText(file);
    } else {
      setFileName(null);
      setExtractedElements([]);
      setParsedElements([]);
      setParseError(null);
    }
  }, [getProcessingOptions]);

  useEffect(() => {
    if (extractedElements.length === 0) {
      setParsedElements([]);
      return;
    }

    const elementMap = new Map<string, ExtractedElement>();
    extractedElements.forEach(item => {
      elementMap.set(item.id, { ...item, children: [] });
    });

    const rootElements: ExtractedElement[] = [];

    // ツリー構造の構築ロジック
    elementMap.forEach(item => {
      if (item.isManuallyMoved && item.parentId) {
        const parent = elementMap.get(item.parentId);
        if (parent) {
          parent.children.push(item);
        } else {
          // 親が見つからない場合、ルート要素として扱う（あるいはエラーハンドリング）
          rootElements.push(item);
        }
      } else if (!item.isManuallyMoved && item.referencedId) {
        const parent = elementMap.get(item.referencedId);
        if (parent && parent.id !== item.id) { // 自己参照を防ぐ
          parent.children.push(item);
          item.parentId = parent.id; // 親IDを設定
        } else {
          rootElements.push(item);
        }
      } else {
        rootElements.push(item);
      }
    });

    // 処理済み要素のトラッキング（循環参照や重複処理を防ぐため）
    const processedElements = new Set<string>();
    function markProcessed(element: ExtractedElement) {
      if (!processedElements.has(element.id)) {
        processedElements.add(element.id);
        element.children.forEach(child => markProcessed(child));
      }
    }
    rootElements.forEach(root => markProcessed(root));

    // 親が見つからなかったり、参照されなかったりした要素をルートに追加
    elementMap.forEach(item => {
      if (!processedElements.has(item.id)) {
        rootElements.push(item);
        markProcessed(item);
      }
    });

    const finalOrderedElements: ExtractedElement[] = [];

    rootElements.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));

    const currentProcessingOptions = getProcessingOptions();

    function traverse(element: ExtractedElement) {
      // processedHtml を再生成する際にオプションオブジェクトを渡す
      const updatedProcessedHtml = processHtmlString(element.originalHtml, {
        textColor: element.appliedTextColor,
        isBold: element.isBold,
        hasBorder: element.hasBorder,
        isAA: element.isAA,
        isText: element.isText,
        parentId: element.parentId,
        hasBr: element.hasBr,
        ...currentProcessingOptions
      });
      finalOrderedElements.push({ ...element, processedHtml: updatedProcessedHtml });

      element.children.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
      element.children.forEach(child => traverse(child));
    }

    rootElements.forEach(root => traverse(root));

    setParsedElements(finalOrderedElements);
  }, [extractedElements, getProcessingOptions]);

  const handleUpdateElement = useCallback((payload: ElementUpdatePayload) => {
    setExtractedElements(prevElements => {
      const updatedElements = prevElements.map(item =>
        item.id === payload.id ? { ...item, ...payload.updates } : item
      );
      return updatedElements;
    });
  }, []);

  const openMoveModal = useCallback((elementId: string) => {
    setMoveTargetElementId(elementId);
    setMoveDestIdInput('');
    setMoveAsRoot(false);
    setIsMoveModalOpen(true);
  }, []);

  const handleConfirmMove = useCallback(() => {
    if (!moveTargetElementId) return;

    // 親関係を解除する場合
    if (moveAsRoot) {
      setExtractedElements(prevElements => {
        const elementIndexToMove = prevElements.findIndex(item => item.id === moveTargetElementId);
        if (elementIndexToMove === -1) {
          alert(`ID ${moveTargetElementId} の要素が見つかりません。`);
          return prevElements;
        }
        const elementToMove = { ...prevElements[elementIndexToMove] };
        elementToMove.parentId = null; // 親関係を解除
        elementToMove.isManuallyMoved = true;

        const newElements = prevElements.filter(item => item.id !== moveTargetElementId);
        newElements.push(elementToMove);
        return newElements;
      });

    } else {
      // 親関係を維持する場合（既存のロジック）
      const targetId = moveDestIdInput.trim();
      if (!/^\d+$/.test(targetId)) {
        // window.alertの代わりに、カスタムモーダルまたはメッセージボックスを使用
        alert("移動先のIDは数値である必要があります。");
        return;
      }

      const targetElement = extractedElements.find(item => item.id === targetId && /^\d+$/.test(item.id));
      if (!targetElement) {
        alert(`移動先のID ${targetId} を持つdivタグが見つからないか、数値IDではありません。`);
        return;
      }

      setExtractedElements(prevElements => {
        const elementIndexToMove = prevElements.findIndex(item => item.id === moveTargetElementId);
        if (elementIndexToMove === -1) {
          alert(`ID ${moveTargetElementId} の要素が見つかりません。`);
          return prevElements;
        }

        const elementToMove = { ...prevElements[elementIndexToMove] };

        // 現在のツリー構造を再構築してチェック
        const currentTree = new Map<string, ExtractedElement & { children: ExtractedElement[] }>();
        prevElements.forEach(item => currentTree.set(item.id, { ...item, children: [] }));
        currentTree.forEach(item => {
          // 移動対象の要素を新しい親に設定した場合の仮の親子関係を考慮
          if (item.id === moveTargetElementId) {
              item.parentId = targetId; // 仮で移動先の親を設定
          }

          if (item.parentId && currentTree.has(item.parentId)) {
            (currentTree.get(item.parentId) as ExtractedElement & { children: ExtractedElement[] }).children.push(item);
          }
        });

        function isDescendant(ancestorId: string, descendantId: string): boolean {
          const ancestorNode = currentTree.get(ancestorId);
          if (!ancestorNode) return false;

          for (const child of ancestorNode.children) {
            if (child.id === descendantId) return true;
            if (isDescendant(child.id, descendantId)) return true;
          }
          return false;
        }

        // 移動元が移動先の子孫になる場合、循環参照
        if (isDescendant(moveTargetElementId, targetId) || moveTargetElementId === targetId) {
          alert(`ID ${moveTargetElementId} をその子孫ID ${targetId} の下に移動することはできません。循環参照になります。`);
          return prevElements;
        }

        elementToMove.parentId = targetId;
        elementToMove.isManuallyMoved = true;

        const newElements = prevElements.filter(item => item.id !== moveTargetElementId);
        newElements.push(elementToMove);

        return newElements;
      });
    }

    setIsMoveModalOpen(false);
    setMoveTargetElementId(null);
    setMoveDestIdInput('');
    setMoveAsRoot(false);
  }, [moveTargetElementId, moveDestIdInput, extractedElements, moveAsRoot]); // parsedElements は不要になった

  const openAddTagModal = useCallback((parentId: string) => {
    setAddTagTargetParentId(parentId);
    setNewTagContentInput('');
    setAddTagAsRoot(false);
    setIsAddTagModalOpen(true);
  }, []);

  const handleConfirmAddTag = useCallback(() => {
    if (!addTagAsRoot && !addTagTargetParentId) { // 親関係なしオプションがオフで、親IDがない場合
      alert("新しいタグの親となるタグのIDが指定されていないか、親関係を作らないオプションがオフです。");
      return;
    }

    const newTagContent = newTagContentInput.trim();
    if (newTagContent === "") {
      alert("新しいタグのHTMLコンテンツを入力してください。");
      return;
    }

    const newId = `${Date.now()}`;

    const sanitizedNewTagContent = DOMPurify.sanitize(newTagContent, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onerror', 'onload'],
    });

    const finalOriginalHtml = sanitizedNewTagContent.startsWith('<') && sanitizedNewTagContent.endsWith('>')
      ? sanitizedNewTagContent
      : `<div class="post"><div class="post-content">${sanitizedNewTagContent}</div></div>`;

    const processedNewContent = processHtmlString(finalOriginalHtml, getProcessingOptions());

    console.log(processedNewContent);
    const newElement: ExtractedElement = {
      id: newId,
      originalHtml: finalOriginalHtml,
      processedHtml: processedNewContent,
      isSelected: false,
      parentId: addTagAsRoot ? null : addTagTargetParentId,
      referencedId: null,
      isManuallyMoved: true,
      isNewTag: true,
      children: [],
      appliedTextColor: null,
      isBold: false,
      hasBorder: false,
      isAA: false,
      isText: false,
      hasBr: false,
    };

    setExtractedElements(prevElements => {
      return [...prevElements, newElement];
    });

    setIsAddTagModalOpen(false);
    setAddTagTargetParentId(null);
    setNewTagContentInput('');
    setAddTagAsRoot(false);
  }, [addTagTargetParentId, newTagContentInput, addTagAsRoot, getProcessingOptions]);

  // 新しい削除モーダルを開く関数
  const openDeleteModal = useCallback((elementId: string) => {
    setDeleteTargetElementId(elementId);
    setIsDeleteModalOpen(true);
  }, []);

  // 削除を確定する関数
  const handleConfirmDelete = useCallback(() => {
    if (!deleteTargetElementId) return;

    setExtractedElements(prevElements => {
      // 削除対象のIDの子孫IDをすべて収集する
      const elementMap = new Map<string, ExtractedElement & { children: ExtractedElement[] }>();
      prevElements.forEach(item => elementMap.set(item.id, { ...item, children: [] }));
      elementMap.forEach(item => {
        if (item.parentId && elementMap.has(item.parentId)) {
          (elementMap.get(item.parentId) as ExtractedElement & { children: ExtractedElement[] }).children.push(item);
        } else if (item.referencedId && elementMap.has(item.referencedId)) {
          (elementMap.get(item.referencedId) as ExtractedElement & { children: ExtractedElement[] }).children.push(item);
        }
      });

      const idsToDelete = new Set<string>();
      function collectChildrenIds(elementId: string) {
        if (idsToDelete.has(elementId)) return;
        idsToDelete.add(elementId);
        const element = elementMap.get(elementId);
        if (element) {
          element.children.forEach(child => collectChildrenIds(child.id));
        }
      }

      collectChildrenIds(deleteTargetElementId);

      // 収集したIDを持つ要素をフィルタリングして削除する
      return prevElements.filter(item => !idsToDelete.has(item.id));
    });

    setIsDeleteModalOpen(false);
    setDeleteTargetElementId(null);
  }, [deleteTargetElementId]);

  // ダウンロード確認モーダルを開くための関数
  const handleSaveHtml = useCallback(() => {
    const selectedHtmls = parsedElements
      .filter(item => item.isSelected)
      .map(item => {
        const sanitizedProcessedHtml = DOMPurify.sanitize(item.processedHtml, {
          USE_PROFILES: { html: true },
          FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
          FORBID_ATTR: ['onerror', 'onload'],
        });
        const parser = new DOMParser();
        // bodyタグでラップして解析し、そのbody内の最初の要素のouterHTMLを返す
        const doc = parser.parseFromString(`<body>${sanitizedProcessedHtml}</body>`, 'text/html');
        const rootElement = doc.body.firstChild as HTMLElement;
        return rootElement ? rootElement.outerHTML : sanitizedProcessedHtml;
      });

    if (selectedHtmls.length === 0) {
      alert("保存するHTMLタグが選択されていません。「採用」チェックボックスをオンにしてください。");
      return;
    }

    const combinedHtml = selectedHtmls.join('\n');
    setHtmlToDownload(combinedHtml); // ダウンロードするHTMLをステートに保存
    setIsDownloadConfirmModalOpen(true); // 確認モーダルを開く
  }, [parsedElements]);

  // ダウンロードを実際に実行する関数
  const handleConfirmDownload = useCallback(() => {
    if (htmlToDownload) {
      const blob = new Blob([htmlToDownload], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `exported_html_${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setHtmlToDownload(null); // ダウンロード後、HTMLコンテンツをクリア
      setIsDownloadConfirmModalOpen(false); // モーダルを閉じる
    }
  }, [htmlToDownload]);

  // isSelected が true のタグの数を計算
  const selectedTagCount = useMemo(() => {
    return parsedElements.filter(item => item.isSelected).length;
  }, [parsedElements]);

  // インデックス指定スクロール処理の関数
  const handleScrollToIndex = useCallback(() => {
    const indexToScroll = parseInt(scrollToIndexInput, 10);
    if (!isNaN(indexToScroll) && indexToScroll >= 0 && indexToScroll < parsedElements.length) {
      // Virtuoso の ref を使用してスクロール
      virtuosoRef.current?.scrollToIndex({
        index: indexToScroll,
        align: 'start', // 'start', 'center', 'end' でスクロール位置を調整
        behavior: 'auto' // スムーズなスクロール
      });
    } else {
      alert("有効なインデックスを入力してください。");
    }
  }, [scrollToIndexInput, parsedElements.length]);


  // renderItem を ElementItem コンポーネントに置き換え
  const renderItem = useCallback((index: number) => {
    const item = parsedElements[index];
    if (!item) return null;

    return (
      <ElementItem
        item={item}
        index={index}
        onUpdateElement={handleUpdateElement}
        onOpenMoveModal={openMoveModal}
        onOpenAddTagModal={openAddTagModal}
        onOpenDeleteModal={openDeleteModal}
      />
    );
  }, [parsedElements, handleUpdateElement, openMoveModal, openAddTagModal, openDeleteModal]);

  return (
    <div className="App">
      <h1>HTMLコード編集Webアプリ</h1>
      <input type="file" accept=".html,.htm,.txt,.dat" onChange={handleFileChange} />
      {!fileName && !parseError && parsedElements.length === 0 && (
        <p>HTMLファイル（他.htm .dat .txt）を選択してください。</p>
      )}

      <div style={{ marginTop: '10px', marginBottom: '10px' }}>
        {cleaningOptionsConfig.map(option => (
          <div key={option.key} style={{ marginBottom: '5px' }}>
            <label>
              <input
                type="checkbox"
                checked={option.state}
                onChange={(e) => option.setter(e.target.checked)}
              />
              {option.label}
            </label>
          </div>
        ))}
      </div>

      {fileName && <p>読み込んだスレッド: {fileName}</p>}

      {parseError && (
        <div style={{ color: 'red', border: '1px solid red', padding: '10px', marginTop: '10px' }}>
          <h3>エラー:</h3>
          <p>{parseError}</p>
          <p>HTMLファイルの内容を確認してください。</p>
        </div>
      )}

      {parsedElements.length > 0 && (
        <>
        <div className="resList" style={{ marginTop: '20px', maxHeight: '600px' }}>
          <p>合計： {selectedTagCount} / {parsedElements.length} 個のタグを抽出しました。</p>

          {/* スクロール機能の追加箇所 */}
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="scrollToIndexInput">インデックスでスクロール:</label>
            <input
              id="scrollToIndexInput"
              type="number"
              value={scrollToIndexInput}
              onChange={(e) => setScrollToIndexInput(e.target.value)}
              min="0"
              max={parsedElements.length - 1}
              style={{ marginLeft: '5px', width: '80px' }}
            />
            <button
              onClick={handleScrollToIndex}
              style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              スクロール
            </button>
          </div>

          <div style={{  }}>
            <button
              onClick={handleSaveHtml}
              style={{ padding: '10px 20px', backgroundColor:'rgb(0, 123, 255)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              選択中のタグをHTMLとして保存
            </button>
            <p style={{ fontSize: '0.9em', color: '#555', marginTop: '5px' }}>
              「採用」にチェックが入ったタグのみが保存されます。
            </p>
          </div>
        </div>
        <div style={{ marginTop: '20px', minHeight: '800px' }}>
          <p>（スクロールして内容を確認・操作してください）</p>
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: '800px', fontSize: '1.0em' }}
            totalCount={parsedElements.length}
            itemContent={renderItem}
            increaseViewportBy={{ top: 500, bottom: 500 }}
          />
        </div>
        </>
      )}

      {/* 移動モーダル */}
      <Modal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} title={moveAsRoot ? 'ルート要素として移動' : `タグID: ${moveTargetElementId} の移動`}>
        <p>
          タグID: <strong>{moveTargetElementId}</strong> を移動させます。
        </p>
        {!moveAsRoot && ( // 親関係を解除しない場合のみ表示
          <>
            <label htmlFor="moveDestIdInput">移動先の親タグのIDを入力してください:</label>
            <input
              id="moveDestIdInput"
              type="text"
              value={moveDestIdInput}
              onChange={(e) => setMoveDestIdInput(e.target.value)}
              style={{ width: '100%', padding: '8px', margin: '10px 0', boxSizing: 'border-box' }}
              placeholder="例: 123"
            />
          </>
        )}
        {/* 新しいオプションの追加 */}
        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={moveAsRoot}
              onChange={(e) => setMoveAsRoot(e.target.checked)}
            />
            親関係を解除して、ルート要素として移動する
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={() => setIsMoveModalOpen(false)} style={{ padding: '8px 15px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>キャンセル</button>
          <button onClick={handleConfirmMove} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>移動を実行</button>
        </div>
      </Modal>

      {/* 新規タグ挿入モーダル */}
      <Modal isOpen={isAddTagModalOpen} onClose={() => setIsAddTagModalOpen(false)} title={addTagAsRoot ? '新しいルートタグの挿入' : `タグID: ${addTagTargetParentId} の下に新しいタグを挿入`}>
        <p>
          {addTagAsRoot
            ? `親関係を作らず、新しいルートタグをリスト最下部に挿入します。`
            : `タグID: <strong>${addTagTargetParentId}</strong> の下に新しいタグを挿入します。`}
        </p>
        <label htmlFor="newTagContentInput">新しいタグのHTMLコンテンツを入力してください:</label>
        <textarea
          id="newTagContentInput"
          value={newTagContentInput}
          onChange={(e) => setNewTagContentInput( DOMPurify.sanitize(e.target.value) )}
          rows={5}
          style={{ width: '100%', padding: '8px', margin: '10px 0', boxSizing: 'border-box' }}
          placeholder='例: <p>新規追加テキスト</p> または <div class="post-content">新しい内容</div>'
        />
        {/* 新しいオプションの追加 */}
        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={addTagAsRoot}
              onChange={(e) => setAddTagAsRoot(e.target.checked)}
            />
            親関係を作らず、ルート要素として挿入する
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={() => setIsAddTagModalOpen(false)} style={{ padding: '8px 15px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>キャンセル</button>
          <button onClick={handleConfirmAddTag} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>タグを挿入</button>
        </div>
      </Modal>

      {/* 削除モーダル */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={`タグID: ${deleteTargetElementId} の削除`}>
        <p>タグID: <strong>{deleteTargetElementId}</strong> を削除してもよろしいですか？</p>
        <p>親タグを削除すると子タグも同時に消えます。<br/>子タグを残したい場合は別の親タグに紐づけてから削除を実行してください。</p>
        <p style={{ color: 'red', fontWeight: 'bold' }}>この操作は取り消せません。</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={() => setIsDeleteModalOpen(false)} style={{ padding: '8px 15px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>キャンセル</button>
          <button onClick={handleConfirmDelete} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>削除を実行</button>
        </div>
      </Modal>

      {/* ダウンロード確認モーダル */}
      <Modal isOpen={isDownloadConfirmModalOpen} onClose={() => setIsDownloadConfirmModalOpen(false)} title="HTMLコードの確認とダウンロード">
        <p>以下のHTMLコードがダウンロードされます。</p>
        <textarea
          // readOnly
          value={htmlToDownload || ''}
          onChange={(e) => setHtmlToDownload(e.target.value)} // 編集を可能にする
          rows={15}
          style={{ width: '500px', padding: '8px', margin: '10px 0', boxSizing: 'border-box', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={() => setIsDownloadConfirmModalOpen(false)} style={{ padding: '8px 15px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>キャンセル</button>
          <button onClick={handleConfirmDownload} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>ダウンロード</button>
        </div>
      </Modal>

      <LoadingSpinner isLoading={isLoading} />
    </div>
  );
}

export default App;
