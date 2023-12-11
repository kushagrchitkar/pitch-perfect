class lineGraph {
    constructor(parentElement, ballData, matchData){
        this.parentElement = parentElement;
        this.ballData = ballData;
        this.matchData = matchData;
        this.speed = 300
        this.initVis();
    }

    initVis() {
        // store keyword this which refers to the object it belongs to in variable vis
        let vis = this;

        vis.margin = {top: 50, right: 40, bottom: 70, left: 100};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height  - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Set up scales
        vis.xScale = d3.scaleLinear().range([0, vis.width]);
        vis.yScale = d3.scaleLinear().range([vis.height, 0]);

        // init x & y axis
        vis.xAxis = vis.svg.append("g")
            .attr("class", "axis axis-x")
            .attr("transform", "translate(0," + vis.height + ")");
        vis.yAxis = vis.svg.append("g")
            .attr("class", "axis axis-y");

        // x-axis label
        let xAxisOffsetY = 5
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("transform", `translate(${vis.width / 2}, ${vis.height + vis.margin.top + xAxisOffsetY})`)
            .style("text-anchor", "middle")
            .style("font-family", "'Bebas Neue', sans-serif")
            .text("Years");

        // y-axis label
        vis.yLabels = {
            sumBatsmanRuns: "Sum of Batsman Runs",
            numPlayerOuts: "Number of Player Outs",
            average: "Average",
            strikeRate: "Strike Rate"
        }
        let yAxisOffsetY = 60
        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - yAxisOffsetY)
            .attr("x", 0 - (vis.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-family", "'Bebas Neue', sans-serif")
            .text(vis.yLabels[selectedCategory]);

        // add title
        vis.title = vis.svg.append('g')
            .attr('class', 'title')
            .append('text')
            .text("How Does " + selectedBatsman.toString() + " Perform over the Years?")
            .attr('transform', `translate(${vis.width / 2}, -15)`)
            .attr('text-anchor', 'middle')
            .style("font-size", "18px");


        vis.wrangleData(startColor);
    }

    wrangleData(color) {
        let vis = this;
        vis.displayData = [];


        // Combine Data
        let combinedData = vis.ballData.map(ball => {
            const match = vis.matchData.find(match => match.ID === ball.ID);
            return { ...ball, ...match };
        });

        //console.log("combinedData: ", combinedData)
        // Filter Data for a Specific batsman
        let filteredData = combinedData.filter(d => d.batter === selectedBatsman);

        // Aggregate Data
        let aggregatedData = d3.rollup(
            filteredData,
            group => ({
                sumBatsmanRuns: d3.sum(group, d => d.batsman_run),
                numPlayerOuts: d3.sum(group, d => d.isWicketDelivery),
                average:  d3.sum(group, d => d.batsman_run)/d3.sum(group, d => d.isWicketDelivery),
                strikeRate: (d3.sum(group, d => d.batsman_run)/group.length) * 100
            }),
            d => d.Date.getFullYear()
        );

        // console.log("aggregatedData: ", aggregatedData)

        // Convert Map to Array
        let lineChartData = Array.from(aggregatedData, ([year, values]) => ({
            year: d3.timeParse("%Y")(year),
            numPlayerOuts: values.numPlayerOuts || 0,
            sumBatsmanRuns: values.sumBatsmanRuns || 0,
            average: values.average,
            strikeRate: values.strikeRate
        }));
        // console.log("lineChartData: ", lineChartData)

        vis.lineChartData = lineChartData;
        vis.updateVis(color);

    }

    updateVis(color) {
        let vis = this;

        // update the scales
        vis.xScale.domain(d3.extent(vis.lineChartData, d => d.year));
        vis.yScale.domain([0, d3.max(vis.lineChartData, d => d[selectedCategory])]);

        // Update the axes
        vis.xAxis
            .transition()
            .duration(vis.speed)
            .call(
                d3.axisBottom(vis.xScale)
                    .tickFormat(d3.timeFormat("%Y")) // Format ticks as four-digit year
            )
        vis.yAxis
            .transition()
            .duration(vis.speed)
            .call(d3.axisLeft(vis.yScale));

        // update y-axis label
        vis.svg.select('.y-axis-label')
            .text(vis.yLabels[selectedCategory]);

        // Check if there's only one data point
        if (vis.lineChartData.length === 1) {
            // Draw a circle for the single data point
            vis.svg.selectAll(".dot")
                .data(vis.lineChartData)
                .enter()
                .append("circle")
                .attr("class", "dot")
                .attr("cx", d => vis.xScale(d.year))
                .attr("cy", d => vis.yScale(d[selectedCategory]))
                .attr("r", 5) // Adjust the radius as needed
                .attr("fill", "#6F989D")
                .merge(vis.lineChart)
                .transition()
                .duration(vis.speed)
                .attr("cx", d => vis.xScale(d.year))
                .attr("cy", d => vis.yScale(d[selectedCategory]))
                .attr("r", 5) // Adjust the radius as needed
                .attr("fill", "#6F989D");
            vis.svg.selectAll(".line").remove();
        } else {
            // Create line function
            vis.line = d3.line()
                .curve(d3.curveMonotoneX)
                .x(d => vis.xScale(d.year))
                .y(d => vis.yScale(d[selectedCategory]));

            vis.lineChart = vis.svg.selectAll(".line")
                .data([vis.lineChartData]);

            // update the line graph
            vis.lineChart
                .enter()
                .append("path")
                .attr("class", "line")
                .attr("stroke", "#6F989D")
                .attr("stroke-width", 5)
                .merge(vis.lineChart)
                .transition()
                .duration(vis.speed)
                .attr("fill", "#6F989D")
                .attr("stroke", "#6F989D")
                .attr("stroke-width", 5)
                .attr("d", vis.line)
            vis.svg.selectAll(".dot").remove();
        }

        // update the title
        vis.title.text("How Does " + selectedBatsman.toString() + " Perform over the Years?")
    }
}