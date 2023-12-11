
class TreeVis{
    constructor(_parentElement, _data, _barMapVis) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.barMapVis = _barMapVis;


        this.initVis();
    }

    initVis(){
        let vis = this;


        vis.margin = { top: 20, right: 0, bottom: 30, left: 30};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right,
            vis.height = 700 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.svg.append("text")
            .attr("x",0)
            .attr("y", -8)
            .text("TreeMap of Winning Teams");


        vis.tooltip = d3.select("#treevis").append('div')
            .style("opacity", 0)
            .attr("class", "tooltip2")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")
            .style("position", "absolute")  // Make sure the position is absolute
            .style("z-index", "9999");

        vis.colorScale = d3.scaleLinear()
            .range(["rgba(55,255,179,0.2)", "#006400"]);


        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;

        let winning_data = {};
        vis.data.forEach(function (d) {
            let winner = d.WinningTeam;
            if (winning_data.hasOwnProperty(winner)) {
                winning_data[winner] += 1;
            } else {
                winning_data[winner] = 1;
            }
        });

        let treeData = {
            name: 'Team Wins',
            children: Object.entries(winning_data).map(([team, wins]) => ({
                name: team,
                wins: wins, // Use wins instead of value
            })),
        };


        treeData.children.sort(function (a, b) {
            return b.wins - a.wins;
        });

        treeData.children = treeData.children.filter(item => item.name !== ' ');

        vis.displayData = treeData;

        vis.updateVis();
    }

    updateVis() {
        let vis = this;
        vis.barMapVis.updateClickedTeam("Mumbai Indians")


        let treemap = d3.treemap()
            .size([vis.width, vis.height])
            .padding(1);

        let root = d3.hierarchy(vis.displayData)
            .sum(d => d.wins);

        // console.log(root.leaves())

// Generate the tree map nodes
        treemap(root);

        vis.colorScale.domain([0, d3.max(root.leaves(), d => d.data.wins)])

        vis.svg.selectAll("rect")
            .data(root.leaves())
            .enter().append('rect')
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .style('fill', d => vis.colorScale(d.data.wins))
            .style('stroke', 'white')
            .style('stroke-width', 1)
            .on('mouseover', function (event, d) {

                d3.select(this)
                    .attr('stroke', 'black')
                    .style('fill', function (d) {
                        if (d.data.name === "Mumbai Indians") {
                            return '#004B8D'
                        }
                        if (d.data.name === "Chennai Super Kings") {
                            return '#F9CD05'
                        }
                        if (d.data.name  === "Kolkata Knight Riders") {
                            return '#3A225D'
                        }
                        if (d.data.name  === "Royal Challengers Bangalore") {
                            return '#E63329'
                        }
                        if (d.data.name  === "Sunrisers Hyderabad") {
                            return '#F7A721'
                        }
                        if (d.data.name  === "Delhi Daredevils") {
                            return '#9A1C22'
                        }
                        if (d.data.name === "Rajasthan Royals") {
                            return '#004BA0'
                        }
                        if (d.data.name  === "Delhi Capitals") {
                            return '#00008B'
                        }
                        if(d.data.name  === "Kings XI Punjab") {
                            return '#ED1D24'
                        }
                        if (d.data.name  === "Deccan Chargers") {
                            return '#D9E3EF'
                        }
                        if (d.data.name  === "Rising Pune Supergiant") {
                            return '#D11D9B'
                        }
                        if (d.data.name  === "Kochi Tuskers Kerala") {
                            return '#E94017'
                        }
                        if (d.data.name  === "Gujarat Lions") {
                            return '#E04F16'
                        }
                        if (d.data.name  === "Gujarat Titans") {
                            return '#1B2133'
                        }
                        if (d.data.name  === "Lucknow Super Giants") {
                            return 'rgba(64,255,223,0.85)'
                        }
                        if (d.data.name  === "Punjab Kings") {
                            return '#DD1F2D'
                        }
                        if (d.data.name  === "Pune Warriors") {
                            return '#2F9BE3'
                        }
                    })

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
         <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
             <h4> Team Name: ${d.data.name}</h4>
             <h4> Team Wins: ${d.data.wins}</h4>     
                                     
         </div>`);
            })
            .on('mouseout', function (event, d) {
                d3.select(this)
                    .style('fill', d => vis.colorScale(d.data.wins))
                    .attr('stroke', 'white')

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })
            .on("click", function(event, d){
                vis.barMapVis.updateClickedTeam(d.data.name);
            });

        vis.svg.selectAll('text')
            .data(root)
            .enter().append('text')
            .attr('x', d => (d.x0 + d.x1) / 2)
            .attr('y', d => (d.y0 + d.y1) / 2)
            .text(d => {
                if(d.data.wins > 15){
                    return `${d.data.name}`
                }
            })
            .style('text-anchor', 'middle')
            .style('fill', 'black')
            .style('font-size', '10px');

    }
}
