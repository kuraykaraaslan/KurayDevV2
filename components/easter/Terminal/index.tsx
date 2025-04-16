// Terminal.tsx

'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useTerminal } from './Hooks/useTerminal';
import { CommandOutput , TerminalFolder } from './Partials/models';
import { commandMap } from './Partials/commands';

const userName = 'kuraykaraaslan';
const hostName = 'kuray-dev';
const prompt = `${userName}@${hostName}:~$`;

const Terminal: React.FC = () => {
    const { history, processCommand, currentPath, fileSystem, setHistory } = useTerminal();
    const [input, setInput] = useState('');
    
    const getCurrentDirectory = useCallback((): TerminalFolder => {
        let currentDir = fileSystem;
        for (const dirName of currentPath) {
            const dir = currentDir.folders.find(f => f.name === dirName);
            if (!dir) return currentDir;
            currentDir = dir;
        }
        return currentDir;
    }, [fileSystem, currentPath]);

    const getCommonPrefix = (strings: string[]): string => {
        if (strings.length === 0) return '';
        let prefix = strings[0];
        for (const str of strings) {
            while (str.indexOf(prefix) !== 0) {
                prefix = prefix.slice(0, -1);
                if (prefix === '') return '';
            }
        }
        return prefix;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const target = e.currentTarget as HTMLInputElement;
        const cursorPos = target.selectionStart || 0;
        const value = target.value;

        if (e.key === 'Enter') {
            const trimmedInput = input.trim();
            
            // Handle empty command
            if (trimmedInput === '') {
                // Add empty command to history with no output
                setHistory(prev => [
                    ...prev,
                    {
                        command: '',
                        output: { type: 'text', content: '' },
                        directoryPath: currentPath,
                    }
                ]);
                setInput('');
                return;
            }
    
            processCommand(trimmedInput);
            setInput('');
        
        } else if (e.key === 'Tab') {
            e.preventDefault();
            // Find current word boundaries
            let start = cursorPos;
            let end = cursorPos;
            while (start > 0 && !/\s/.test(value[start - 1])) start--;
            while (end < value.length && !/\s/.test(value[end])) end++;

            const currentWord = value.slice(start, end);
            const before = value.slice(0, start);
            const after = value.slice(end);

            // Determine completion context
            const isCommand = before.trim().split(/\s+/).length === 0;
            const currentDir = getCurrentDirectory();
            const candidates = isCommand
                ? Object.keys(commandMap)
                : [
                    ...currentDir.folders.map(f => f.name),
                    ...currentDir.files.map(f => f.name)
                ];

            const suggestions = candidates
                .filter(name => name.startsWith(currentWord))
                .sort();

            if (suggestions.length > 0) {
                const commonPrefix = getCommonPrefix(suggestions);
                const completion = commonPrefix.slice(currentWord.length);
                
                if (completion) {
                    const newValue = `${before}${currentWord}${completion}${after}`;
                    const newCursorPos = start + currentWord.length + completion.length;
                    setInput(newValue);
                    setTimeout(() => target.setSelectionRange(newCursorPos, newCursorPos), 0);
                }
            }
        }

        // up and down arrow keys
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length > 0) {
                const lastCommand = history[history.length - 1].command;
                setInput(lastCommand);
                target.setSelectionRange(lastCommand.length, lastCommand.length);
            }
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (history.length > 0) {
                const lastCommand = history[history.length - 1].command;
                setInput(lastCommand);
                target.setSelectionRange(lastCommand.length, lastCommand.length);
            }
        }
    };


    const renderOutput = (output: CommandOutput) => {
        switch (output.type) {
            case 'text':
                return <pre className="whitespace-pre-wrap font-mono">{output.content}</pre>;
            case 'list':
                return output.items.map((item, i) => (
                    <span key={i} className={item.type === 'folder' ? 'text-blue-500' : 'text-white'}>
                        {item.name}{' '}
                    </span>
                ));
            case 'error':
                return <span className="text-red-500">{output.message}</span>;
            default:
                return null;
        }
    };

    return (
        <div className="bg-black text-white p-4 min-h-screen font-mono">
            <div className="">
                {history.map((item, i) => {
                    const renderedOutput = renderOutput(item.output);

                    console.log('renderedOutput', renderedOutput);
                    //if it is empty, return null
                    //if it is a list, add a new line
                    return (
                        <div key={i} className="">
                            <div className="text-green-500 h-6">
                                <span className="">{prompt}</span>
                                <span className="text-blue-500 ml-1">{item.directoryPath.join('/') || '~'}</span>$
                                <span className="ml-2 text-white">{item.command}</span>
                            </div>
                            {renderedOutput && (
                                <div className="">{renderedOutput}</div>
                            )}
                        </div>
                    );
                }
                )}
            </div>
            <div className="flex items-center">
                <span className="text-green-500">{prompt}</span>
                <span className="text-blue-500 ml-1">{currentPath.join('/') || '~'}</span>$
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-6 pl-2 bg-transparent text-white outline-none flex-1 focus:ring-0 focus:outline-none border-0"
                    autoFocus
                />
            </div>
        </div>
    );
};

export default Terminal;