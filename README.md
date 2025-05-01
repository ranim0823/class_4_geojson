# Foodscape of New York City 2025

## Project Overview

The **NYC Food Map** is an interactive web application designed to explore the foodscape of New York City. It visualizes the population-to-restaurant ratio across neighborhoods, allowing users to filter and analyze restaurants based on cuisine types, price levels, and ratings. The project aims to provide insights into the distribution of restaurants and their accessibility in NYC.

This web map serves at the first step in a larger research project that examines the spatial distribution of restaurants in relations with certain characteristics of New York City's neighborhoods. (e.g. %foreign-born, %female,%white, place of birth, ancestry, average gross rent, average gross income)

--

## Why Does this Project Exist?

This project is created to:

1. Allow users to explore the geography of taste in New York City.
   - Are there any correlations between the spatial distribution of certain types of restaurants with certain groups of people?
   - Are there more coffee shops in neighborhoods with higher income or higher rent? Or, are "ethnic" restaurants more likely to locate in neighborhoods with higher percentage of foreign-born population?
   - Is there a relationship between diversity of a place with the diversity of its food?

2. Allow users to filter and explore restaurants based on their preferences, such as cusiine type, price level, and ratings.

--

## Features

- **Interactive Map**: Displays NYC neighborhoods with a color-coded population-to-restaurant ratio.
- **Restaurant Filters**: Users can filter restaurants by cuisine type, price level, and ratings.
- **Dynamic Popups**: Clicking on a neighborhood or restaurant marker shows detailed information.
- **Legend**: A legend explains the color gradient for population-to-restaurant ratios.
- **Responsive Design**: The website is optimized for both desktop and mobile devices.

--

## Data Source

1. **NYC Neighborhood GeoJSON**
   - File: "nyc_nta_2020_pop+food.geojson"
   - 2022 5-year Amercian Community Survey (ACS)
   - 2020 Neighborhood Tabulation Areas (NTA)
   - restaurant data see below
2. **Restaurant Data**
   - File: "filtered_restaurants.json"
   - Google Places API on April 1, 2025
   - Contains detailed information about restaurants, including:
      - Name
      - Location (latitude and longitude)
      - Price level (Very Expensive, Expensive, Moderate, Inexpensive)
      - Primary type (only 1 per restaurant)
      - Sub-types (1 or more per restaurant)
      - Overall Rating (out of 5)
      - Number of Reviews
      - Text of top 5 Reviews
      - Whether it has a restroom or not
   - **Dataset Breakdown**

      | Restaurant Type               | Count  |
      |-------------------------------|--------|
      | **Summary Statistics** | |
      | Total Unique Restaurants | 20,847 |
      | Total Unique Primary Types | 143 |
      | Total Unique Types | 73 |
      | **Primary Type By Geography** | |
      | afghani_restaurant | 12 |
      | afghan_restaurant | 3 |
      | african_restaurant | 22 |
      | albanian_restaurant | 6 |
      | american_restaurant | 1093 |
      | armenian_restaurant | 3 |
      | argentine_restaurant | 4 |
      | asian_restaurant | 246 |
      | australian_restaurant | 15 |
      | austrian_restaurant | 4 |
      | bangladeshi_restaurant | 37 |
      | belgian_restaurant | 17 |
      | bosnian_restaurant | 1 |
      | brazilian_restaurant | 25 |
      | british_restaurant | 11 |
      | burmese_restaurant | 5 |
      | cambodian_restaurant | 1 |
      | canadian_restaurant | 1 |
      | cantonese_restaurant | 3 |
      | caribbean_restaurant | 210 |
      | chinese_restaurant | 1920 |
      | colombian_restaurant | 127 |
      | croatian_restaurant | 1 |
      | cuban_restaurant | 49 |
      | czech_restaurant | 2 |
      | dominican_restaurant | 315 |
      | dutch_restaurant | 1 |
      | ecuadorian_restaurant | 88 |
      | egyptian_restaurant | 6 |
      | eritrean_restaurant | 2 |
      | ethiopian_restaurant | 13 |
      | filipino_restaurant | 29 |
      | french_restaurant | 191 |
      | georgian_restaurant | 32 |
      | german_restaurant | 18 |
      | ghanaian_restaurant | 2 |
      | greek_restaurant | 155 |
      | grenadian_restaurant | 1 |
      | guatemalan_restaurant | 9 |
      | guyanese_restaurant | 11 |
      | haitian_restaurant | 43 |
      | honduran_restaurant | 10 |
      | hungarian_restaurant | 2 |
      | indian_restaurant | 332 |
      | indonesian_restaurant | 4 |
      | iranian_restaurant | 1 |
      | irish_restaurant | 30 |
      | israeli_restaurant | 23 |
      | italian_restaurant | 971 |
      | ivorian_restaurant | 1 |
      | jamaican_restaurant | 279 |
      | japanese_restaurant | 614 |
      | kazakh_restaurant | 1 |
      | korean_restaurant | 343 |
      | lao_restaurant | 1 |
      | lebanese_restaurant | 23 |
      | malaysian_restaurant | 18 |
      | mediterranean_restaurant | 276 |
      | mexican_restaurant | 1290 |
      | middle_eastern_restaurant | 142 |
      | moroccan_restaurant | 4 |
      | nepalese_restaurant | 16 |
      | nigerian_restaurant | 7 |
      | pakistani_restaurant | 27 |
      | panamanian_restaurant | 1 |
      | paraguayan_restaurant | 2 |
      | peruvian_restaurant | 100 |
      | polish_restaurant | 13 |
      | portuguese_restaurant | 8 |
      | romanian_restaurant | 3 |
      | russian_restaurant | 19 |
      | salvadoran_restaurant | 33 |
      | senegalese_restaurant | 9 |
      | serbian_restaurant | 1 |
      | singaporean_restaurant | 3 |
      | somali_restaurant | 1 |
      | spanish_restaurant | 107 |
      | sri lankan_restaurant | 7 |
      | swedish_restaurant | 4 |
      | taiwanese_restaurant | 35 |
      | tajik_restaurant | 1 |
      | thai_restaurant | 358 |
      | tibetan_restaurant | 14 |
      | trinidadian_restaurant | 12 |
      | turkish_restaurant | 57 |
      | ukrainian_restaurant | 5 |
      | uruguayan_restaurant | 1 |
      | uzbek_restaurant | 27 |
      | venezuelan_restaurant | 23 |
      | vietnamese_restaurant | 155 |
      | west african_restaurant | 34 |
      | yemeni_restaurant | 13 |
      | **Primary Type By Foods**  ||
      | bakery | 242 |
      | bar/pub | 1443 |
      | bar_and_grill | 221 |
      | bagel_shop | 110 |
      | breakfast_restaurant | 91 |
      | brunch_restaurant | 31 |
      | buffet_restaurant | 43 |
      | cafe | 1053 |
      | chocolate_shop | 1 |
      | chicken_restaurant | 600 |
      | comfort food_restaurant | 150 |
      | deli | 426 |
      | dessert_shop | 44 |
      | diner | 239 |
      | donut_shop | 3 |
      | dumpling_restaurant | 36 |
      | fast_food_restaurant | 526 |
      | fine_dining_restaurant | 53 |
      | food_court | 41 |
      | hamburger_restaurant | 242 |
      | halal_restaurant | 110 |
      | health_food | 81 |
      | hookah_bar | 2 |
      | ice_cream_shop | 27 |
      | juice_shop | 49 |
      | lounge_restaurant | 30 |
      | noodle_restaurant | 26 |
      | pizza_restaurant | 1406 |
      | poke_restaurant | 9 |
      | ramen_restaurant | 122 |
      | restaurant | 1607 |
      | sandwich_shop | 251 |
      | seafood_restaurant | 292 |
      | steak_house | 133 |
      | sushi_restaurant | 368 |
      | taco_restaurant | 55 |
      | takeout | 46 |
      | tea_house | 23 |
      | teriyaki_restaurant | 5 |
      | vegan_restaurant | 110 |
      | vegetarian_restaurant | 51 |
      | wine_bar | 77 |

## Technologies Used

### Frontend

- **HTML**: Structure of the website
- **CSS**:Styling for the website, including responsive design.
- **JavaScript**:Core functionality for interactivity and data visualization.

### Mapping

- **Mapbox GL JS**:
  - Used for rendering the interactive map.
  - Provides layers for neighborhoods and restaurant markers.
  - Enables dynamic popups and hover effects.

### Data Processing

- **GeoJSON:**:
  - Used for geospatial data visualization.
  - Displays NYC neighborhoods with population-to-restaurant ratios.
- **JSON**:
  - Used for restaurant and cuisine type data.

--

## How It Works

1. Map Initialization:
   - The map is initialized using Mapbox GL JS with a dark theme.
   - The center is set to NYC with an appropriate zoom level.
2. Neighborhood Layer:
   - A GeoJSON layer is added to display NYC neighborhoods.
   - Neighborhoods are color-coded based on the population-to-restaurant ratio using a gradient from light grey to black.
3. Restaurant Markers:
   - Restaurants are displayed as markers with emojis representing their primary type.
   - Markers are dynamically filtered based on user-selected criteria.
4. Filters:
   - Users can filter restaurants by:
      -Primary and secondary type by Geography (e.g., Italian, Chinese etc.) or Food/Drink served (e.g., Pizza, Vegan, Bar etc.).
      -Price level (e.g., $, $$, $$$).
      -Ratings (e.g., ⭐⭐⭐⭐).
   - Filters dynamically update the markers on the map.
      -Restaurants which primary type matches the filter selection are shown with bigger markers
      -Restaurants which sub-types contains the filter selection are shown with smaller markers.
      -The number of restaurants which primary type/sub-type matches the filter selection.
5. Legend:
   - A legend explains the color gradient for population-to-restaurant ratios.
   - Users can toggle the visibility of the neighborhood layer.

--

## How to Run the Project

1. Clone the repository:
"<https://github.com/ranim0823/class_4_geojson>"

2. Explore the map:
"<https://ranim0823.github.io/class_4_geojson>"

--

## Future Enhancements

1. Load GeoJSON files of NYC's census tracts with data on:
   - %foreign-born
   - %female
   - %white
   - Place of birth
   - Ancestry
   - Average gross rent
   - Average gross income

2. Visualize census tracts as the base layer on the map, create different layers for different parameters, and create a filter for each layer.

3. Make census tract polygons clickable, with metadata in pop-ups, along with the top five restaurant types and the count of each type.

4. Load GeoJSON file of NYC's neighborhood boundaries.

5. Create filters for restaurants in each neighborhood.
