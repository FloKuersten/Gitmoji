import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ExtensionContext,
  QuickInputButton,
  QuickPickItem,
  QuickPickItemButtonEvent,
} from "vscode";
import type { GitmojiMapping } from "../types";

const mock = vi.hoisted(() => ({
  create: vi.fn(),
  warn: vi.fn(),
  back: { tooltip: "Back", iconPath: { id: "arrow-left" } },
}));
vi.mock("vscode", () => ({
  window: { createQuickPick: mock.create, showWarningMessage: mock.warn },
  ThemeIcon: class {
    constructor(public id: string) {}
  },
  QuickPickItemKind: { Separator: -1 },
  QuickInputButtons: { Back: mock.back },
}));
import { GitmojiPicker } from "../gitmojiPicker";

function emitter<T>() {
  const callbacks = new Set<(value: T) => void>();
  return {
    event: (callback: (value: T) => void) => {
      callbacks.add(callback);
      return { dispose: () => callbacks.delete(callback) };
    },
    fire: (value: T) => [...callbacks].forEach((callback) => callback(value)),
    count: () => callbacks.size,
  };
}

interface Item extends QuickPickItem {
  mapping?: GitmojiMapping;
  category?: string;
  allCategories?: boolean;
}

function fixture(initial: unknown = undefined) {
  const accept = emitter<void>();
  const hide = emitter<void>();
  const button = emitter<QuickInputButton>();
  const itemButton = emitter<QuickPickItemButtonEvent<Item>>();
  const input = {
    items: [] as Item[],
    selectedItems: [] as Item[],
    activeItems: [] as Item[],
    buttons: [] as QuickInputButton[],
    value: "",
    title: "",
    placeholder: "",
    onDidAccept: accept.event,
    onDidHide: hide.event,
    onDidTriggerButton: button.event,
    onDidTriggerItemButton: itemButton.event,
    show: vi.fn(),
    dispose: vi.fn(),
  };
  mock.create.mockReturnValue(input);
  const update = vi.fn(async (_key: string, _state: unknown) => {});
  const context = {
    subscriptions: [],
    globalState: { get: () => initial, update },
  };
  const picker = new GitmojiPicker(context as unknown as ExtensionContext);
  return { picker, input, update, accept, hide, button, itemButton, context };
}

const bug: GitmojiMapping = {
  gitmoji: "🐛",
  code: ":bug:",
  name: "bug",
  keywords: ["fix"],
  category: "Quality",
};
const feature: GitmojiMapping = {
  gitmoji: "✨",
  code: ":sparkles:",
  name: "sparkles",
  keywords: ["feat"],
  category: "Features",
};
beforeEach(() => vi.clearAllMocks());

describe("GitmojiPicker lifecycle", () => {
  it("returns the selected format without recording a canceled or rejected edit", async () => {
    const f = fixture();
    const pending = f.picker.pick([bug], "code", "Pick for repository");
    f.input.selectedItems = f.input.items.filter((item) => item.mapping);
    f.accept.fire();
    expect(await pending).toEqual({ token: ":bug:", mapping: bug });
    expect(f.update).not.toHaveBeenCalled();
    expect(f.input.dispose).toHaveBeenCalledTimes(1);
    expect([
      f.accept.count(),
      f.hide.count(),
      f.button.count(),
      f.itemButton.count(),
    ]).toEqual([0, 0, 0, 0]);
    await f.picker.record(bug);
    expect(f.update).toHaveBeenLastCalledWith("autoGitmoji.pickerState", {
      recent: [":bug:"],
      favorites: [],
    });
  });

  it.each(["hide", "dispose"])(
    "settles canceled picks and disposes event handlers on %s",
    async (action) => {
      const f = fixture();
      const pending = f.picker.pick([bug], "emoji");
      if (action === "hide") f.hide.fire();
      else f.picker.dispose();
      expect(await pending).toBeUndefined();
      expect(f.input.dispose).toHaveBeenCalledOnce();
      expect(f.hide.count()).toBe(0);
      expect(f.update).not.toHaveBeenCalled();
      if (action === "dispose")
        expect(await f.picker.pick([bug], "emoji")).toBeUndefined();
    }
  );

  it("persists favorites even when insertion is canceled, without storing search text", async () => {
    const f = fixture();
    const pending = f.picker.pick([bug, feature], "emoji");
    f.input.value = "private search text";
    const item = f.input.items.find((entry) => entry.mapping === bug)!;
    f.itemButton.fire({ item, button: item.buttons![0] });
    expect(f.input.items[0].label).toBe("Favorites");
    expect(f.input.value).toBe("private search text");
    f.hide.fire();
    await pending;
    await f.picker.clearRecent();
    expect(f.update).toHaveBeenLastCalledWith("autoGitmoji.pickerState", {
      recent: [],
      favorites: [":bug:"],
    });
    expect(JSON.stringify(f.update.mock.calls)).not.toContain(
      "private search text"
    );
  });

  it("filters categories in place and restores the search query when returning", async () => {
    const f = fixture();
    const pending = f.picker.pick([bug, feature], "emoji");
    f.input.value = "fix";
    f.button.fire(f.input.buttons[0]);
    expect(f.input.value).toBe("");
    f.input.selectedItems = f.input.items.filter(
      (item) => item.category === "Quality"
    );
    f.accept.fire();
    expect(f.input.value).toBe("fix");
    expect(
      f.input.items.filter((item) => item.mapping).map((item) => item.mapping)
    ).toEqual([bug]);
    f.button.fire(f.input.buttons[0]);
    f.button.fire(mock.back);
    expect(f.input.value).toBe("fix");
    expect(f.input.title).toContain("Quality");
    f.hide.fire();
    await pending;
  });

  it("clears recent history while retaining favorites and permits later selections", async () => {
    const f = fixture({ recent: [":bug:"], favorites: [":sparkles:"] });
    await f.picker.clearRecent();
    await f.picker.record(feature);
    expect(f.update.mock.calls.map((call) => call[1])).toEqual([
      { recent: [], favorites: [":sparkles:"] },
      { recent: [":sparkles:"], favorites: [":sparkles:"] },
    ]);
  });

  it("does not fail an edit when persistence fails, and allows subsequent writes", async () => {
    const f = fixture();
    f.update.mockRejectedValueOnce(new Error("storage unavailable"));
    await expect(f.picker.record(bug)).resolves.toBeUndefined();
    expect(mock.warn).toHaveBeenCalledOnce();
    await f.picker.record(feature);
    expect(f.update).toHaveBeenLastCalledWith("autoGitmoji.pickerState", {
      recent: [":sparkles:", ":bug:"],
      favorites: [],
    });
  });
});
