class SlopegraphVis {
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;


        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 30, right: 200, bottom: 200, left: 140};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right,
            vis.height = 700 - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.svg.append("text")
            .attr("x", -50)
            .attr("y", -15)
            .text("Slope Graph representing team positions over time")

        vis.tooltip = d3.select("#slopegraph").append('div')
            .style("opacity", 0)
            .attr("class", "tooltip3")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")
            .style("position", "absolute")  // Make sure the position is absolute
            .style("z-index", "9999");


        vis.x = d3.scaleLinear().range([0, vis.width]);
        vis.y = d3.scaleLinear().range([vis.height, 0]);

        // Set up line generator
        vis.line = d3.line()
            .x(d => vis.x(d.Year))
            .y(d => vis.y(d.Rank));

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;



        vis.data.forEach(d => {
            d.Year = +d.Year;
            d.Rank = +d.Rank;
        });


        // console.log(vis.data)

        vis.teams = [...new Set(vis.data.map(d => d.Team))];
        // console.log(vis.teams)

        vis.lastSeason = d3.max(vis.data, d => d.Year);
        vis.lastSeasonData = vis.data.filter(d => d.Year === vis.lastSeason);
        vis.lastteams = [...new Set(vis.lastSeasonData.map(d => d.Team))];
        // console.log(vis.lastSeasonData)
        // console.log(vis.lastSeason)
        // console.log(vis.lastteams)


        vis.updateVis();
    }

    updateVis(){
        let vis = this;



        vis.teams.forEach(team => {
            let teamData = vis.data.filter(d => d.Team === team);

            // console.log(teamData)

            // Update domain for scales


            vis.y.domain([d3.max(vis.data, d => d.Rank)+1, 1]);
            vis.x.domain(d3.extent(vis.data, d => d.Year));



            // Append the path element
            vis.svg.append("path")
                .data([teamData])
                .attr("class", "line")
                .style('stroke', function (d) {
                    // console.log(team)
                    if (team === "Mumbai Indians") {
                        return '#004B8D'
                    }
                    if (team === "Chennai Super Kings") {
                        return '#F9CD05'
                    }
                    else
                        return 'lightgrey'})
                .style("stroke-width", 0) // Set initial stroke width to 0
                .attr("d", vis.line)
                .style("stroke-width", function (d) {
                    // console.log(team)
                    if (team === "Mumbai Indians") {
                        return 10
                    }
                    if (team === "Chennai Super Kings") {
                        return 10
                    }
                    else
                        return 5})
                .on("mouseover", function (event, d) {

                    d3.select(this)
                        .style('stroke', function (d) {
                            if (team === "Mumbai Indians") {
                                return '#004B8D'
                            }
                            if (team === "Chennai Super Kings") {
                                return '#F9CD05'
                            }
                            if (team === "Kolkata Knight Riders") {
                                return '#3A225D'
                            }
                            if (team === "Royal Challengers Bangalore") {
                                return '#E63329'
                            }
                            if (team === "Sunrisers Hyderabad") {
                                return '#F7A721'
                            }
                            if (team === "Delhi Daredevils") {
                                return '#9A1C22'
                            }
                            if (team === "Rajasthan Royals") {
                                return '#004BA0'
                            }
                            if (team === "Delhi Capitals") {
                                return '#00008B'
                            }
                            if (team === "Kings XI Punjab") {
                                return '#ED1D24'
                            }
                            if (team === "Deccan Chargers") {
                                return '#D9E3EF'
                            }
                            if (team === "Rising Pune Supergiant") {
                                return '#D11D9B'
                            }
                            if (team === "Kochi Tuskers Kerala") {
                                return '#E94017'
                            }
                            if (team === "Gujarat Lions") {
                                return '#E04F16'
                            }
                            if (team === "Gujarat Titans") {
                                return '#1B2133'
                            }
                            if (team === "Lucknow Supergiants") {
                                return 'rgba(64,255,223,0.53)'
                            }
                            if (team === "Punjab Kings") {
                                return '#DD1F2D'
                            }
                            if (team === "Pune Warriors India") {
                                return '#2F9BE3'
                            }
                        })
                        .style("stroke-width", 10);

                    vis.tooltip
                        .style("opacity", 1)
                        .style("left", event.pageX + 20 + "px")
                        .style("top", event.pageY + "px")
                        .html(`
         <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
             <h4> Team Name: ${d[0].Team}</h4>
            
         </div>`);

                })

                .on("mouseout", function (event, d) {
                    // Revert to original color on mouseout
                    d3.select(this)
                        .style('stroke', function (d) {
                            // console.log(team)
                            if (team === "Mumbai Indians") {
                                return '#004B8D'
                            }
                            if (team === "Chennai Super Kings") {
                                return '#F9CD05'
                            }
                            else
                                return 'lightgrey'})
                        .style("stroke-width", 5)

                    vis.tooltip
                        .style("opacity", 0)
                        .style("left", 0)
                        .style("top", 0)
                        .html(``);
                })


        });



        vis.lastteams.forEach(team => {
            // Filter data for the specific team
            let teamData = vis.lastSeasonData.filter(d => d.Team === team);

            vis.svg.append("text")
                .attr("class", "team-label")
                .attr("x", vis.width + 10) // Adjust the position as needed
                .attr("y", vis.y(teamData[0].Rank)) // Use the last rank for y-position
                .text(team)
                .style("font-size", "12px")
                .style("alignment-baseline", "middle");
        })







        vis.svg.append("g")
            .attr("transform", `translate(0,${vis.height})`)
            .call(d3.axisBottom(vis.x).tickFormat(d3.format("d")));

        vis.svg.append("g")
            .call(d3.axisLeft(vis.y));


    }


}