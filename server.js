const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');  // Make sure to import the path module
require('dotenv').config();

const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());

app.post('/api/process', async (req, res) => {
    try {
        const { code, action, language } = req.body;

        if (!code || !action || !language) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const output = await generateOutput(action, code);
        const formattedOutput = formatOutput(output, language);

        res.json({ output: formattedOutput });
    } catch (error) {
        console.error('Internal server error while processing code:', error);
        const errorMsg = error.response ? error.response.data : 'Failed to process code';
        res.status(500).json({ error: 'Failed to process code', details: errorMsg });
    }
});

app.post('/api/generate-docs', async (req, res) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const docUrl = await generateDocumentation(code, language);
        res.json({ docUrl });
    } catch (error) {
        console.error('Internal server error while generating documentation:', error);
        res.status(500).json({ error: 'Failed to generate documentation' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

async function generateOutput(action, code) {
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
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: 'You are a highly skilled coding assistant. You provide detailed and accurate assistance to software developers, including adding comments, writing tests, and refactoring code.' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
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
                formattedOutput += `<pre><code class="${langClass}">`;
            } else {
                formattedOutput += `</code></pre>`;
            }
        } else {
            if (inCodeBlock) {
                formattedOutput += line + '\n';
            } else {
                formattedOutput += `<p>${line}</p>`;
            }
        }
    });

    return formattedOutput;
}

async function generateDocumentation(code, language) {
    const tempDir = path.join(__dirname, 'temp');
    const codeFilePath = path.join(tempDir, `code.${language}`);
    const docsOutputDir = path.join(tempDir, 'docs');

    try {
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        fs.writeFileSync(codeFilePath, code);

        let generateDocsCommand;

        if (language === 'javascript') {
            generateDocsCommand = `npx jsdoc -d ${docsOutputDir} ${codeFilePath}`;
        } else if (language === 'python') {
            generateDocsCommand = `sphinx-apidoc -o ${docsOutputDir} ${codeFilePath} && cd ${docsOutputDir} && make html`;
        } else if (language === 'dart') {
            const pubspecPath = path.join(tempDir, 'pubspec.yaml');
            if (!fs.existsSync(pubspecPath)) {
                fs.writeFileSync(pubspecPath, `name: temp_project\ndescription: Temporary project for documentation generation\nversion: 0.0.1\nenvironment:\n  sdk: ">=2.12.0 <3.0.0"`);
            }
            generateDocsCommand = `dart doc --output ${docsOutputDir}`;
        } else {
            throw new Error('Unsupported language');
        }

        await execPromise(generateDocsCommand);

        const docUrl = path.join(docsOutputDir, 'index.html');
        return docUrl;
    } catch (error) {
        console.error('Error generating documentation:', error);
        throw error;
    }
}

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
