// models.ts

export interface TerminalFile {
    name: string;
    content: string;
    type: 'file';
}

export interface TerminalFolder {
    name: string;
    folders: TerminalFolder[];
    files: TerminalFile[];
}

export type CommandOutput =
    | { type: 'text'; content: string }
    | { type: 'list'; items: Array<{ name: string; type: 'file' | 'folder' }> }
    | { type: 'error'; message: string };

export interface HistoryItem {
    command: string;
    output: CommandOutput;
    directoryPath: string[];
}