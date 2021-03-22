
d3.csv("d3_timeline.csv", ({ Pass_ID, time_past, BallPossession }) => ({
    Pass_ID: +Pass_ID,
    time_past: +time_past,
    BallPossession: +BallPossession,
})).then(function (data) {

    // 设置x轴
    var x = d3
        .scaleLinear()
        .domain([0, 6450])
        .range([0, 10 * width_timeline]);

    var x2 = d3
        .scaleLinear()
        .domain([0, width_timeline])
        .range([0, 9.8 * width_timeline]);

    svg_timeline.append('g')
        .attr('id', 'timeline')
        .call(d3.axisBottom(x).ticks(200).tickFormat(d => Math.round(d / 60) + "min" + Math.round(d % 60) + "s"));

    svg_timeline
        .append("g")
        .attr("id", "barGroup")
        .style("clip-path", "url(#barGroup_clip)")
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("r", 0.05 * height_timeline)
        .attr("cx", (d, i) => x(d.time_past))
        .attr("cy", (d, i) => {
            if (d.BallPossession == 1.0) {
                return 0.25 * (height_timeline - brushHeight);
            } else {
                return 0.85 * (height_timeline - brushHeight);
            }
        })
        .attr("fill", (d, i) => {
            if (d.BallPossession == 1.0) {
                return "steelblue";
            } else {
                return "Crimson";
            }
        })
        .attr("stroke", 'white')
        .on("mouseover", function (d) {
            div.transition().duration(200).style("opacity", 0.9);
            div
                .html("Pass ID:" + d.Pass_ID + "<br/> Time:" + Math.round(d.time_past / 60) + "min" + Math.round(d.time_past % 60) + "s")
                .style("left", d3.event.pageX - 110 + "px")
                .style("top", d3.event.pageY + "px");
        })
        .on("mouseout", function () {
            div.transition().duration(500).style("opacity", 0);
        });


    var brushed = () => {
        const s = d3.event.selection
        d3.select("#barGroup").attr("transform", `translate(${-x2(s[0]) + margin_timeline.left}, 0)`); // #barGroup指上方点区域
        d3.select("#timeline").attr("transform", `translate(${-x2(s[0]) + margin_timeline.left}, ${0.5 * (height_timeline - brushHeight)})`); // 坐标轴一起动
    };

    var brush_timeline = d3.brushX()
        .extent([
            [0, 0],
            [width_timeline - margin_timeline.right - margin_timeline.left, brushHeight],
        ])
        .on("brush end", brushed);

    const brushGroup = svg_timeline
        .append("g")
        .attr("class", "brush")
        .attr(
            "transform",
            `translate(${margin_timeline.left}, ${(height_timeline - brushHeight)})` // 乱做的数据，之后再改
        )
        .call(brush_timeline)
        // brush.move就是人为设置一个现有的被刷选范围
        // 这里是设置brushGroup中的[0,200]这个坐标区间作为初始选中区间,使这个区间充当滑块
        .call(brush_timeline.move, [0, 0.05 * width_timeline]);

    brushGroup.selectAll("rect").attr("height", brushHeight);






    var bins = histogram(data);

    var hists = [];
    for (let i = 1; i <= ticks; i++) {
        hists.push((6400 / ticks) * i);
    }

    var result_left = [];
    var result_right = [];
    count_left = 0;
    count_right = 0;
    i = 0;

    //console.log(data.length);
    data.forEach(function (d) {
        pivot = hists[i];
        time_past = d.time_past;
        BallPossession = d.BallPossession;
        if (i >= ticks) {
        } else if (time_past < pivot) {
            if (BallPossession == 1.0) {
                // console.log(count_left)
                count_left++;
            } else {
                count_right++;
            }
        } else {
            result_left.push(count_left);
            result_right.push(count_right);
            count_left = 0;
            count_right = 0;
            i++;
        }
    });

    //console.log(result_left);
    //console.log(result_right);
    //console.log(d3.sum(result_left));
    //console.log(d3.sum(result_right));

    // svg <- 条状图(左队)
    stack
        .append("g")
        .selectAll("rect")
        .data(result_left)
        .enter()
        .append("rect")
        .attr("class", "bar_top")
        .attr("x_stack", 1)
        .attr("transform", function (d, i) {
            return "translate(" + x_stack((6400 / ticks) * i) + "," + y1_stack(d) + ")";
        })
        .attr("width", function (d) {
            return width_stack / ticks;
        })
        .attr("height", function (d) {
            return height_stack - y1_stack(d);
        })
        .attr("fill", "steelblue");
    // .attr("fake", (d,i)=> console.log(d,i));

    // stack <- 条状图(右队)
    stack
        .append("g")
        .selectAll("rect")
        .data(result_right)
        .enter()
        .append("rect")
        .attr("class", "bar_bottom")
        .attr("x_stack", 1)
        .attr("transform", function (d, i) {
            return "translate(" + x_stack((6400 / ticks) * i) + "," + height_stack + ")";
        })
        .attr("width", function (d) {
            return width_stack / ticks;
        })
        .attr("height", function (d) {
            return y2_stack(d) - height_stack;
        })
        .attr("fill", "Crimson");

    // 加入x轴
    stack
        .append("g")
        .attr("transform", "translate(0," + height_stack + ")")
        .call(d3.axisBottom(x_stack));

    // // // 加入y轴
    // svg.append("g").call(d3.axisLeft(y1_stack));
    // svg.append("g").call(d3.axisLeft(y2_stack));
});