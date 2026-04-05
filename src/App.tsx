import { useEffect } from "react";
import { Outlet } from "react-router";

function App() {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [{ check }, { ask }, { relaunch }] = await Promise.all([
          import("@tauri-apps/plugin-updater"),
          import("@tauri-apps/plugin-dialog"),
          import("@tauri-apps/plugin-process"),
        ]);

        const update = await check();
        const available =
          !!update && (typeof update.available === "boolean" ? update.available : true);

        if (!available) return;

        const ok = await ask(`发现新版本 ${update.version}，是否立即更新？`, {
          title: "更新提示",
          kind: "info",
          okLabel: "更新",
          cancelLabel: "稍后",
        });

        if (!ok || cancelled) return;

        await update.downloadAndInstall();
        await relaunch();
      } catch {
        return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Outlet />
  );
}

export default App;
