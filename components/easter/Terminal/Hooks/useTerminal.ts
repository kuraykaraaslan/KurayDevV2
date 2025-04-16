// useTerminal.ts

import { useState } from 'react';
import { TerminalFolder, HistoryItem, CommandOutput } from '../Partials/models';
import { executeCommand } from '../Partials/commands';
import filesystem from '../Partials/filesystem';
import { useRouter } from 'next/navigation';

export const useTerminal = () => {
    const [fileSystem, setFileSystem] = useState<TerminalFolder>(filesystem);
    const [currentPath, setCurrentPath] = useState<string[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const router = useRouter();

    const processCommand = (command: string) => {
        const result = executeCommand(
            command,
            currentPath,
            fileSystem
        );

        // Handle clear command
        if (command.trim() === 'clear') {
            setHistory([]);
            setCurrentPath([]);
            setFileSystem(filesystem);
            return;
        }

        //handle history
        if (command.trim() === 'history') {
            const historyOutput: CommandOutput = {
                type: 'list',
                items: history.map((item, index) => ({
                    name: `${index + 1}: ${item.command}`,
                    type: 'file'
                }))
            };
            const newHistoryItem: HistoryItem = {
                command,
                output: historyOutput,
                directoryPath: currentPath
            };
            setHistory(prev => [...prev, newHistoryItem]);
            return;
        }

        // Handle exit command
        if (command.trim() === 'exit') {
            const exitOutput: CommandOutput = {
                type: 'text',
                content: 'Exiting terminal...'
            };
            setTimeout(() => {
                router.push('/');
            }
            , 1000);

            const newHistoryItem: HistoryItem = {
                command,
                output: exitOutput,
                directoryPath: currentPath
            };
            setHistory(prev => [...prev, newHistoryItem]);
            return;

        }

        const { output } = result;
        const newHistoryItem: HistoryItem = {
            command,
            output: output as CommandOutput, // Ensure output is cast to CommandOutput
            directoryPath: currentPath
        };

        setHistory(prev => [...prev, newHistoryItem]);
        if ('newFileSystem' in result && result.newFileSystem) {
            setFileSystem(result.newFileSystem);
        }
        if ('newPath' in result && result.newPath) {
            setCurrentPath(result.newPath);
        }
    };

    return { history, processCommand, currentPath, fileSystem, setHistory };


};