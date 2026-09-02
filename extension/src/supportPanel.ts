import * as vscode from "vscode";

export class SupportPanel {
  public static readonly viewType = "autoGitmoji.support";

  private static currentPanel: SupportPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    extensionContext: vscode.ExtensionContext
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    this.panel.webview.html = this.getHtml(this.panel.webview);
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      (message: { command: string }) => {
        if (message.command === "openBmac") {
          void this.openBuyMeACoffee();
        }
        if (message.command === "openWebsite") {
          void this.openWebsite();
        }
      },
      null,
      this.disposables
    );

    extensionContext.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (
          e.affectsConfiguration("autoGitmoji.buyMeACoffeeUrl") ||
          e.affectsConfiguration("autoGitmoji.websiteUrl")
        ) {
          this.panel.webview.html = this.getHtml(this.panel.webview);
        }
      })
    );
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    extensionContext: vscode.ExtensionContext
  ): void {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (SupportPanel.currentPanel) {
      SupportPanel.currentPanel.panel.reveal(column);
      SupportPanel.currentPanel.panel.webview.html =
        SupportPanel.currentPanel.getHtml(
          SupportPanel.currentPanel.panel.webview
        );
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      SupportPanel.viewType,
      "KueTech Digital — Support",
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "assets"),
          extensionUri,
        ],
      }
    );

    SupportPanel.currentPanel = new SupportPanel(
      panel,
      extensionUri,
      extensionContext
    );
  }

  private getHtml(webview: vscode.Webview): string {
    const qrUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "assets", "donate-qr.png")
    );

    const cspSource = webview.cspSource;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https:; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource};" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KueTech Digital — Support</title>
  <style>
    :root {
      --bg: #0f1419;
      --card: #1a2332;
      --text: #e7ecf3;
      --muted: #8b9cb3;
      --accent: #ffdd00;
      --accent-hover: #f5d000;
      --border: #2a3548;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 24px 48px rgba(0,0,0,0.35);
    }
    h1 { font-size: 1.35rem; margin: 0 0 0.25rem; font-weight: 600; letter-spacing: 0.02em; }
    .tagline { color: var(--text); font-size: 0.9rem; margin: 0 0 0.75rem !important; opacity: 0.9; }
    p { color: var(--muted); line-height: 1.55; margin: 0 0 1.5rem; font-size: 0.95rem; }
    .qr-wrap {
      background: #fff;
      border-radius: 12px;
      padding: 1rem;
      margin: 0 auto 1.5rem;
      width: fit-content;
    }
    .qr-wrap img { display: block; width: 220px; height: 220px; object-fit: contain; }
    .actions { display: flex; flex-direction: column; gap: 0.75rem; }
    button {
      border: none;
      border-radius: 10px;
      padding: 0.85rem 1.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.1s ease;
    }
    button:active { transform: scale(0.98); }
    .primary { background: var(--accent); color: #1a1200; }
    .primary:hover { background: var(--accent-hover); }
    .secondary {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }
    .secondary:hover { background: rgba(255,255,255,0.06); }
    .note { font-size: 0.8rem; color: var(--muted); margin-top: 1.25rem; }
    .note a { color: var(--accent); text-decoration: none; }
    .note a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <h1>KueTech Digital</h1>
    <p class="tagline">Auto Gitmoji &amp; Docs — free, local, and private.</p>
    <p>If this extension saves you time, scan the QR or buy me a coffee.</p>
    <div class="qr-wrap">
      <img src="${qrUri}" alt="Donate QR Code" />
    </div>
    <div class="actions">
      <button class="primary" id="bmac">Buy Me a Coffee</button>
      <button class="secondary" id="site">KueTech Digital</button>
    </div>
    <p class="note"><strong>KueTech Digital</strong> · <a href="#" id="siteLink">kuetech.at</a></p>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('bmac').addEventListener('click', () => {
      vscode.postMessage({ command: 'openBmac' });
    });
    document.getElementById('site').addEventListener('click', () => {
      vscode.postMessage({ command: 'openWebsite' });
    });
    document.getElementById('siteLink').addEventListener('click', (e) => {
      e.preventDefault();
      vscode.postMessage({ command: 'openWebsite' });
    });
  </script>
</body>
</html>`;
  }

  private async openWebsite(): Promise<void> {
    const url = vscode.workspace
      .getConfiguration("autoGitmoji")
      .get<string>("websiteUrl", "https://kuetech.at");
    if (url) {
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }
  }

  private async openBuyMeACoffee(): Promise<void> {
    const url = vscode.workspace
      .getConfiguration("autoGitmoji")
      .get<string>("buyMeACoffeeUrl", "");
    if (!url) {
      vscode.window.showWarningMessage(
        "Set autoGitmoji.buyMeACoffeeUrl in Settings to your Buy Me a Coffee link."
      );
      return;
    }
    await vscode.env.openExternal(vscode.Uri.parse(url));
  }

  private dispose(): void {
    SupportPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const item = this.disposables.pop();
      item?.dispose();
    }
  }
}

export function registerSupportCommand(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("autoGitmoji.openSupport", () => {
      SupportPanel.createOrShow(context.extensionUri, context);
    })
  );
}
