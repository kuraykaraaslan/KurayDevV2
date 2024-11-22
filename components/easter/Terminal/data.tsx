export interface TerminalFile {
    name: string;
    content: string;
    type: string;
}

export interface TerminalFolder {
    name: string;
    parent?: TerminalFolder;
    folders: TerminalFolder[];
    files: TerminalFile[];
}

// home folder has a resume folder and a readme file
const home_folder_readme : TerminalFile = {
    name: 'readme.txt',
    content: 'Welcome to my terminal! This is a simple terminal emulator I built using Next.js and Tailwind CSS. You can navigate through the folders and files using basic commands like `ls` and `cd`. Feel free to explore!',
    type: 'file'
}

const home_folder_resume : TerminalFolder = {
    name: 'resume',
    folders: [],
    files: []
}

export const home_folder : TerminalFolder = {
    name: '~',
    folders: [home_folder_resume],
    files: [home_folder_readme]
}