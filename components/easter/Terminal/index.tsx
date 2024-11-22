'use client';
import React, { useState, useEffect } from 'react';

// Fake Navigation
import { home_folder, TerminalFile, TerminalFolder } from '@/components/easter/Terminal/data';

interface HistoryItem {
    command: string;
    output?: string;
    directory: TerminalFolder;
}


const Terminal: React.FC = () => {

    const welcomeMessage = `# 
    # Welcome to my terminal! This is a simple terminal emulator I built using Next.js and Tailwind CSS.
    # You can navigate through the folders and files using basic commands like <span class="text-green-500">ls</span> and <span class="text-green-500">cd</span>.
    # Feel free to explore!
    #`;
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const [currentDirectory, setCurrentDirectory] = useState<TerminalFolder>(home_folder);

    // top commands
    const command_ls = (directory: TerminalFolder) => {
        var output = '';
        directory.folders.forEach(folder => {
            output += `<span class="text-blue-500">${folder.name}</span> `;
        });
        directory.files.forEach(file => {
            output += `<span class="text-white">${file.name}</span> `;
        });

        return output;
    }

    const command_cd = (directory: TerminalFolder, args: string[]) => {
        if (args.length === 0) {
            return 'cd: missing operand';
        }

        //if the argument is ".." go to the parent directory
        if (args[0] === '..') {
            if (directory.parent) {
                setCurrentDirectory(directory.parent);
                return '';
            } else {
                return 'cd: Permission denied';
            }
        }

        const newDirectory = directory.folders.find(folder => folder.name === args[0]);
        if (!newDirectory) {
            return `cd: ${args[0]}: No such file or directory`;
        }

        setCurrentDirectory(newDirectory);
        return '';
    }

    const command_cat = (directory: TerminalFolder, args: string[]) => {
        if (args.length === 0) {
            return 'cat: missing operand';
        }

        const file = directory.files.find(file => file.name === args[0]);
        if (file) {
            return file.content;
        }

        if (directory.folders.find(folder => folder.name === args[0])) {
            return `cat: ${args[0]}: Is a directory`;
        }

        return `cat: ${args[0]}: No such file or directory`;
    }

    const command_pwd = (directory: TerminalFolder) => {
        return directory.name;
    }

    const command_history = () => {
        return history.map((historyItem, index) => historyItem.command).join('<br>');
    }

    const command_clear = () => {
        setHistory([]);
        return '';
    }

    const command_mkdir = (directory: TerminalFolder, args: string[]) => {
        if (args.length === 0) {
            return 'mkdir: missing operand';
        }

        if (directory.folders.find(folder => folder.name === args[0])) {
            return `mkdir: cannot create directory ‘${args[0]}’: File exists`;
        }

        const newFolder: TerminalFolder = {
            name: args[0],
            folders: [],
            files: [],
            parent: directory
        };

        directory.folders.push(newFolder);
        return '';
    }

    const command_rm = (directory: TerminalFolder, args: string[]) => {
        if (args.length === 0) {
            return 'rm: missing operand';
        }

        const folderIndex = directory.folders.findIndex(folder => folder.name === args[0]);
        if (folderIndex !== -1) {
            directory.folders.splice(folderIndex, 1);
            return '';
        }

        const fileIndex = directory.files.findIndex(file => file.name === args[0]);
        if (fileIndex !== -1) {
            directory.files.splice(fileIndex, 1);
            return '';
        }

        return `rm: cannot remove ‘${args[0]}’: No such file or directory`;
    }


    const command_mv = (directory: TerminalFolder, args: string[]) => {
        if (args.length < 2) {
            return 'mv: missing file operand';
        }

        const source = directory.folders.find(folder => folder.name === args[0]) || directory.files.find(file => file.name === args[0]);
        if (!source) {
            return `mv: cannot stat ‘${args[0]}’: No such file or directory`;
        }

        const destination = directory.folders.find(folder => folder.name === args[1]) || directory.files.find(file => file.name === args[1]);
        if (destination) {
            return `mv: cannot move ‘${args[0]}’: File exists`;
        }

        source.name = args[1];
        return '';
    }

    const command_cp = (directory: TerminalFolder, args: string[]) => {
        if (args.length < 2) {
            return 'cp: missing file operand';
        }

        const source = directory.folders.find(folder => folder.name === args[0]) || directory.files.find(file => file.name === args[0]);
        if (!source) {
            return `cp: cannot stat ‘${args[0]}’: No such file or directory`;
        }

        const destination = directory.folders.find(folder => folder.name === args[1]) || directory.files.find(file => file.name === args[1]);
        if (destination) {
            return `cp: cannot copy ‘${args[0]}’: File exists`;
        }

        return '';
    }


    const command_help = () => {
        // available commands : ls, cd, cat, pwd, history, clear, help, mkdir, rm, mv, cp
        return `<span class="text-green-500">ls</span> - list directory contents <br>
        <span class="text-green-500">cd</span> - change the current directory <br>
        <span class="text-green-500">cat</span> - concatenate files and print on the standard output <br>
        <span class="text-green-500">pwd</span> - print name of current/working directory <br>
        <span class="text-green-500">history</span> - display the command history <br>
        <span class="text-green-500">clear</span> - clear the terminal screen <br>
        <span class="text-green-500">help</span> - display help for commands <br>`;
    }




    /*
    * This function takes a command as input and returns the output of the command.
    */
    const commands = (command: string) => {
        const firstWord = command.split(' ')[0];
        const args = command.split(' ').slice(1);

        switch (firstWord) {
            case 'cd':
                return command_cd(currentDirectory, args);
                break;
            case 'ls':
                return command_ls(currentDirectory);
                break;
            case 'cat':
                return command_cat(currentDirectory, args);
                break;
            case '':
                return '';
                break;
            case 'pwd':
                return command_pwd(currentDirectory);
                break;
            case 'history':
                return command_history();
                break;
            case 'clear':
                return command_clear();
                break;
            case 'help':
                return command_help();
                break;
            case 'mkdir':
                return command_mkdir(currentDirectory, args);
                break;
            case 'rm':
                return command_rm(currentDirectory, args);
                break;
            case 'mv':
                return command_mv(currentDirectory, args);
                break;
            case 'cp':
                return command_cp(currentDirectory, args);
                break;
            default:
                return `${firstWord}: command not found`;
        }


        return;
    }

    /*
     * This function is called when the user presses the Enter key.
    */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const newHistoryItem: HistoryItem = {
                command: input,
                output: commands(input),
                directory: currentDirectory
            };

            setHistory([...history, newHistoryItem]);
            setInput('');
        }
    };

    // focus on the input field
    useEffect(() => {
        document.onkeydown = (e) => {
            // focus on the input field when the user presses the Escape key
            if (e.key === 'Escape') {
                setInput('');
            }

            // scroll to the bottom of the terminal
            window.scrollTo(0, document.body.scrollHeight);
        }
    }, []);


    return (
        <div style={{ backgroundColor: 'black', color: 'white', padding: '10px', minHeight: '100vh' }}>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus={true}
                className="fixed bg-black text-white border-none outline-none focus:outline-none focus:border-none focus:ring-0"
                style={{ backgroundColor: 'transparent', color: 'transparent', border: 'none', outline: 'none', height: '100%', width: '100%', bottom: 0, position: 'fixed' }}
            />
            <div>
                <span className="mr-1" dangerouslySetInnerHTML={{ __html: welcomeMessage }}></span>
                {history.map((historyItem, index) => (
                    <div key={index} className='flex flex-col'>
                        <div>
                            <span className="text-green-500 mr-1">kuray@karaaslan:</span>
                            <span className="text-blue-500 mr-1">{historyItem.directory.name}</span>
                            <span style={{ height: '1rem' }}>{historyItem.command}</span>
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: historyItem.output || '' }}>
                        </div>
                    </div>



                ))}
            </div>
            <div>
                <span className="text-green-500 mr-1">kuray@karaaslan:</span>
                <span className="text-blue-500 mr-1">{currentDirectory.name}</span>
                <span className="mr-1" style={{ height: '1rem' }}>{input}</span>
                <span className="cursor-pointer animate-typing">|</span>
            </div>
        </div>
    );
};

export default Terminal;