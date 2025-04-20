import json
import geopandas as gpd
from shapely.geometry import Point

# File paths
nta_geojson_file = "class_4_geojson/nyc_nta_2020.geojson"
restaurants_json_file = "class_4_geojson/filtered_restaurants.json"
acs_geojson_file = "class_4_geojson/nyc_nta_2020_acs_5y_2022.geojson"
output_file = "class_4_geojson/nyc_nta_2020_pop+food.geojson"

# Step 1: Count the number of restaurants in each NTA area
def count_restaurants(nta_gdf, restaurants_json_file):
    # Load the restaurant dataset
    with open(restaurants_json_file, "r") as f:
        restaurants_data = json.load(f)

    # Convert restaurant dataset to GeoDataFrame with Point geometries
    restaurant_points = [
        Point(float(restaurant['longitude']), float(restaurant['latitude']))
        for restaurant in restaurants_data
        if 'longitude' in restaurant and 'latitude' in restaurant
    ]
    restaurants_gdf = gpd.GeoDataFrame(geometry=restaurant_points, crs="EPSG:4326")  # Assuming WGS84 CRS

    # Perform spatial join to count restaurants within each NTA
    nta_with_counts = gpd.sjoin(nta_gdf, restaurants_gdf, how="left", predicate="contains")
    nta_counts = nta_with_counts.groupby("NTA2020").size().reset_index(name="restaurant_count")

    # Merge the counts back into the original NTA GeoDataFrame
    nta_gdf = nta_gdf.merge(nta_counts, on="NTA2020", how="left")

    # Fill NaN values with 0 (in case some NTAs have no restaurants)
    nta_gdf["restaurant_count"] = nta_gdf["restaurant_count"].fillna(0).astype(int)

    return nta_gdf

# Step 2: Add population data from ACS GeoJSON
def add_population_data(nta_gdf, acs_geojson_file):
    # Load the ACS GeoJSON file
    acs_gdf = gpd.read_file(acs_geojson_file)

    # Merge the population data (Pop_1E) into the NTA GeoDataFrame based on NTA2020 field
    nta_gdf = nta_gdf.merge(
        acs_gdf[['NTA2020', 'Pop_1E']],
        on="NTA2020",
        how="left"
    )

    # Fill NaN values in Pop_1E with 0 (if any NTAs are missing population data)
    nta_gdf["Pop_1E"] = nta_gdf["Pop_1E"].fillna(0).astype(int)

    return nta_gdf

# Step 3: Calculate population-to-restaurant ratio
def calculate_population_to_restaurant_ratio(nta_gdf):
    # Calculate the population-to-restaurant count ratio
    def calculate_ratio(row):
        population = row.get("Pop_1E", 0)
        restaurant_count = row.get("restaurant_count", 0)
        if restaurant_count > 0:
            return round(population / restaurant_count)  # Round to the nearest integer
        else:
            return None  # Avoid division by zero

    # Apply the ratio calculation to each feature
    nta_gdf["pop_to_rest_ratio"] = nta_gdf.apply(calculate_ratio, axis=1)

    return nta_gdf

# Main function to integrate all steps
def main():
    # Load the NTA GeoJSON file
    nta_gdf = gpd.read_file(nta_geojson_file)

    # Step 1: Count restaurants
    nta_gdf = count_restaurants(nta_gdf, restaurants_json_file)

    # Step 2: Add population data
    nta_gdf = add_population_data(nta_gdf, acs_geojson_file)

    # Step 3: Calculate population-to-restaurant ratio
    nta_gdf = calculate_population_to_restaurant_ratio(nta_gdf)

    # Save the final updated GeoJSON file
    nta_gdf.to_file(output_file, driver="GeoJSON")
    print(f"Final GeoJSON file saved to {output_file}!")

# Run the script
if __name__ == "__main__":
    main()