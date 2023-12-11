/* * * * * * * * * * * * * *
*      class BarVis        *
* * * * * * * * * * * * * */
let selectedBar = null;
class BarVis {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = []

        this.speed = 1000
        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 50, right: 30, bottom: 70, left: 90};
        // console.log("parent width: ", document.getElementById(vis.parentElement).getBoundingClientRect().width)
        // console.log("parent height: ", document.getElementById(vis.parentElement).getBoundingClientRect().height)
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // console.log(vis.width, vis.height)
        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // clip path
        vis.svg.append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);

        // create barchart vis element
        vis.barchart = vis.svg.append("g")
            .attr("class", "bar-chart")

        // create a color scale
        let hexColors = [
            '#f7909f', '#e2647f', '#d1698c',
            '#e8555f', '#da332a', '#fe672a',
            '#ff7a34', '#ffb22c', '#83ba69',
            '#4ca64e', '#2a897e', '#287f91',
            '#62b0dc', '#6492cb', '#4975c4',
            '#3b4f93', '#32436f', '#5f5395',
            '#6f4483', '#5a3340'
        ]
        // Define the start and end colors in HSL format
        // Number of colors
        // let numColors = 20;
        //
        // // Create a linear scale for interpolating colors
        // let colorScale = d3.scaleLinear()
        //     .domain([0, numColors - 1])
        //     .range(["#B9D1EA", "#061E37"])
        //     .interpolate(d3.interpolateRgb);
        //
        // // Generate a list of 20 hex colors
        // let hexColors = d3.range(numColors).map(d => colorScale(d));

        vis.colorScale = d3.scaleOrdinal()
            .range(hexColors);

        // add title
        let title = "Who is the Most Successful Batsman?"
        vis.barchart.append('g')
            .attr('class', 'title')
            .append('text')
            .text(title)
            .attr('transform', `translate(${vis.width / 2}, -15)`)
            .attr('text-anchor', 'middle')
            .style("font-size", "18px");

        // init scales
        vis.x = d3.scaleBand().range([0, vis.width]).padding(0.1);
        vis.y = d3.scaleLinear().range([vis.height, 0]);

        // init x & y axis
        vis.xAxis = vis.svg.append("g")
            .attr("class", "axis axis-x")
            .attr("transform", "translate(0," + vis.height + ")");
        vis.yAxis = vis.svg.append("g")
            .attr("class", "axis axis-y");

        // x-axis label
        let xAxisOffsetY = 15
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("transform", `translate(${vis.width / 2}, ${vis.height + vis.margin.top + xAxisOffsetY})`)
            .style("text-anchor", "middle")
            .text("Batsman Names");

        // y-axis label
        vis.yLabels = {
            sumBatsmanRuns: "Sum of Batsman Runs",
            numPlayerOuts: "Number of Player Outs",
            average: "Average",
            strikeRate: "Strike Rate"
        }
        let yAxisOffsetY = 70
        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - yAxisOffsetY)
            .attr("x", 0 - (vis.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(vis.yLabels[selectedCategory]);

        // create a tooltip
        vis.tooltip = d3.select("#barDiv").append('div')
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")
            .style("position", "absolute")  // Make sure the position is absolute
            .style("z-index", "9999");  // Set a high z-index

        // vis.organizeDataInitial();
        vis.wrangleData();
    }
    organizeDataInitial() {
        let vis = this
        vis.displayData = [];

        // prepare batsman data by grouping all rows by batsman name
        let dataByBatsman = Array.from(d3.group(this.data, d => d.batter), ([key, value]) => ({key, value}))

        // merge
        dataByBatsman.forEach(batter => {

            // get full batsman name
            let batterName = batter.key

            // init counters
            let sumBatsmanRuns = 0;
            let totalOccurrences = 0;
            let numPlayerOuts = 0;

            // Sum up the number of times the batsman occurred in the dataset
            vis.data.forEach(row => {
                if (row.batter === batterName) {
                    totalOccurrences += 1
                }
            })

            // calculate new cases by summing up all the entries for each batsman
            batter.value.forEach(entry => {
                sumBatsmanRuns += entry.batsman_run
                if (entry.player_out === batterName) {numPlayerOuts += 1;}
                else {numPlayerOuts += 0;}
            });

            if (numPlayerOuts === 0) {numPlayerOuts = 1;}
            if (isNaN(numPlayerOuts)) {numPlayerOuts = 1;}
            // populate the final data structure
            if (sumBatsmanRuns >= 400){
                vis.displayData.push(
                    {
                        name: batterName,
                        sumBatsmanRuns: sumBatsmanRuns,
                        numPlayerOuts: numPlayerOuts,
                        average: sumBatsmanRuns / numPlayerOuts,
                        strikeRate: sumBatsmanRuns / totalOccurrences,
                    }
                )
            }
        })

        // console.log("final data: ", vis.displayData)

        // Save data to json
        const jsonData = JSON.stringify(vis.displayData, null, 2); // Convert the object to a nicely formatted JSON string
        //console.log(jsonData) // I just copied and pasted this from the console to the file
    }

    wrangleData() {
        let vis = this;

        let selectedExists = vis.data.some(d => d.name === selectedBatsman);

        // If selectedBatsman does not exist in the new data set, reset it
        if (!selectedExists) {
            selectedBatsman = null;
        }
        // console.log(vis.data)
        vis.displayData = [...vis.data]

        // Filter out rows based on the selected category
        if (selectedCategory === "average") {
            // Example: Remove rows where average is 0
            vis.displayData = vis.displayData.filter(d => d[selectedCategory] !== 0);
        }

        // sort descending
        vis.displayData.sort((a, b) => { return b[selectedCategory] - a[selectedCategory] });

        // Set up data to visualize
        // let topNum = 10
        vis.displayData = vis.displayData.slice(0, topNum);
        // console.log("vis.displayData: ", vis.displayData)
        vis.updateVis();
    }

    clearBars() {
        let vis = this
        // Remove all bars
        vis.barchart.selectAll(".bars")
            .data([])  // Use an empty array to remove all bars
            .exit()
            .remove();
    }
    updateVis() {
        let vis = this

        // initialize scales
        let yMaxDomain = d3.max(vis.displayData, d => d[selectedCategory])
        vis.x.domain(vis.displayData.map(d => d.name));
        vis.y.domain([0, yMaxDomain]);
        vis.colorScale.domain(vis.displayData.map(d => d.name))

        // draw the axes
        vis.xAxis
            .transition()
            .duration(500)
            .call(d3.axisBottom(vis.x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "1.5em")
            .attr("dy", "1.15em")
            .attr("transform", "rotate(-25)")
            .style("font-size", "10");
        vis.yAxis
            .transition()
            .duration(500)
            .call(d3.axisLeft(vis.y));

        // update y-axis label
        vis.svg.select('.y-axis-label')
            .text(vis.yLabels[selectedCategory]);

        // functions for mouseover, mousemove, and mouseleave
        let originalFillColor;
        vis.mouseover = function() {
            originalFillColor = d3.select(this).attr("fill");
            vis.tooltip
                .style("opacity", 1)
            d3.select(this)
                .style("stroke", "black")
                .style("opacity", 1)
        }
        vis.mousemove = function(event, d) {
            let sumBatsmanRuns = 0
            let numPlayerOuts = 0
            let average = 0
            let strikeRate = 0
            vis.displayData.forEach(batsman => {
                if (d.name === batsman.name) {
                    sumBatsmanRuns = batsman.sumBatsmanRuns
                    numPlayerOuts = batsman.numPlayerOuts
                    average = batsman.average
                    strikeRate = batsman.strikeRate
                }
            })
            d3.select(this)
                .attr("fill", "gray")
                .style("stroke", "black")
                .style("stroke-opacity", "1")
            vis.tooltip
                .style("opacity", 1)
                .style("left", event.pageX + 20 + "px")
                .style("top", event.pageY + "px")
                .html(`
                     <div>
                         <p>${d.name}<p>
                         <p>Batsman Runs: ${sumBatsmanRuns}<p>
                         <p>Player Outs: ${numPlayerOuts}<p>
                         <p>Average: ${average.toFixed(2)}<p>
                         <p>Strike Rate: ${strikeRate}<p>
                     </div>`);
        }
        vis.mouseleave = function() {
            d3.select(this)
                .attr("fill", originalFillColor)
                .style("stroke-opacity", "0")
                .style("stroke", "none")
                .style("opacity", 1)
            vis.tooltip
                .style("opacity", 0)
                .style("left", 0 + "px")
                .style("top", 0 + "px")
                .html(``);
        }

        // Update the bars data binding
        vis.bars = vis.barchart.selectAll(".bars")
            .data(vis.displayData, d => d.name + selectedCategory);

        // Remove bars that are no longer needed
        vis.bars.exit()
            .remove();

        // Update the existing bars
        vis.bars
            .transition()
            .duration(vis.speed)
            .ease(d3.easeCubicInOut)
            .attr("x", d => vis.x(d.name))
            .attr("y", d => vis.y(d[selectedCategory]))
            .attr("width", vis.x.bandwidth())
            .attr("height", d => vis.height - vis.y(d[selectedCategory]))
            .attr("fill", "#A8D4AD");

        // Add new bars
        vis.bars.enter()
            .append("rect")
            .attr("class", "bars")
            .attr("x", d => vis.x(d.name))
            .attr("y", vis.height)  // Initial position for entering bars
            .attr("width", vis.x.bandwidth())
            .attr("height", 0)  // Initial height for entering bars
            .attr("fill", function(d) {
                if (d.name === selectedBatsman) {
                    selectedBar = d3.select(this);
                    return "#6F989D";
                }
                else { return "#A8D4AD";}
            })
            .on("click", function (event, d) {
                if (selectedBar) {
                    selectedBar.attr("fill", "#A8D4AD");
                }

                // Update selectedBatsman
                selectedBatsman = d.name;

                // Change color of the clicked bar
                d3.select(this).attr("fill", "#6F989D");
                selectedBar = d3.select(this);
                originalFillColor = "#6F989D";

                // Update the line graph
                batsmanLineGraph.wrangleData(originalFillColor);

            })
            .on("mouseover", vis.mouseover)
            .on("mousemove", vis.mousemove)
            .on("mouseleave", vis.mouseleave)
            .merge(vis.bars)  // Merge the new bars with the existing ones
            .transition()  // Apply a transition to the merged selection
            .duration(vis.speed)
            .ease(d3.easeCubicInOut)
            .attr("x", d => vis.x(d.name))
            .attr("y", d => vis.y(d[selectedCategory]))
            .attr("width", vis.x.bandwidth())
            .attr("height", d => vis.height - vis.y(d[selectedCategory]))


        //  Draw labels
        vis.labels = vis.barchart.selectAll(".bar-label")
            .data(vis.displayData, d => d.name);

        // Remove labels that are not needed
        vis.labels.exit().remove();

        // Add and update labels
        vis.labels = vis.labels.enter()
            .append("text")
            .attr("class", "bar-label")
            .merge(vis.labels)
            .transition()
            .duration(vis.speed) // Set the duration of the transition
            .attr("x", d => vis.x(d.name) + vis.x.bandwidth() / 2)
            .attr("y", d => vis.y(d[selectedCategory]) - 5)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .text(d => {
                let number = d[selectedCategory];
                if (number % 1 === 0) {
                    return number;
                } else {
                    return number.toFixed(2);
                }
            })
            .style("font-size", "9px")
            .style("fill", "black");

    }
}
