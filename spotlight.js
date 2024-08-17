/**
 * Spotlight Module
 * This module provides a spotlight search feature with customizable options and UI elements.
 * It includes methods for initializing the spotlight search, handling user interactions,
 * and displaying search results dynamically.
 */

const spotlight = (() => {
    // Default options for the spotlight module
    const defaultOptions = {
        /*
         * General
         */

        // URL for AJAX requests (required)
        url: '',
        // Options for AJAX requests
        ajaxOptions: {},

        /*
         * UI
         */

        // Default search icon (FontAwesome class)
        searchIcon: 'fas fa-search',
        // Icon classes and colors for different search categories
        icons: {
            "books": { class: 'fas fa-book', backgroundColor: '#007bff', foregroundColor: '#fff' },
            "movies": { class: 'fas fa-film', backgroundColor: '#28a745', foregroundColor: '#fff' },
            "music": { class: 'fas fa-music', backgroundColor: '#dc3545', foregroundColor: '#fff' },
            "tv-shows": { class: 'fas fa-tv', backgroundColor: '#ffc107', foregroundColor: '#000' },
            "tech": { class: 'fas fa-laptop-code', backgroundColor: '#17a2b8', foregroundColor: '#fff' }
        },
        // Fallback icon if a type is not defined
        fallbackIcon: { class: 'fas fa-question', backgroundColor: '#6c757d', foregroundColor: '#fff' },
        // Placeholder text for the input field
        placeholderText: 'Search... (Ctrl + K)',
        // Icon class for the clear button
        clearButtonIcon: 'fas fa-times',
        // Flag to disable the clear button
        disableClearButton: false,
        // Custom classes for different UI elements
        modalClass: '',
        inputClass: '',
        clearButtonClass: '',
        resultsContainerClass: '',
        sectionClass: '',
        sectionTitleClass: '',
        sectionItemClass: '',

        /*
         * UX
         */

        // Delay in milliseconds before focusing the input field when the modal is shown
        focusTimeout: 40,
        // Delay in milliseconds to wait before triggering the search request
        debounceTimeout: 300,
        // Keyboard shortcut for opening the spotlight
        keyboardShortcut: { ctrlKey: true, key: 'k' },

        /*
         * Callbacks
         */

        // Called when a fetch request starts
        onFetchStart: () => {},
        // Called for the fetch request
        onFetch: (url, ajaxOptions) => fetch(url, ajaxOptions),
        // Called when a fetch request is successful
        onFetchSuccess: () => {},
        // Called when a fetch request fails
        onFetchError: (error) => {},
        // Called when search results are updated
        onResultsUpdate: (hasResults) => {},
        // Called when the modal visibility is toggled
        onModalToggle: (modal) => {},
        // Called when the input field is focused
        onInputFocus: (input) => {},
        // Called when data is received and processed
        onDataResponse: (query, data) => data,
        // Called to determine how each item should be displayed
        onItemAdd: (itemData) => itemData.name,
        // Callback function when an item is clicked
        onItemClick: (sectionData, itemData) => {},
    };

    // Private variables
    let options = {};
    let currentDebounceTimeout;
    let currentRequestController;
    const itemIdMap = new Map();
    const sectionIdMap = new Map();

    /**
     * Creates an icon element with custom colors.
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
    const handleSearchResults = (data) => {
        let hasResults = false;
        let resultsHTML = '';

        clearMaps();

        data.forEach(section => {
            let { type, name, items = [] } = section;
            if (items.length === 0) return;

            items = generateMaps(section, items);

            hasResults = true;
            const sectionIcon = options.icons[type] || options.fallbackIcon;
            resultsHTML += createSectionHTML(section, sectionIcon.class, sectionIcon.backgroundColor, sectionIcon.foregroundColor, items);
        });

        return { hasResults, resultsHTML };
    };

    /**
     * Generates a unique identifier (UUID) in the format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx.
     * The UUID is used to uniquely identify items in the application.
     *
     * @returns {string} A UUID string.
     */
    const generateUniqueId = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    /**
     * Generates unique IDs for each section and item and stores them in a map for easy access.
     *
     * @param {Object} section - Object representing an item section.
     * @param {Array<Object>} items - An array of item objects to be assigned unique IDs.
     * @returns {Array<Object>} A new array of items with each item having a unique __uuid property.
     */
    const generateMaps = (section, items) => {
        const { ["items"]: _, ...sectionParams } = section;
        sectionIdMap.set(section.type, sectionParams);

        return items.map(item => {
            const itemId = generateUniqueId();
            itemIdMap.set(itemId, item);
            return { ...item, __uuid: itemId };
        });
    };

    /**
     * Clear the saved maps.
     *
     */
    const clearMaps = () => {
        sectionIdMap.clear();
        itemIdMap.clear();
    };

    /**
     * Retrieves item data from the map using the item's unique ID.
     *
     * @param {string} itemId - The unique ID of the item.
     * @returns {Object|undefined} The item data associated with the given ID, or undefined if not found.
     */
    const findItemData = (itemId) => {
        return itemIdMap.get(itemId);
    };

    /**
     * Retrieves metadata for a section based on its type.
     *
     * @param {string} sectionType - The type of the section to retrieve metadata for.
     * @returns {Object|null} - The section metadata, or null if not found.
     */
    const findSectionData = (sectionType) => {
        return sectionIdMap.get(sectionType) || null;
    };

    /**
     * Creates HTML for a section, including items with unique IDs.
     * The items are assigned unique IDs using the __uuid field.
     *
     * @param {Object} section - The section object.
     * @param {string} iconClass - The FontAwesome class for the section icon.
     * @param {string} iconBackgroundColor - The background color for the section icon.
     * @param {string} iconForegroundColor - The text color for the section icon.
     * @param {Array<Object>} itemsWithIds - An array of items with unique __uuid fields.
     * @returns {string} The generated HTML string for the section.
     */
    const createSectionHTML = (section, iconClass, iconBackgroundColor, iconForegroundColor, itemsWithIds) => {
        return `
            <div class="spotlight-section ${options.sectionClass}">
                <div class="spotlight-section-header">
                    <div class="icon-container" style="background-color: ${iconBackgroundColor}; color: ${iconForegroundColor};">
                        ${createIconElement(iconClass).outerHTML}
                    </div>
                    <span class="spotlight-section-title ${options.sectionTitleClass}">${section.name}</span>
                </div>
                <div class="spotlight-section-content">
                    ${itemsWithIds.map(item => `
                        <div class="spotlight-section-item ${options.sectionItemClass}"
                            data-section-type="${section.type}"
                            data-item-id="${item.__uuid}">
                            ${options.onItemAdd(item)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };


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

                const url = new URL(options.url);
                url.search = new URLSearchParams({ query: query });
                const response = await options.onFetch(url, { ...options.ajaxOptions, signal });
                if (!response.ok) throw new Error('Network response was not ok');

                const data = await response.json();
                const processedData = options.onDataResponse(query, data);
                const { hasResults, resultsHTML } = handleSearchResults(processedData);

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
        document.addEventListener('click', handleItemClick);
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
     * Handles clicks on items within the spotlight section.
     * Retrieves item data based on the item's unique ID and triggers the onItemClick callback.
     *
     * @param {Event} event - The click event.
     */
    const handleItemClick = (event) => {
        const itemElement = event.target.closest('.spotlight-section-item');
        if (!itemElement) return;

        const itemId = itemElement.getAttribute('data-item-id');
        if (!itemId) return;

        const itemData = findItemData(itemId);
        if (!itemData) return;

        const sectionType = itemElement.getAttribute('data-section-type');
        if (!sectionType) return;

        const sectionData = findSectionData(sectionType);
        if (!sectionData) return;

        options.onItemClick(sectionData, itemData);
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
