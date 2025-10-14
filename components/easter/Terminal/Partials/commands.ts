import { TerminalFolder, CommandOutput } from "./models";

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

        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(dirName)) {
            return { output: { type: 'error', message: `mkdir: invalid directory name '${dirName}'` } };
        }

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
    tree: (currentPath, fileSystem) => {
        const targetDir = getFolderByPath(fileSystem, currentPath);
        if (!targetDir) {
            return {
                output: {
                    type: 'error',
                    message: `tree: cannot access '${currentPath.join('/')}': No such file or directory`
                }
            };
        }
        const formatTree = (dir: TerminalFolder, prefix: string): string => {
            let result = `${prefix}${dir.name}/\n`;
            const items = [...dir.folders, ...dir.files].sort((a, b) => a.name.localeCompare(b.name));
            items.forEach((item, index) => {
                const isLast = index === items.length - 1;
                const newPrefix = `${prefix}${isLast ? '    ' : '│   '}`;
                if ('folders' in item) { // Check if the item is a folder
                    result += formatTree(item, newPrefix);
                } else {
                    result += `${newPrefix}${item.name}\n`;
                }
            }
            );
            return result;
        };
        const treeString = formatTree(targetDir, '');
        return {
            output: {
                type: 'text',
                content: treeString
            }
        };
    },
    mv: (currentPath, fileSystem, args) => {
        if (args.length < 2) {
            return { output: { type: 'error', message: 'mv: missing operand' } };
        }
        const currentDir = getFolderByPath(fileSystem, currentPath);
        if (!currentDir) return { output: { type: 'error', message: 'Directory not found' } };
        const oldName = args[0];
        const newName = args[1];
        const targetFile = currentDir.files.find(f => f.name === oldName);
        const targetFolder = currentDir.folders.find(f => f.name === oldName);
        if (!targetFile && !targetFolder) {
            return {
                output: {
                    type: 'error',
                    message: `mv: ${oldName}: No such file or directory`
                }
            };
        }
        if (targetFile) {
            if (currentDir.files.some(f => f.name === newName)) {
                return { output: { type: 'error', message: `mv: ${newName}: File exists` } };
            }
            const newFileSystem = updateFolderInTree(fileSystem, currentPath, folder => ({
                ...folder,
                files: folder.files.map(f => f.name === oldName ? { ...f, name: newName } : f)
            }));
            return { output: { type: 'text', content: '' }, newFileSystem };
        }
        if (targetFolder) {
            if (currentDir.folders.some(f => f.name === newName)) {
                return { output: { type: 'error', message: `mv: ${newName}: Directory exists` } };
            }
            const newFileSystem = updateFolderInTree(fileSystem, currentPath, folder => ({
                ...folder,
                folders: folder.folders.map(f => f.name === oldName ? { ...f, name: newName } : f)
            }));
            return { output: { type: 'text', content: '' }, newFileSystem };
        }
        return {
            output: {
                type: 'error',
                message: `mv: ${oldName}: No such file or directory`
            }
        };
    },
    cp: (currentPath, fileSystem, args) => {
        if (args.length < 2) {
            return { output: { type: 'error', message: 'cp: missing operand' } };
        }
        const currentDir = getFolderByPath(fileSystem, currentPath);
        if (!currentDir) return { output: { type: 'error', message: 'Directory not found' } };
        const sourceName = args[0];
        const targetName = args[1];
        const sourceFile = currentDir.files.find(f => f.name === sourceName);
        const sourceFolder = currentDir.folders.find(f => f.name === sourceName);
        if (!sourceFile && !sourceFolder) {
            return {
                output: {
                    type: 'error',
                    message: `cp: ${sourceName}: No such file or directory`
                }
            };
        }
        if (sourceFile) {
            if (currentDir.files.some(f => f.name === targetName)) {
                return { output: { type: 'error', message: `cp: ${targetName}: File exists` } };
            }
            const newFileSystem = updateFolderInTree(fileSystem, currentPath, folder => ({
                ...folder,
                files: [...folder.files, { ...sourceFile, name: targetName }]
            }));
            return { output: { type: 'text', content: '' }, newFileSystem };
        }
        if (sourceFolder) {
            if (currentDir.folders.some(f => f.name === targetName)) {
                return { output: { type: 'error', message: `cp: ${targetName}: Directory exists` } };
            }
            const newFileSystem = updateFolderInTree(fileSystem, currentPath, folder => ({
                ...folder,
                folders: [...folder.folders, { ...sourceFolder, name: targetName }]
            }));
            return { output: { type: 'text', content: '' }, newFileSystem };
        }
        return {
            output: {
                type: 'error',
                message: `cp: ${sourceName}: No such file or directory`
            }
        };
    },
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
            help  - Show this help message
            touch - Create a new file
            rm    - Remove a file
            echo  - Print text to the terminal
            whoami - Show current user
            date  - Show current date and time
            exit  - Exit the terminal
            mv    - Move or rename files/directories
            cp    - Copy files/directories
            tree  - Show directory structure
            uptime - Show system uptime
              `
        }
    }),
    rm: (currentPath, fileSystem, args) => {
        if (args.length === 0) {
            return { output: { type: 'error', message: 'rm: missing operand' } };
        }
        const currentDir = getFolderByPath(fileSystem, currentPath);
        if (!currentDir) return { output: { type: 'error', message: 'Directory not found' } };
        const fileName = args[0];
        const targetFile = currentDir.files.find(f => f.name === fileName);
        if (!targetFile) {
            return {
                output: {
                    type: 'error',
                    message: `rm: ${fileName}: No such file or directory`
                }
            };
        }
        const newFileSystem = updateFolderInTree(fileSystem, currentPath, folder => ({
            ...folder,
            files: folder.files.filter(f => f.name !== fileName)
        }));
        return { output: { type: 'text', content: '' }, newFileSystem };
    },
    pwd: (currentPath) => ({
        output: {
            type: 'text',
            content: '/' + currentPath.join('/')
        }
    }),
    touch: (currentPath, fileSystem, args) => {
        if (args.length === 0) return { output: { type: 'error', message: 'touch: missing file name' } };
        const fileName = args[0];
        const currentDir = getFolderByPath(fileSystem, currentPath);
        if (!currentDir) return { output: { type: 'error', message: 'Directory not found' } };
        if (currentDir.files.some(f => f.name === fileName)) {
            return { output: { type: 'error', message: `touch: ${fileName}: File exists` } };
        }
        const newFileSystem = updateFolderInTree(fileSystem, currentPath, folder => ({
            ...folder,
            files: [...folder.files, { name: fileName, content: '', type: 'file' }]
        }));
        return { output: { type: 'text', content: '' }, newFileSystem };
    },
    //@ts-ignore
    echo: (currentPath, fileSystem, args) => {
        const textToEcho = args.join(' ');
        return {
            output: {
                type: 'text',
                content: textToEcho
            }
        };
    },
    whoami: (() => ({
        output: {
            type: 'text',
            content: 'kuraykaraaslan'
        }
    })),
    date: () => ({
        output: {
            type: 'text',
            content: new Date().toLocaleString()
        }
    }),
    //since 2023-agust-26
    uptime: () => {
        const uptime = process.uptime();
        const days = Math.floor(uptime / (24 * 60 * 60));
        const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((uptime % (60 * 60)) / 60);
        const seconds = Math.floor(uptime % 60);
        return {
            output: {
                type: 'text',
                content: `${days}d ${hours}h ${minutes}m ${seconds}s`
            }
        };
    }
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
