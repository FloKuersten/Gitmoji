export interface GitmojiMapping {
  keywords: string[];
  gitmoji: string;
  description?: string;
}

export interface GitmojiDictionary {
  version: number;
  mappings: GitmojiMapping[];
}

export interface GitAPI {
  repositories: GitRepository[];
}

export interface GitRepository {
  inputBox: {
    value: string;
  };
}

export interface GitExtension {
  getAPI(version: 1): GitAPI;
}
