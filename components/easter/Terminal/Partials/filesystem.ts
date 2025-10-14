import { TerminalFolder } from "./models";

const filesystem: TerminalFolder = {
    name: '~',
    folders: [
        {
            name: 'resume',
            folders: [],
            files: [
                {
                    name: 'cv.txt',
                    content: `KURAY KARAASLAN\n\nFull Stack Developer | React, Node.js, Java`,
                    type: 'file'
                },
                {
                    name: 'cover-letter.md',
                    content: '# Cover Letter\n\nHello, I am Kuray Karaaslan, a full stack developer who transitioned from civil engineering to software development. I specialize in building modern SaaS applications with clean architecture and excellent user experience.',
                    type: 'file'
                }
            ]
        },
        {
            name: 'skills',
            folders: [],
            files: [
                {
                    name: 'languages.txt',
                    content: 'JavaScript/TypeScript, Java',
                    type: 'file'
                },
                {
                    name: 'frameworks.txt',
                    content: 'React, Next.js, React Native, Express.js, Prisma, Spring Boot',
                    type: 'file'
                },
                {
                    name: 'tools.txt',
                    content: 'Docker, Git, MQTT, Stripe, Tailwind CSS, Zustand, Three.js, TurboRepo, Iyzico',
                    type: 'file'
                },
                {
                    name: 'design.txt',
                    content: 'UI/UX Design, Figma, Tailwind CSS, pixel-perfect components',
                    type: 'file'
                }
            ]
        },
        {
            name: 'education',
            folders: [],
            files: [
                {
                    name: 'university.txt',
                    content: 'BSc Civil Engineering\nDokuz Eylul University (2015-2021)',
                    type: 'file'
                }
            ]
        },
        {
            name: 'hobbies',
            folders: [],
            files: [
                {
                    name: 'reading.txt',
                    content: 'Enjoys reading blog posts, developer docs, and exploring SaaS architecture patterns.',
                    type: 'file'
                },
                {
                    name: 'fitness.txt',
                    content: 'Goes to the gym 2-3 times/week. 40 min treadmill, 30 min strength training.',
                    type: 'file'
                },
                {
                    name: 'coffee-nerd.md',
                    content: 'Has two coffee machines and enjoys reviewing them. Left-handed coffee enthusiast.',
                    type: 'file'
                },
                {
                    name: 'fun.txt',
                    content: 'Enjoys witty riddles and jokes. Built a streaming setup with lights, webcam, and professional mic.',
                    type: 'file'
                },
                {
                    name: 'stream-setup.txt',
                    content: `Dual monitor, Logitech 4K webcam, RGB lights, pro mic, adjustable arms. Used for recording educational videos and live demos.`,
                    type: 'file'
                }
            ]
        },
        {
            name: 'config',
            folders: [],
            files: [
                {
                    name: 'settings.json',
                    content: '{"theme":"dark","font":"Fira Code"}',
                    type: 'file'
                }
            ]
        }
    ],
    files: [
        {
            name: 'readme.txt',
            content: `# Welcome to my terminal!\n\nThis is a simulated terminal environment. You can explore my files and folders using commands like 'ls', 'cd', and 'cat'.\n\nTo get started, try typing 'ls' to list the contents of the current directory.`,
            type: 'file'
        },
        {
            name: 'contact.info',
            content: `Email: kuraykaraaslan@gmail.com\nLinkedIn: linkedin.com/in/kuray\nGitHub: github.com/kuraykaraaslan`,
            type: 'file'
        },
        {
            name: 'about.txt',
            content: `Kuray Karaaslan — developer, builder, engineer in transition. From construction sites to codebases, now designing better systems than buildings.`,
            type: 'file'
        },
        {
            name: '.bashrc',
            content: '# Custom bash config with alias for productivity',
            type: 'file'
        }
    ]
};

export default filesystem;
