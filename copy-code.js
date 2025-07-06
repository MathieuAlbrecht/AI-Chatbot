// Function to add copy buttons to code blocks
const addCopyButtonsToCodeBlocks = (container) => {
    const codeBlocks = container.querySelectorAll('pre code');
    codeBlocks.forEach((codeBlock) => {
        const pre = codeBlock.parentElement;
        
        // Skip if already processed
        if (pre.parentElement.classList.contains('code-block-wrapper')) {
            return;
        }
        
        // Create wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        
        // Create header with copy button
        const header = document.createElement('div');
        header.className = 'code-block-header';
        
        // Detect language
        const language = codeBlock.className.match(/language-(\w+)/);
        const langName = language ? language[1] : 'code';
        
        const langLabel = document.createElement('span');
        langLabel.className = 'code-language';
        langLabel.textContent = langName;
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i> Kopieren';
        copyButton.title = 'Code kopieren';
        
        copyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(codeBlock.textContent);
                copyButton.innerHTML = '<i class="fas fa-check"></i> Kopiert!';
                copyButton.classList.add('copied');
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i> Kopieren';
                    copyButton.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code:', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = codeBlock.textContent;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                copyButton.innerHTML = '<i class="fas fa-check"></i> Kopiert!';
                copyButton.classList.add('copied');
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i> Kopieren';
                    copyButton.classList.remove('copied');
                }, 2000);
            }
        });
        
        header.appendChild(langLabel);
        header.appendChild(copyButton);
        
        // Insert wrapper before pre element
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
    });
};

// Export for use in main script
window.addCopyButtonsToCodeBlocks = addCopyButtonsToCodeBlocks;