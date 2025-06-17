/*
import LoadingSpinner from './components/LoadingSpinner';
    インポート宣言

const [isLoading, setIsLoading] = useState<boolean>(false);
    isLoadingという状態変数を作成し、初期値はfalse（非ローディング中）に設定します。

setIsLoading(true); // ローディング画面を実行
    使用したい関数内で、
    処理を開始する直前にisLoadingをtrueに設定し、ローディングアニメーションを表示します。
    環境依存やメモ化などと干渉しないように呼び出し位置には気を付ける。

try {
    //
    //　ここにローディング画面中に処理する内容を記載
    //
} catch (error) {
    console.error('処理エラー発生:', error);
} finally {
    setIsLoading(false); // ローディング画面終了処理
}

<LoadingSpinner isLoading={isLoading} />
    ローディングコンポーネント表示用

*/

import React from 'react';
import './LoadingSpinner.css'; // スタイルシートをインポート

interface LoadingSpinnerProps {
  isLoading: boolean; // ローディング中かどうかを示すプロパティ
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ isLoading }) => {
  if (!isLoading) {
    return;
  }

  return (
    <div className="loading-spinner-overlay">
      <div className="spinner"></div>
      <p>ファイル読み込み中</p> {/* 必要に応じてメッセージを追加 */}
    </div>
  );
};

export default LoadingSpinner;
