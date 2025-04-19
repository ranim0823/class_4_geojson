// Mapbox API access token
mapboxgl.accessToken = 'pk.eyJ1IjoicmFuLW1hcCIsImEiOiJjbTlicmp4YXQwa2IyMmtxMWpvbTI1Y3MxIn0.648gkZUHOMLe8Nxww67Yww';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-74.006, 40.7128],
    zoom: 13
});

// Add NYC neighborhoods base layer
async function addNeighborhoodLayer() {
    try {
        const response = await fetch('nyc_neighborhood_Tabulation_areas_2020.geojson');
        if (!response.ok) throw new Error('Failed to load NYC neighborhoods GeoJSON');
        const geojsonData = await response.json();

        // Add the GeoJSON source to the map
        map.addSource('nyc-neighborhoods', {
            type: 'geojson',
            data: geojsonData
        });

        // Add a fill layer to display the neighborhoods
        map.addLayer({
            id: 'nyc-neighborhoods-fill',
            type: 'fill',
            source: 'nyc-neighborhoods',
            paint: {
                'fill-color': '#888888', // Gray fill color
                'fill-opacity': 0.4      // Semi-transparent
            }
        });

        // Add a line layer to outline the neighborhoods
        map.addLayer({
            id: 'nyc-neighborhoods-outline',
            type: 'line',
            source: 'nyc-neighborhoods',
            paint: {
                'line-color': 'grey', // Grey outline
                'line-width': 1,
                'line-opacity': 0.5  // Semi-transparent
            }
        });

        // Add a click event listener to the fill layer
        map.on('click', 'nyc-neighborhoods-fill', (e) => {
            const properties = e.features[0].properties;
            const coordinates = e.lngLat;

            // Highlight the clicked polygon by increasing the border width
            map.setPaintProperty('nyc-neighborhoods-outline', 'line-width', [
                'case',
                ['==', ['get', 'NTAName'], properties.NTAName], // Match the clicked neighborhood
                3, // Bolden the border for the clicked polygon
                1  // Default border width for others
            ]);

            // Create a popup with BoroName and NTAName
            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(`
                    <div>
                        <strong>Borough:</strong> ${properties.BoroName}<br>
                        <strong>Neighborhood:</strong> ${properties.NTAName}
                    </div>
                `)
                .addTo(map);
        });

        // Change the cursor to a pointer when hovering over the polygons
        map.on('mouseenter', 'nyc-neighborhoods-fill', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Reset the cursor when it leaves the polygons
        map.on('mouseleave', 'nyc-neighborhoods-fill', () => {
            map.getCanvas().style.cursor = '';
        });

        console.log('NYC neighborhoods layer added successfully.');
    } catch (error) {
        console.error('Error adding NYC neighborhoods layer:', error);
    }
}

// Load unique food-related types
async function loadUniqueFoodRelatedTypes() {
    try {
        const response = await fetch('unique_food_related_types.json');
        if (!response.ok) throw new Error('Failed to load unique food-related types');
        return await response.json();
    } catch (error) {
        console.error('Error loading unique food-related types:', error);
        return [];
    }
}

// Process restaurant data
function processRestaurantData(rawData) {
    const uniqueRestaurants = {};
    const primaryTypes = new Set();
    const priceLevels = new Set();
    const allTypes = new Set();

    rawData.forEach(restaurant => {
        const primaryType = restaurant.primary_type;

        if (primaryType) {
            primaryTypes.add(primaryType);
            if (restaurant.price_level) {
                priceLevels.add(restaurant.price_level);
            }

            // Safely process the "types" field
            let types = [];
            if (Array.isArray(restaurant.types)) {
                types = restaurant.types; // Use the array directly if it's already an array
            } else if (typeof restaurant.types === 'string') {
                try {
                    types = JSON.parse(restaurant.types.replace(/'/g, '"')); // Convert string to array
                } catch (error) {
                    console.warn(`Failed to parse types for restaurant ${restaurant.google_place_id}:`, error);
                }
            }

            types.forEach(type => allTypes.add(type));

            if (!uniqueRestaurants[restaurant.google_place_id]) {
                uniqueRestaurants[restaurant.google_place_id] = {
                    id: restaurant.google_place_id,
                    name: restaurant.name,
                    primary_type: primaryType,
                    types: types, // Ensure types are stored here
                    rating: parseFloat(restaurant.overall_rating),
                    review_count: parseInt(restaurant.user_rating_count),
                    price_level: restaurant.price_level,
                    coordinates: [parseFloat(restaurant.longitude), parseFloat(restaurant.latitude)]
                };
            }
        }
    });

    return {
        restaurants: Object.values(uniqueRestaurants),
        primaryTypes: Array.from(primaryTypes).sort(),
        priceLevels: Array.from(priceLevels).sort(),
        allTypes: Array.from(allTypes).sort()
    };
}

// Format primary type for display
function formatPrimaryType(type) {
    return type
        .replace(/_restaurant$/, '')
        .replace(/_/g, ' ')
        .replace(/(?:^|\s)\S/g, a => a.toUpperCase());
}

// Emoji mapping for primary types
function getEmojiForCuisine(primaryType) {
    // Special case for combined filter "coffee_cafe"
    if (primaryType === 'coffee_cafe') {
        return '☕️';
    }

    // Geo-based emojis
    const geoEmojis = {
        'american_restaurant': '🇺🇸',
        'afghani_restaurant': '🇦🇫',
        'african_restaurant': '🪘',
        'asian_restaurant': '⛩️',
        'brazilian_restaurant': '🇧🇷',
        'chinese_restaurant': '🇨🇳',
        'french_restaurant': '🇫🇷',
        'greek_restaurant': '🇬🇷',
        'indian_restaurant': '🇮🇳',
        'indonesian_restaurant': '🇮🇩',
        'italian_restaurant': '🇮🇹',
        'japanese_restaurant': '🇯🇵',
        'korean_restaurant': '🇰🇷',
        'lebanese_restaurant': '🇱🇧',
        'mediterranean_restaurant': '🫒',
        'mexican_restaurant': '🇲🇽',
        'middle_eastern_restaurant': '🥙',
        'spanish_restaurant': '🇪🇸',
        'thai_restaurant': '🇹🇭',
        'turkish_restaurant': '🇹🇷',
        'vietnamese_restaurant': '🇻🇳'
    };

    // Food-based emojis
    const foodEmojis = {
        'acai_shop': '🍇',
        'bagel_shop': '🥯',
        'bakery': '🍞',
        'bar': '🥃',
        'bar_and_grill': '🍺🔥',
        'barbecue_area': '🍖',
        'barbecue_restaurant': '🍖',
        'breakfast_restaurant': '🌞',
        'brunch_restaurant': '🥑',
        'buffet_restaurant': '🍱',
        'cafe': '☕️',
        'cafeteria': '🥣',
        'candy_store': '🍬',
        'cat_cafe': '🐱☕️',
        'catering_service': '👩‍🍳',
        'chocolate_shop': '🍫',
        'coffee_shop': '☕️',
        'confectionery': '🍬',
        'deli': '🥪',
        'dessert_restaurant': '🍰',
        'dessert_shop': '🎂',
        'diner': '🥓',
        'dog_cafe': '🐶☕️',
        'donut_shop': '🍩',
        'fast_food_restaurant': '🍟',
        'fine_dining_restaurant': '🍽️',
        'food_court': '🥣',
        'hamburger_restaurant': '🍔',
        'ice_cream_shop': '🍦',
        'internet_cafe': '💻',
        'juice_shop': '🍊',
        'meal_takeaway': '🥡',
        'pizza_restaurant': '🍕',
        'pub': '🍺',
        'ramen_restaurant': '🍜',
        'sandwich_shop': '🥪',
        'seafood_restaurant': '🦞',
        'steak_house': '🥩',
        'sushi_restaurant': '🍣',
        'tea_house': '🍵',
        'vegan_restaurant': '🌱',
        'vegetarian_restaurant': '🥗',
        'wine_bar': '🍷'
    };

    return geoEmojis[primaryType] || foodEmojis[primaryType] || '❓';
}

// Group types by geography and food type
function groupPrimaryTypes(types) {
    const geoBased = [
        "afghani_restaurant",
        "african_restaurant",
        "american_restaurant",
        "asian_restaurant",
        "brazilian_restaurant",
        "chinese_restaurant",
        "french_restaurant",
        "greek_restaurant",
        "indian_restaurant",
        "indonesian_restaurant",
        "italian_restaurant",
        "japanese_restaurant",
        "korean_restaurant",
        "lebanese_restaurant",
        "mediterranean_restaurant",
        "mexican_restaurant",
        "middle_eastern_restaurant",
        "spanish_restaurant",
        "thai_restaurant",
        "turkish_restaurant",
        "vietnamese_restaurant"
      ];

    const foodBased = [
        "acai_shop",
        "bagel_shop",
        "bakery",
        "bar",
        "bar_and_grill",
        "barbecue_area",
        "barbecue_restaurant",
        "breakfast_restaurant",
        "brunch_restaurant",
        "buffet_restaurant",
        "cafe",
        "cafeteria",
        "candy_store",
        "cat_cafe",
        "catering_service",
        "chocolate_shop",
        "coffee_shop",
        "confectionery",
        "deli",
        "dessert_restaurant",
        "dessert_shop",
        "diner",
        "dog_cafe",
        "donut_shop",
        "fast_food_restaurant",
        "fine_dining_restaurant",
        "food_court",
        "hamburger_restaurant",
        "ice_cream_shop",
        "internet_cafe",
        "juice_shop",
        "meal_takeaway",
        "pizza_restaurant",
        "pub",
        "ramen_restaurant",
        "sandwich_shop",
        "seafood_restaurant",
        "steak_house",
        "sushi_restaurant",
        "tea_house",
        "vegan_restaurant",
        "vegetarian_restaurant",
        "wine_bar"
      ];

    const availableGeography = types.filter(type => geoBased.includes(type));
    const availableFoodType = types.filter(type => foodBased.includes(type));

    return [
        { name: 'By Geography', types: availableGeography },
        { name: 'By Food Type', types: availableFoodType }
    ].filter(group => group.types.length > 0);
}

// Helper function to convert price_level to money emojis
function getPriceLevelEmoji(priceLevel) {
    switch (priceLevel) {
        case "PRICE_LEVEL_VERY_EXPENSIVE":
            return "💰💰💰💰"; // $$$$
        case "PRICE_LEVEL_EXPENSIVE":
            return "💰💰💰"; // $$$
        case "PRICE_LEVEL_MODERATE":
            return "💰💰"; // $$
        case "PRICE_LEVEL_INEXPENSIVE":
            return "💰"; // $
        default:
            return "N/A"; // Not available
    }
}

// Add markers to the map
function addMarkers(restaurants, selectedFilter, selectedPrices) {
    // Remove existing markers
    document.querySelectorAll('.mapboxgl-marker').forEach(marker => marker.remove());

    restaurants.forEach(restaurant => {
        // Determine if the restaurant matches the selected filter
        const isPrimaryMatch =
            selectedFilter === 'coffee_cafe'
                ? restaurant.primary_type === 'coffee_shop' || restaurant.primary_type === 'cafe'
                : restaurant.primary_type === selectedFilter;

        const isPriceMatch = selectedPrices.length > 0 && selectedPrices.includes(restaurant.price_level);

        // Create a marker element
        const el = document.createElement('div');
        el.className = 'marker';
        el.innerHTML = getEmojiForCuisine(restaurant.primary_type); // Use emoji for primary_type

        // Apply styles based on match type
        if (isPrimaryMatch || isPriceMatch) {
            el.style.fontSize = '15px'; // Much larger size for primary matches or price matches
            el.style.opacity = '1'; // Fully opaque for matches
        } else {
            el.style.fontSize = '6px'; // Way smaller size for non-matches
            el.style.opacity = '0.3'; // 90% transparent for non-matches
        }

        el.style.textAlign = 'center';
        el.style.cursor = 'pointer';

        // Add hover event listener to temporarily enlarge the marker
        el.addEventListener('mouseenter', () => {
            el.style.fontSize = '20px'; // Temporarily enlarge the marker
            el.style.zIndex = '1000'; // Bring the marker to the front
        });

        el.addEventListener('mouseleave', () => {
            // Reset the marker size and z-index
            if (isPrimaryMatch || isPriceMatch) {
                el.style.fontSize = '15px'; // Reset to larger size for matches
            } else {
                el.style.fontSize = '6px'; // Reset to smaller size for non-matches
            }
            el.style.zIndex = '1'; // Reset z-index
        });

        // Add hover event listener to show a popup
        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 15 // Offset the popup from the marker
        });

        el.addEventListener('mouseenter', () => {
            // Filter sub-types to exclude the primary type
            const filteredSubTypes = Array.isArray(restaurant.types)
                ? restaurant.types.filter(type => type !== restaurant.primary_type).map(formatPrimaryType)
                : [];

            popup
                .setLngLat(restaurant.coordinates)
                .setHTML(`
                    <div class="popup-content" style="line-height: 1.6; margin-bottom: 10px;">
                        <h3>${restaurant.name}</h3>
                        ${restaurant.price_level ? `
                        <div class="price-level" style="margin-bottom: 10px;">
                            <strong>Price Level:</strong> ${getPriceLevelEmoji(restaurant.price_level)}
                        </div>` : ''}
                        <p style="margin-bottom: 10px;"><strong>Primary Type:</strong> ${formatPrimaryType(restaurant.primary_type)}</p>
                        ${filteredSubTypes.length > 0 ? `
                        <p style="margin-bottom: 10px;"><strong>Sub-types:</strong> ${filteredSubTypes.join(', ')}</p>` : ''}
                        <div class="rating-container" style="margin-bottom: 10px;">
                            <span class="rating">${restaurant.rating.toFixed(1)}</span>
                            <span class="stars">${'★'.repeat(Math.round(restaurant.rating))}</span>
                            <span class="review-count">(${restaurant.review_count} reviews)</span>
                        </div>
                    </div>
                `)
                .addTo(map);
        });

        el.addEventListener('mouseleave', () => {
            popup.remove();
        });

        // Add the marker to the map
        const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
        })
        .setLngLat(restaurant.coordinates)
        .addTo(map);

        // Store the primary type in the marker element for easy access
        el.dataset.primaryType = restaurant.primary_type;
    });
}

// Setup filters
function setupFilters(primaryTypes, priceLevels, allTypes) {
    const filterContainer = document.getElementById('filters-container');
    filterContainer.innerHTML = ''; // Clear any existing filters

    // Add "Select All" and "Deselect All" buttons to the sidebar header
    const sidebarHeader = document.querySelector('.sidebar-header');
    sidebarHeader.innerHTML = `
        <h2>Filters</h2>
        <div class="filter-controls">
            <button id="select-all-filters" class="filter-control-button">Select All</button>
            <button id="deselect-all-filters" class="filter-control-button">Deselect All</button>
        </div>
    `;

    // Add event listeners for the buttons
    document.getElementById('select-all-filters').addEventListener('click', () => {
        document.querySelectorAll('#filters-container input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
        });
        filterRestaurants(); // Trigger filtering
    });

    document.getElementById('deselect-all-filters').addEventListener('click', () => {
        document.querySelectorAll('#filters-container input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        filterRestaurants(); // Trigger filtering
    });

    // Add price level filters
    const priceDiv = document.createElement('div');
    priceDiv.className = 'filter-group';
    priceDiv.innerHTML = '<h3>Price Level</h3>';

    const sortedPriceLevels = priceLevels.sort((a, b) => {
        const priceOrder = ['PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_MODERATE', 'PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE'];
        return priceOrder.indexOf(a) - priceOrder.indexOf(b);
    });

    sortedPriceLevels.forEach(price => {
        const emoji = getPriceLevelEmoji(price);
        const div = document.createElement('div');
        div.className = 'filter-item';
        div.innerHTML = `
            <input type="checkbox" id="price-${price}" aria-label="Filter by price level ${price}">
            <label for="price-${price}">
                ${emoji}
            </label>
        `;
        priceDiv.appendChild(div);
        div.querySelector('input').addEventListener('change', filterRestaurants);
    });

    filterContainer.appendChild(priceDiv);

    // Group all types into categories by geography and food type
    const groupedTypes = groupPrimaryTypes(allTypes);

    // Add filters for each grouped type
    groupedTypes.forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'filter-group';
        groupDiv.innerHTML = `<h3>${group.name}</h3>`;

        group.types.forEach(type => {
            // Combine "coffee_shop" and "cafe" into one filter
            if (type === 'coffee_shop' || type === 'cafe') {
                if (!groupDiv.querySelector('#type-coffee_cafe')) {
                    const div = document.createElement('div');
                    div.className = 'filter-item';
                    div.innerHTML = `
                        <input type="checkbox" id="type-coffee_cafe" aria-label="Filter by Cafe/Coffee Shop">
                        <label for="type-coffee_cafe">
                            ☕️ Cafe/Coffee Shop
                        </label>
                    `;
                    groupDiv.appendChild(div);
                    div.querySelector('input').addEventListener('change', filterRestaurants);
                }
            } else {
                const div = document.createElement('div');
                div.className = 'filter-item';
                div.innerHTML = `
                    <input type="checkbox" id="type-${type}" aria-label="Filter by type ${formatPrimaryType(type)}">
                    <label for="type-${type}">
                        ${getEmojiForCuisine(type)} ${formatPrimaryType(type)}
                    </label>
                `;
                groupDiv.appendChild(div);
                div.querySelector('input').addEventListener('change', filterRestaurants);
            }
        });

        filterContainer.appendChild(groupDiv);
    });

    // Deselect all filters by default
    document.querySelectorAll('#filters-container input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Trigger filtering to start with no markers
    filterRestaurants();
}

// Filter restaurants
function filterRestaurants() {
    const selectedTypes = [];
    const selectedPrices = [];
    let selectedFilter = null;

    // Collect selected types and price levels
    document.querySelectorAll('#filters-container input[type="checkbox"]:checked').forEach(checkbox => {
        if (checkbox.id.startsWith('type-')) {
            const type = checkbox.id.replace('type-', '');
            selectedTypes.push(type);
            selectedFilter = type; // Use the last selected type as the primary filter
        } else if (checkbox.id.startsWith('price-')) {
            selectedPrices.push(checkbox.id.replace('price-', ''));
        }
    });

    // If no filters are selected, clear all markers
    if (selectedTypes.length === 0 && selectedPrices.length === 0) {
        addMarkers([], null, null); // Clear all markers
        updateFilterCounts([]); // Reset counts to 0
        return;
    }

    // Filter restaurants based on selected filters
    const filtered = window.restaurantData.filter(restaurant => {
        const matchesTypes = selectedTypes.length === 0 || selectedTypes.some(type => {
            if (type === 'coffee_cafe') {
                // Match "coffee_shop" or "cafe" in primary_type or types
                return (
                    restaurant.primary_type === 'coffee_shop' ||
                    restaurant.primary_type === 'cafe' ||
                    (Array.isArray(restaurant.types) &&
                        (restaurant.types.includes('coffee_shop') || restaurant.types.includes('cafe')))
                );
            }
            return (
                restaurant.primary_type === type ||
                (Array.isArray(restaurant.types) && restaurant.types.includes(type))
            );
        });

        const matchesPriceLevel = selectedPrices.length === 0 || selectedPrices.includes(restaurant.price_level);

        return matchesTypes && matchesPriceLevel;
    });

    // Update markers on the map
    addMarkers(filtered, selectedFilter, selectedPrices);

    // Highlight markers that match the selected filter by enlarging them
    document.querySelectorAll('.mapboxgl-marker').forEach(marker => {
        const markerType = marker.dataset.primaryType;
        if (markerType === selectedFilter) {
            marker.style.fontSize = '12px'; // Enlarge matching markers
            marker.style.opacity = '1'; // Fully opaque for matching markers
        } else {
            marker.style.fontSize = '6px'; // Default size for non-matching markers
            marker.style.opacity = '0.1'; // Semi-transparent for non-matching markers
        }
    });

    // Update the count for each filter checkbox
    updateFilterCounts(filtered);
}

// Update filter counts based on the filtered restaurants
function updateFilterCounts(filteredRestaurants) {
    const filterCounts = {};

    // Count the number of restaurants for each type
    filteredRestaurants.forEach(restaurant => {
        // Count primary type
        if (restaurant.primary_type) {
            if (!filterCounts[restaurant.primary_type]) {
                filterCounts[restaurant.primary_type] = 0;
            }
            filterCounts[restaurant.primary_type]++;
        }

        // Count sub-types
        if (Array.isArray(restaurant.types)) {
            restaurant.types.forEach(type => {
                if (!filterCounts[type]) {
                    filterCounts[type] = 0;
                }
                filterCounts[type]++;
            });
        }

        // Count price levels
        if (restaurant.price_level) {
            if (!filterCounts[restaurant.price_level]) {
                filterCounts[restaurant.price_level] = 0;
            }
            filterCounts[restaurant.price_level]++;
        }
    });

    // Update the label for each filter checkbox
    document.querySelectorAll('#filters-container input[type="checkbox"]').forEach(checkbox => {
        const label = checkbox.nextElementSibling; // Get the corresponding label
        if (checkbox.checked) {
            label.style.fontWeight = 'bold'; // Bolden the text of checked filters
        } else {
            label.style.fontWeight = 'normal'; // Reset to normal for unchecked filters
        }

        if (checkbox.id.startsWith('type-')) {
            const type = checkbox.id.replace('type-', '');
            const count = filterCounts[type] || 0; // Default to 0 if no matches

            // Handle combined filter "coffee_cafe"
            if (type === 'coffee_cafe') {
                const coffeeCount = filterCounts['coffee_shop'] || 0;
                const cafeCount = filterCounts['cafe'] || 0;
                label.innerHTML = `☕️ Cafe/Coffee Shop (${coffeeCount + cafeCount})`;
            } else {
                label.innerHTML = `${getEmojiForCuisine(type)} ${formatPrimaryType(type)} (${count})`;
            }
        } else if (checkbox.id.startsWith('price-')) {
            const price = checkbox.id.replace('price-', '');
            const count = filterCounts[price] || 0; // Default to 0 if no matches
            label.innerHTML = `${getPriceLevelEmoji(price)} (${count})`;
        }
    });
}

// Load restaurant data
async function loadRestaurantData() {
    try {
        const response = await fetch('filtered_restaurants.json');
        if (!response.ok) throw new Error('Failed to load data');
        const rawData = await response.json();
        return processRestaurantData(rawData);
    } catch (error) {
        console.error('Error loading restaurant data:', error);
        return { restaurants: [], primaryTypes: [], priceLevels: [], allTypes: [] };
    }
}


// Initialize app
async function initializeApp() {
    const { restaurants, primaryTypes, priceLevels, allTypes } = await loadRestaurantData();

    if (restaurants.length > 0) {
        window.restaurantData = restaurants;
        setupFilters(primaryTypes, priceLevels, allTypes);

        // Ensure no markers are displayed initially
        filterRestaurants();
    }

    // Add the NYC neighborhoods base layer
    addNeighborhoodLayer();
}

// Start the app
map.on('load', initializeApp);
