import React, { useState, useCallback, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import './App.css';


interface ExtractedElement {
  id: string;
  originalHtml: string;
}

function App() {

  const divsWithNumericId: ExtractedElement[] = [];
  divsWithNumericId.push({ id: '1', originalHtml: "xxx" });
  divsWithNumericId.push({ id: '2', originalHtml: "xxx" });
  const item = divsWithNumericId[0];

  return (
    <>
      <div className="hamburger-menu">
        <input type="checkbox" id="menu-toggle-1" className="menu-toggle"/>
        <label htmlFor="menu-toggle-1" className="menu-icon">&#9776;</label>
        <div className="tagControls">
          <ul>
            <li>メニュー1</li>
            <li>メニュー2</li>
            <li>メニュー3</li>
          </ul>
        </div>
      </div>

      <div className="hamburger-menu">
        <input type="checkbox" id="menu-toggle-2" className="menu-toggle"/>
        <label htmlFor="menu-toggle-2" className="menu-icon">&#9776;</label>
        <div className="tagControls">
          <ul>
            <li>オプションA</li>
            <li>オプションB</li>
          </ul>
        </div>
      </div>
    </>
  );

}
export default App;