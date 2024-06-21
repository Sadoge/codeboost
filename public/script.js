async function processCode(action) {
    const code = document.getElementById('codeInput').value;
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
            body: JSON.stringify({ code, action })
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
