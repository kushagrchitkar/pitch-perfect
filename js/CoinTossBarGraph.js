/* * * * * * * * * * * * * * * * * * *
*      class CoinTossBarGraph        *
* * * * * * * * * * * * * * * * * * */

class CoinTossBarGraph {
    constructor(parentElement, data, isDecision) {
        this.parentElement = parentElement
        this.data = data
        this.isDecision = isDecision
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 50, right: 20, bottom: 40, left: 60};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

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

        // add title
        let title = ""
        if (vis.isDecision) {title = "Coin Toss Decision"}
        else {title = "Winner based on Coin Toss Decision"}
        vis.barchart.append('g')
            .attr('class', 'title')
            .append('text')
            .text(title)
            .style("font-size", "15px")
            .attr('transform', `translate(${vis.width / 2}, 0)`)
            .attr('text-anchor', 'middle');

        // init scales
        vis.x = d3.scaleBand().range([0, vis.width]).padding(0.1);
        vis.y = d3.scaleLinear().range([vis.height, 0]);

        // init x & y axis groups
        vis.xAxis = vis.svg.append("g")
            .attr("class", "axis axis-x")
            .attr("transform", "translate(0," + vis.height + ")");
        vis.yAxis = vis.svg.append("g")
            .attr("class", "axis axis-y");

        // x-axis label
        let xAxisLabel = ""
        if (vis.isDecision) {xAxisLabel = "Coin Toss Decision"}
        else {xAxisLabel = "Winner based on Coin Toss Decision"}
        let xAxisOffsetY = -15
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("transform", `translate(${vis.width / 2}, ${vis.height + vis.margin.top + xAxisOffsetY})`)
            .style("text-anchor", "middle")
            .style("font-size", "15px")
            .style("font-family", "'Bebas Neue', sans-serif")
            .text(xAxisLabel);

        // y-axis label
        let yAxisOffsetY = 48
        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .text("Occurrences")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - yAxisOffsetY)
            .attr("x", 0 - (vis.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-family", "'Bebas Neue', sans-serif");

        // Create a group for labels
        vis.labelsGroup = vis.barchart.append("g")
            .attr("class", "labels-group");
    }

    wrangleData(barData, color, cityName) {
        let vis = this
        vis.displayData = barData

        // Sort the data alphabetically by the decision
        vis.displayData.sort((a, b) => d3.ascending(a.decision, b.decision));

        vis.updateVis(color, cityName);
    }

    updateVis(color, cityName) {
        let vis = this
        // Initialize scales
        let barLabelOffset = 5
        let yMaxDomain = d3.max(vis.displayData, d => d.count);
        vis.x.domain(vis.displayData.map(d => d.decision));
        vis.y.domain([0, yMaxDomain + barLabelOffset]);

        // Update the title text
        let title = ""
        if (vis.isDecision) {title = "Coin Toss Decision for " + cityName;}
        else {title = "Winner based on Coin Toss Decision for " + cityName}
        this.svg.select('.title text')
            .text(title);

        // Update Bars
        let bars = vis.barchart.selectAll(".bar")
            .data(vis.displayData);

        // Exit
        bars.exit()
            .transition()
            .duration(500) // Set the duration of the transition in milliseconds
            .attr("height", 0) // Shrink the height to 0
            .remove(); // Remove the exiting bars

        // Update
        bars
            .transition()
            .duration(500)
            .attr("x", d => vis.x(d.decision))
            .attr("width", vis.x.bandwidth())
            .attr("y", d => vis.y(d.count))
            .attr("height", d => vis.height - vis.y(d.count))
            .attr("fill", color);

        // Enter
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => vis.x(d.decision))
            .attr("width", vis.x.bandwidth())
            .attr("y", vis.height) // Start from the bottom
            .attr("height", 0) // Initially, set height to 0
            .attr("fill", color)
            .transition()
            .duration(500)
            .attr("y", d => vis.y(d.count))
            .attr("height", d => vis.height - vis.y(d.count));

        // Create labels for each bar in the bar chart
        let labels = vis.labelsGroup.selectAll(".label")
            .data(vis.displayData);

        // Exit
        labels.exit().remove();

        // Update
        let labelYOffset = 5
        labels.transition()
            .duration(500)
            .attr("x", d => vis.x(d.decision) + vis.x.bandwidth() / 2)
            .attr("y", d => vis.y(d.count) - labelYOffset)
            .text(d => d.count);

        // Enter
        labels.enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => vis.x(d.decision) + vis.x.bandwidth() / 2)
            .attr("y", vis.height)
            .attr("text-anchor", "middle")
            .style("font-size", "13px")
            .text(d => d.count)
            .transition()
            .duration(500)
            .attr("y", d => vis.y(d.count) - 5);

        // Update x-axis
        vis.xAxis.transition().duration(500).call(d3.axisBottom(vis.x));

        // Update y-axis
        vis.yAxis.transition().duration(500).call(d3.axisLeft(vis.y).ticks(5));
    }
}