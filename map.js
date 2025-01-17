

// Define a function to get the data value for a country
function getData(countryName, csvData, selectedOption) {
    const countryData = csvData.find(row => row.country === countryName);
    return countryData ? parseFloat(countryData[selectedOption]) : null;
}

// Define a function to set the color for a country
function getColor(d, csvData, selectedOption, colorScale) {
    const dataValue = getData(d.properties.ADMIN, csvData, selectedOption);
    if (dataValue === null) {
        return 'black'; // Color for countries with no data
    }
    return colorScale(dataValue); // Use a color scale for data values
}

// Define a color scale
var colorScale = d3.scaleLinear(); // Initialize color scale

function updateColorScale(csvData, selectedOption) {
    const minValue = d3.min(csvData, d => parseFloat(d[selectedOption]));
    const maxValue = d3.max(csvData, d => parseFloat(d[selectedOption]));
    colorScale.domain([minValue, maxValue]).range(["lightskyblue", "navy"]);
}

// Wrap the map-related code in a function
function loadMap() {
    // Remove existing map content
    d3.select("#map-container").selectAll("*").remove();

    // Load the GeoJSON data
    d3.json('countries.geojson').then(function(geojsonData) {

        // Load the CSV data
        d3.csv('whoiswinning.csv').then(function(csvData) {

            // Update color scale with default indicator
            updateColorScale(csvData, yVariable);

            // Create the SVG element for the map with a white background
            const svg = d3.select("#map-container").append("svg")
                .attr("width", 960)
                .attr("height", 610)
                .style("background-color", "#E9c46a"); // Set background color to white

            // Define a projection and path generator
            const projection = d3.geoNaturalEarth1()
                .scale(170)
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

            // Add legend using the same color scale
            addLegend(svg, colorScale);   

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

// Function to add a legend to the map
function addLegend(svg, colorScale) {
    // Define dimensions and position for the legend
    const legendWidth = 800;
    const legendHeight = 15;
    const legendMargin = { top: 30, right: 30, bottom: 30, left: 30 };
    const legendX = (960 - legendWidth) / 2; // Center the legend horizontally
    const legendY = 590 - legendHeight - legendMargin.bottom; // Position legend at the bottom

    // Create a group element for the legend
    const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", "translate(" + legendX + "," + legendY + ")");

        const gradient = legend.append("defs").append("linearGradient")
        .attr("id", "gradient")
        .selectAll("stop")
        .data(colorScale.range().map(function(color, i) {
            return {
                offset: i / (colorScale.range().length - 1),
                color: color
            };
        }))
        .enter().append("stop")
        .attr("offset", function(d) { return d.offset; })
        .attr("stop-color", function(d) { return d.color; });


    // Draw the legend's colored rectangle
    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#gradient)");

    // Create a scale for the legend's x-axis based on the color scale domain
    const xScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([0, legendWidth]);

    // Add an axis to the legend
    const axis = d3.axisBottom(xScale)
        .ticks(5); // Adjust number of ticks based on your preference

    legend.append("g")
        .attr("transform", "translate(0," + legendHeight + ")")
        .call(axis);
    
    legend.append("text")
      .attr("x", 0)
      .attr("y", legendHeight + 30)
      .text("Note: Countries with black-fill do not have data available on the selected indicator")
      .style("fill", "black");
}

// Call loadMap when "Skip to Results" is clicked
document.querySelector('.button-2').addEventListener('click', function() {
  loadMap();
});
