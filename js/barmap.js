class BarMapVis {
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;


        this.initVis();
    }

    initVis() {
        let vis = this;


        vis.margin = {top: 30, right: 20, bottom: 200, left: 140};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right,
            vis.height = 700 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.introLabel = vis.svg
            .append("text")
            .attr("x", -50)
            .attr("y", -8)
            .text("BarGraph of Team Records (Click on treemap to select team)");


        vis.y = d3.scaleBand()
            .range([vis.height, 0])
            .paddingInner(0.1);


        vis.x = d3.scaleLinear()
            .range([0, vis.width]);

        vis.xAxis = vis.svg.append("g")
            .attr("class", "axis axis-x")
            .attr("transform", "translate(0," + vis.height + ")");
        vis.yAxis = vis.svg.append("g")
            .attr("class", "axis axis-y");



        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    wrangleData(selectedTeam){
        let vis = this;

        //console.log(selectedTeam)

        //ideally select team name from selection here
        vis.teamName = selectedTeam;

// Create an object to store team records
        let teamRecords = {
            team_name: vis.teamName,
            records: []
        };

        vis.data.forEach(match => {
            const team1 = match.Team1;
            const team2 = match.Team2;
            const winningTeam = match.WinningTeam;

            if (team1 !== vis.teamName && team2 !== vis.teamName) {
                return;
            }

            let opponent, result;
            if (team1 === vis.teamName) {
                opponent = team2;
            } else if (team2 === vis.teamName) {
                opponent = team1;
            }

            if (winningTeam === vis.teamName) {
                result = "win";
            } else {
                result = "loss";
            }

            const existingRecord = teamRecords.records.find(record => record.team === opponent);

            if (existingRecord) {
                if (result === "win") {
                    existingRecord.wins++;
                } else {
                    existingRecord.losses++;
                }
            } else {
                teamRecords.records.push({
                    team: opponent,
                    wins: result === "win" ? 1 : 0,
                    losses: result === "loss" ? 1 : 0
                });
            }
        });

        teamRecords.records.sort(function (a, b) {
            return b.wins - a.wins;
        });



        vis.displayData = teamRecords;



        vis.updateVis();
    }

    updateVis(){
        let vis = this;

        vis.y.domain(vis.displayData.records.map(d => d.team))

        vis.x.domain([0, d3.max(vis.displayData.records, d => d.wins) + 1])


        vis.xAxis.transition().duration(500).call(d3.axisBottom(vis.x));
        vis.yAxis.transition().duration(500).call(d3.axisLeft(vis.y));

        vis.bars = vis.svg.selectAll(".bar")
            .data(vis.displayData.records);

        vis.textLabels = vis.svg.selectAll(".text-label")
            .data(vis.displayData.records);

        vis.bars.enter()
            .append("rect")
            .merge(vis.bars)
            .transition().duration(500)
            .attr("class", "bar")
            .attr("y", d => vis.y(d.team))
            .attr("x", 0)
            .attr("width", d => vis.x(d.wins))
            .attr("height", vis.y.bandwidth())
            .attr('fill', function (d) {
                if (vis.teamName === "Mumbai Indians") {
                    return '#004B8D'
                }
                if (vis.teamName === "Chennai Super Kings") {
                    return '#F9CD05'
                }
                if (vis.teamName === "Kolkata Knight Riders") {
                    return '#3A225D'
                }
                if (vis.teamName === "Royal Challengers Bangalore") {
                    return '#E63329'
                }
                if (vis.teamName === "Sunrisers Hyderabad") {
                    return '#F7A721'
                }
                if (vis.teamName === "Delhi Daredevils") {
                    return '#9A1C22'
                }
                if (vis.teamName === "Rajasthan Royals") {
                    return '#004BA0'
                }
                if (vis.teamName === "Delhi Capitals") {
                    return '#00008B'
                }
                if (vis.teamName === "Kings XI Punjab") {
                    return '#ED1D24'
                }
                if (vis.teamName === "Deccan Chargers") {
                    return '#D9E3EF'
                }
                if (vis.teamName === "Rising Pune Supergiant") {
                    return '#D11D9B'
                }
                if (vis.teamName === "Kochi Tuskers Kerala") {
                    return '#E94017'
                }
                if (vis.teamName === "Gujarat Lions") {
                    return '#E04F16'
                }
                if (vis.teamName === "Gujarat Titans") {
                    return '#1B2133'
                }
                if (vis.teamName === "Lucknow Super Giants") {
                    return 'rgba(64,255,223,0.85)'
                }
                if (vis.teamName === "Punjab Kings") {
                    return '#DD1F2D'
                }
                if (vis.teamName === "Pune Warriors") {
                    return '#2F9BE3'
                }
            });

        vis.textLabels.enter()
            .append("text")
            .attr("class", "text-label")
            .merge(vis.textLabels)
            .transition().duration(500)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "black")
            .text(d => {
                return `${d.wins} Wins`})
            .attr("x", d => vis.x(d.wins) + 16)
            .attr("y", d => vis.y(d.team) +16);

        vis.bars.exit().transition().duration(500).remove();
        vis.textLabels.exit().transition().duration(500).remove();
        vis.svg.selectAll(".axis").exit().remove();


    }

    updateClickedTeam(teamName) {
        this.wrangleData(teamName);
        this.updateVis();

        const coloredTeamName = `<tspan fill="${this.getTeamColor(teamName)}">${teamName}</tspan>`;
        this.introLabel.html(`How ${coloredTeamName} have performed against other teams`);
    }

    getTeamColor(teamName) {
        // Define your team colors here
        const teamColors = {
            "Mumbai Indians": "#004B8D",
            "Chennai Super Kings": "#F9CD05",
            "Kolkata Knight Riders": "#3A225D",
            "Royal Challengers Bangalore": "#E63329",
            "Sunrisers Hyderabad": "#F7A721",
            "Delhi Daredevils": "#9A1C22",
            "Rajasthan Royals": "#004BA0",
            "Delhi Capitals": "#00008B",
            "Kings XI Punjab": "#ED1D24",
            "Deccan Chargers": "#D9E3EF",
            "Rising Pune Supergiant": "#D11D9B",
            "Kochi Tuskers Kerala": "#E94017",
            "Gujarat Lions": "#E04F16",
            "Gujarat Titans": "#1B2133",
            "Lucknow Super Giants": "rgba(64,255,223,0.85)",
            "Punjab Kings": "#DD1F2D",
            "Pune Warriors": "#2F9BE3",
        };

        // Default color if team name not found
        const defaultColor = "black";

        return teamColors[teamName] || defaultColor;
    }

}