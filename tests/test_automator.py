"""Unit tests for automator package modules."""

import os
from pathlib import Path
from typer.testing import CliRunner

from automator.adb import AdbClient, AdbResult
from automator.cli import app
from automator.config import settings
from automator.host_bridge import host_bridge
from automator.installer import two_stage_installer
from automator.screenshot import screenshot_manager

runner = CliRunner()


def test_config_defaults() -> None:
    """Verify default configuration values."""
    assert settings.device_serial == "emulator-5554"
    assert settings.adb_socket == "tcp:127.0.0.1:5037"
    assert settings.app_package == "com.b1alek.materialbook.test"


def test_adb_env_injection() -> None:
    """Verify ADB_SERVER_SOCKET is exported in AdbClient environment."""
    client = AdbClient(socket_addr="tcp:127.0.0.1:5037")
    env = client._get_env()
    assert env["ADB_SERVER_SOCKET"] == "tcp:127.0.0.1:5037"


def test_adb_result_dataclass() -> None:
    """Verify AdbResult behavior."""
    ok_res = AdbResult(returncode=0, stdout="Success", stderr="", duration_s=0.1)
    assert ok_res.success is True

    fail_res = AdbResult(returncode=1, stdout="", stderr="Error", duration_s=0.1)
    assert fail_res.success is False


def test_standardized_artifact_naming() -> None:
    """Verify that generated filename adheres strictly to naming standards."""
    name = screenshot_manager.generate_filename(
        task_or_issue="task23",
        test_case="boot_test",
        proof_type="green_verified",
        ext="png",
        version="1.4.0",
    )
    assert name.startswith("task23_boot_test_green_verified_v1.4.0_")
    assert name.endswith(".png")


def test_app_version_parsing() -> None:
    """Verify that app version is extracted dynamically from build.gradle.kts."""
    import re
    ver = two_stage_installer.get_app_version()
    # Ensure version matches semver format (e.g. 1.4.1)
    assert re.match(r"^\d+\.\d+\.\d+$", ver), f"Extracted version '{ver}' is not valid semver"
    gradle_file = settings.repo_root / "Materialbook" / "app" / "build.gradle.kts"
    if gradle_file.exists():
        match = re.search(r'versionName\s*=\s*"([^"]+)"', gradle_file.read_text(encoding="utf-8"))
        if match:
            assert ver == match.group(1)


def test_host_script_generation(tmp_path: Path) -> None:
    """Verify standalone PowerShell script generation."""
    script_path = host_bridge.generate_host_script()
    assert script_path.exists()
    content = script_path.read_text(encoding="utf-8")
    assert "Stop-Process" in content
    assert settings.avd_name in content
    assert "wait-for-device" in content
    assert "Set-Location $env:USERPROFILE" in content
    assert "kill-server" in content


def test_cli_help() -> None:
    """Verify Typer CLI help output."""
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "status" in result.stdout
    assert "restart" in result.stdout
    assert "preflight" in result.stdout
    assert "deploy" in result.stdout
    assert "screenshot" in result.stdout


def test_cli_generate_script() -> None:
    """Verify generate-script CLI command."""
    result = runner.invoke(app, ["generate-script"])
    assert result.exit_code == 0
    assert "Generated host PowerShell script" in result.stdout


def test_cli_avd_help() -> None:
    """Verify avd subcommand help."""
    result = runner.invoke(app, ["avd", "--help"])
    assert result.exit_code == 0
    assert "list" in result.stdout
    assert "targets" in result.stdout
    assert "devices" in result.stdout
    assert "create" in result.stdout


def test_cli_avd_list_and_targets() -> None:
    """Verify avd list and targets execution."""
    res_list = runner.invoke(app, ["avd", "list"])
    assert res_list.exit_code == 0
    assert "Virtual Devices" in res_list.stdout

    res_targets = runner.invoke(app, ["avd", "targets"])
    assert res_targets.exit_code == 0
    assert "System Image Targets" in res_targets.stdout


def test_cli_switches() -> None:
    """Verify switches CLI command."""
    res = runner.invoke(app, ["switches"])
    assert res.exit_code == 0
    assert "Android Emulator usage" in res.stdout


def test_host_bridge_create_and_delete_avd() -> None:
    """Verify AVD provisioning and cleanup via HostBridge."""
    test_avd_name = "Automator_Test_AVD"
    ok, msg = host_bridge.create_avd(test_avd_name)
    assert ok is True
    assert "SUCCESS" in msg

    avds = host_bridge.list_avds()
    assert test_avd_name in avds

    del_ok, del_msg = host_bridge.delete_avd(test_avd_name)
    assert del_ok is True
    assert test_avd_name not in host_bridge.list_avds()


def test_cli_cookies_help_and_list() -> None:
    """Verify cookies subcommand help and list."""
    res_help = runner.invoke(app, ["cookies", "--help"])
    assert res_help.exit_code == 0
    assert "dump" in res_help.stdout
    assert "load" in res_help.stdout
    assert "list" in res_help.stdout

    res_list = runner.invoke(app, ["cookies", "list"])
    assert res_list.exit_code == 0
    assert "Saved Cookie Artifacts" in res_list.stdout


def test_cookie_manager_export_json(tmp_path: Path) -> None:
    """Verify parsing and exporting cookies from SQLite database."""
    from automator.cookies import cookie_manager
    test_db = tmp_path / "test_cookies.db"

    import sqlite3
    conn = sqlite3.connect(str(test_db))
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE cookies(
            creation_utc INTEGER, host_key TEXT, top_frame_site_key TEXT,
            name TEXT, value TEXT, encrypted_value BLOB, path TEXT,
            expires_utc INTEGER, is_secure INTEGER, is_httponly INTEGER,
            last_access_utc INTEGER, has_expires INTEGER, is_persistent INTEGER,
            priority INTEGER, samesite INTEGER, source_scheme INTEGER,
            source_port INTEGER, last_update_utc INTEGER, source_type INTEGER,
            has_cross_site_ancestor INTEGER
        )
    """)
    cur.execute("""
        INSERT INTO cookies (creation_utc, host_key, top_frame_site_key, name, value, encrypted_value, path, expires_utc, is_secure, is_httponly, last_access_utc, has_expires, is_persistent, priority, samesite, source_scheme, source_port, last_update_utc, source_type, has_cross_site_ancestor)
        VALUES (0, '.facebook.com', '', 'c_user', '12345', X'', '/', 0, 1, 0, 0, 0, 1, 1, 1, 1, 443, 0, 0, 0)
    """)
    conn.commit()
    conn.close()

    json_path = cookie_manager.export_json(test_db)
    assert json_path is not None
    assert json_path.exists()

    import json
    data = json.loads(json_path.read_text(encoding="utf-8"))
    assert len(data) == 1
    assert data[0]["name"] == "c_user"
    assert data[0]["value"] == "12345"
