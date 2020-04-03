class GraphSettings {
    constructor(svg, width, height, margin) {
        // Margin is an object with left, right, top and bottom
        this.svg = svg;
        this.width = width;
        this.height = height;
        this.margin = margin;
    }
}

class SingleGraph {
    constructor(settings) {
        this.settings = settings;
    }

    clear() {
        this.settings.svg.selectAll("*").remove();
    }

    draw(data) {
        throw new Error("This is an abstract method you can't call this directly")
    }

    redraw(data) {
        this.clear();
        this.draw(data);
    }
}

// ========== Histogram ==========

class Histogram extends SingleGraph {
    constructor(settings, ticks, coloring, fixedXDomain=null, fixedYDomain=null) {
        // Coloring is a function that takes the bin data and returns a color
        super(settings);

        this.ticks = ticks;
        this.coloring = coloring;
        this.fixedXDomain = fixedXDomain;
        this.fixedYDomain = fixedYDomain;
    }

    addAxes(x, y) {
        let margin = this.settings.margin;

        let xAxis = g => g
            .attr("class", "axis")
            .attr("transform", `translate(0,${this.settings.height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(this.settings.width / 80 ).tickSizeOuter(0));

        let yAxis = g => g
            .attr("class", "axis")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(this.settings.height / 40));

        // Add X axis
        this.settings.svg.append("g")
            .call(xAxis);

        // Add Y axis
        this.settings.svg.append("g")
            .call(yAxis);
    }

    // Draw the histogram with the given data
    draw(data) {
        let margin = this.settings.margin;

        let x = d3.scaleLinear()
            .range([margin.left, this.settings.width - margin.right]);

        if (!this.fixedXDomain) {
            x = x.domain(d3.extent(data)).nice();
        } else {
            x = x.domain(this.fixedXDomain);
        }

        let indexZipped = data.map(function(e, i) {
            return [i, e];
        });

        let bins = d3.histogram()
            .value(d => d[1])
            .domain(x.domain())
            .thresholds(x.ticks(this.ticks))
            (indexZipped);

        let y = d3.scaleLinear()
            .range([this.settings.height - margin.bottom, margin.top]);

        if (!this.fixedYDomain) {
            y = y.domain([0, d3.max(bins, d => d.length)]).nice();
        } else {
            y = y.domain(this.fixedYDomain);
        }

        this.addAxes(x, y);

        this.settings.svg.append("g")
            .selectAll("rect")
            .data(bins)
            .join("rect")
                .attr("fill", (b) => this.coloring(b))
                .attr("x", d => x(d.x0) + 1)
                .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
                .attr("y", d => y(d.length))
                .attr("height", d => y(0) - y(d.length));
    }
}

// ========== Point Plotter ==========

/// Basic point plotter (no axes or anything)
class PointPlotter1D extends SingleGraph {
    constructor(settings, pointSize, coloring, xScale, xJitter=[0, 0], yJitter=[0, 0], jitterSame=false) {
        // Coloring is a function that takes the value and index and returns a color
        // Jitter is [min, max] and is randomly chosen and added to each point
        // jitterSame means that it is deterministic on index
        super(settings);

        this.pointSize = pointSize;
        this.coloring = coloring;
        this.xScale = xScale;
        this.xJitter = xJitter;
        this.yJitter = yJitter;
        this.jitterSame = jitterSame;

        if (jitterSame) {
            this.jitterXVals = [];
            this.jitterYVals = [];
        }
    }

    draw(data) {
        let margin = this.settings.margin;
        let xJitt = d3.randomUniform(this.xJitter[0], this.xJitter[1]);
        let yJitt = d3.randomUniform(this.yJitter[0], this.yJitter[1]);

        let filteredData = data.filter(d => {
            let scaled = this.xScale(d);
            return scaled > margin.left && scaled < this.settings.width - margin.right;
        });

        let cGroup = this.settings.svg.append("g")
            .selectAll("circle")
            .data(filteredData)
            .join("circle")
                .attr("fill", (d, i) => this.coloring(d, i))
                .attr("r", this.pointSize);

        if (this.jitterSame) {
            if (this.xJitter !== [0, 0]) {
                while (this.jitterXVals.length < data.length) {
                    this.jitterXVals.push(xJitt());
                }
                cGroup
                    .attr("cx", (d, i) => this.xScale(d) + this.jitterXVals[i]);
            } else {
                cGroup
                    .attr("cx", d => this.xScale(d));
            }

            if (this.yJitter !== [0, 0]) {
                while (this.jitterYVals.length < data.length) {
                    this.jitterYVals.push(yJitt());
                }
                cGroup
                    .attr("cy", (d, i) => (this.settings.height / 2) + this.jitterYVals[i]); // Not technically correct with margin
            } else {
                cGroup
                    .attr("cy", this.settings.height / 2);
            }


        } else {
            cGroup
                .attr("cx", d => this.xScale(d) + xJitt())
                .attr("cy", () => (this.settings.height / 2) + yJitt()) // Not technically correct with margin
        }
    }
}