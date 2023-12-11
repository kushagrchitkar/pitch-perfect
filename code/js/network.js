/* * * * * * * * * * * * * *
*      Network Graph       *
* * * * * * * * * * * * * */


class NetworkGraph{
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;


        this.initVis();
    }

    initVis(){
        let vis = this;


        vis.margin = { top: 10, right: 0, bottom: 30, left: 30 };

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right,
            vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;


        // #1: Individual umpires
        // Initialize an object for the number of matches the umpire officiated
        let umpireCounts = {};

        vis.data.forEach(d => {
            // Count for Umpire1
            if (d.Umpire1 in umpireCounts) {
                umpireCounts[d.Umpire1]++;
            } else {
                umpireCounts[d.Umpire1] = 1;
            }

            // Count for Umpire2
            if (d.Umpire2 in umpireCounts) {
                umpireCounts[d.Umpire2]++;
            } else {
                umpireCounts[d.Umpire2] = 1;
            }
        });

        // Convert the object to an array of objects and sort
        vis.umpireArray = Object.keys(umpireCounts).map(key => {
            return { name: key, count: umpireCounts[key] };
        }).sort((a, b) => b.count - a.count);


        // #2: Umpire pairs
        let umpirePairs = {};

        // Iterate over the dataset to count umpire pairs
        vis.data.forEach(d => {
            // Create a key for the pair, ensuring consistency in pair order
            let pairKey = [d.Umpire1, d.Umpire2].sort().join("-");

            // Count occurrences of each pair
            if (pairKey in umpirePairs) {
                umpirePairs[pairKey]++;
            } else {
                umpirePairs[pairKey] = 1;
            }
        });

        // Convert umpirePairs object to an array and sort it
        vis.umpirePairsArray = Object.entries(umpirePairs).map(([key, value]) => {
            let [umpire1, umpire2] = key.split("-");
            return { Umpire1: umpire1, Umpire2: umpire2, Matches: value };
        }).sort((a, b) => b.Matches - a.Matches);


        // Creating nodes array from umpireArray
        vis.nodes = vis.umpireArray.map(umpire => {
            return { id: umpire.name, count: umpire.count };
        });



        // Creating the links array from umpirePairsArray
        vis.links = vis.umpirePairsArray.map(pair => {
            // locate the index of Umpire1 in the nodes array
            let sourceIndex = vis.nodes.findIndex(node => node.id === pair.Umpire1);

            // locate the index of Umpire2 in the nodes array
            let targetIndex = vis.nodes.findIndex(node => node.id === pair.Umpire2);

            return {
                source: sourceIndex,
                target: targetIndex,
                value: pair.Matches
            };
        });

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Scale for node radius
        let radiusScale = d3.scaleSqrt()
            .domain(d3.extent(vis.nodes, node => node.count))
            .range([5, 70]);


        // Scale for link thickness
        let thicknessScale = d3.scaleLinear()
            .domain(d3.extent(vis.links, link => link.value))
            .range([1, 15]);


        // Links
        let transparencyScale = d3.scaleLinear()
            .domain(d3.extent(vis.links, link => link.value))
            .range([0.2, 1]); // Thinner lines are more transparent

        // thickest link
        let maxValue = d3.max(vis.links, d => d.value);

        // Set line thickness corresponding to the number of matches officiated together
        let lines = vis.svg.selectAll('line')
            .data(vis.links)
            .enter()
            .append('line')
            .attr('stroke-width', link => thicknessScale(link.value))
            .attr('stroke', d => d.value === maxValue ? '#6D9DF2' : '#A1E6F9')
            .attr('stroke-opacity', link => transparencyScale(link.value))
            .on("mouseover", (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(d.source.id + " & " + d.target.id + "<br/>" + d.value + " matches together")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", (event, d) => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });


        let linkDistanceScale = d3.scaleLinear()
            .domain(d3.extent(vis.links, d => d.value))
            .range([100, 20]);

        // largest node
        let maxCount = d3.max(vis.nodes, d => d.count);

        // Nodes
        let circles = vis.svg.selectAll('circle')
            .data(vis.nodes)
            .enter()
            .append('circle')
            .attr('r', node => radiusScale(node.count))
            .attr('fill', d => d.count === maxCount ? '#12E8A4' : 'lightgreen')
            .on("mouseover", (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                tooltip.html(d.id + "<br/>" + d.count + " matches")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", (event, d) => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });


        // Nodes - text
        let labels = vis.svg.selectAll('.node-label')
            .data(vis.nodes)
            .enter()
            .append('text')
            .attr("class", "node-label")
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .style("font-size", "12px");


        // tooltip
        let tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #000")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("pointer-events", "none")
            .style("z-index", "10");

        const centerX = vis.width / 2;
        const centerY = vis.height / 2;


        // Network structure: center gravity, width, height
        let simulation = d3.forceSimulation(vis.nodes)
            .force('charge', d3.forceManyBody().strength(-500))
            .force('link', d3.forceLink(vis.links).distance(d => linkDistanceScale(d.value)).strength(0.53)) // link force strength
            .force('center', d3.forceCenter(centerX-97, centerY-110)) // x and y coordinates of the center gravity
            .force('forceX', d3.forceX(centerX).strength(0.005)) // lesser strength allows the nodes to be horizontally spread out
            .force('forceY', d3.forceY(centerY).strength(0.7))
            .force('collision', d3.forceCollide().radius(d => radiusScale(d.count) + 20))

        // Set nodes and links corresponding to matches officiated
        simulation.on('tick', () => {

            lines
                .attr('x1', link => link.source.x)
                .attr('y1', link => link.source.y)
                .attr('x2', link => link.target.x)
                .attr('y2', link => link.target.y);

            circles
                .attr('cx', node => node.x)
                .attr('cy', node => node.y);


            labels.attr('x', d => d.x)
                .attr('y', d => d.y)
                .text(d => {
                    if (radiusScale(d.count) > 25) {
                        return d.id;
                    }
                    return '';
                });

        });

        // Define drag behavior
        let drag = d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded);


        function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.05).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
        }


        document.getElementById('reset-button').addEventListener('click', function() {
            // Reset fixed positions of all nodes
            vis.nodes.forEach(function(d) {
                d.fx = null;
                d.fy = null;
            });

            // Reset the simulation
            simulation.alpha(0.05).restart();
        });



        // Apply drag behavior
        circles.call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));



        // Legend

        let legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(" + (vis.width - vis.margin.right - 155) + "," + (vis.margin.top+70) + ")");

        let circleSizes = [7, 40, 70];
        let circleLabels = ['1 match', '60 matches', '131 matches'];
        let baselineY = circleSizes[circleSizes.length - 1];

        circleSizes.forEach(function (size, i) {
            legend.append("circle")
                .attr("r", size)
                .attr("cx", 0)
                .attr("cy", baselineY - size)
                .attr('stroke', 'black')
                .attr('fill', 'none')
                .attr('stroke-width', 2);

            legend.append("text")
                .attr("x", 0)
                .attr("y", baselineY - size * 2 - 10)
                .text(circleLabels[i])
                .attr("text-anchor", "middle")
                .style("font-size", "12px");
        });

        let lineThicknesses = [2, 7, 15];
        let lineLabels = ['1 match together', '7 matches together', '13 matches together'];
        let startY = baselineY * 2 + 20;

        lineThicknesses.forEach(function (thickness, i) {
            legend.append("line")
                .attr("x1", -81)
                .attr("x2", -11)
                .attr("y1", startY + (i * 15 - 70))
                .attr("y2", startY + (i * 15 - 70))
                .attr("stroke-width", thickness)
                .attr('stroke', thickness === 15 ? '#6D9DF2' : '#A1E6F9');

            legend.append("text")
                .attr("x", -5)
                .attr("y", startY + (i * 15 - 70))
                .text(lineLabels[i])
                .style("alignment-baseline", "middle")
                .style("font-size", "12px");
        });


    }
}
