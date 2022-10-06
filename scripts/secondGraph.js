const svg = d3.select("svg#svg2");
const width = svg.attr('width');
const height = svg.attr('height');
const margin = { top: 30, right: 30, bottom: 60, left: 120 };
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;

let annotations = svg.append("g").attr("id", "annotations");
let chartArea = svg.append("g").attr("id", "points")
    .attr("transform", `translate(${margin.left},${margin.top})`);

d3.json("resources/test.json", d3.autotype).then((data => {
    console.log(data)
}));

d3.json("resources/cleaned.json", d3.autotype).then((data) => {
    data.forEach(d => {
        d['Stats'].forEach(d_ => {
            let freq = d_['freq']
            d_['Hours_watched'] /= freq
            d_["Hours_watched"] /= freq
            d_["Hours_streamed"] /= freq
            d_["Peak_channels"] /= freq
            d_["Avg_viewers"] /= freq
            d_["Genre"] = d.Genre
            d_["Avg_viewer_ratio"] /= freq
        })
    })

    console.log(data)

    let smallTrendData = []

    genreList = []
    data.forEach(d => {

        // if (smallSet.has(d['Genre'])) {
        //     smallTrendData.push(d)
        // }

        if (d['Genre'] == 'MOBA'
            || d["Genre"] == 'Turn-based strategy (TBS)' ||
            d["Genre"] == 'Card & Board Game' ||
            d["Genre"] == 'Adventure' || d["Genre"] == 'Shooter'
            || d["Genre"] == 'Point-and-click') {
            smallTrendData.push(d);
            genreList.push(d['Genre'])
        }
    })

    const timeParser = d3.timeParse('%Y-%m-%d');

    let dates = [];
    let min_value_viewers = Number.MAX_VALUE
    let max_value_viewers = Number.MIN_VALUE
    smallTrendData.forEach(d => {
        d['Stats'].forEach(d_ => {
            d_['Date'] = timeParser(d_['Date']);
            dates.push(d_['Date'])
            min_value_viewers = Math.min(min_value_viewers, d_['Avg_viewers'])
            max_value_viewers = Math.max(max_value_viewers, d_['Avg_viewers'])
        })
    });

    // X axis
    let timeScale = d3.extent(dates)
    const dateScale = d3.scaleTime().domain(timeScale).range([0, chartWidth]);
    let bottomAxis = d3.axisBottom(dateScale).ticks(20)
    let bottomsubAxis = d3.axisBottom(dateScale).ticks(50).tickFormat("");
    let bottomGridlines = d3.axisBottom(dateScale)
        .tickSize(-chartHeight - 10)
        .tickFormat("")
    annotations.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(${margin.left},${chartHeight + margin.top + 10})`)
        .call(bottomAxis)
        .selectAll("text")
    annotations.append("g")
        .attr("class", "x gridlines")
        .attr("transform", `translate(${margin.left},${chartHeight + margin.top + 10})`)
        .call(bottomGridlines);
    annotations.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(${margin.left},${chartHeight + margin.top + 10})`)
        .call(bottomsubAxis);

    // Y Axis
    const viewerScale = d3.scaleLinear().domain([min_value_viewers, max_value_viewers]).range([chartHeight, 0]);
    let leftAxis = d3.axisLeft(viewerScale).tickFormat(d3.format(",~s"))
    let leftGridlines = d3.axisLeft(viewerScale)
        .tickSize(-chartWidth - 10)
        .tickFormat("")
    annotations.append("g")
        .attr("class", "y axis")
        .attr("transform", `translate(${margin.left - 10},${margin.top})`)
        .call(leftAxis)
    annotations.append("g")
        .attr("class", "y gridlines")
        .attr("transform", `translate(${margin.left - 10},${margin.top})`)
        .call(leftGridlines);

    const colorScale = d3.scaleOrdinal(d3.schemeDark2);

    var lineGen = d3.line()
        .x(d => dateScale(d.Date))
        .y(d => viewerScale(d.Avg_viewers));

    let paths = chartArea.selectAll('g').data(smallTrendData).join('g')
        .attr('class', 'tags')
        .attr('id', d => d.Genre)
        .style('stroke', d => colorScale(d.Genre));

    paths.append('path').attr('class', 'path')
        .attr('d', d => lineGen(d.Stats))
        .style('stroke-width', '2px')
        .style('fill', 'none');

    chartArea.selectAll('g').selectAll('circle')
        .data(d => d.Stats)
        .join('circle')
        .attr('r', '2px')
        .attr('cx', d => dateScale(d.Date))
        .attr('cy', d => viewerScale(d.Avg_viewers))
        .style('fill', d => colorScale(d.Genre));

    annotations.append('rect').attr('class', 'legend_box')
        .attr('x', 120)
        .attr('y', 30)
        .attr('width', 210)
        .attr('height', 200)
        .style('fill', "white")
        .style('opacity', 0.9)


    // select the svg area
    let rect_SVG = svg.select("g#annotations")

    // Add one dot in the legend for each name.
    let size = 20
    let offset = 130
    rect_SVG.selectAll("squares")
        .data(smallTrendData)
        .join("rect")
        .attr("x", offset)
        .attr("y", (d, i) => (60 + i * (size + 5)))
        .attr("width", size)
        .attr("height", size)
        .style("fill", d => colorScale(d.Genre))

    // Add one dot in the legend for each name.
    rect_SVG.selectAll("labels")
        .data(smallTrendData)
        .join("text")
        .attr("x", offset + size * 1.2)
        .attr("y", (d, i) => (60 + i * (size + 5) + (size / 2)))
        .style("fill", d => colorScale(d.Genre))
        .text(d => d.Genre)
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")

    rect_SVG.raise()
    chartArea.raise()
});