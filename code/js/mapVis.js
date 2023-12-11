class MapVis {

    constructor(parentElement, geoData, matchData, cityHumidity) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.matchData = matchData
        this.cityHumidity = cityHumidity
        this.startColor = "#B9D1EA"
        this.endColor = "#061E37"

        // console.log("cityHumidity", this.cityHumidity)
        // console.log("matchData", this.matchData)

        this.handleClick = this.handleClick.bind(this);

        // this.mergeData()
        this.coinTossDecision("Chennai", this.colorBasedOnHumidity("88"))
        this.coinTossWinner("Chennai", this.colorBasedOnHumidity("88"))
        this.initVis();
    }

    // Was originally used to clean the dataset and then uploaded into the data folder
    // This is because this code would take 10 min to run each time, so it's not suitable to put in wrangleData
    // no need to run again once dataset is created
    mergeData() {
        let vis = this

        let flattenedCityHumidity = vis.cityHumidity.flatMap(city => {
            let cityName = city.cityName;
            let longitude = city.data[0].longitude
            let latitude = city.data[0].latitude
            let elevation = city.data[0].elevation
            return city.data.map(entry => ({
                cityName,
                date: new Date(entry.time),
                humidity: entry['relative_humidity_2m (%)'],
                latitude: latitude,
                longitude: longitude,
                elevation: elevation
            }));
        });

        // Merge datasets based on cityName and date
        let mergedData = vis.matchData.map(match => {
            let cityName = match.City;
            let date = new Date(match.Date);
            let dateCompare = date.toISOString().split('T')[0];

            let matchingHumidityEntry = flattenedCityHumidity.find(entry =>
                entry.cityName === cityName &&
                entry.date.toISOString().split('T')[0] === dateCompare
            );

            // If a corresponding humidity entry is found, add humidity data to the match data
            if (matchingHumidityEntry) {
                return {
                    ...match,
                    humidity: matchingHumidityEntry.humidity,
                    latitude: matchingHumidityEntry.latitude,
                    longitude: matchingHumidityEntry.longitude,
                    elevation: matchingHumidityEntry.elevation,
                };
            } else {
                // If no corresponding humidity entry is found, handle it as needed (e.g., set humidity to a default value)
                return {
                    ...match,
                    humidity: "N/A",
                    latitude: "N/A",
                    longitude: "N/A",
                    elevation: "N/A",
                };
            }
        });

        let jsonData = JSON.stringify(mergedData, null, 2); // Convert the object to a nicely formatted JSON string
        console.log(jsonData) // I just copied and pasted this from the console to the file
    }

    // Create a function to generate a color scale
    colorBasedOnHumidity(humidity) {
        let vis = this
        // Adjust the color scale based on your specific requirements
        // Here, a simple example is used where low humidity is blue and high humidity is red
        let colorScale = d3.scaleLinear()
            .domain([0, 100])
            .range([vis.startColor, vis.endColor]);
        return colorScale(humidity);
    }

    // Create a function to generate the color scale for humidity
    addColorLegend(vis) {
        let legendWidth = 200;
        let legendHeight = 20;

        let colorScale = d3.scaleLinear()
            .domain([0, 100])
            .range([vis.startColor, vis.endColor]);

        let legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width - legendWidth - 20}, ${70})`);

        let legendScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, legendWidth]);

        let legendAxis = d3.axisBottom(legendScale)
            .tickValues([0, 25, 50, 75, 100])
            .tickFormat(d => `${d}%`);

        // Append a title to the legend
        legend.append("text")
            .attr("class", "legend-title")
            .attr("x", legendWidth / 2)
            .attr("y", -10)
            .style("text-anchor", "middle")
            .style("font-size", "15px")
            .text("Humidity Scale");

        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legendGradient)");

        legend.append("g")
            .attr("transform", `translate(0, ${legendHeight})`)
            .call(legendAxis);

        let gradient = legend.append("defs")
            .append("linearGradient")
            .attr("id", "legendGradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", legendWidth)
            .attr("y2", 0);

        gradient.selectAll("stop")
            .data(colorScale.range())
            .enter().append("stop")
            .attr("offset", (d, i) => i / (colorScale.range().length - 1))
            .attr("stop-color", d => d);
    }


    initVis() {
        let vis = this
        vis.margin = {top: 30, right: 10, bottom: 0, left: 10};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("class", "map map-hover")

        // clip path
        vis.svg.append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);

        // add title
        let titleOffsetY = 15
        let titleOffsetX = 10
        vis.svg.append("g")
            .attr("class", "title")
            .append("text")
            .text("Map Indicating Humidity Levels in Cricket Stadiums in India")
            .attr("transform", `translate(${vis.width / 2 - titleOffsetX}, ${titleOffsetY})`)
            .attr("text-anchor", "middle")
            .style("font-size", "18px");

        // create a tooltip
        vis.tooltip = d3.select("body").append('div')
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")
            .style("position", "absolute")  // Make sure the position is absolute
            .style("z-index", "9999");  // Set a high z-index

        // Process the Geo Data
        vis.projection = d3.geoMercator().fitSize([vis.width, vis.height-20], vis.geoData);
        vis.path = d3.geoPath().projection(vis.projection);

        vis.statesGroup = vis.svg.append("g")
            .attr("class", "states-group");
        // Initialize the map (draw each state)
        vis.states = vis.statesGroup.selectAll(".state")
            .data(vis.geoData.features)
            .enter()
            .append("path")
            .attr("class", "state")
            .attr("d", vis.path)
            .attr("fill", d => vis.colorBasedOnHumidity(50));

        vis.statesGroup.attr("transform", "translate(20, 30)");

        // Create a group for the dots
        vis.dotsGroup = vis.svg.append("g")
            .attr("class", "dots-group")
            .attr("transform", `translate(20, 30)`); // Adjusted here


        vis.addColorLegend(vis);
        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Group data by city and calculate the average humidity for each city
        let groupedData = d3.group(vis.cityHumidity, d => d.City);

        // Calculate the average humidity for each city
        let aggregatedData = Array.from(groupedData, ([city, data]) => {
            let humidityValues = data.map(entry => parseFloat(entry.humidity));
            let averageHumidity = humidityValues.reduce((sum, value) => sum + value, 0) / humidityValues.length;

            return {
                City: city,
                humidity: averageHumidity,
                latitude: data[0].latitude,
                longitude: data[0].longitude,
                elevation: data[0].elevation,
            };
        });

        vis.displayData = aggregatedData;
        vis.updateVis();
    }

    updateVis() {
        let vis = this

        // functions for mouseover, mousemove, and mouseleave
        vis.mouseover = function() {
            vis.tooltip
                .style("opacity", 1)
            d3.select(this)
                .style("stroke", "black")
                .style("opacity", 1)
                .attr("stroke-width", 2);
        }
        vis.mousemove = function(event, d) {
            // Filter cityHumidity for the specific city
            let cityData = vis.cityHumidity.filter(entry => entry.City === d.City);

            // Calculate the overall average humidity for the city
            let numericHumidities = cityData.map(entry => parseFloat(entry.humidity)).filter(value => !isNaN(value));
            let overallAverageHumidity = numericHumidities.length > 0 ? numericHumidities.reduce((sum, value) => sum + value, 0) / numericHumidities.length : NaN;

            d3.select(this)
                .attr("fill", "red")
                .attr("stroke-width", 2);

            let tooltipHeight = vis.tooltip.node().offsetHeight; // Get the height of the tooltip
            vis.tooltip
                .style("opacity", 1)
                .style("left", event.pageX + 20 + "px")
                .style("top",  event.pageY + "px")
                .html(`
             <div>
                 <p><strong>${d.City}</strong><p>
                 <p>Overall Average Humidity: ${overallAverageHumidity.toFixed(2)}%<p>
             </div>`);
        }
        vis.mouseleave = function() {
            d3.select(this)
                .attr("fill", d => vis.colorBasedOnHumidity(parseFloat(d.humidity)))
                .style("opacity", 1)
                .attr("stroke-width", 2);
            vis.tooltip
                .style("opacity", 0)
                .style("left", 0 + "px")
                .style("top", 0 + "px")
                .html(``);
        }

        // Filter data excluding points with "N/A" humidity and specific cities
        let filteredData = vis.displayData.filter(d => !isNaN(d.humidity) && !['Sharjah', 'Dubai', 'Abu Dhabi'].includes(d.City));

        // Draw points on the map with color based on humidity
        vis.dotsGroup.selectAll("circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("cx", d => {
                let longitude = parseFloat(d.longitude);
                let latitude = parseFloat(d.latitude);
                return isNaN(longitude) || isNaN(latitude) ? 0 : vis.projection([longitude, latitude])[0];
            })
            .attr("cy", d => {
                let longitude = parseFloat(d.longitude);
                let latitude = parseFloat(d.latitude);
                return isNaN(longitude) || isNaN(latitude) ? 0 : vis.projection([longitude, latitude])[1];
            })
            .attr("r", 8)
            .attr("fill", d => vis.colorBasedOnHumidity(parseFloat(d.humidity)))
            .style("stroke", "black")
            .style("stroke-width", 2)
            .on("mouseover", vis.mouseover)
            .on("mousemove", vis.mousemove)
            .on("mouseleave", vis.mouseleave)
            .on("click", vis.handleClick);
    }

    // Method to update the bar graphs based on what was clicked
    handleClick(event, data) {
        let vis = this
        let color = vis.colorBasedOnHumidity(data.humidity)
        vis.coinTossDecision(data.City, color)
        vis.coinTossWinner(data.City, color)
    }

    // update the bar graph for coin toss decision
    coinTossDecision(city, color) {
        let vis = this
        let cityName = city;
        let tossDecisions = vis.matchData
            .filter(match => match.City === cityName)
            .map(match => match.TossDecision);

        // Count the occurrences of each toss decision
        let countDecisions = tossDecisions.reduce((acc, decision) => {
            acc[decision] = (acc[decision] || 0) + 1;
            return acc;
        }, {});

        // Prepare data for the bar graph
        let barData = Object.keys(countDecisions).map(decision => ({
            decision,
            count: countDecisions[decision],
        }));

        // Update the bar chart
        indiaMapCoinTossDecision.wrangleData(barData, color, cityName);
    }

    // update the bar graph for winners based on coin toss
    coinTossWinner(city, color) {
        let vis = this;
        let cityName = city;

        // Filter match data for the clicked city
        let cityMatches = vis.matchData.filter((match) => match.City === cityName);

        // Count the occurrences of each toss decision and outcome
        let countDecisions = cityMatches.reduce((acc, match) => {
            let decision = match.TossDecision;
            let outcome = match.WinningTeam;
            let tossWinner = match.TossWinner;

            // Check if tossWinner is the same as the winning team
            if (tossWinner === outcome) {
                acc[decision] = acc[decision] || 0;
                acc[decision]++;
            }
            return acc;
        }, {});

        // Prepare data for the bar graph and sort by toss decision
        let barData = Object.keys(countDecisions)
            .map((decision) => ({
                decision,
                count: countDecisions[decision],
            }))
            .sort((a, b) => (a.decision > b.decision ? 1 : -1));

        // Update the bar chart
        indiaMapCoinTossWinner.wrangleData(barData, color, cityName);
    }

}