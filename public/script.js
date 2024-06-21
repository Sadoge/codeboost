async function processCode(action) {
    const code = document.getElementById('codeInput').value;
    const modelSelect = document.getElementById('modelSelect');
    const model = modelSelect.value; // Get the selected model
    const languageSelect = document.getElementById('languageSelect');
    const language = languageSelect.value; // Get the selected language
    const loader = document.getElementById('loader');
    const resultElement = document.getElementById('result');
    const copyButton = document.getElementById('copyButton');
    const clearButton = document.getElementById('clearButton');

    loader.style.display = 'block';
    resultElement.innerHTML = '';
    copyButton.classList.add('hidden');
    clearButton.classList.add('hidden');

    try {
        const response = await fetch('/api/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, action, language, model })  // Include the model and language parameters
        });

        const result = await response.json();
        resultElement.innerHTML = result.output;
        Prism.highlightAllUnder(resultElement);

        if (result.output.trim() !== '') {
            copyButton.classList.remove('hidden');
            clearButton.classList.remove('hidden');
        }
    } catch (error) {
        resultElement.innerHTML = '<p class="text-red-500">Failed to process code.</p>';
    } finally {
        loader.style.display = 'none';
    }
}

async function generateDocs() {
    const code = document.getElementById('codeInput').value;
    const languageSelect = document.getElementById('languageSelect');
    const language = languageSelect.value; // Get the selected language
    const loader = document.getElementById('loader');
    loader.style.display = 'block';

    try {
        const response = await fetch('/api/generate-docs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, language })  // Include the language parameter
        });

        const result = await response.json();
        if (result.docUrl) {
            window.open(result.docUrl, '_blank');
        } else {
            alert('Failed to generate documentation');
        }
    } catch (error) {
        alert('Failed to generate documentation');
    } finally {
        loader.style.display = 'none';
    }
}

function copyCode() {
    const resultElement = document.getElementById('result');
    const codeBlocks = resultElement.querySelectorAll('pre code');
    let textToCopy = '';

    codeBlocks.forEach(codeBlock => {
        textToCopy += codeBlock.textContent + '\n';
    });

    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Code copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

function clearResult() {
    document.getElementById('codeInput').value = '';
    document.getElementById('result').innerHTML = '';
    document.getElementById('copyButton').classList.add('hidden');
    document.getElementById('clearButton').classList.add('hidden');
}
