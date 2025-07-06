document.addEventListener("DOMContentLoaded", () => {
    marked.setOptions({
        highlight: function (code, lang) {
            const language = hljs.getLanguage(lang) ? lang : "plaintext";
            return hljs.highlight(code, { language }).value;
        },
        langPrefix: "hljs language-",
    });

    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('profile-username').textContent = username;
    }

    // DOM Elements
    const chatHistoryEl = document.getElementById("chat-history");
    const userInputEl = document.getElementById("user-input");
    const chatFormEl = document.getElementById("chat-form");
    const modelSelectEl = document.getElementById("model-select");
    const sendButtonEl = document.getElementById("send-button");
    const newChatBtn = document.getElementById("new-chat-btn");
    const chatListEl = document.getElementById("chat-list");
    const mainContentEl = document.getElementById("main-content");
    const welcomeScreenEl = document.getElementById("welcome-screen");
    const modelInfoEl = document.getElementById("model-info");
    const currentProviderEl = document.getElementById("current-provider");

    // Modal elements
    const clearAllBtn = document.getElementById("clear-all-btn");
    const confirmationModal = document.getElementById("confirmation-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");
    const modalCancel = document.getElementById("modal-cancel");
    const modalConfirm = document.getElementById("modal-confirm");

    // File upload elements
    const attachmentBtn = document.getElementById("attachment-btn");
    const fileUploadContainer = document.getElementById("file-upload-container");
    const fileUploadArea = document.getElementById("file-upload-area");
    const fileInput = document.getElementById("file-input");
    const filePreview = document.getElementById("file-preview");

    // Global variables
    let chats = [];
    let activeChatId = null;
    let isLoading = false;
    let availableModels = [];
    let selectedFiles = [];
    let pendingDeleteAction = null;
    const API_BASE_URL = 'http://localhost:3000';

    // Modal functions
    const showModal = (title, message, confirmCallback) => {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        pendingDeleteAction = confirmCallback;
        confirmationModal.classList.add('show');
    };

    const hideModal = () => {
        confirmationModal.classList.remove('show');
        pendingDeleteAction = null;
    };

    // UI State Management
    const showWelcomeScreen = () => {
        console.log("Showing welcome screen");        mainContentEl.classList.add("hidden");
        welcomeScreenEl.classList.remove("hidden");
        
        // activeChatId = null; // Diese Zeile MUSS entfernt bleiben!
    };

    const showChatScreen = () => {
        welcomeScreenEl.classList.add("hidden");
        console.log("Showing chat screen");        mainContentEl.classList.remove("hidden");
        
    };



    // Chat-Löschfunktionen
    const deleteChat = (chatId) => {
        chats = chats.filter(chat => chat.id !== chatId);
        if (activeChatId === chatId) {
            if (chats.length > 0) {
                setActiveChat(chats[0].id);
            } else {
                activeChatId = null;
                showWelcomeScreen();
            }
        }
        renderChatList();
        saveChats();
    };

    const showDeleteChatModal = (chatId, chatTitle) => {
        showModal(
            "Chat löschen",
            `Möchtest du den Chat "${chatTitle}" wirklich löschen?`,
            () => {
                deleteChat(chatId);
                hideModal();
            }
        );
    };

    // Utility functions
    const saveChats = () => {
        localStorage.setItem("ai-chathub-chats", JSON.stringify(chats));
        localStorage.setItem("ai-chathub-active-id", activeChatId);
    };

    const saveLastModel = () => {
        localStorage.setItem("ai-chathub-last-model", modelSelectEl.value);
    };

    // File upload functions
    const toggleFileUpload = () => {
        fileUploadContainer.classList.toggle('hidden');
        attachmentBtn.style.color = fileUploadContainer.classList.contains('hidden')
            ? '#8B949E' : '#2F81F7';
    };

    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/')) return 'fas fa-image';
        if (fileType.includes('pdf')) return 'fas fa-file-pdf';
        if (fileType.includes('word') || fileType.includes('document')) return 'fas fa-file-word';
        if (fileType.includes('text') || fileType.includes('plain')) return 'fas fa-file-text';
        if (fileType.includes('json') || fileType.includes('javascript')) return 'fas fa-file-code';
        return 'fas fa-file';
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const addFileToPreview = (file) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.fileName = file.name;
        fileItem.innerHTML = `
      <i class="${getFileIcon(file.type)}"></i>
      <span class="file-name">${file.name}</span>
      <span class="file-size">(${formatFileSize(file.size)})</span>
      <button class="file-remove">✕</button>
    `;

        fileItem.querySelector('.file-remove').addEventListener('click', () => {
            selectedFiles = selectedFiles.filter(f => f.name !== file.name);
            fileItem.remove();
            if (selectedFiles.length === 0) {
                fileUploadContainer.classList.add('hidden');
                attachmentBtn.style.color = '#8B949E';
            }
        });
        filePreview.appendChild(fileItem);
    };

    const handleFileSelect = (files) => {
        Array.from(files).forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                alert(`Datei "${file.name}" ist zu gross. Maximum: 10MB`);
                return;
            }
            if (selectedFiles.some(f => f.name === file.name)) return;
            selectedFiles.push(file);
            addFileToPreview(file);
        });
        if (selectedFiles.length > 0) {
            fileUploadContainer.classList.remove('hidden');
            attachmentBtn.style.color = '#2F81F7';
        }
    };

    // Load available models from server
    const loadAvailableModels = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/models`);
            const data = await response.json();
            availableModels = data.models;
            modelSelectEl.innerHTML = '';

            // Group models by provider
            const providers = {};
            data.models.forEach(model => {
                if (!providers[model.provider]) {
                    providers[model.provider] = [];
                }
                providers[model.provider].push(model);
            });

            // Add optgroups for each provider
            Object.keys(providers).forEach(provider => {
                const optgroup = document.createElement('optgroup');
                let providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
                if (provider === 'puter') {
                    providerLabel += ' (Kostenlos)';
                }
                optgroup.label = providerLabel + ' Models';

                providers[provider].forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = model.name;
                    option.disabled = !model.available;
                    option.dataset.provider = model.provider;

                    if (!model.available) {
                        option.textContent += ' (API-Schlüssel erforderlich)';
                        option.style.color = '#8B949E';
                    } else if (provider === 'puter') {
                        option.textContent += ' 🆓';
                    }
                    optgroup.appendChild(option);
                });
                modelSelectEl.appendChild(optgroup);
            });

            // Restore last selected model
            const savedModel = localStorage.getItem("ai-chathub-last-model");
            if (savedModel && [...modelSelectEl.options].some(opt => opt.value === savedModel && !opt.disabled)) {
                modelSelectEl.value = savedModel;
            } else {
                // Select first available model
                const firstAvailable = [...modelSelectEl.options].find(opt => opt.value && !opt.disabled);
                if (firstAvailable) {
                    modelSelectEl.value = firstAvailable.value;
                }
            }
            updateModelInfo();
        } catch (error) {
            console.error('Fehler beim Laden der Modelle:', error);
            modelSelectEl.innerHTML = 'Fehler beim Laden der Modelle';
        }
    };

    // Update model info display
    const updateModelInfo = () => {
        const selectedOption = modelSelectEl.selectedOptions[0];
        if (selectedOption && selectedOption.dataset.provider) {
            const provider = selectedOption.dataset.provider;
            currentProviderEl.textContent = `Provider: ${provider}`;
            currentProviderEl.className = `provider-badge provider-${provider}`;
            modelInfoEl.classList.remove('hidden');
        } else {
            modelInfoEl.classList.add('hidden');
        }
    };

    // Get chat history for context
    const getChatHistory = (activeChat, maxMessages = 10) => {
        if (!activeChat || !activeChat.history) return [];
        return activeChat.history.slice(-maxMessages).map(msg => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.message
        }));
    };

    // Format chat history for different providers
    const formatChatHistoryForProvider = (history, currentMessage) => {
        const messages = [...history];
        messages.push({ role: "user", content: currentMessage });
        return messages;
    };

    const addMessageToDOM = (message, sender, isLoading = false) => {
        const messageContainer = document.createElement("div");
        messageContainer.className = `chat-message ${sender}`;
        if (isLoading) {
            messageContainer.textContent = 'Denkt nach...';
            messageContainer.id = 'loading-message';
        } else {
            messageContainer.innerHTML = marked.parse(message);
            // Add copy buttons to code blocks
            if (window.addCopyButtonsToCodeBlocks) {
                window.addCopyButtonsToCodeBlocks(messageContainer);
            }
        }
        chatHistoryEl.appendChild(messageContainer);
        chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
        return messageContainer;
    };

    const updateLoadingMessage = (message) => {
        const loadingElement = document.getElementById('loading-message');
        if (loadingElement) {
            loadingElement.innerHTML = marked.parse(message);
            loadingElement.removeAttribute('id');
        }
    };

    function renderActiveChat() {
        const activeChat = chats.find(c => c.id === activeChatId);

        if (!activeChat) {
            showWelcomeScreen();
            return;
        }

        showChatScreen();
        chatHistoryEl.innerHTML = "";
        
        if (activeChat.history && activeChat.history.length > 0) {
            activeChat.history.forEach(msg => {
                const div = document.createElement("div");
                div.className = `chat-message ${msg.sender}`;
                div.innerHTML = marked.parse(msg.message || msg.content);
                if (window.addCopyButtonsToCodeBlocks) {
                    window.addCopyButtonsToCodeBlocks(div);
                }
                chatHistoryEl.appendChild(div);
            });
            chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
        }
    }


    const setActiveChat = (chatId) => {
        activeChatId = chatId;
        renderActiveChat();
        renderChatList();
        saveChats();
    };

    const createNewChat = () => {
        const newChatId = Date.now().toString();
        const newChat = {
            id: newChatId,
            title: "Neuer Chat",
            history: [],
        };
        chats.push(newChat);
        activeChatId = newChatId;
        renderChatList();
        setActiveChat(newChatId); // WICHTIG: Welcome Screen entfernt
        saveChats();
    };

    const addMessageToState = (message, sender) => {
        const activeChat = chats.find((c) => c.id === activeChatId);
        if (activeChat) {
            activeChat.history.push({ sender, message });
            if (activeChat.history.length === 1 && sender === "user") {
                activeChat.title = message.substring(0, 40) + (message.length > 40 ? "..." : "");
                renderChatList();
            }
            saveChats();
        }
    };

    const setLoadingState = (loading) => {
        isLoading = loading;
        sendButtonEl.disabled = loading;
        userInputEl.disabled = loading;
        modelSelectEl.disabled = loading;
    };

    // Komplette renderChatList Funktion
    const renderChatList = () => {
        chatListEl.innerHTML = "";
        [...chats].reverse().forEach((chat) => {
            const li = document.createElement("li");
            li.dataset.chatId = chat.id;
            li.className = `chat-list-item ${
                chat.id === activeChatId ? "active-chat" : ""
            }`;

            // Chat-Inhalt Container
            const chatContent = document.createElement("div");
            chatContent.className = "chat-content";
            chatContent.textContent = chat.title;
            chatContent.addEventListener("click", () => setActiveChat(chat.id));

            // Löschen-Button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-chat-btn";
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = "Chat löschen";
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                showDeleteChatModal(chat.id, chat.title);
            });

            li.appendChild(chatContent);
            li.appendChild(deleteBtn);
            chatListEl.appendChild(li);
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const userMessage = userInputEl.value.trim();
        let activeChat = chats.find((c) => c.id === activeChatId);
        const selectedModel = modelSelectEl.value;

        if ((userMessage === "" && selectedFiles.length === 0) || !selectedModel || isLoading) return;

        // Automatisch neuen Chat erstellen wenn keiner aktiv ist
        if (!activeChat) {
            createNewChat();
            activeChat = chats.find((c) => c.id === activeChatId);
        }

        // Modell-Konfiguration suchen
        const modelConfig = availableModels.find(m => m.id === selectedModel);
        if (!modelConfig) {
            setLoadingState(false);
            alert("Ungültiges Modell ausgewählt.");
            return;
        }

        setLoadingState(true);
        addMessageToState(userMessage, "user");
        renderActiveChat();

        // UI aufräumen
        userInputEl.value = "";
        userInputEl.style.height = "auto";
        selectedFiles = [];
        filePreview.innerHTML = "";
        fileUploadContainer.classList.add('hidden');
        attachmentBtn.style.color = '#8B949E';

        // Add loading message
        addMessageToDOM("", "ai", true);

        try {
            let responseText;

            // Handle Puter.js models (Claude)
            if (modelConfig.provider === 'puter') {
                // Get chat history for context
                const chatHistory = getChatHistory(activeChat, 8);
                responseText = await callPuterClaude(
                    modelConfig.id,
                    userMessage,
                    chatHistory
                );
            } else {
                // Handle server-side models
                // Get chat history for context
                const chatHistory = getChatHistory(activeChat, 10);
                const messages = formatChatHistoryForProvider(chatHistory, userMessage);

                const response = await fetch(`${API_BASE_URL}/api/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: userMessage,
                        model: selectedModel,
                        messages: messages,
                        useContext: true
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.error || `HTTP error! status: ${response.status}`
                    );
                }

                const data = await response.json();
                responseText = data.response;
            }

            updateLoadingMessage(responseText);
            addMessageToState(responseText, "ai");
            renderActiveChat();
        } catch (error) {
            console.error("Fehler:", error);
            const errorMessage = `Fehler: ${error.message}`;
            updateLoadingMessage(errorMessage);
            addMessageToState(errorMessage, "ai");
            renderActiveChat();
        } finally {
            setLoadingState(false);
        }
    };

    const loadInitialState = async () => {
        // Load available models first
        await loadAvailableModels();

        const savedChats = localStorage.getItem("ai-chathub-chats");
        if (savedChats) chats = JSON.parse(savedChats);

        const savedActiveId = localStorage.getItem("ai-chathub-active-id");
        if (savedActiveId && chats.some((c) => c.id === savedActiveId)) {
            setActiveChat(savedActiveId);
        } else {
            // Show welcome screen if no active chat
            showWelcomeScreen();
        }
        renderChatList();
    };

    // Puter.js Claude function (placeholder)
    const callPuterClaude = async (modelId, message, chatHistory) => {
        // This is a placeholder for Puter.js integration
        // You would need to implement the actual Puter.js Claude API call here
        throw new Error("Puter.js integration not implemented yet. Please use a different model.");
    };

    // Event Listeners
    newChatBtn.addEventListener("click", createNewChat);
    chatFormEl.addEventListener("submit", handleFormSubmit);
    userInputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            chatFormEl.requestSubmit();
        }
    });
    modelSelectEl.addEventListener("change", () => {
        saveLastModel();
        updateModelInfo();
    });

    // Modal event listeners
    modalCancel.addEventListener("click", hideModal);
    modalConfirm.addEventListener("click", () => {
        if (pendingDeleteAction) {
            pendingDeleteAction();
        }
        hideModal();
    });

    // Clear all chats function
    clearAllBtn.addEventListener("click", () => {
        showModal(
            "Alle Chats löschen",
            "Möchtest du wirklich alle Chats löschen?",
            () => {
                chats = [];
                localStorage.removeItem("ai-chathub-chats");
                localStorage.removeItem("ai-chathub-active-id");
                renderChatList();
                showWelcomeScreen();
                hideModal();
            }
        );
    });

    // Close modal when clicking outside
    confirmationModal.addEventListener("click", (e) => {
        if (e.target === confirmationModal) {
            hideModal();
        }
    });

    // ESC key to close modal
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            hideModal();
        }
    });

    // File upload event listeners
    attachmentBtn.addEventListener("click", toggleFileUpload);
    fileUploadArea.addEventListener("click", () => {
        fileInput.click();
    });
    fileInput.addEventListener("change", (e) => {
        handleFileSelect(e.target.files);
    });

    // Drag and drop functionality
    fileUploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        fileUploadArea.classList.add("dragover");
    });
    fileUploadArea.addEventListener("dragleave", (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove("dragover");
    });
    fileUploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove("dragover");
        handleFileSelect(e.dataTransfer.files);
    });

    // Initialize the application
    loadInitialState();
});
