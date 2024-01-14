// Define a function to get the data value for a country
function getData(countryName, csvData, selectedOption) {
    const countryData = csvData.find(row => row.country === countryName);
    return countryData ? parseFloat(countryData[selectedOption]) : null;
}

// Define a function to set the color for a country
function getColor(d, csvData, selectedOption, colorScale) {
    const dataValue = getData(d.properties.ADMIN, csvData, selectedOption);
    if (dataValue === null) {
        return 'red'; // Color for countries with no data
    }
    return colorScale(dataValue); // Use a color scale for data values
}

// Wrap the map-related code in a function
function loadMap() {
  // Remove existing map content
  d3.select("#map-container").selectAll("*").remove();

  // Load the GeoJSON data
  d3.json('countries.geojson').then(function(geojsonData) {

    // Load the CSV data
    d3.csv('whoiswinning.csv').then(function(csvData) {

      // Define your color scale here
      var colorScale = d3.scaleLinear(); // Initialize color scale

      function updateColorScale(selectedOption) {
        const minValue = d3.min(csvData, d => parseFloat(d[selectedOption]));
        const maxValue = d3.max(csvData, d => parseFloat(d[selectedOption]));
        colorScale.domain([minValue, maxValue]).range(["lightblue", "darkblue"]);
      }

      // Initial update of color scale with default indicator
      updateColorScale(yVariable);

      // Create the SVG element for the map with a white background
      const svg = d3.select("#map-container").append("svg")
          .attr("width", 960)
          .attr("height", 600)
          .style("background-color", "white"); // Set background color to white

      // Define a projection and path generator
      const projection = d3.geoNaturalEarth1()
          .scale(153)
          .translate([480, 300]);
      const path = d3.geoPath().projection(projection);

      // Draw the map
      var countries = svg.selectAll("path")
          .data(geojsonData.features)
          .enter().append("path")
          .attr("d", path)
          .attr("fill", d => getColor(d, csvData, yVariable, colorScale))
          .attr("stroke", "black") // Set country borders to black
          .attr("stroke-width", 0.2); // Set border width to 0.2 pixels

      // Create a tooltip. This tooltip will display the country's name, the selected indicator, and its value.
      var tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);

      // Function to update tooltip content
      function updateTooltipContent(d, selectedOption) {
          var indicatorValue = getData(d.properties.ADMIN, csvData, selectedOption);
          return d.properties.ADMIN + "<br/>" + selectedOption + ": " + indicatorValue;
      }

      // Add event listeners for mouseover and mouseout
      countries.on("mouseover", function(d) {
          tooltip.transition()
              .duration(200)
              .style("opacity", .9);
          tooltip.html(updateTooltipContent(d, yVariable))
              .style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          tooltip.transition()
              .duration(500)
              .style("opacity", 0);
      });

      // Listen to changes in the dropdown
      d3.select('select').on('change', function() {
          yVariable = d3.select(this).property('value');
          updateColorScale(yVariable); // Update color scale with new indicator

          // Update the map colors based on the selected option
          countries.transition()  // Optional: smooth transition for color change
              .duration(500) // Transition duration in milliseconds
              .attr("fill", d => getColor(d, csvData, yVariable, colorScale));

          // Update tooltip content on indicator change
          countries.on("mouseover", function(d) {
              tooltip.transition()
                  .duration(200)
                  .style("opacity", .9);
              tooltip.html(updateTooltipContent(d, yVariable))
                  .style("left", (d3.event.pageX) + "px")
                  .style("top", (d3.event.pageY - 28) + "px");
          })
          .on("mouseout", function(d) {
              tooltip.transition()
                  .duration(500)
                  .style("opacity", 0);
          });
      });
    });
  });
}

// Call loadMap when "Skip to Results" is clicked
document.querySelector('.button-2').addEventListener('click', function() {
  loadMap();
});