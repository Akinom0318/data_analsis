import time
import json
import os
from datetime import datetime
import psutil
import win32gui
import win32process

LOG_FILE = os.path.join(os.path.dirname(__file__), "data.json")
SAVE_INTERVAL = 60  # 每 60 秒寫檔一次
POLL_INTERVAL = 1   # 每秒檢查一次前景視窗


def load_logs():
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:  # 檔案為空或格式不正確
            return []
    return []

def save_logs(logs):
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(logs, f, ensure_ascii=False, indent=2)


def get_foreground_app():
    hwnd = win32gui.GetForegroundWindow()
    if hwnd == 0:
        return None, None

    # 視窗標題（抓到網頁標題可能靠這個）
    title = win32gui.GetWindowText(hwnd)

    try:
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        process = psutil.Process(pid)
        name = process.name()
    except:
        return None, None

    return name, title


def main():
    logs = load_logs()

    last_app = None
    last_title = None
    start_time = datetime.now()

    last_save_time = time.time()

    print("開始監控前景視窗...")

    while True:
        try:
            app, title = get_foreground_app()
            now = datetime.now()

            # 若首次 or 程式不同 or 標題不同（分頁不同）
            if (app != last_app) or (title != last_title):
                # 寫入上一段紀錄
                if last_app is not None:
                    end_time = now
                    duration = (end_time - start_time).total_seconds()

                    logs.append({
                        "app": last_app,
                        "title": last_title,
                        "start": start_time.isoformat(),
                        "end": end_time.isoformat(),
                        "duration_sec": duration
                    })

                # 換新的
                last_app = app
                last_title = title
                start_time = now

            # 定期寫檔
            if time.time() - last_save_time >= SAVE_INTERVAL:
                save_logs(logs)
                last_save_time = time.time()
                print(f"[{datetime.now()}] 已寫入 JSON")

            time.sleep(POLL_INTERVAL)

        except KeyboardInterrupt:
            print("停止監控，寫入最後紀錄...")
            break

    # 結束前把最後一段寫入
    end_time = datetime.now()
    if last_app is not None:
        duration = (end_time - start_time).total_seconds()

        logs.append({
            "app": last_app,
            "title": last_title,
            "start": start_time.isoformat(),
            "end": end_time.isoformat(),
            "duration_sec": duration
        })

    save_logs(logs)
    print("所有紀錄已寫入完成。")


if __name__ == "__main__":
    main()
