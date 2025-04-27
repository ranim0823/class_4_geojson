// Mapbox API access token
mapboxgl.accessToken = 'pk.eyJ1IjoicmFuLW1hcCIsImEiOiJjbTlicmp4YXQwa2IyMmtxMWpvbTI1Y3MxIn0.648gkZUHOMLe8Nxww67Yww';

// Declare selectedRange as a global variable
let selectedRange = null;

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-73.890, 40.705],
    zoom: 9.5
});

// Ensure the map resizes properly on window resize
window.addEventListener('resize', () => {
    map.resize();
});

// Add NYC neighborhoods base layer
async function addNeighborhoodLayer() {
    try {
        const response = await fetch('nyc_nta_2020_pop+food.geojson');
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
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'pop_to_rest_ratio'], // Access the pop_to_rest_ratio property
                    3, '#f7f7f7', // Very light grey for the minimum value
                    143, '#d9d9d9', // Light grey for the 10th percentile
                    350, '#bdbdbd', // Medium-light grey for the 25th percentile
                    565, '#969696', // Medium grey for the 50th percentile
                    769.25, '#636363', // Dark grey for the 75th percentile
                    988, '#252525', // Very dark grey for the 90th percentile
                    5394, '#000000' // Black for the maximum value
                ],
                'fill-opacity': 0.9 // Semi-transparent
            },
            layout: {
                visibility: 'none' // Initially hide the layer
            },
            filter: [
                'all',
                ['>', ['get', 'pop_to_rest_ratio'], 0], // Exclude neighborhoods with a ratio of 0
                ['has', 'pop_to_rest_ratio'] // Exclude neighborhoods with no value
            ]
        });

        // Add a line layer to outline the neighborhoods
        map.addLayer({
            id: 'nyc-neighborhoods-outline',
            type: 'line',
            source: 'nyc-neighborhoods',
            paint: {
                'line-color': 'white', // grey outline
                'line-width': 0.1,
                'line-opacity': 0.5  // Semi-transparent
            },
            layout: {
                visibility: "none" // Initially hidden
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

            // Format the population-to-restaurant ratio
            const popToRestRatio = properties.pop_to_rest_ratio
                ? `<strong>${properties.pop_to_rest_ratio}</strong> Peoples per Restaurant`
                : 'Data not available';

            // Format the content for the pop-up
            const content = `<strong>${properties.NTAName}</strong>, ${properties.BoroName}<br> 
                            ${popToRestRatio}`;

            // Dynamically calculate the width based on the content length
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'flexible';
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.whiteSpace = 'nowrap';
            tempDiv.style.fontFamily = 'Arial, sans-serif';
            tempDiv.style.fontSize = '14px';
            tempDiv.innerHTML = content;
            document.body.appendChild(tempDiv);
            const calculatedWidth = tempDiv.offsetWidth + 20; // Add padding
            document.body.removeChild(tempDiv);

            // Create a popup with a unique class for neighborhoods
            new mapboxgl.Popup({ className: 'neighborhood-popup' })
                .setLngLat(coordinates)
                .setHTML(content)
                .setMaxWidth(`${calculatedWidth}px`) // Set the dynamic width
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
            primaryTypes.add(primaryType); // Ensure all primary types are added
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
                    coordinates: [parseFloat(restaurant.longitude), parseFloat(restaurant.latitude)],
                    generative_summary: restaurant.generative_summary
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
    // Geo-based emojis
    const geoEmojis = {
        "afghani_restaurant": "🇦🇫",
        "african_restaurant": "🌍",
        "asian_restaurant": "🥢",
        "albanian_restaurant": "🇦🇱",
        "american_restaurant": "🇺🇸",
        "argentine_restaurant": "🇦🇷",
        "armenian_restaurant": "🇦🇲",
        "australian_restaurant": "🇦🇺",
        "austrian_restaurant": "🇦🇹",
        "azerbaijani_restaurant": "🇦🇿",
        "bangladeshi_restaurant": "🇧🇩",
        "belgian_restaurant": "🇧🇪",
        "bhutanese_restaurant": "🇧🇹",
        "bolivian_restaurant": "🇧🇴",
        "bosnian_restaurant": "🇧🇦",
        "brazilian_restaurant": "🇧🇷",
        "british_restaurant": "🇬🇧",
        "burmese_restaurant": "🇲🇲",
        "cambodian_restaurant": "🇰🇭",
        "cantonese_restaurant": "🇭🇰",
        "canadian_restaurant": "🇨🇦",
        "caribbean_restaurant": "🌴",
        "chinese_restaurant": "🇨🇳",
        "colombian_restaurant": "🇨🇴",
        "croatian_restaurant": "🇭🇷",
        "cuban_restaurant": "🇨🇺",
        "dominican_restaurant": "🇩🇴",
        "ecuadorian_restaurant": "🇪🇨",
        "egyptian_restaurant": "🇪🇬",
        "eritrean_restaurant": "🇪🇷",
        "ethiopian_restaurant": "🇪🇹",
        "filipino_restaurant": "🇵🇭",
        "french_restaurant": "🇫🇷",
        "german_restaurant": "🇩🇪",
        "ghanaian_restaurant": "🇬🇭",
        "greek_restaurant": "🇬🇷",
        "grenadian_restaurant": "🇬🇩",
        "guatemalan_restaurant": "🇬🇹",
        "guyanese_restaurant": "🇬🇾",
        "haitian_restaurant": "🇭🇹",
        "honduran_restaurant": "🇭🇳",
        "indian_restaurant": "🇮🇳",
        "indonesian_restaurant": "🇮🇩",
        "iranian_restaurant": "🇮🇷",
        "irish_restaurant": "🇮🇪",
        "israeli_restaurant": "🇮🇱",
        "italian_restaurant": "🇮🇹",
        "ivorian_restaurant": "🇨🇮",
        "jamaican_restaurant": "🇯🇲",
        "japanese_restaurant": "🇯🇵",
        "kazakh_restaurant": "🇰🇿",
        "korean_restaurant": "🇰🇷",
        "lebanese_restaurant": "🇱🇧",
        "malaysian_restaurant": "🇲🇾",
        "mediterranean_restaurant": "🌊",
        "mexican_restaurant": "🇲🇽",
        "middle_eastern_restaurant": "🕌",
        "moroccan_restaurant": "🇲🇦",
        "nepalese_restaurant": "🇳🇵",
        "nigerian_restaurant": "🇳🇬",
        "pakistani_restaurant": "🇵🇰",
        "panamanian_restaurant": "🇵🇦",
        "paraguayan_restaurant": "🇵🇾",
        "peruvian_restaurant": "🇵🇪",
        "persian_restaurant": "𓆃",
        "polish_restaurant": "🇵🇱",
        "portuguese_restaurant": "🇵🇹",
        "romanian_restaurant": "🇷🇴",
        "russian_restaurant": "🇷🇺",
        "salvadoran_restaurant": "🇸🇻",
        "senegalese_restaurant": "🇸🇳",
        "serbian_restaurant": "🇷🇸",
        "singaporean_restaurant": "🇸🇬",
        "somali_restaurant": "🇸🇴",
        "spanish_restaurant": "🇪🇸",
        "sri lankan_restaurant": "🇱🇰",
        "surinamese_restaurant": "🇸🇷",
        "swedish_restaurant": "🇸🇪",
        "tajik_restaurant": "🇹🇯",
        "thai_restaurant": "🇹🇭",
        "taiwanese_restaurant": "🇹🇼",
        "tibetan_restaurant": "🏔",
        "trinidadian_restaurant": "🇹🇹",
        "turkish_restaurant": "🇹🇷",
        "ukrainian_restaurant": "🇺🇦",
        "uruguayan_restaurant": "🇺🇾",
        "uzbek_restaurant": "🇺🇿",
        "venezuelan_restaurant": "🇻🇪",
        "vietnamese_restaurant": "🇻🇳",
        "west african_restaurant": "🥘",
        "yemeni_restaurant": "🇾🇪"
    };

    // Food-based emojis
    const foodEmojis = {
        "acai_shop": "🍇",
        "bagel_shop": "🥯",
        "bakery": "🍞",
        "bar/pub": "🍺",
        "bar_and_grill": "🍺🔥",
        "barbecue_restaurant": "🍖",
        "brunch_restaurant": "🥑",
        "buffet_restaurant": "🍱",
        "cafe": "☕️",
        "chicken_restaurant": "🍗",
        "chocolate_shop": "🍫",
        "comfort food_restaurant": "🍲",
        "deli": "🥪",
        "dessert_shop": "🍰",
        "diner": "🥓",
        "donut_shop": "🍩",
        "dumpling_restaurant": "🥟",
        "fast_food_restaurant": "🍟",
        "fine_dining_restaurant": "🍽️",
        "food_court": "🥣",
        "hamburger_restaurant": "🍔",
        "health_food": "🥗",
        "hookah_bar": "💨",
        "hot pot_restaurant": "🍲",
        "ice_cream_shop": "🍦",
        "juice_shop": "🍊",
        "lounge_restaurant": "🍸",
        "noodle_restaurant": "🍜",
        "poke_restaurant": "🐟",
        "ramen_restaurant": "🍜",
        "restaurant": "🍴",
        "sandwich_shop": "🥪",
        "seafood_restaurant": "🦞",
        "steak_house": "🥩",
        "sushi_restaurant": "🍣",
        "takeout": "🥡",
        "taco_restaurant": "🌮",
        "tea_house": "🍵",
        "teriyaki_restaurant": "🍢",
        "vegan_restaurant": "🌱",
        "vegetarian_restaurant": "🥗",
        "wine_bar": "🍷"
    };

    return geoEmojis[primaryType] || foodEmojis[primaryType] || '❓';
}

// Group types by geography and food type
function groupPrimaryTypes(types) {
    const geoBased = [
        "afghani_restaurant",
        "african_restaurant",
        "asian_restaurant",
        "albanian_restaurant",
        "american_restaurant",
        "argentine_restaurant",
        "armenian_restaurant",
        "australian_restaurant",
        "austrian_restaurant",
        "azerbaijani_restaurant",
        "bangladeshi_restaurant",
        "belgian_restaurant",
        "bhutanese_restaurant",
        "bolivian_restaurant",
        "bosnian_restaurant",
        "brazilian_restaurant",
        "british_restaurant",
        "burmese_restaurant",
        "cambodian_restaurant",
        "canadian_restaurant",
        "cantonese_restaurant",
        "caribbean_restaurant",
        "chinese_restaurant",
        "colombian_restaurant",
        "croatian_restaurant",
        "cuban_restaurant",
        "dominican_restaurant",
        "ecuadorian_restaurant",
        "egyptian_restaurant",
        "eritrean_restaurant",
        "ethiopian_restaurant",
        "filipino_restaurant",
        "french_restaurant",
        "german_restaurant",
        "ghanaian_restaurant",
        "greek_restaurant",
        "grenadian_restaurant",
        "guatemalan_restaurant",
        "guyanese_restaurant",
        "haitian_restaurant",
        "honduran_restaurant",
        "indian_restaurant",
        "indonesian_restaurant",
        "iranian_restaurant",
        "irish_restaurant",
        "israeli_restaurant",
        "italian_restaurant",
        "ivorian_restaurant",
        "jamaican_restaurant",
        "japanese_restaurant",
        "kazakh_restaurant",
        "korean_restaurant",
        "lebanese_restaurant",
        "malaysian_restaurant",
        "mediterranean_restaurant",
        "mexican_restaurant",
        "middle_eastern_restaurant",
        "moroccan_restaurant",
        "nepalese_restaurant",
        "nigerian_restaurant",
        "pakistani_restaurant",
        "panamanian_restaurant",
        "paraguayan_restaurant",
        "peruvian_restaurant",
        "persian_restaurant",
        "polish_restaurant",
        "portuguese_restaurant",
        "romanian_restaurant",
        "russian_restaurant",
        "salvadoran_restaurant",
        "senegalese_restaurant",
        "serbian_restaurant",
        "singaporean_restaurant",
        "somali_restaurant",
        "spanish_restaurant",
        "sri lankan_restaurant",
        "surinamese_restaurant",
        "swedish_restaurant",
        "tajik_restaurant",
        "thai_restaurant",
        "taiwanese_restaurant",
        "tibetan_restaurant",
        "trinidadian_restaurant",
        "turkish_restaurant",
        "ukrainian_restaurant",
        "uruguayan_restaurant",
        "uzbek_restaurant",
        "venezuelan_restaurant",
        "vietnamese_restaurant",
        "west african_restaurant",
        "yemeni_restaurant"
    ];

    const foodBased = [
        "acai_shop",
        "bagel_shop",
        "bakery",
        "bar/pub",
        "bar_and_grill",
        "barbecue_restaurant",
        "brunch_restaurant",
        "buffet_restaurant",
        "cafe",
        "chicken_restaurant",
        "chocolate_shop",
        "comfort food_restaurant",
        "deli",
        "dessert_shop",
        "diner",
        "donut_shop",
        "dumpling_restaurant",
        "fast_food_restaurant",
        "fine_dining_restaurant",
        "food_court",
        "hamburger_restaurant",
        "health_food",
        "hookah_bar",
        "hot pot_restaurant",
        "ice_cream_shop",
        "juice_shop",
        "lounge_restaurant",
        "noodle_restaurant",
        "poke_restaurant",
        "ramen_restaurant",
        "restaurant",
        "sandwich_shop",
        "seafood_restaurant",
        "steak_house",
        "sushi_restaurant",
        "takeout",
        "taco_restaurant",
        "tea_house",
        "teriyaki_restaurant",
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
        const isPrimaryMatch = restaurant.primary_type === selectedFilter;
        const isPriceMatch = selectedPrices.length > 0 && selectedPrices.includes(restaurant.price_level);

        // Create a marker element
        const el = document.createElement('div');
        el.className = 'marker';
        el.innerHTML = getEmojiForCuisine(restaurant.primary_type); // Use emoji for primary_type

        // Apply styles based on match type
        if (isPrimaryMatch) {
            el.style.fontSize = '15px'; // Larger size for primary matches
            el.style.opacity = '1'; // Fully opaque for matches
        } else {
            el.style.fontSize = '6px'; // Smaller size for non-matches
            el.style.opacity = '0.3'; // 70% transparent for non-matches
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
            offset: 15, // Offset the popup from the marker
            className: 'restaurant-popup' // Add a unique class for restaurant popups
        });

        el.addEventListener('mouseenter', () => {
            // Filter sub-types to exclude the primary type
            const filteredSubTypes = Array.isArray(restaurant.types)
                ? restaurant.types.filter(type => type !== restaurant.primary_type).map(formatPrimaryType)
                : [];

            // Ensure generative_summary is handled properly
            const description = restaurant.generative_summary
                ? `<p style="margin-bottom: 10px;"><strong>Description:</strong> ${restaurant.generative_summary}</p>`
                : '<p style="margin-bottom: 10px;"><strong>Description:</strong> No description available.</p>';

            // Determine the number of stars based on ratingRanges
            const getStarsForRating = (rating) => {
                if (rating >= 1.0 && rating <= 3.7) return '⭐';
                if (rating >= 3.8 && rating <= 4.0) return '⭐⭐';
                if (rating >= 4.1 && rating <= 4.3) return '⭐⭐⭐';
                if (rating >= 4.4 && rating <= 4.6) return '⭐⭐⭐⭐';
                if (rating >= 4.7 && rating <= 5.0) return '⭐⭐⭐⭐⭐';
                return ''; // Default to no stars if rating is out of range
            };

            // Update the popup content
            popup
                .setLngLat(restaurant.coordinates)
                .setHTML(`
                    <div class="popup-content" style="
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        line-height: 1.6;
                        color: white;
                        padding: 10px;
                    ">
                        <h3 style="margin-bottom: 10px; font-size: 16px; font-weight: bold;">${restaurant.name}</h3>
                        ${restaurant.price_level ? `
                        <div class="price-level" style="margin-bottom: 10px;">
                            <strong>Price Level:</strong> ${getPriceLevelEmoji(restaurant.price_level)}
                        </div>` : ''}
                        <p style="margin-bottom: 10px;"><strong>Primary Type:</strong> ${formatPrimaryType(restaurant.primary_type)}</p>
                        ${filteredSubTypes.length > 0 ? `
                        <p style="margin-bottom: 10px;"><strong>Sub-types:</strong> ${filteredSubTypes.join(', ')}</p>` : ''}
                        ${description}
                        <div class="rating-container" style="margin-bottom: 10px;">
                            <span class="rating" style="font-size: 14px; font-weight: bold;">${restaurant.rating.toFixed(1)}</span>
                            <span class="stars" style="color: #FFD700;">${getStarsForRating(restaurant.rating)}</span>
                            <span class="review-count" style="font-size: 12px; color: light grey;">(${restaurant.review_count} reviews)</span>
                        </div>
                    </div>
                `)
                .addTo(map);
        });

        el.addEventListener('mouseleave', () => {
            popup.remove();
        });

        // Add the marker to the map
        new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat(restaurant.coordinates)
            .addTo(map);
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

    // Add rating filters
    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'filter-group';
    ratingDiv.innerHTML = '<h3>Overall Rating</h3>';

    const ratingRanges = [
        { id: 'rating-1', label: '⭐ 1.0 – 3.7', min: 1.0, max: 3.7 },
        { id: 'rating-2', label: '⭐⭐ 3.8 – 4.0', min: 3.8, max: 4.0 },
        { id: 'rating-3', label: '⭐⭐⭐ 4.1 – 4.3', min: 4.1, max: 4.3 },
        { id: 'rating-4', label: '⭐⭐⭐⭐ 4.4 – 4.6', min: 4.4, max: 4.6 },
        { id: 'rating-5', label: '⭐⭐⭐⭐⭐ 4.7 – 5.0', min: 4.7, max: 5.0 }
    ];

    ratingRanges.forEach(range => {
        const div = document.createElement('div');
        div.className = 'filter-item';
        div.innerHTML = `
            <input type="checkbox" id="${range.id}" aria-label="Filter by rating ${range.label}">
            <label for="${range.id}">
                ${range.label}
            </label>
        `;
        ratingDiv.appendChild(div);
        div.querySelector('input').addEventListener('change', filterRestaurants);
    });

    filterContainer.appendChild(ratingDiv);

    // Group primary types by geography and food type
    const groupedTypes = groupPrimaryTypes(primaryTypes);

    groupedTypes.forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'filter-group';
        groupDiv.innerHTML = `<h3>${group.name}</h3>`;

        group.types.forEach(type => {
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
    const selectedRatings = [];
    let selectedFilter = null;

    // Define the rating ranges (same as in setupFilters)
    const ratingRanges = [
        { id: 'rating-1', min: 1.0, max: 3.7 },
        { id: 'rating-2', min: 3.8, max: 4.0 },
        { id: 'rating-3', min: 4.1, max: 4.3 },
        { id: 'rating-4', min: 4.4, max: 4.6 },
        { id: 'rating-5', min: 4.7, max: 5.0 }
    ];

    // Collect selected types, price levels, and ratings
    document.querySelectorAll('#filters-container input[type="checkbox"]:checked').forEach(checkbox => {
        if (checkbox.id.startsWith('type-')) {
            const type = checkbox.id.replace('type-', '');
            selectedTypes.push(type);
            selectedFilter = type; // Use the last selected type as the primary filter
        } else if (checkbox.id.startsWith('price-')) {
            selectedPrices.push(checkbox.id.replace('price-', ''));
        } else if (checkbox.id.startsWith('rating-')) {
            const range = ratingRanges.find(r => r.id === checkbox.id); // Find the corresponding range
            if (range) {
                selectedRatings.push(range); // Add the range to the selectedRatings array
            }
        }
    });

    // If no filters are selected, clear all markers
    if (selectedTypes.length === 0 && selectedPrices.length === 0 && selectedRatings.length === 0) {
        addMarkers([], null, null); // Clear all markers
        updateFilterCounts([]); // Reset counts to 0
        return;
    }

    // Filter restaurants based on selected filters
    const filtered = window.restaurantData.filter(restaurant => {
        const matchesTypes = selectedTypes.length === 0 || selectedTypes.every(type => {
            return (
                restaurant.primary_type === type ||
                (Array.isArray(restaurant.types) && restaurant.types.includes(type))
            );
        });

        const matchesPriceLevel = selectedPrices.length === 0 || selectedPrices.includes(restaurant.price_level);

        const matchesRating = selectedRatings.length === 0 || selectedRatings.some(range => {
            return restaurant.rating >= range.min && restaurant.rating <= range.max;
        });

        // Only include restaurants that match all selected filters
        return matchesTypes && matchesPriceLevel && matchesRating;
    });

    // Update markers on the map
    addMarkers(filtered, selectedFilter, selectedPrices);

    // Update the count for each filter checkbox
    updateFilterCounts(filtered);
}

// Update filter counts based on the filtered restaurants
function updateFilterCounts(filteredRestaurants) {
    const filterCounts = {};

    // Count the number of restaurants for each type, price level, and rating range
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

        // Count rating ranges
        const ratingRanges = [
            { id: 'rating-1', min: 1.0, max: 3.7 },
            { id: 'rating-2', min: 3.8, max: 4.0 },
            { id: 'rating-3', min: 4.1, max: 4.3 },
            { id: 'rating-4', min: 4.4, max: 4.5 },
            { id: 'rating-5', min: 4.6, max: 5.0 }
        ];

        ratingRanges.forEach(range => {
            if (restaurant.rating >= range.min && restaurant.rating <= range.max) {
                if (!filterCounts[range.id]) {
                    filterCounts[range.id] = 0;
                }
                filterCounts[range.id]++;
            }
        });
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
            label.innerHTML = `${getEmojiForCuisine(type)} ${formatPrimaryType(type)} (${count})`;
        } else if (checkbox.id.startsWith('price-')) {
            const price = checkbox.id.replace('price-', '');
            const count = filterCounts[price] || 0; // Default to 0 if no matches
            label.innerHTML = `${getPriceLevelEmoji(price)} (${count})`;
        } else if (checkbox.id.startsWith('rating-')) {
            const ratingId = checkbox.id;
            const count = filterCounts[ratingId] || 0; // Default to 0 if no matches
            label.innerHTML = `${label.textContent.split('(')[0]} (${count})`; // Update count while keeping the label text
        }
    });
}

// Load restaurant data
async function loadRestaurantData() {
    try {
        const response = await fetch('restaurants_filtered.json');
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
    await addNeighborhoodLayer();

    // Add event listener for the NYC neighborhoods layer toggle via the title
    const toggleTitle = document.getElementById('toggle-nyc-layer-title');
    if (toggleTitle) {
        toggleTitle.addEventListener('click', (event) => {
            const title = event.target;
            const isLayerVisible = map.getLayoutProperty('nyc-neighborhoods-fill', 'visibility') === 'visible';

            if (isLayerVisible) {
                // Hide the NYC neighborhoods layer
                map.setLayoutProperty('nyc-neighborhoods-fill', 'visibility', 'none');
                map.setLayoutProperty('nyc-neighborhoods-outline', 'visibility', 'none');
                title.style.color = 'white'; // Change title color back to white
            } else {
                // Show the NYC neighborhoods layer
                map.setLayoutProperty('nyc-neighborhoods-fill', 'visibility', 'visible');
                map.setLayoutProperty('nyc-neighborhoods-outline', 'visibility', 'visible');

                // Update the filter to exclude neighborhoods with 0 or no value
                map.setFilter('nyc-neighborhoods-fill', [
                    'all',
                    ['>', ['get', 'pop_to_rest_ratio'], 0], // Exclude neighborhoods with a ratio of 0
                    ['has', 'pop_to_rest_ratio'] // Exclude neighborhoods with no value
                ]);
                title.style.color = '#457b9d'; // Change title color to #457b9d
            }
        });
    }

    // Add event listeners for hover, click, and reset functionality
    document.querySelectorAll('.legend-item').forEach(item => {
        const min = parseFloat(item.getAttribute('data-min'));
        const max = parseFloat(item.getAttribute('data-max'));

        // Highlight neighborhoods on hover
        item.addEventListener('mouseenter', () => {
            if (!selectedRange) {
                map.setFilter('nyc-neighborhoods-fill', [
                    'all',
                    ['>=', ['get', 'pop_to_rest_ratio'], min],
                    ['<=', ['get', 'pop_to_rest_ratio'], max],
                    ['>', ['get', 'pop_to_rest_ratio'], 0], // Exclude neighborhoods with a ratio of 0
                    ['has', 'pop_to_rest_ratio'] // Exclude neighborhoods with no value
                ]);
                map.setPaintProperty('nyc-neighborhoods-fill', 'fill-opacity', [
                    'case',
                    ['all', ['>=', ['get', 'pop_to_rest_ratio'], min], ['<=', ['get', 'pop_to_rest_ratio'], max]],
                    0.9, // Full opacity for matching neighborhoods
                    0.5  // Reduced opacity for others
                ]);
                map.setPaintProperty('nyc-neighborhoods-outline', 'line-width', [
                    'case',
                    ['all', ['>=', ['get', 'pop_to_rest_ratio'], min], ['<=', ['get', 'pop_to_rest_ratio'], max]],
                    1.5, // Bolden the border for matching neighborhoods
                    0.5 // Default border width for others
                ]);
            }
        });

        // Reset highlight on mouse leave
        item.addEventListener('mouseleave', () => {
            if (!selectedRange) {
                map.setFilter('nyc-neighborhoods-fill', [
                    'all',
                    ['>', ['get', 'pop_to_rest_ratio'], 0], // Exclude neighborhoods with a ratio of 0
                    ['has', 'pop_to_rest_ratio'] // Exclude neighborhoods with no value
                ]);
                map.setPaintProperty('nyc-neighborhoods-fill', 'fill-opacity', 0.9);
                map.setPaintProperty('nyc-neighborhoods-outline', 'line-width', 0.5);
            }
        });

        // Lock the map on click
        item.addEventListener('click', () => {
            if (selectedRange && selectedRange.min === min && selectedRange.max === max) {
                // If the same range is clicked again, reset the map
                selectedRange = null;
                map.setFilter('nyc-neighborhoods-fill', [
                    'all',
                    ['>', ['get', 'pop_to_rest_ratio'], 0], // Exclude neighborhoods with a ratio of 0
                    ['has', 'pop_to_rest_ratio'] // Exclude neighborhoods with no value
                ]);
                map.setPaintProperty('nyc-neighborhoods-fill', 'fill-opacity', 0.9);
                map.setPaintProperty('nyc-neighborhoods-outline', 'line-width', 0.5);
            } else {
                // Lock the map to the selected range
                selectedRange = { min, max };
                map.setFilter('nyc-neighborhoods-fill', [
                    'all',
                    ['>=', ['get', 'pop_to_rest_ratio'], min],
                    ['<=', ['get', 'pop_to_rest_ratio'], max],
                    ['>', ['get', 'pop_to_rest_ratio'], 0], // Exclude neighborhoods with a ratio of 0
                    ['has', 'pop_to_rest_ratio'] // Exclude neighborhoods with no value
                ]);
                map.setPaintProperty('nyc-neighborhoods-fill', 'fill-opacity', [
                    'case',
                    ['all', ['>=', ['get', 'pop_to_rest_ratio'], min], ['<=', ['get', 'pop_to_rest_ratio'], max]],
                    0.9, // Full opacity for matching neighborhoods
                    0.5  // Reduced opacity for others
                ]);
                map.setPaintProperty('nyc-neighborhoods-outline', 'line-width', [
                    'case',
                    ['all', ['>=', ['get', 'pop_to_rest_ratio'], min], ['<=', ['get', 'pop_to_rest_ratio'], max]],
                    3, // Bolden the border for matching neighborhoods
                    0.5 // Default border width for others
                ]);
            }
        });
    });

    // Reset the map when clicking anywhere else on the page
    document.addEventListener('click', (event) => {
        const legend = document.getElementById('legend');
        if (!legend.contains(event.target)) {
            selectedRange = null;
            map.setFilter('nyc-neighborhoods-fill', [
                'all',
                ['>', ['get', 'pop_to_rest_ratio'], 0], // Exclude neighborhoods with a ratio of 0
                ['has', 'pop_to_rest_ratio'] // Exclude neighborhoods with no value
            ]);
            map.setPaintProperty('nyc-neighborhoods-fill', 'fill-opacity', 0.9);
            map.setPaintProperty('nyc-neighborhoods-outline', 'line-width', 0.5);
        }
    });
}

// Start the app
map.on('load', initializeApp);
