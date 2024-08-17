/**
 * Spotlight Module
 * This module provides a spotlight search feature with customizable options and UI elements.
 * It includes methods for initializing the spotlight search, handling user interactions,
 * and displaying search results dynamically.
 */

const spotlight = (() => {
    // Default options for the spotlight module
    const defaultOptions = {
        searchIcon: 'fas fa-search', // Default search icon (FontAwesome class)
        icons: { // Icon classes and colors for different search categories
            "books": { class: 'fas fa-book', backgroundColor: '#007bff', foregroundColor: '#fff' },
            "movies": { class: 'fas fa-film', backgroundColor: '#28a745', foregroundColor: '#fff' },
            "music": { class: 'fas fa-music', backgroundColor: '#dc3545', foregroundColor: '#fff' },
            "tv-shows": { class: 'fas fa-tv', backgroundColor: '#ffc107', foregroundColor: '#000' },
            "tech": { class: 'fas fa-laptop-code', backgroundColor: '#17a2b8', foregroundColor: '#fff' }
        },
        placeholderText: 'Search... (Ctrl + K)', // Placeholder text for the input field
        clearButtonIcon: 'fas fa-times', // Icon class for the clear button
        focusTimeout: 40, // Delay in milliseconds before focusing the input field when the modal is shown
        debounceTimeout: 300, // Delay in milliseconds to wait before triggering the search request
        disableClearButton: false, // Flag to disable the clear button
        fallbackIcon: { class: 'fas fa-question', backgroundColor: '#6c757d', foregroundColor: '#fff' }, // Fallback icon if a type is not defined
        ajaxOptions: {}, // Options for AJAX requests
        keyboardShortcut: { ctrlKey: true, key: 'k' }, // Keyboard shortcut for opening the spotlight
        url: '', // URL for AJAX requests
        // Custom classes for different UI elements
        modalClass: '',
        inputClass: '',
        clearButtonClass: '',
        resultsContainerClass: '',
        sectionClass: '',
        sectionTitleClass: '',
        sectionItemClass: '',
        // Callback functions
        onFetchStart: () => {}, // Called when a fetch request starts
        onFetchSuccess: () => {}, // Called when a fetch request is successful
        onFetchError: (error) => {}, // Called when a fetch request fails
        onResultsUpdate: (hasResults) => {}, // Called when search results are updated
        onModalToggle: (modal) => {}, // Called when the modal visibility is toggled
        onInputFocus: (input) => {}, // Called when the input field is focused
        onDataResponse: (data) => data, // Called when data is received and processed
        onItemAdd: (itemData) => itemData.name // Called to determine how each item should be displayed
    };

    // Private variables
    let options = {};
    let currentDebounceTimeout;
    let currentRequestController;

    /**
     * Creates a FontAwesome icon element with custom colors.
     * @param {string} iconClass - The FontAwesome icon class.
     * @param {string} backgroundColor - The background color for the icon.
     * @param {string} foregroundColor - The foreground color for the icon.
     * @returns {HTMLElement} - The created icon element.
     */
    const createIconElement = (iconClass, backgroundColor, foregroundColor) => {
        const iconElement = document.createElement('i');
        iconElement.className = iconClass;
        iconElement.style.backgroundColor = backgroundColor;
        iconElement.style.color = foregroundColor;
        return iconElement;
    };

    /**
     * Creates the HTML structure for the spotlight modal.
     * @param {string} placeholderText - The placeholder text for the search input.
     * @param {string} clearButtonIcon - The icon class for the clear button.
     * @param {boolean} disableClearButton - Flag to disable the clear button.
     * @param {string} modalClass - Additional class for the modal.
     * @param {string} inputClass - Additional class for the input field.
     * @param {string} clearButtonClass - Additional class for the clear button.
     * @param {string} resultsContainerClass - Additional class for the results container.
     * @returns {string} - The generated HTML for the spotlight modal.
     */
    const createModalHTML = (placeholderText, clearButtonIcon, disableClearButton, modalClass, inputClass, clearButtonClass, resultsContainerClass) => `
        <div class="spotlight-modal ${modalClass}">
            <div class="spotlight-modal-content">
                <div class="spotlight-container">
                    <input type="text" class="spotlight-input ${inputClass}" placeholder="${placeholderText}" aria-label="Search">
                    ${disableClearButton ? '' : `<button class="spotlight-clear-btn ${clearButtonClass}"><i class="${clearButtonIcon}"></i></button>`}
                </div>
                <div class="spotlight-results-container ${resultsContainerClass}"></div>
            </div>
        </div>
    `;

    /**
     * Creates the spotlight icon element and appends it to the specified trigger element.
     * @param {HTMLElement} trigger - The element to which the spotlight icon should be appended.
     * @returns {HTMLElement} - The created icon element.
     */
    const createSpotlightIcon = (trigger) => {
        const iconElement = createIconElement(options.searchIcon + ' spotlight-icon');
        trigger.appendChild(iconElement);
        return iconElement;
    };

    /**
     * Inserts the spotlight modal into the document body.
     * @param {string} placeholderText - The placeholder text for the search input.
     * @param {string} clearButtonIcon - The icon class for the clear button.
     * @param {boolean} disableClearButton - Flag to disable the clear button.
     * @param {string} modalClass - Additional class for the modal.
     * @param {string} inputClass - Additional class for the input field.
     * @param {string} clearButtonClass - Additional class for the clear button.
     * @param {string} resultsContainerClass - Additional class for the results container.
     */
    const insertModal = (placeholderText, clearButtonIcon, disableClearButton, modalClass, inputClass, clearButtonClass, resultsContainerClass) => {
        document.body.insertAdjacentHTML('beforeend', createModalHTML(placeholderText, clearButtonIcon, disableClearButton, modalClass, inputClass, clearButtonClass, resultsContainerClass));
    };

    /**
     * Toggles the visibility of the spotlight modal.
     * @param {HTMLElement} spotlightModal - The modal element to toggle.
     * @param {HTMLElement} spotlightInput - The input element to focus when the modal is shown.
     */
    const toggleModal = (spotlightModal, spotlightInput) => {
        spotlightModal.classList.toggle('show');
        if (spotlightModal.classList.contains('show')) {
            focusInputAfterDelay(spotlightInput, options.focusTimeout);
        } else {
            unfocusInput(spotlightInput);
        }
        // Execute callback after toggling the modal
        options.onModalToggle(spotlightModal);
    };

    /**
     * Focuses the input field after a specified delay.
     * @param {HTMLElement} spotlightInput - The input element to focus.
     * @param {number} delay - The delay before focusing, in milliseconds.
     */
    const focusInputAfterDelay = (spotlightInput, delay) => {
        setTimeout(() => {
            spotlightInput.select();
            spotlightInput.focus();
            options.onInputFocus(spotlightInput);
        }, delay);
    };

    /**
     * Unfocuses the input field.
     * @param {HTMLElement} spotlightInput - The input element to unfocus.
     */
    const unfocusInput = (spotlightInput) => spotlightInput.blur();

    /**
     * Closes the spotlight modal by removing the 'show' class.
     * @param {HTMLElement} spotlightModal - The modal element to close.
     */
    const closeModal = spotlightModal => spotlightModal.classList.remove('show');

    /**
     * Clears the input field and search results.
     * @param {HTMLElement} spotlightInput - The input element to clear.
     * @param {HTMLElement} spotlightResults - The results container element to clear.
     * @param {HTMLElement} spotlightClear - The clear button element to hide.
     */
    const clearInput = (spotlightInput, spotlightResults, spotlightClear) => {
        spotlightInput.value = '';
        spotlightResults.innerHTML = '';
        spotlightResults.style.display = 'none';
        spotlightClear.classList.remove('show');
        spotlightInput.focus();
    };

    /**
     * Handles and processes the search results based on the user query.
     * @param {Array} data - The array of search data.
     * @param {string} query - The search query entered by the user.
     * @returns {Object} - An object containing a boolean `hasResults` and the generated `resultsHTML`.
     */
    const handleSearchResults = (data, query) => {
        let hasResults = false;
        let resultsHTML = '';

        data.forEach(section => {
            const { type, name, items = [] } = section;
            const filteredItems = items.filter(item => item.name.toLowerCase().includes(query));

            if (filteredItems.length === 0) return;

            hasResults = true;
            const sectionIcon = options.icons[type] || options.fallbackIcon; // Fallback icon if type is not in map
            resultsHTML += createSectionHTML(name, sectionIcon.class, sectionIcon.backgroundColor, sectionIcon.foregroundColor, filteredItems);
        });

        return { hasResults, resultsHTML };
    };

    /**
     * Creates the HTML structure for a search results section.
     * @param {string} sectionName - The name of the section.
     * @param {string} iconClass - The icon class for the section.
     * @param {string} iconBackgroundColor - The background color for the section icon.
     * @param {string} iconForegroundColor - The foreground color for the section icon.
     * @param {Array} filteredItems - The filtered items to display in the section.
     * @returns {string} - The generated HTML for the section.
     */
    const createSectionHTML = (sectionName, iconClass, iconBackgroundColor, iconForegroundColor, filteredItems) => `
        <div class="spotlight-section ${options.sectionClass}">
            <div class="spotlight-section-header">
                <div class="icon-container" style="background-color: ${iconBackgroundColor}; color: ${iconForegroundColor};">
                    ${createIconElement(iconClass).outerHTML}
                </div>
                <span class="spotlight-section-title ${options.sectionTitleClass}">${sectionName}</span>
            </div>
            <div class="spotlight-section-content">
                ${filteredItems.map(item => `<div class="spotlight-section-item ${options.sectionItemClass}">${options.onItemAdd(item)}</div>`).join('')}
            </div>
        </div>
    `;

    /**
     * Updates the search results based on the user's query after a debounce period.
     * Cancels any ongoing request if a new one is initiated.
     * @param {string} query - The search query entered by the user.
     * @param {HTMLElement} spotlightResults - The results container element.
     * @param {HTMLElement} spotlightClear - The clear button element.
     */
    const updateResults = (query, spotlightResults, spotlightClear) => {
        // Clear the previous debounce timeout
        clearTimeout(currentDebounceTimeout);

        // Set a new debounce timeout to delay the request
        currentDebounceTimeout = setTimeout(async () => {
            // Cancel any ongoing request
            if (currentRequestController) {
                currentRequestController.abort();
            }

            // Create a new AbortController for the current request
            currentRequestController = new AbortController();
            const { signal } = currentRequestController;

            // Clear the current results
            spotlightClear.classList.toggle('show', query.length > 0);
            if (!query) {
                spotlightResults.style.display = 'none';
                return;
            }

            // Fetch the data
            try {
                options.onFetchStart();

                const response = await fetch(options.url, { ...options.ajaxOptions, signal });
                if (!response.ok) throw new Error('Network response was not ok');

                const data = await response.json();
                const processedData = options.onDataResponse(data);
                const { hasResults, resultsHTML } = handleSearchResults(processedData, query);

                spotlightResults.innerHTML = resultsHTML;
                spotlightResults.style.display = hasResults ? 'block' : 'none';

                options.onResultsUpdate(hasResults);
                options.onFetchSuccess();
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Search failed:', error.message || error);
                    spotlightResults.innerHTML = '<div class="spotlight-section-item">Error fetching results</div>';
                    spotlightResults.style.display = 'block';
                    options.onFetchError(error);
                }
            }
        }, options.debounceTimeout);
    };

    /**
     * Sets up event listeners for the spotlight elements.
     * @param {Object} elements - The elements related to the spotlight feature.
     * @param {HTMLElement} elements.spotlightIcon - The spotlight icon element.
     * @param {HTMLElement} elements.spotlightModal - The spotlight modal element.
     * @param {HTMLElement} elements.spotlightInput - The spotlight input element.
     * @param {HTMLElement} elements.spotlightClear - The spotlight clear button element.
     * @param {HTMLElement} elements.spotlightResults - The spotlight results container element.
     */
    const setupEventListeners = (elements) => {
        const { spotlightIcon, spotlightModal, spotlightInput, spotlightClear, spotlightResults } = elements;

        spotlightIcon.addEventListener('click', () => toggleModal(spotlightModal, spotlightInput));
        document.addEventListener('click', event => handleDocumentClick(event, spotlightModal, spotlightIcon));
        spotlightClear.addEventListener('click', () => clearInput(spotlightInput, spotlightResults, spotlightClear));
        spotlightInput.addEventListener('input', () => updateResults(spotlightInput.value.trim().toLowerCase(), spotlightResults, spotlightClear));
        document.addEventListener('keydown', event => handleKeydown(event, spotlightModal, spotlightInput));
    };

    /**
     * Handles clicks outside the spotlight modal to close it.
     * @param {Event} event - The click event.
     * @param {HTMLElement} spotlightModal - The spotlight modal element.
     * @param {HTMLElement} spotlightIcon - The spotlight icon element.
     */
    const handleDocumentClick = (event, spotlightModal, spotlightIcon) => {
        if (!spotlightModal.contains(event.target) && event.target !== spotlightIcon) {
            closeModal(spotlightModal);
        }
    };

    /**
     * Handles keyboard shortcuts to toggle the spotlight modal.
     * @param {Event} event - The keydown event.
     * @param {HTMLElement} spotlightModal - The spotlight modal element.
     * @param {HTMLElement} spotlightInput - The spotlight input element.
     */
    const handleKeydown = (event, spotlightModal, spotlightInput) => {
        if (event.ctrlKey === options.keyboardShortcut.ctrlKey && event.key === options.keyboardShortcut.key) {
            event.preventDefault();
            toggleModal(spotlightModal, spotlightInput);
        }
    };

    /**
     * Initializes the spotlight module with user-defined options.
     * @param {Object} userOptions - The user-defined options to customize the spotlight.
     */
    const init = (userOptions = {}) => {
        // Merge user options with default options
        options = { ...defaultOptions, ...userOptions };

        // Insert modal HTML into the document
        insertModal(
            options.placeholderText,
            options.clearButtonIcon,
            options.disableClearButton,
            options.modalClass,
            options.inputClass,
            options.clearButtonClass,
            options.resultsContainerClass
        );

        // Setup event listeners for each element with the `data-spotlight` attribute
        document.querySelectorAll('[data-spotlight="true"]').forEach(trigger => {
            setupEventListeners({
                spotlightIcon: createSpotlightIcon(trigger, options.searchIcon),
                spotlightModal: document.getElementsByClassName("spotlight-modal")[0],
                spotlightInput: document.getElementsByClassName("spotlight-input")[0],
                spotlightResults: document.getElementsByClassName("spotlight-results-container")[0],
                spotlightClear: document.getElementsByClassName("spotlight-clear-btn")[0],
            });
        });
    };

    // Publicly exposed methods
    return { init };
})();

export default spotlight;
