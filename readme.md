# App Usage Analyzer

小型桌面應用，用來記錄使用者前景視窗（應用程式名稱、視窗標題、使用時長）並在前端顯示分析結果。

目錄結構（重要檔案）：
- `backend/`：Python 後端程式，包含 `project.py`（監控前景視窗並寫入 `data.json`）與 `requirements.txt`。
- `frontend/`：Electron 應用（`main.js`, `index.html`, `package.json`）。
- `imgs/`：圖示檔。

## 快速開始（Windows）
### 複製專案並切到 repo 根目錄

後端（Python）
```powershell
cd <repo-root>\backend
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
python project.py
```

前端（Electron）
```powershell
cd <repo-root>\frontend
npm install
npm start
```

### 同時啟動（開發用）
在 repo 根執行（會開兩個 PowerShell 窗口）：
```powershell
.\start-all.ps1
```

如果你無法使用 `py` 命令，請改用系統上的 `python`，或在 `frontend/main.js` 中修改 `pythonCmd` 的設定。

開機自動啟動（Autolaunch）與系統列（Tray）
- `frontend/main.js` 已加入：
  - `app.setLoginItemSettings({ openAtLogin: true })` 預設設定（開發時可改為 false）。
  - 建立系統列圖示（Tray），啟動時預設隱藏視窗，右鍵選單包含 `Show` 與 `Quit`。
  - 啟動時會 spawn Python 子程序運行 `backend/project.py`，並在退出時嘗試關閉子程序。

開發者注意事項
- `project.py` 使用 `pywin32` 與 `psutil`，僅能在 Windows 上運作。
- 若要發佈給其他使用者，建議：
  - 把後端改為獨立可打包的程式或服務（避免要求使用者安裝 Python）；或
  - 用 Node.js 實作監控（如可能）以減少跨程式語言的部署難度。

## what if I want to see the new data?

click the "reload data"on top right corner:

![reload data pic](./imgs/relaod.png)