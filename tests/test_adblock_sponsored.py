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
async def test_adblock_sponsored_detection_and_hiding():
    """Verify that adblock.js correctly detects, counts, and hides sponsored ads."""
    # Check device connectivity
    dev_res = subprocess.run(["adb", "devices"], capture_output=True, text=True,
                             env={"ADB_SERVER_SOCKET": "tcp:127.0.0.1:5037", "PATH": "/usr/bin:/bin"})
    connected_devs = [ln.split()[0] for ln in dev_res.stdout.splitlines()[1:] if ln.strip() and "device" in ln]
    if not connected_devs:
        pytest.skip("No running Android emulator detected via ADB")

    # Ensure app is running
    pid_res = subprocess.run(["adb", "shell", "pidof", "com.b1alek.materialbook.test"],
                             capture_output=True, text=True,
                             env={"ADB_SERVER_SOCKET": "tcp:127.0.0.1:5037", "PATH": "/usr/bin:/bin"})
    pid = pid_res.stdout.strip()
    if not pid:
        pytest.skip("App com.b1alek.materialbook.test is not running on device")

    # Forward port to webview devtools
    port = "9235"
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

    # 1. Test live DOM baseline
    initial_stats = await cdp_eval(ws_url, """
        (() => {
            const hiddenAds = document.querySelectorAll('[data-ad-hidden="true"]');
            const totalPosts = document.querySelectorAll('[data-tracking-duration-id]');
            return {
                hiddenCount: hiddenAds.length,
                totalPosts: totalPosts.length
            };
        })()
    """)
    assert isinstance(initial_stats["hiddenCount"], int)
    assert isinstance(initial_stats["totalPosts"], int)

    # 2. Inject synthetic sponsored posts (English and Polish variants) into DOM
    injection_res = await cdp_eval(ws_url, """
        (() => {
            const scroller = document.querySelector('div[data-type="vscroller"]') || document.body;
            
            // Post A: English 'Sponsored' with aria-label
            const adA = document.createElement('div');
            adA.id = 'test-ad-english';
            adA.setAttribute('data-tracking-duration-id', '99901');
            adA.setAttribute('data-mcomponent', 'MContainer');
            adA.setAttribute('class', 'm');
            adA.innerHTML = '<header><span class="f5" aria-label="Sponsored">Sponsored</span></header><p>Test Ad Content</p>';
            scroller.appendChild(adA);

            // Post B: Polish 'Sponsorowane' with transparency link
            const adB = document.createElement('div');
            adB.id = 'test-ad-polish';
            adB.setAttribute('data-tracking-duration-id', '99902');
            adB.setAttribute('data-mcomponent', 'MContainer');
            adB.setAttribute('class', 'm');
            adB.innerHTML = '<header><span class="f5">Sponsorowane</span><a href="https://m.facebook.com/ads/about">About this ad</a></header><p>Reklama testowa</p>';
            scroller.appendChild(adB);

            // Post C: Organic post (NOT sponsored)
            const organic = document.createElement('div');
            organic.id = 'test-organic-post';
            organic.setAttribute('data-tracking-duration-id', '99903');
            organic.setAttribute('data-mcomponent', 'MContainer');
            organic.setAttribute('class', 'm');
            organic.innerHTML = '<header><span class="f5">Normal User Name</span></header><p>Hello world!</p>';
            scroller.appendChild(organic);

            return { injected: true };
        })()
    """)
    assert injection_res["injected"] is True

    # Allow MutationObserver in adblock.js to process added nodes
    await asyncio.sleep(1.0)

    # 3. Verify detection, hiding, and display: none
    verify_stats = await cdp_eval(ws_url, """
        (() => {
            const adA = document.getElementById('test-ad-english');
            const adB = document.getElementById('test-ad-polish');
            const organic = document.getElementById('test-organic-post');

            return {
                adAHiddenAttr: adA ? (adA.dataset.adHidden || null) : null,
                adADisplay: adA ? window.getComputedStyle(adA).display : null,
                adBHiddenAttr: adB ? (adB.dataset.adHidden || null) : null,
                adBDisplay: adB ? window.getComputedStyle(adB).display : null,
                organicHiddenAttr: organic ? (organic.dataset.adHidden || null) : null,
                organicDisplay: organic ? window.getComputedStyle(organic).display : null
            };
        })()
    """)

    # Verify English ad hidden
    assert verify_stats.get("adAHiddenAttr") == "true", "English sponsored ad must have data-ad-hidden='true'"
    assert verify_stats.get("adADisplay") == "none", "English sponsored ad must have display: none"

    # Verify Polish ad hidden
    assert verify_stats.get("adBHiddenAttr") == "true", "Polish sponsored ad must have data-ad-hidden='true'"
    assert verify_stats.get("adBDisplay") == "none", "Polish sponsored ad must have display: none"

    # Verify organic post kept visible
    assert verify_stats.get("organicHiddenAttr") is None, "Organic post must NOT have data-ad-hidden"
    assert verify_stats.get("organicDisplay") != "none", "Organic post must remain visible"

    # Cleanup test elements
    await cdp_eval(ws_url, """
        (() => {
            document.getElementById('test-ad-english')?.remove();
            document.getElementById('test-ad-polish')?.remove();
            document.getElementById('test-organic-post')?.remove();
        })()
    """)
