// src/components/ElementItem.tsx

import React from 'react';
import type { ElementUpdatePayload, ExtractedElement } from '../types';
import { TEXT_COLORS } from '../constants/colors';

interface ElementItemProps {
  item: ExtractedElement;
  index: number;
  onUpdateElement: (payload: ElementUpdatePayload) => void;
  onOpenMoveModal: (elementId: string) => void;
  onOpenAddTagModal: (parentId: string) => void;
  onOpenDeleteModal: (parentId: string) => void;
}

// タグコントロールコンテナ　更新場所
//　１．ElementItem.tsx内　チェックボックス・ラジオボタンのタグ設置
//　２．index.ts内　ExtractedElement　や　ProcessOptions　への設定
//　３．App.tsx内　
//    useEffect　＞　function traverse(element: ExtractedElement)　の　element.オプション　への設定
//    handleFileChange　＞　reader.onload　＞　divsWithNumericId.push({　への設定
//    handleConfirmAddTag　＞　const newElement: ExtractedElement　への設定

const ElementItem: React.FC<ElementItemProps> = ({
  item,
  index,
  onUpdateElement,
  onOpenMoveModal,
  onOpenAddTagModal,
  onOpenDeleteModal,
}) => {
  return (
    <div
      key={item.id + '-' + index}
      style={{
        borderBottom: '1px dotted #ccc',
        padding: '0px 0px',
        backgroundColor: item.isSelected ? '#e0f7fa' : item.isNewTag ? '#fffacd' : 'white',
        marginLeft: item.parentId ? '15px' : '0',
        borderLeft: item.parentId ? '0px solid #aaa' : 'none',
        fontStyle: item.isNewTag ? 'italic' : 'normal',
      }}
    >
      <div className="tagControlsContainer">
        <div className="idLabel">
          <div className="keepCheck" style={{ }}>
            <label>
              <input
                type="checkbox"
                checked={item.isSelected}
                onChange={() => onUpdateElement({ id: item.id, updates: { isSelected: !item.isSelected } })}
              />
              採用
            </label>
          </div>
          <div className="tagId" style={{ }}>
            <strong>ID:</strong> {item.id} <span className="relIndex">(Index: {index})
            {item.isNewTag && <span style={{ color: 'orange', marginLeft: '5px' }}>[新規]</span>}
            {item.isManuallyMoved && <span style={{ color: 'purple', marginLeft: '5px' }}>[手動移動]</span>}
            {item.parentId && <span> - 親ID: {item.parentId}</span>}
            {item.referencedId && !item.isManuallyMoved && <span> - 参照ID: {item.referencedId}</span>}</span>
          </div>
        </div>
        <div className="hamburger-menu slide" id={`tagControls-${item.id}`}>
          <input type="checkbox" id={`menu-toggle-slide-${item.id}`} className="menu-toggle"/>
          <label htmlFor={`menu-toggle-slide-${item.id}`} className="menu-icon">&#9776;</label>
          <nav className="tagControls">
            <ul className="tagControlsColor">
              <li className="tagControls-cid"><div><strong>control ID:</strong> {item.id}</div></li>
              {/* テキストカラー設定ラジオボタン */}
              <li style={{  }}>
                <div className="colorLabel">色:</div>
                <div>{Object.entries(TEXT_COLORS).map(([name, colorValue]) => (
                  <label key={name} style={{ marginLeft: '10px' }}>
                    <input
                      type="radio"
                      name={`textColor-${item.id}`}
                      value={colorValue}
                      checked={item.appliedTextColor === colorValue}
                      onChange={() => onUpdateElement({ id: item.id, updates: { appliedTextColor: colorValue } })}
                    />
                    {name === '' ? '適用無し' : <span style={{ color: colorValue }}>■</span>}
                  </label>
                ))}</div>
              </li>
            </ul>
            <ul className="tagControlsStyle">
              {/* 太字設定チェックボックス */}
              <li style={{  }}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.isBold}
                    onChange={() => onUpdateElement({ id: item.id, updates: { isBold: !item.isBold } })}
                  />
                  太字
                </label>
              </li>
              {/* 強調設定チェックボックス */}
              <li style={{  }}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.hasBorder}
                    onChange={() => onUpdateElement({ id: item.id, updates: { hasBorder: !item.hasBorder } })}
                  />
                  強調
                </label>
              </li>
              {/* AA設定チェックボックス */}
              <li style={{  }}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.isAA}
                    onChange={() => onUpdateElement({ id: item.id, updates: { isAA: !item.isAA } })}
                  />
                  AA
                </label>
              </li>
              {/* 本文設定チェックボックス */}
              <li style={{  }}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.isText}
                    onChange={() => onUpdateElement({ id: item.id, updates: { isText: !item.isText } })}
                  />
                  本文タグ<span style={{ fontSize: '0.6em' }}>※CSS依存</span>
                </label>
              </li>
              {/* レス前後の改行設定チェックボックス */}
              <li style={{  }}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.hasBr}
                    onChange={() => onUpdateElement({ id: item.id, updates: { hasBr: !item.hasBr } })}
                  />
                  改行
                </label>
              </li>
            {/*</ul>
            <ul className="tagControlsModal">*/}
              <li>
                <div className="colorLabel">タグ操作:</div>
              </li>
              <li>
                <button
                  onClick={() => onOpenMoveModal(item.id)}
                  style={{ backgroundColor: '#e6e6fa', border: '1px solid #ccc', cursor: 'pointer' }}
                >
                  移動
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAddTagModal(item.id)}
                  style={{ backgroundColor: '#d4edda', border: '1px solid #ccc', cursor: 'pointer' }}
                >
                  挿入
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenDeleteModal(item.id)}
                  style={{ backgroundColor: '#d4edda', border: '1px solid #ccc', cursor: 'pointer' }}
                >
                  削除
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      <div style={{ fontSize: '0.9em', color: '#111', border: '0px solid #eee', padding: '5px 25px', textAlign: 'left' }}>
        <div dangerouslySetInnerHTML={{ __html: item.processedHtml }} />
      </div>
    </div>
  );
};

export default ElementItem;