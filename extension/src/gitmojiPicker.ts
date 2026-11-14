import * as vscode from "vscode";
import { formatToken } from "./gitmojiMatcher";
import {
  buildPickerEntries,
  mappingKey,
  pickerCategories,
  pickerSearchText,
  readPickerState,
  recordRecent,
  toggleFavorite,
  type PickerState,
} from "./pickerState";
import type { GitmojiMapping, GitmojiOutputFormat } from "./types";

const STATE_KEY = "autoGitmoji.pickerState";

export interface GitmojiPick {
  token: string;
  mapping: GitmojiMapping;
}

interface PickerItem extends vscode.QuickPickItem {
  mapping?: GitmojiMapping;
  category?: string;
  allCategories?: boolean;
}

/** A local-only picker: selections are recorded by the caller after a successful edit. */
export class GitmojiPicker implements vscode.Disposable {
  private state: PickerState;
  private pendingWrite: Promise<void> = Promise.resolve();
  private cancelActive: (() => void) | undefined;
  private disposed = false;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.state = readPickerState(context.globalState.get(STATE_KEY));
    context.subscriptions.push(this);
  }

  pick(
    mappings: GitmojiMapping[],
    outputFormat: GitmojiOutputFormat,
    title = "Pick a Gitmoji"
  ): Promise<GitmojiPick | undefined> {
    if (this.disposed || mappings.length === 0)
      return Promise.resolve(undefined);
    this.cancelActive?.();
    return new Promise((resolve) => {
      const picker = vscode.window.createQuickPick<PickerItem>();
      const listeners: vscode.Disposable[] = [];
      const filterButton: vscode.QuickInputButton = {
        iconPath: new vscode.ThemeIcon("filter"),
        tooltip: "Filter by category",
      };
      let category: string | undefined;
      let choosingCategory = false;
      let savedQuery = "";
      let finished = false;

      const finish = (picked?: GitmojiPick): void => {
        if (finished) return;
        finished = true;
        if (this.cancelActive === cancel) this.cancelActive = undefined;
        listeners.forEach((listener) => listener.dispose());
        picker.dispose();
        resolve(picked);
      };
      const cancel = (): void => finish();
      this.cancelActive = cancel;

      const showMappings = (): void => {
        choosingCategory = false;
        picker.title = category ? `${title} — ${category}` : title;
        picker.placeholder =
          "Search Gitmojis, keywords, tags or shortcodes. Star your favorites.";
        picker.buttons = [filterButton];
        const activeKey =
          picker.activeItems[0]?.mapping &&
          mappingKey(picker.activeItems[0].mapping);
        const items: PickerItem[] = [];
        let previousGroup: string | undefined;
        for (const entry of buildPickerEntries(
          mappings,
          this.state,
          category
        )) {
          if (entry.group !== previousGroup) {
            items.push({
              label: entry.group,
              kind: vscode.QuickPickItemKind.Separator,
            });
            previousGroup = entry.group;
          }
          const mapping = entry.mapping;
          items.push({
            label: `${mapping.gitmoji} ${mapping.name ?? mapping.keywords[0]}`,
            description: [mapping.description, mapping.semver]
              .filter(Boolean)
              .join(" · "),
            detail: pickerSearchText(mapping),
            mapping,
            buttons: [
              {
                iconPath: new vscode.ThemeIcon(
                  entry.favorite ? "star-full" : "star-empty"
                ),
                tooltip: entry.favorite
                  ? "Remove from favorites"
                  : "Add to favorites",
              },
            ],
          });
        }
        picker.items = items;
        const active = items.find(
          (item) => item.mapping && mappingKey(item.mapping) === activeKey
        );
        if (active) picker.activeItems = [active];
      };

      const showCategories = (): void => {
        savedQuery = picker.value;
        choosingCategory = true;
        picker.value = "";
        picker.title = "Filter Gitmojis by category";
        picker.placeholder = "Choose a category, or All categories to reset";
        picker.buttons = [vscode.QuickInputButtons.Back];
        picker.items = [
          { label: "All categories", allCategories: true },
          ...pickerCategories(mappings).map((name) => ({
            label: name,
            category: name,
          })),
        ];
      };

      listeners.push(
        picker.onDidHide(cancel),
        picker.onDidAccept(() => {
          const item = picker.selectedItems[0];
          if (!item) return;
          if (choosingCategory) {
            category = item.allCategories ? undefined : item.category;
            showMappings();
            picker.value = savedQuery;
          } else if (item.mapping) {
            finish({
              token: formatToken(item.mapping, outputFormat),
              mapping: item.mapping,
            });
          }
        }),
        picker.onDidTriggerButton((button) => {
          if (button === vscode.QuickInputButtons.Back) {
            showMappings();
            picker.value = savedQuery;
          } else if (button === filterButton) {
            showCategories();
          }
        }),
        picker.onDidTriggerItemButton(({ item }) => {
          if (!item.mapping) return;
          this.state = toggleFavorite(this.state, item.mapping);
          void this.persist();
          showMappings();
        })
      );
      picker.matchOnDescription = true;
      picker.matchOnDetail = true;
      picker.keepScrollPosition = true;
      showMappings();
      picker.show();
    });
  }

  record(mapping: GitmojiMapping): Promise<void> {
    if (this.disposed) return Promise.resolve();
    this.state = recordRecent(this.state, mapping);
    return this.persist();
  }

  clearRecent(): Promise<void> {
    if (this.disposed) return Promise.resolve();
    this.state = { ...this.state, recent: [] };
    return this.persist();
  }

  private persist(): Promise<void> {
    const snapshot = readPickerState(this.state);
    this.pendingWrite = this.pendingWrite
      .then(() => this.context.globalState.update(STATE_KEY, snapshot))
      .catch(() => {
        void vscode.window.showWarningMessage(
          "Gitmoji preferences could not be saved. Your edit is unaffected."
        );
      });
    return this.pendingWrite;
  }

  dispose(): void {
    this.disposed = true;
    this.cancelActive?.();
  }
}
