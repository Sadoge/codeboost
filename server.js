const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file

const app = express();

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(bodyParser.json());

// Handle POST requests to '/api/process'
app.post('/api/process', async (req, res) => {
    try {
        const { code, action } = req.body;

        console.log('Received request body:', req.body);

        if (!code || !action) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const output = await generateOutput(action, code);

        console.log('Received output:', output);

        const formattedOutput = formatOutput(output);

        res.json({ output: formattedOutput });
    } catch (error) {
        console.error('Error processing request:', error);
        const errorMsg = error.response ? error.response.data : 'Failed to process code';
        res.status(500).json({ error: 'Failed to process code', details: errorMsg });
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// Function to generate output using OpenAI API
async function generateOutput(action, code) {
    const prompts = {
        comments: `You are a coding assistant. Your task is to add clear, concise comments to the following code snippet to explain its functionality:\n\n${code}`,
        tests: `You are a coding assistant. Your task is to write comprehensive unit tests for the following code snippet using a popular testing framework:\n\n${code}`,
        refactor: `You are a coding assistant. Your task is to refactor the following code snippet to improve its readability, efficiency, and maintainability. Ensure the functionality remains unchanged:\n\n${code}`
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

// Function to format the output with HTML tags
function formatOutput(output) {
    const lines = output.split('\n');
    let formattedOutput = '';
    let inCodeBlock = false;

    lines.forEach(line => {
        if (line.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            if (inCodeBlock) {
                formattedOutput += `<pre><code class="language-javascript">`;
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
