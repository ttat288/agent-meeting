# Desktop installation · Linux, macOS and Windows

**Status:** implemented in this checkout. Linux installation, upgrade, rollback and uninstall have been exercised with temporary user directories. Native installer smoke tests passed on Ubuntu, macOS and Windows for `6f329f8` ([CI run](https://github.com/ttat288/agent-meeting/actions/runs/39632577516)). Finder/Start Menu GUI launch and real icon appearance still need manual checks. Use the GitHub main branch command below for the current implementation; no npm registry release is required.

## One command from this checkout

Requires an existing **Node.js 18+** installation. No npm packages, administrator rights or runtime download are required for the desktop launcher.

```bash
node bin/cli.js install --dry-run
node bin/cli.js install
```

Install directly from GitHub main:

```bash
npx github:ttat288/agent-meeting#main install
```

The installer copies the application's runtime files to a stable per-user directory and creates a native launcher. It records the absolute Node executable used during installation. Opening the launcher starts the existing local console/server and opens your browser; it does not embed a desktop web engine. The installer itself does not start a server, connect an AI client or enable a public tunnel.

| System | App files | Launcher |
|---|---|---|
| Linux | `$XDG_DATA_HOME/agent-meeting`, normally `~/.local/share/agent-meeting` | Application menu `.desktop` entry and `~/.local/bin/agent-meeting` |
| macOS | `~/Applications/Agent Meeting.app` | Finder app bundle opens Terminal; optional command at `~/.local/bin/agent-meeting` |
| Windows | `%LOCALAPPDATA%\Programs\Agent Meeting` | Current user's Start Menu `.lnk`; command wrapper `agent-meeting.cmd` inside the app directory |

Managed code execution/verification still requires Linux with functioning bubblewrap; desktop launcher support does not add native managed execution on macOS/Windows. See [implementation limits](IMPLEMENTATION-STATUS.vi.md).

No PATH, registry, login startup, shell profiles, execution policy or AI client configuration is modified. If `~/.local/bin` is already in your PATH, the command is available as `agent-meeting`; otherwise use the full path or the application menu. If you move/remove Node or your version manager removes its recorded executable, rerun the installer with the new Node version.

The launcher relies on the platform's existing tools: a desktop environment/terminal on Linux, Terminal and `open` on macOS, Windows PowerShell plus `WScript.Shell` for the Windows shortcut. A blocked or unavailable shortcut tool causes installation to fail and roll back; there is no policy bypass. Windows JSON plans are read explicitly as UTF-8 to preserve international user paths.

## Upgrade and remove

Run `install` again from the newer checkout. A recognized old app is moved to a timestamped sibling backup before activation. On a caught installation error, the prior app and launcher bytes are restored. Backups are kept for manual recovery; the installer does not remove old backups automatically.

Unknown destination directories, symlinks and locally modified managed launchers are preserved and reported. The historical Linux layout can migrate when its Agent Meeting package and CLI are identified; its old external icon file is retained. The compatibility command still works:

```bash
bash scripts/install-linux.sh --dry-run
bash scripts/install-linux.sh
```

Use the same environment/path settings as installation when uninstalling:

```bash
node bin/cli.js uninstall --dry-run
node bin/cli.js uninstall
```

Uninstall only removes recognized managed files. Modified app files or launchers are kept and reported. Meeting history, minutes, `~/.agent-meeting/config`, workspaces, MCP registrations and installation backups are retained. A legacy Linux install needs an upgrade before it has a managed uninstall manifest.

A lock prevents concurrent install/uninstall. If the process is interrupted, inspect its `.install-lock`, staging directories and backup before retrying. Recovery from a power loss/process kill is manual; the rollback guarantee covers errors caught during the installation transaction.

## Inspect another platform without writing

```bash
node bin/cli.js install --dry-run --platform linux --json
node bin/cli.js install --dry-run --platform darwin --json
node bin/cli.js install --dry-run --platform win32 --json
```

Foreign-platform previews use sample user/runtime paths. Actual installation is restricted to the current OS. A preview verifies the plan, not OS-native launch behavior.

## Verification

`test/desktop-install.test.js` uses temporary user paths, leaving the actual desktop, app data and port 3000 untouched. It covers runnable payloads, native launcher metadata, Unicode/spaces/reserved filename characters, upgrade backups, injected write failures, foreign files, edited launchers, symlinks, lock contention, source/hash guards and data-preserving uninstall.

On Linux, the test additionally validates the desktop entry and exercises its quoting with GLib `gio launch` when those tools are present; the launched command is `--version`, never a meeting server. On macOS it checks the plist and decodes ICNS with `iconutil`; on Windows it reads the actual shortcut target/arguments/icon through the native COM API. Those branches passed on their native GitHub-hosted runners; they were not emulated on this Linux development machine.

The `.github/workflows/desktop-install.yml` workflow is configured for sequential Ubuntu/macOS/Windows native smoke tests. Consult its run for the commit you are installing; local Linux results alone do not establish native macOS/Windows support. GUI launch in Finder/Start Menu and real high-DPI icon appearance remain native manual acceptance items.

Platform contracts used here: [freedesktop Exec quoting](https://specifications.freedesktop.org/desktop-entry/latest/exec-variables.html), [Apple app bundle keys](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html), [Apple high-resolution icon sets](https://developer.apple.com/library/archive/documentation/GraphicsAnimation/Conceptual/HighResolutionOSX/Optimizing/Optimizing.html), [Windows shortcut API](https://learn.microsoft.com/en-us/troubleshoot/windows-client/admin-development/create-desktop-shortcut-with-wsh), [Windows icon formats](https://learn.microsoft.com/en-us/windows/win32/menurc/about-icons), [npm npx](https://docs.npmjs.com/cli/v8/commands/npx/).
