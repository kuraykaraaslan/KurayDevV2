// commands.ts

import { TerminalFolder, CommandOutput } from "./models";
import { useTerminal } from "../Hooks/useTerminal";

type CommandHandler = (
    currentPath: string[],
    fileSystem: TerminalFolder,
    args: string[]
) => {
    output: CommandOutput;
    newFileSystem?: TerminalFolder;
    newPath?: string[];
};


// Helper function to get a folder by path
export const getFolderByPath = (root: TerminalFolder, path: string[]): TerminalFolder | null => {
    let currentFolder = root;
    for (const dirName of path) {
        const folder = currentFolder.folders.find(f => f.name === dirName);
        if (!folder) return null;
        currentFolder = folder;
    }
    return currentFolder;
};

// Helper function to update folder structure immutably
const updateFolderInTree = (
    current: TerminalFolder,
    path: string[],
    updater: (folder: TerminalFolder) => TerminalFolder
): TerminalFolder => {
    if (path.length === 0) return updater(current);
    const [nextDir, ...restPath] = path;
    return {
        ...current,
        folders: current.folders.map(folder => {
            if (folder.name === nextDir) {
                return updateFolderInTree(folder, restPath, updater);
            }
            return folder;
        })
    };
};

const resolvePath = (currentPath: string[], inputPath: string): string[] => {
    // Handle absolute paths (our filesystem root is home)
    if (inputPath.startsWith('/')) {
        return inputPath.split('/').slice(1);
    }

    // Handle relative paths
    let newPath = [...currentPath];
    const parts = inputPath.split('/');

    for (const part of parts) {
        if (part === '..') {
            if (newPath.length > 0) {
                newPath.pop();
            }
        } else if (part !== '.' && part !== '') {
            newPath.push(part);
        }
    }

    return newPath;
};


export const commandMap: Record<string, CommandHandler> = {
    ls: (currentPath, fileSystem, args) => {
        const targetPath = args[0] ? resolvePath(currentPath, args[0]) : currentPath;
        const targetDir = getFolderByPath(fileSystem, targetPath);
        if (!targetDir) {
            return {
                output: {
                    type: 'error',
                    message: `ls: cannot access '${args[0]}': No such file or directory`
                }
            };
        }
        const folders = targetDir.folders
            .map(f => ({ name: f.name, type: 'folder' as const }))
            .sort((a, b) => a.name.localeCompare(b.name));
        const files = targetDir.files
            .map(f => ({ name: f.name, type: 'file' as const }))
            .sort((a, b) => a.name.localeCompare(b.name));
        return {
            output: {
                type: 'list',
                items: [...folders, ...files]
            }
        };
    },
    cd: (currentPath, fileSystem, args) => {
        if (args.length === 0) return { output: { type: 'error', message: 'cd: missing argument' } };
        const target = args[0];
        if (target === '..') {
            if (currentPath.length === 0) return { output: { type: 'error', message: 'Already at root' } };
            return { output: { type: 'text', content: '' }, newPath: currentPath.slice(0, -1) };
        }
        const newPath = [...currentPath, target];
        const targetDir = getFolderByPath(fileSystem, newPath);
        return targetDir
            ? { output: { type: 'text', content: '' }, newPath }
            : { output: { type: 'error', message: `cd: ${target}: No such directory` } };
    },
    mkdir: (currentPath, fileSystem, args) => {
        if (args.length === 0) return { output: { type: 'error', message: 'mkdir: missing operand' } };
        const dirName = args[0];
        const currentDir = getFolderByPath(fileSystem, currentPath);
        if (!currentDir) return { output: { type: 'error', message: 'Current directory not found' } };
        if (currentDir.folders.some(f => f.name === dirName)) {
            return { output: { type: 'error', message: `mkdir: ${dirName}: File exists` } };
        }
        const newFileSystem = updateFolderInTree(fileSystem, currentPath, folder => ({
            ...folder,
            folders: [...folder.folders, { name: dirName, folders: [], files: [] }]
        }));
        return { output: { type: 'text', content: '' }, newFileSystem };
    },
    cat: (currentPath, fileSystem, args) => {
        if (args.length === 0) {
            return { output: { type: 'error', message: 'cat: missing file operand' } };
        }
        const currentDir = getFolderByPath(fileSystem, currentPath);
        if (!currentDir) return { output: { type: 'error', message: 'Directory not found' } };
        const fileName = args[0];
        const targetFile = currentDir.files.find(f => f.name === fileName);
        const targetFolder = currentDir.folders.find(f => f.name === fileName);
        if (targetFolder) {
            return {
                output: {
                    type: 'error',
                    message: `cat: ${fileName}: Is a directory`
                }
            };
        }
        if (!targetFile) {
            return {
                output: {
                    type: 'error',
                    message: `cat: ${fileName}: No such file or directory`
                }
            };
        }
        return {
            output: {
                type: 'text',
                content: targetFile.content
            }
        };
    },
    neofetch: () => ({
        output: {
            type: 'text',
            content: 
                '\n' +
                '    ██╗  ██╗██╗   ██╗██████╗  █████╗ ██╗   ██╗\n' +
                '    ██║ ██╔╝██║   ██║██╔══██╗██╔══██╗╚██╗ ██╔╝\n' +
                '    █████╔╝ ██║   ██║██████╔╝███████║ ╚████╔╝ \n' +
                '    ██╔═██╗ ██║   ██║██╔══██╗██╔══██║  ╚██╔╝  \n' +
                '    ██║  ██╗╚██████╔╝██║  ██║██║  ██║   ██║   \n' +
                '    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   \n' +
                '\n' +
                'OS: PortfolioOS v2.1.0\n' +
                'Host: Terminal Portfolio\n' +
                'Kernel: 5.19.0-react-terminal\n' +
                'CPU: Intel i9-13900K (24) @ 5.8GHz\n' +
                'Memory: 32GB DDR5 @ 4800MHz\n' +
                'Uptime: 24/7 Available\n' +
                'Terminal: WebTerminal 3.1.4\n'
        }
    }),
    help: () => ({
        output: {
            type: "text",
            content: `Available commands:
              ls    - List directory contents
              cd    - Change directory
              cat   - Show file content
              mkdir - Create a new directory
              neofetch - Show system information
              pwd   - Show current directory
              clear - Clear terminal
              help  - Show this help message`
        }
    }),
};
// Add more command handlers as needed

export const executeCommand = (
    command: string,
    currentPath: string[],
    fileSystem: TerminalFolder
) => {
    const [cmd, ...args] = command.split(" ");
    const handler = commandMap[cmd];

    return handler
        ? handler(currentPath, fileSystem, args)
        : { output: { type: "error", message: `${cmd}: command not found` } };
};
