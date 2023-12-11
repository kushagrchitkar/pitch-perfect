let indiaUrl = "https://raw.githubusercontent.com/HindustanTimesLabs/shapefiles/master/india/state_ut/india_state.json";
let citiesCSV = ['Ahmedabad.csv', 'Kolkata.csv', 'Mumbai.csv', 'Navi Mumbai.csv', 'Pune.csv', 'Dubai.csv', 'Sharjah.csv', 'Abu Dhabi.csv', 'Delhi.csv', 'Chennai.csv', 'Hyderabad.csv', 'Visakhapatnam.csv', 'Chandigarh.csv', 'Bengaluru.csv', 'Jaipur.csv', 'Indore.csv', 'Bangalore.csv', 'Kanpur.csv', 'Rajkot.csv', 'Raipur.csv', 'Ranchi.csv', 'Cuttack.csv', 'Dharamsala.csv', 'Kochi.csv', 'Nagpur.csv']

// Function to load and parse CSV data for a city
let parentFolder = 'data/IndiaWeather/';
function loadCitiesCSV(city) {
    const filePath = `${parentFolder}${city}`;
    return d3.csv(filePath)
        .then((data) => {
            let cityName = city.replace(".csv", "")
            return { cityName, data };
        })
        .catch((error) => {
            console.error(`Error loading CSV for ${city}:`, error);
        });
}

let promises = [
    d3.csv("data/IPL_Ball_by_Ball_2008_2022_cleaned.csv"),
    d3.csv("data/matches_cleaned3.csv"),
    d3.json("data/batsmanData.json"),
    d3.csv("data/pointstable.csv"),
    d3.json(indiaUrl),
    d3.json("data/matches_humidity.json")
];

Promise.all(promises)
    .then(function (data) {
        createVis(data)
    })
    .catch(function (err) {
        console.log(err)
    });

let barMapVis;
let treemapVis;
let slopeGraphVis;
let networkVis;
let batsmanBarGraph;
let batsmanLineGraph;
let indiaMapVis;
let indiaMapCoinTossDecision;
let indiaMapCoinTossWinner;
let parseDate = d3.timeParse("%Y-%m-%d");
let topNum = 10;
let selectedBatsman = "V Kohli"
let startColor = "#6F989D"
let selectedCategory =  document.getElementById('categorySelector').value;
function categoryChange() {
    selectedCategory = document.getElementById('categorySelector').value;
    let batsman_category_list = {
        "sumBatsmanRuns": "V Kohli",
        "numPlayerOuts": "RG Sharma",
        "average": "KL Rahul",
        "strikeRate": "AD Russell"
    }

    selectedBatsman = batsman_category_list[selectedCategory]
    batsmanBarGraph.clearBars()
    batsmanBarGraph.wrangleData();
    batsmanLineGraph.wrangleData(startColor);
}

function createVis(data) {
    data = cleanData(data)
    // console.log("ball_by_ball", data[0])
    // console.log("matches", data[3])
    // console.log("batsmanData", data[2])
    barMapVis = new BarMapVis("barvis", data[1]);
    treemapVis = new TreeVis("treevis", data[1], barMapVis);

    // Create BarMapVis

    slopeGraphVis = new SlopegraphVis("slopegraph", data[3]);

    // Create Network Graph
    networkVis = new NetworkGraph("network-graph", data[1]);

    // Initialize Bar Graph and Line Graph
    batsmanBarGraph = new BarVis('barDiv', data[2]);
    batsmanLineGraph = new lineGraph('lineDiv', data[0], data[1]);

    // Create MapVis
    indiaMapCoinTossDecision = new CoinTossBarGraph("coin-toss-decision-bar", data[5], true)
    indiaMapCoinTossWinner = new CoinTossBarGraph("coin-toss-winner-bar", data[5], false)
    indiaMapVis = new MapVis("mapDiv", data[4], data[1], data[5])


    // Create Slider
    createBarGraphSlider(data[0])

}

function createBarGraphSlider(data) {
    // grab slider location in your DOM
    let slider = document.getElementById("slider");
    let slider_min = 3;
    let slider_max = 20;
    noUiSlider.create(slider, {
        start: [10],
        connect: true,
        range: {
            'min': slider_min,
            'max': slider_max
        },
        // tooltips: [true, true],
        behaviour: "drag",
        step: 1,
        tooltips: true
    });

    slider.noUiSlider.on('update', function (value) {
        //console.log(value)
        topNum = value
        document.getElementById("slider-value").innerText = Math.round(value);
        batsmanBarGraph.wrangleData();
    });
}
function cleanData(data) {
    // Clean ball_by_ball data
    data[0].forEach(function (d) {
        // Convert string values to numbers
        d.ID = +d.ID
        d.innings = +d.innings
        d.overs = +d.overs
        d.ballnumber = +d.ballnumber
        d.batsman_run = +d.batsman_run
        d.extras_run = +d.extras_run
        d.total_run = +d.total_run
        d.isWicketDelivery = +d.isWicketDelivery
    });

    // Clean matches data
    data[1].forEach(function (d) {
        // Convert string values to numbers
        d.ID = +d.ID
        d.Date = parseDate(d.Date)
        d.Season = +d.Season
        d.Margin = +d.Margin
    });
    return data;
}

