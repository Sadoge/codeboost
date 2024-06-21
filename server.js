const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware to serve static files and parse JSON requests
app.use(express.static('public'));
app.use(bodyParser.json());

// Handle code processing requests
app.post('/api/process', async (req, res) => {
    try {
        const { code, action, language, model } = req.body;

        // Validate request body
        if (!code || !action || !language || !model) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const output = await generateOutput(action, code, model);
        const formattedOutput = formatOutput(output, language);

        res.json({ output: formattedOutput });
    } catch (error) {
        console.error('Error processing code:', error);
        const errorMsg = error.response ? error.response.data : 'Failed to process code';
        res.status(500).json({ error: 'Failed to process code', details: errorMsg });
    }
});

// Handle documentation generation requests
app.post('/api/generate-docs', async (req, res) => {
    try {
        const { code, language } = req.body;

        // Validate request body
        if (!code || !language) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const docPath = await generateDocumentation(code, language);
        res.json({ docUrl: `/docs/${path.basename(docPath)}` });
    } catch (error) {
        console.error('Error generating documentation:', error);
        res.status(500).json({ error: 'Failed to generate documentation' });
    }
});

// Serve the generated documentation files
app.use('/docs', express.static(path.join(__dirname, 'temp', 'docs')));

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Generate output based on the action, code, and model
async function generateOutput(action, code, model) {
    const prompts = {
        comments: `You are a coding assistant. Your task is to add clear, concise comments to the following code snippet to explain its functionality:\n\n${code}`,
        tests: `You are a coding assistant. Your task is to write comprehensive unit tests for the following code snippet using a popular testing framework:\n\n${code}`,
        refactor: `You are a highly skilled software developer. Your task is to refactor the following code snippet to improve its readability, efficiency, and maintainability. Specifically, you should:

1. Improve the code structure and organization.
2. Enhance the performance where possible.
3. Ensure the code adheres to best practices and coding standards.
4. Remove any redundant or unnecessary code.
5. Simplify complex logic without changing the functionality.
6. Add comments to explain non-obvious parts of the code.

Here is the code snippet to refactor:

\`\`\`
${code}
\`\`\`

Please provide the refactored code along with a brief explanation of the changes you made.`
    };

    const prompt = prompts[action];
    if (!prompt) {
        throw new Error('Invalid action');
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: model,
        messages: [
            { role: 'system', content: 'You are a highly skilled coding assistant. You provide detailed and accurate assistance to software developers, including adding comments, writing tests, and refactoring code.' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        n: 1,
        stop: null,
        temperature: 0.7,
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
    });

    return response.data.choices[0].message.content;
}

// Format the output into HTML with syntax highlighting
function formatOutput(output, language) {
    const lines = output.split('\n');
    let formattedOutput = '';
    let inCodeBlock = false;

    lines.forEach(line => {
        if (line.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            if (inCodeBlock) {
                const match = line.match(/```(\w+)/);
                const langClass = match ? `language-${match[1]}` : `language-${language}`;
                formattedOutput += ``;
            } else {
                formattedOutput += ``;
            }
        } else {
            if (inCodeBlock) {
                formattedOutput += line + '\n';
            } else {
                formattedOutput += `${line}`;
            }
        }
    });

    return formattedOutput;
}

// Generate documentation for the provided code and language
async function generateDocumentation(code, language) {
    const tempDir = path.join(__dirname, 'temp');
    const codeFilePath = path.join(tempDir, `code.${language}`);
    const docsOutputDir = path.join(tempDir, 'docs');

    try {
        // Ensure temp directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        // Write code to file
        fs.writeFileSync(codeFilePath, code);

        // Determine the command to generate documentation
        let generateDocsCommand = getGenerateDocsCommand(language, codeFilePath, docsOutputDir);

        // Execute the command to generate documentation
        await execPromise(generateDocsCommand);

        return path.join(docsOutputDir, 'index.html');
    } catch (error) {
        console.error('Error generating documentation:', error);
        throw error;
    }
}

// Get the command to generate documentation based on the language
function getGenerateDocsCommand(language, codeFilePath, docsOutputDir) {
    switch (language) {
        case 'javascript':
            return `npx jsdoc -d ${docsOutputDir} ${codeFilePath}`;
        case 'python':
            return `sphinx-apidoc -o ${docsOutputDir} ${codeFilePath} && cd ${docsOutputDir} && make html`;
        case 'dart':
            const pubspecPath = path.join(path.dirname(codeFilePath), 'pubspec.yaml');
            if (!fs.existsSync(pubspecPath)) {
                fs.writeFileSync(pubspecPath, `name: temp_project\ndescription: Temporary project for documentation generation\nversion: 0.0.1\nenvironment:\n  sdk: ">=2.12.0 <3.0.0"`);
            }
            return `dart doc --output ${docsOutputDir}`;
        case 'java':
            return `javadoc -d ${docsOutputDir} ${codeFilePath}`;
        default:
            throw new Error('Unsupported language');
    }
}

// Execute a shell command and return a promise
function execPromise(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout || stderr);
            }
        });
    });
}

module.exports = app;
module.exports = server;
