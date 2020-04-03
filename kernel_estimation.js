// Global settings for graphs
const width = 950;
const fixedXDomain = [-10, 10];
const colors = ["#7560A7", "#BB342F", "#7DB4AB", "#7E8284", "#F0DEE4", "#EBBC4C", "#508BA1"];
const colorValues = colors.map(c => hexToRgb(c));

// Generate some data in a normal distribution
const dataPoints = 1000;
const dataPointsHalfway = Math.floor(dataPoints / 2);
// const baseNormal = random_normal(0, 1, dataPoints);

const normalGenerator = d3.randomNormal(0, 1);
const baseNormal = d3.range(dataPoints).map(() => normalGenerator());

function gaussianHistogramColoring() {
    return colors[0];
}

function bimodalHistogramColoring(b) {
    if (b.length === 0) {
        return colors[0];
    }

    let sumA = 0;
    for (let i = 0; i < b.length; i++) {
        if (b[i][0] < dataPointsHalfway) {
            sumA++;
        }
    }
    return colorMixer(colorValues[0], colorValues[1], sumA / b.length);
    // return sumA > Math.floor(b.length / 2) ? colors[0] : colors[1];
}

// Create the distribution graph
let distributionHistogram;
{
    const height= 500;
    const margin = {left: 30, right: 30, top: 30, bottom: 30};

    let svg = d3.select("#distribution-graph")
        .attr("viewBox", [0, 0, width, height]);

    const settings = new GraphSettings(svg, width, height, margin);
    const ticks = 60;

    distributionHistogram = new Histogram(settings, ticks, bimodalHistogramColoring, fixedXDomain);
}

// The current data state information
let dataChanged = new EventManager();

// Required input elements
const gaussianOptions = d3.select("#gaussian-options");
const bimodalOptions = d3.select("#bimodal-options");

const distributionPicker = d3.select("#distribution-selector");

const gaussianStdDevSlider = d3.select("#gaussian-stddev");
const gaussianStdDevLabel = d3.select("#gaussian-slider-output");

const bimodalMeanA = d3.select("#bimodal-mean-a");
const bimodalMeanB = d3.select("#bimodal-mean-b");
const bimodalDevA = d3.select("#bimodal-dev-a");
const bimodalDevB = d3.select("#bimodal-dev-b");

const bimodalMeanALabel = d3.select("#bimodal-mean-a-slider-output");
const bimodalMeanBLabel = d3.select("#bimodal-mean-b-slider-output");
const bimodalDevALabel = d3.select("#bimodal-dev-a-slider-output");
const bimodalDevBLabel = d3.select("#bimodal-dev-b-slider-output");

const bimodalSettings = [bimodalMeanA, bimodalMeanB, bimodalDevA, bimodalDevB];
const bimodalLabels = [bimodalMeanALabel, bimodalMeanBLabel, bimodalDevALabel, bimodalDevBLabel];

// Transform data from the standard normal distribution to have a different mean and standard deviation
function transformNormal(baseData, mean, stdDev) {
    return baseData.map(v => v * stdDev + mean);
}

// Transforms data from std normal to bimodal with [meanA, meanB, stdDevA, stdDevB]
function transformBimodal(baseData, settings) {
    let halfway = Math.floor(baseData.length / 2);

    return baseNormal.map((v, i) => {
        if (i < halfway) {
            return v * settings[2] + settings[0];
        } else {
            return v * settings[3] + settings[1];
        }
    });
}

// Set the graph to the single gaussian display
function setGraphGaussian(histogram) {
    let newStdDev = gaussianStdDevSlider.property("value") / 10;

    // Update the label
    gaussianStdDevLabel.text(newStdDev.toFixed(1));

    // Get a new mapping of the data
    let newData = transformNormal(baseNormal, 0, newStdDev);
    histogram.clear();
    histogram.draw(newData);
    dataChanged.trigger(newData);
}

gaussianStdDevSlider
    .on("input", () => {
        setGraphGaussian(distributionHistogram);
    });


// Set the graph to the the bimodal gaussian display
function setGraphBimodal(histogram) {
    let bimodalValues = [0, 0, 0, 0];

    // Get the values
    bimodalSettings.forEach((v, i) => {
        bimodalValues[i] = v.property("value") / 10;
    });

    // Update the labels
    bimodalLabels.forEach((v, i) => {
        v.text(bimodalValues[i].toFixed(1));
    });

    // Update the histogram and data
    let newData = transformBimodal(baseNormal, bimodalValues);
    histogram.clear();
    histogram.draw(newData);
    dataChanged.trigger(newData);
}

bimodalSettings.forEach(v => {
    v.on("input", () => setGraphBimodal(distributionHistogram))
});

function switchDistribution(histogram, selectedDistr) {
    if (selectedDistr === "gaussian") {
        bimodalOptions.classed("invisible", true);
        gaussianOptions.classed("invisible", false);
        histogram.coloring = gaussianHistogramColoring;
        setGraphGaussian(histogram);
    } else if (selectedDistr === "bimodal") {
        bimodalOptions.classed("invisible", false);
        gaussianOptions.classed("invisible", true);
        histogram.coloring = bimodalHistogramColoring;
        setGraphBimodal(histogram)
    }
}

let currentDistribution = "bimodal";
distributionPicker.on("input", () => {
    let newDistr = distributionPicker.property("value");

    if (newDistr !== currentDistribution) {
        currentDistribution = newDistr;
        switchDistribution(distributionHistogram, newDistr);
    }
});

// =============== Point Graph =================

function gaussianPointColoring() {
    return colors[0];
}

function bimodalPointColoring(d, i) {
    if (i < dataPointsHalfway) {
        return colors[0];
    }

    return colors[1];
}

let pointGraph;
{
    const height = 150;
    const margin = {left: 30, right: 30, top: 5, bottom: 5};

    let svg = d3.select("#point-graph")
        .attr("viewBox", [0, 0, width, height]);
        // .attr("style", "border: 1px solid red");

    const settings = new GraphSettings(svg, width, height, margin);

    let xScale = d3.scaleLinear()
        .domain(fixedXDomain)
        .range([margin.left, width - margin.right]);

    let yJitter = [-(height/2 - margin.top - 5), height/2 - margin.bottom - 5];
    let coloring = currentDistribution === "bimodal" ? bimodalPointColoring : gaussianPointColoring;

    pointGraph = new PointPlotter1D(settings, 3, coloring, xScale, [0, 0], yJitter);
}

// Update when data is changed
dataChanged.addListener((d) => {
    pointGraph.coloring = currentDistribution === "bimodal" ? bimodalPointColoring : gaussianPointColoring;
    pointGraph.redraw(d);
});

// ============ Plot and setup the default state ================
switchDistribution(distributionHistogram, currentDistribution);