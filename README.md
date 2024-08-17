# Spotlight Search

## Overview

The Spotlight Search is a customizable JavaScript module that provides a quick search functionality with a spotlight-style modal. It supports categories with custom icons and colors, integrates with a data source via AJAX, and allows customization through options and callbacks. The module is built with a focus on flexibility and ease of integration.

![Spotlight Search](./screenshot.png)

## Features

- Pure JavaScript and CSS with no dependencies on external libraries or frameworks
- Customizable icons and colors for different categories
- AJAX-based search with debounce for optimized performance
- Keyboard shortcuts to toggle the search modal
- Supports custom callbacks for various stages of the search process
- Gracefully handles errors and provides feedback to the user
- Easily integratable into any web project

## Installation

1. Clone the repository or download the files.
2. Include the JavaScript and CSS files in your project.

### Files

- `spotlight.js`: The main JavaScript module.
- `spotlight.css`: The accompanying CSS file for styling the modal.

### Example

- `example.html`: A working example of using the module.

### Usage

#### HTML

Add the following HTML to your page where you want the search icon to appear:

```html
<div data-spotlight="true"></div>
```

#### JavaScript

Initialize the module with custom options (if needed):

```javascript
import spotlight from './spotlight.js';

spotlight.init({
    url: '/search', // URL to fetch search data (required)
    placeholderText: 'Search here...',
    icons: {
        "books": { class: 'fas fa-book', backgroundColor: '#4CAF50', foregroundColor: '#fff' },
        "movies": { class: 'fas fa-film', backgroundColor: '#FF5722', foregroundColor: '#fff' }
    },
    onItemAdd: (itemData) => `<strong>${itemData.name}</strong>`,
    onFetchSuccess: () => console.log('Fetch successful!'),
    onFetchError: (error) => console.error('Fetch failed:', error),
    debounceDelay: 500
});
```

#### CSS

Ensure that the necessary CSS styles are included in spotlight.css or your custom stylesheet to style the modal, input, buttons, and results container.

#### Options

You can pass the following options to the `init` method to customize the behavior of the module. Note that the `url` option is required for the AJAX requests to function properly.

- **searchIcon**: `string` - Default search icon (FontAwesome class). Defaults to `'fas fa-search'`.
- **icons**: `object` - Icon classes and colors for different search categories. Each key corresponds to a category type and should have `class`, `backgroundColor`, and `foregroundColor` properties. Defaults provided for `"books"`, `"movies"`, `"music"`, `"tv-shows"`, and `"tech"`.
- **placeholderText**: `string` - Placeholder text for the input field. Defaults to `'Search... (Ctrl + K)'`.
- **clearButtonIcon**: `string` - Icon class for the clear button. Defaults to `'fas fa-times'`.
- **focusTimeout**: `number` - Delay in milliseconds before focusing the input field when the modal is shown. Defaults to `150`.
- **debounceTimeout**: `number` - Delay in milliseconds to wait before triggering the search request. Defaults to `300`.
- **disableClearButton**: `boolean` - Flag to disable the clear button. Defaults to `false`.
- **fallbackIcon**: `object` - Fallback icon if a type is not defined, with `class`, `backgroundColor`, and `foregroundColor` properties. Defaults to `{ class: 'fas fa-question', backgroundColor: '#6c757d', foregroundColor: '#fff' }`.
- **ajaxOptions**: `object` - Options for AJAX requests. Defaults to an empty object.
- **keyboardShortcut**: `object` - Keyboard shortcut for opening the spotlight, with `ctrlKey` and `key` properties. Defaults to `{ ctrlKey: true, key: 'k' }`.
- **url**: `string` - URL for AJAX requests. **Required**.
- **modalClass**: `string` - Custom class for the modal element.
- **inputClass**: `string` - Custom class for the input field.
- **clearButtonClass**: `string` - Custom class for the clear button.
- **resultsContainerClass**: `string` - Custom class for the results container.
- **sectionClass**: `string` - Custom class for each results section.
- **sectionTitleClass**: `string` - Custom class for the section title.
- **sectionItemClass**: `string` - Custom class for each section item.
- **onFetchStart**: `function` - Callback called when a fetch request starts.
- **onFetchSuccess**: `function` - Callback called when a fetch request is successful.
- **onFetchError**: `function` - Callback called when a fetch request fails.
- **onResultsUpdate**: `function` - Callback called when search results are updated.
- **onModalToggle**: `function` - Callback called when the modal visibility is toggled.
- **onInputFocus**: `function` - Callback called when the input field is focused.
- **onDataResponse**: `function` - Callback called when data is received and processed.
- **onItemAdd**: `function` - Callback called to determine how each item should be displayed.

### Query Response Format

The module expects the query response from the server to be in the following JSON format:

```json
[
    {
        "type": "category-type",
        "name": "Category Name",
        "items": [
            {
                "name": "Item Name"
            }
        ]
    }
]
```

#### Response Fields

- **type**: A string representing the category type (e.g., "books", "movies"). This should match the keys in the `icons` option to apply the correct icon and color.
- **name**: A string representing the name of the category. This is displayed as the section title in the search results.
- **items**: An array of objects where each object represents an item in the category.
  - **name**: A string representing the name of the item. This is displayed as an individual result in the search results.

#### Example Response

```json
[
    {
        "type": "books",
        "name": "Books",
        "items": [
            { "name": "JavaScript: The Good Parts" },
            { "name": "Eloquent JavaScript" }
        ]
    },
    {
        "type": "movies",
        "name": "Movies",
        "items": [
            { "name": "Inception" },
            { "name": "The Matrix" }
        ]
    }
]
```

Ensure that the response from your server adheres to this format for proper integration with the Spotlight Search.

### License

This project is licensed under the MIT License. Feel free to use and modify the code as needed.

### Contributing

If you encounter any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.
