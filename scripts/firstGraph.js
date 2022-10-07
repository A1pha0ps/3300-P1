(function () {
    const svg = d3.select("svg#svg1");
    const cLegend = d3.select("svg#svg1scale")

    const width = svg.attr('width');
    const height = svg.attr('height');
    const margin = { top: 50, right: 50, bottom: 50, left: 250 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    let annotations = svg.append("g").attr("id", "annotations");
    let chartArea = svg.append("g").attr("id", "points")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.json("resources/cleaned.json", d3.autotype).then((data) => {
        data = data.filter(d => (d['Genre'] != 'nan' && d['Genre'] != 'Visual Novel'))

        data.forEach(d => {
            let totalViewerCount = 0
            d['Stats'].forEach(d_ => {
                d_["Genre"] = d.Genre
                d_['log_scale_view'] = Math.log10(d_['Avg_viewers']);
                totalViewerCount += d_['Avg_viewers']
            })
            d['totalViewerCount'] = totalViewerCount
        })

        data.sort((a, b) => (a['totalViewerCount'] - b['totalViewerCount']))

        let genreList = []

        data.forEach(d => {
            genreList.push(d['Genre'])
        })

        const timeParser = d3.timeParse('%Y-%m-%d');

        let dates = [];
        let views = [];
        let min_value_viewers = Number.MAX_VALUE
        let max_value_viewers = Number.MIN_VALUE
        data.forEach(d => {
            d['Stats'].forEach(d_ => {
                d_['Date'] = timeParser(d_['Date']);
                dates.push(d_['Date'])
                views.push(d_['log_scale_view'])
                min_value_viewers = Math.min(min_value_viewers, d_['log_scale_view'])
                max_value_viewers = Math.max(max_value_viewers, d_['log_scale_view'])
            })
        });

        // X axis
        let timeScale = d3.extent(dates)
        const dateScale = d3.scaleTime().domain(timeScale).range([0, chartWidth]);
        let bottomAxis = d3.axisBottom(dateScale).ticks(20)
        let bottomsubAxis = d3.axisBottom(dateScale).ticks(50).tickFormat("");
        annotations.append('g')
            .attr('class', 'x axis')
            .attr("transform", `translate(${margin.left + 7},${chartHeight + margin.top})`)
            .call(bottomsubAxis);
        annotations.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(${margin.left + 7},${chartHeight + margin.top})`)
            .call(bottomAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-1em")
            .attr("dy", "0em")
            .attr("transform", "rotate(-65)");

        // Y Axis
        const viewerScale = d3.scaleBand().domain(genreList).range([chartHeight, 0]).padding(0.05);
        let leftAxis = d3.axisLeft(viewerScale)
        annotations.append("g")
            .attr("class", "y axis")
            .attr("transform", `translate(${margin.left},${margin.top})`)
            .call(leftAxis)

        const colorScale = d3.scaleSequential(d3.interpolateBlues).domain((d3.extent(views)))

        let paths = chartArea.selectAll('g').data(data).join('g')
            .attr('class', 'tags')
            .attr('id', d => d.Genre)
            .style('stroke', d => colorScale(d.log_scale_view));

        paths.selectAll('g')
            .data(d => d.Stats)
            .join("rect")
            .attr("x", d => dateScale(d.Date))
            .attr("y", d => viewerScale(d.Genre))
            .attr("width", chartWidth / 72)
            .attr("height", viewerScale.bandwidth())
            .style("fill", d => colorScale(d.log_scale_view))

        annotations.raise()

        chartArea.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 912)
            .attr('height', 500)
            .style('fill', 'white')

        let legend_data = d3.range(min_value_viewers, max_value_viewers, (max_value_viewers - min_value_viewers) / 50);

        let legendColorScale = d3.scaleSequential()
            .interpolator(d3.interpolateBlues)
            .domain([min_value_viewers, max_value_viewers]);

        let xColorScale = d3.scaleLinear()
            .domain([min_value_viewers, max_value_viewers])
            .range([0, 300]);

        cLegend.selectAll("rect")
            .data(legend_data)
            .join("rect")
            .attr("x", d => Math.floor(xColorScale(d)))
            .attr("y", 0)
            .attr("height", 40)
            .attr("width", d => (Math.floor(xColorScale(d + 1)) - Math.floor(xColorScale(d)) + 1))
            .attr("fill", d => legendColorScale(d))
            .attr('transform', `translate(0,${20})`)

        legend_data.forEach((d, i) => {
            if (i != 0 && i != legend_data.length - 1 && (i % 5 != 0)) {
                legend_data.splice(i, 1);
            }
        });

        cLegend.selectAll("rect").select("text").data(legend_data)
            .join("text")
            .text((d, i) => {
                let temp = Math.pow(10, d);
                if (i == 0) return "0"
                if (i == legend_data.length - 1) return Math.trunc(temp.toFixed(4))
                if (i % 2 == 0) {

                    if (temp < 1000) {
                        return Math.trunc(temp.toFixed(2))
                    }
                    if (temp < 10000) {
                        return Math.trunc(temp.toFixed(3))
                    }
                    return Math.trunc(temp.toFixed(4))

                }
            })
            .attr("class", "numbers")
            .style("text-anchor", "end")
            .style("font-size", 10)
            .attr("x", -45)
            .attr("y", d => Math.floor(xColorScale(d)))
            .attr('transform', `translate(0,${20}) rotate(${-90})`)

        cLegend.selectAll("text")
            .filter(function () {
                if (d3.select(this).text() == "") {
                    this.remove()
                }
            })

        cLegend.append("text")
            .attr('class', 'title-graph')
            .text("Key (Corresponds to Avg. Viewers): ")
            .style("font-size", 15)
            .attr("x", 0)
            .attr("y", 10);

        svg.append("text")
            .attr('class', 'title-graph')
            .text("Genre of Games (Top 200) vs. Time (2016-2021)")
            .style("font-size", 20)
            .attr("x", `${chartWidth / 2}`)
            .attr("y", `${margin.bottom - 20}`);

        chartArea.selectAll("g").raise()
    });

    // Annotations

    // Tactical: Valorant
    svg.append("circle")
        .attr("cx", 890)
        .attr("cy", 95)
        .attr("r", 8)
        .attr("stroke", "white")
        .attr("stroke-width", "1px")
        .attr("fill", "maroon");

    svg.append("text")
        .attr("x", 886)
        .attr("y", 100)
        .text("1")
        .attr("fill", "white");

    // Indie: Among US
    svg.append("circle")
        .attr("cx", 960)
        .attr("cy", 333)
        .attr("r", 8)
        .attr("stroke", "white")
        .attr("stroke-width", "1px")
        .attr("fill", "maroon");

    svg.append("text")
        .attr("x", 956)
        .attr("y", 338)
        .text("2")
        .attr("fill", "white");

    // Puzzle: Phasmophobia
    svg.append("circle")
        .attr("cx", 960)
        .attr("cy", 470)
        .attr("r", 8)
        .attr("stroke", "white")
        .attr("stroke-width", "1px")
        .attr("fill", "maroon");

    svg.append("text")
        .attr("x", 956)
        .attr("y", 475)
        .text("3")
        .attr("fill", "white");

    // Platform: Terraria
    svg.append("circle")
        .attr("cx", 900)
        .attr("cy", 492)
        .attr("r", 8)
        .attr("stroke", "white")
        .attr("stroke-width", "1px")
        .attr("fill", "maroon");

    svg.append("text")
        .attr("x", 896)
        .attr("y", 497)
        .text("4")
        .attr("fill", "white");
})();



