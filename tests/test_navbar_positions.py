import pytest
import subprocess
import json
import urllib.request
import asyncio
import websockets
from typing import Dict, Any, List

async def cdp_eval(ws_url: str, js_expr: str) -> Any:
    async with websockets.connect(ws_url) as ws:
        msg = {
            "id": 1,
            "method": "Runtime.evaluate",
            "params": {
                "expression": js_expr,
                "returnByValue": True
            }
        }
        await ws.send(json.dumps(msg))
        resp = json.loads(await ws.recv())
        return resp.get("result", {}).get("result", {}).get("value")

@pytest.mark.asyncio
async def test_navbar_position_changes_across_sections():
    """Verify that navbar and tabbar dynamically adapt position across Feed and Notifications."""
    # Check device connectivity
    dev_res = subprocess.run(["adb", "devices"], capture_output=True, text=True,
                             env={"ADB_SERVER_SOCKET": "tcp:127.0.0.1:5037", "PATH": "/usr/bin:/bin"})
    connected_devs = [ln.split()[0] for ln in dev_res.stdout.splitlines()[1:] if ln.strip() and "device" in ln]
    if not connected_devs:
        pytest.skip("No running Android emulator detected via ADB")

    # Ensure app is alive
    pid_res = subprocess.run(["adb", "shell", "pidof", "com.b1alek.materialbook.test"],
                             capture_output=True, text=True,
                             env={"ADB_SERVER_SOCKET": "tcp:127.0.0.1:5037", "PATH": "/usr/bin:/bin"})
    pid = pid_res.stdout.strip()
    if not pid:
        pytest.skip("App com.b1alek.materialbook.test is not running on device")

    # Forward port to webview devtools
    port = "9231"
    subprocess.run(["adb", "forward", f"tcp:{port}", f"localabstract:webview_devtools_remote_{pid}"],
                   check=True, env={"ADB_SERVER_SOCKET": "tcp:127.0.0.1:5037", "PATH": "/usr/bin:/bin"})

    # Query devtools targets
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/json", timeout=5) as r:
            pages = json.loads(r.read())
    except Exception as e:
        pytest.skip(f"Could not connect to DevTools port {port}: {e}")
    
    page = next((p for p in pages if "facebook.com" in p.get("url", "") and p.get("type") == "page"), None)
    if not page:
        pytest.skip("No active Facebook page found in DevTools")
    ws_url = page["webSocketDebuggerUrl"]

    # Verify if user is logged into Feed or at login screen
    is_login_page = await cdp_eval(ws_url, "!!document.querySelector('input[name=\"email\"], #m_login_email')")
    if is_login_page:
        pytest.skip("WebView is at Facebook login screen; skipping authenticated feed navbar test")

    # 1. Navigate to Feed (Tab 0)
    await cdp_eval(ws_url, """
        (() => {
            const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
            if (tabs[0]) tabs[0].click();
        })()
    """)
    await asyncio.sleep(2.0)

    feed_state = await cdp_eval(ws_url, """
        (() => {
            const logo = document.querySelector('div[aria-label*="Facebook"]');
            const tabbar = document.querySelector('[role="tablist"]');
            return {
                url: window.location.href,
                hasLogo: !!logo,
                tabbarTop: tabbar ? tabbar.style.top : null,
                tabbarRectTop: tabbar ? tabbar.getBoundingClientRect().top : null
            };
        })()
    """)
    assert feed_state["hasLogo"] is True, "Feed page must contain Facebook brand logo"
    assert feed_state["tabbarTop"] == "43px", f"On Feed, tabbar must sit below navbar at 43px (got {feed_state['tabbarTop']})"
    assert feed_state["tabbarRectTop"] == 43, f"On Feed, tabbar top rect must be 43 (got {feed_state['tabbarRectTop']})"

    # 2. Navigate to Notifications (Tab 4)
    await cdp_eval(ws_url, """
        (() => {
            const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
            const notifTab = tabs.find(t => (t.getAttribute('aria-label') || '').includes('notifications')) || tabs[4];
            if (notifTab) notifTab.click();
        })()
    """)
    await asyncio.sleep(2.0)

    notif_state = await cdp_eval(ws_url, """
        (() => {
            const logo = document.querySelector('div[aria-label*="Facebook"]');
            const tabbar = document.querySelector('[role="tablist"]');
            return {
                url: window.location.href,
                hasLogo: !!logo,
                tabbarTop: tabbar ? tabbar.style.top : null,
                tabbarRectTop: tabbar ? tabbar.getBoundingClientRect().top : null
            };
        })()
    """)
    assert notif_state["hasLogo"] is False, "Notifications page does not contain brand logo"
    assert notif_state["tabbarTop"] == "0px", f"On Notifications, tabbar must stick to top: 0px (got {notif_state['tabbarTop']})"
    assert notif_state["tabbarRectTop"] == 0, f"On Notifications, tabbar top rect must be 0 (got {notif_state['tabbarRectTop']})"

    # Return to Feed
    await cdp_eval(ws_url, """
        (() => {
            const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
            if (tabs[0]) tabs[0].click();
        })()
    """)
