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
   - **Total Unique Restaurants**: 21,891

      **Primary Types by Geography**

      | Cuisine Type              | Count       |
      | ------------------------- | ----------- |
      | Afghani Restaurant        | 12          |
      | African Restaurant        | 22          |
      | American Restaurant       | 847         |
      | Asian Restaurant          | 194         |
      | Brazilian Restaurant      | 24          |
      | Chinese Restaurant        | 1,770       |
      | French Restaurant         | 161         |
      | Greek Restaurant          | 133         |
      | Indian Restaurant         | 299         |
      | Indonesian Restaurant     | 4           |
      | Italian Restaurant        | 877         |
      | Japanese Restaurant       | 579         |
      | Korean Restaurant         | 296         |
      | Lebanese Restaurant       | 23          |
      | Mediterranean Restaurant  | 223         |
      | Mexican Restaurant        | 1,166       |
      | Middle Eastern Restaurant | 109         |
      | Spanish Restaurant        | 83          |
      | Thai Restaurant           | 345         |
      | Turkish Restaurant        | 54          |
      | Vietnamese Restaurant     | 144         |

      **Primary Types by Food**

      | Food Type              | Count      |
      | ---------------------- | ---------- |
      | Acai Shop              | 11         |
      | Bagel Shop             | 110        |
      | Bakery                 | 242        |
      | Bar                    | 902        |
      | Bar and Grill          | 221        |
      | Barbecue Restaurant    | 91         |
      | Buffet Restaurant      | 43         |
      | Cafe                   | 392        |
      | Cafeteria              | 8          |
      | Catering Service       | 33         |
      | Chocolate Shop         | 1          |
      | Coffee Shop            | 432        |
      | Confectionery          | 2          |
      | Deli                   | 426        |
      | Dessert Restaurant     | 12         |
      | Dessert Shop           | 32         |
      | Diner                  | 239        |
      | Donut Shop             | 3          |
      | Fine Dining Restaurant | 53         |
      | Food Court             | 38         |
      | Hamburger Restaurant   | 242        |
      | Ice Cream Shop         | 27         |
      | Juice Shop             | 49         |
      | Meal Delivery          | 52         |
      | Meal Takeaway          | 128        |
      | Pizza Restaurant       | 1,344      |
      | Pub                    | 96         |
      | Ramen Restaurant       | 122        |
      | Sandwich Shop          | 251        |
      | Seafood Restaurant     | 292        |
      | Steak House            | 133        |
      | Sushi Restaurant       | 329        |
      | Tea House              | 23         |
      | Vegan Restaurant       | 86         |
      | Vegetarian Restaurant  | 35         |
      | Wine Bar               | 77         |


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
