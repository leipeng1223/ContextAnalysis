function Initialize(dataOption) {

    d3.selectAll('.removable').remove()

    // 选择数据集
    var dtset = '';
    var m = 0;
    if (dataOption == 'Team Left') {
        dtset = 'd3_data_left.csv';
        m = 180;
    }
    else if (dataOption == 'Team Right') {
        dtset = 'd3_data_right.csv';
        m = 35;
    }
    else {
        dtset = 'd3_data_changed.csv';
        m = 45;
    }


    // 读入数据集
    d3.csv(dtset).then(function (data) {

        //********************Clusters*********************

        // 获取data的部分重要参数(本部分可考虑直接从python传递?)
        // (1)cluster数量, (2)cluster最大context数
        // var cluster_number = [];
        // data.forEach(function (d) {
        //     cluster_number.push(parseInt(d.k6))
        // })
        // var k = d3.max(cluster_number) + 1;

        var x_clusters = d3.scaleLinear()
            .domain([0, m])
            .range([0, width_clusters - margin_clusters.left - margin_clusters.right])

        // 绘制坐标轴axis
        for (i = 0; i < k; i++) {
            // x轴
            svg_clusters.append("g")
                .attr('class', 'removable')
                .attr("transform", "translate(" + (margin_clusters.left) + "," + ((margin_clusters.top + height_cluster) + 1.4 * i * height_cluster) + ")")
                .call(d3.axisBottom(x_clusters).ticks(10))
                .select('.domain').remove()
            // y轴
            svg_clusters.append("g")
                .attr('class', 'removable')
                .attr("transform", "translate(" + (margin_clusters.left) + "," + (margin_clusters.top + 1.4 * i * height_cluster) + ")")
                .call(d3.axisLeft(y_clusters).tickSize(-width_clusters + margin_clusters.right + margin_clusters.left).ticks(3).tickValues([0, 25, 50]).tickFormat(d => d - 25))
                .select('.domain').remove()
        }

        // Customization
        svg_clusters.selectAll(".tick line").attr("stroke", "#EBEBEB")

        // 绘制色块
        dots = svg_clusters.append('g')
            .selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr('class', 'removable')
            .attr("width", width_clusters / m)
            .attr("height", height_cluster / 51)
            .attr("x", function (d) { return x_clusters(d.order) + margin_clusters.left })
            .attr("y", function (d) { return y_clusters(d.Y) + 1.4 * height_cluster * d.k6 + margin_clusters.top }) //cluster间距是1.3倍height_cluster
            .style("fill", function (d) { return d.color_tsne_5000 })


        // 设置刷选
        var brush_clusters = d3.brush()
            .on('start', brush_start)
            .on("end", brushed_clusters)

        function brush_start() {
            d3.selectAll(".foreground path").attr('visibility', 'hidden');
            d3.selectAll('.brush_on_parallel').call(d3.brush().clear)
            d3.selectAll('.track').remove()
        }

        function brushed_clusters() {
            // d3.brushSelection(this),获取当前刷子的刷选区域！！
            selection = d3.brushSelection(this);
            if (selection) {
                pass = [];
                id = [];
                pass_id = [];
                const [[x0, y0], [x1, y1]] = selection;
                let value = dots.filter(function () {
                    var a = d3.select(this).attr('y')
                    var b = d3.select(this).attr('x')
                    return (x0 <= b && b < x1 && y0 <= a && a < y1)
                }).data()
                value.forEach(function (d) {
                    id.push(d.id);
                    if (!pass_id.includes(+d.Pass_ID)) {
                        pass_id.push(+d.Pass_ID);
                    }
                })

                data.forEach(function (d) {
                    if (id.includes(d.id)) {
                        pass.push(d)
                    }
                })
                draw(id);
                track(pass);
                highlight(pass_id);
            }
            else {
                d3.selectAll('.track').remove()
                d3.selectAll('.timepoint').attr("fill", (d, i) => {
                    if (d.BallPossession == 1.0) {
                        return "steelblue";
                    } else {
                        return "Crimson";
                    }
                }).transition(1000).attr('r', 0.05 * height_timeline)
            }
        }

        // 为画布绑定刷子
        svg_clusters.call(brush_clusters);


        //********************Parallel*********************

        // 获得要画的维度名称
        // 这里不为dimensions声明var，函数外还要用到
        // （不特别声明的就是全局变量）
        dimensions = d3.keys(data[0]).slice(2, 11);

        // 创建横轴比例尺
        x_parallel.domain(dimensions)
            .range([0, width_parallel - margin_parallel.left - margin_parallel.right]);

        // 为每个特征创建纵轴比例尺
        dimensions.forEach(function (d) {
            y_parallel[d] = d3.scaleLinear()
                // .domain(
                //   d3.extent(pass, function (p) {
                //     return +p[d];
                //   })
                // )
                .domain([0, 1])
                .range([height_parallel - margin_parallel.top - margin_parallel.bottom, 0])
        });

        var sample = data
            .filter(function (d) {
                return (d.Y % 5 == 0)
            })

        // 背景灰色线条
        background = svg_parallel
            .append("g")
            .attr('class', 'removable background')
            .selectAll("path")
            .data(sample)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("opacity", 0.2);

        // 前景彩色线条
        foreground = svg_parallel
            .append("g")
            .attr('class', 'removable foreground')
            .selectAll("path")
            .data(sample)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "none")
            .attr("shape-rendering", "crispEdges")
            .attr("class", (function (d) {
                return ("k" + (d["k6"]) + " parallel_lines")
            }))
            .attr('id', d => d.id)
            .attr("stroke", d => d.color_tsne_5000)
            .attr("opacity", 0.5);

        // 把坐标轴等等全部放在折线后面再画
        // 它们和设置在它们上面的brush就会在折线上层，不会被遮挡！
        // 设置纵轴拖拽
        var Ys = svg_parallel
            .selectAll(".dimension")
            .data(dimensions)
            .enter()
            .append("g")
            .attr("class", "dimension removable")
            .attr("transform", function (d) {
                return "translate(" + x_parallel(d) + ")";
            })
            .call(
                d3.drag()
                    .on("start", function (d) {
                        dragging[d] = x_parallel(d);
                        background.attr("visibility", "hidden");
                    })
                    .on("drag", function (d) {
                        dragging[d] = Math.min(width_parallel, Math.max(0, d3.event.x));
                        foreground.attr("d", path);
                        if (typeof brushed_lines !== "undefined" && brushed_lines !== null) {
                            brushed_lines.attr("d", path);
                        }
                        dimensions.sort(function (a, b) {
                            return position(a) - position(b);
                        });
                        x_parallel.domain(dimensions);
                        Ys.attr("transform", function (d) {
                            return "translate(" + position(d) + ")";
                        });
                    })
                    .on("end", function (d) {
                        delete dragging[d];
                        transition(d3.select(this)).attr(
                            "transform",
                            "translate(" + x_parallel(d) + ")"
                        );
                        transition(foreground).attr("d", path);
                        if (typeof brushed_lines !== "undefined" && brushed_lines !== null) {
                            transition(brushed_lines).attr("d", path);
                        }
                        if (!(dropdownButton_cluster.property("value") == 'Clear')) {
                            background
                                .attr("d", path)
                                .transition()
                                .delay(500)
                                .duration(0)
                                .attr("visibility", "visible");
                        }
                    })
            );

        // 画每个纵轴
        Ys.append("g")
            .attr("class", "axis removable")
            .each(function (d) {
                d3.select(this).call(d3.axisLeft(y_parallel[d]));
            })


        // 显示纵轴特征名称
        Ys.append("text")
            .attr('class', 'removable y_text')
            .attr("x", -0.02 * width_parallel)
            .attr("y", -0.03 * height_parallel)
            .text(function (d) {
                var l = d.split(' ');
                if (l.length > 4) {
                    l = l.slice(0, 4)
                    l.push('...')
                }
                return l.join(' ');
            })
            .on("mouseover", function (d) {
                tip.transition().duration(200).style("opacity", 0.9);
                tip
                    .html(d)
                    .style("left", d3.event.pageX - 110 + "px")
                    .style("top", d3.event.pageY - 70 + "px");
            })
            .on("mouseout", function () {
                tip.transition().duration(500).style("opacity", 0);
            });


        // 纵轴刷选
        var brush_parallel = Ys.append("g")
            .attr("class", 'brush_on_parallel')
            .each(function (d) {
                d3.select(this).call(
                    (y_parallel[d].brush = d3.brushY()
                        .extent([[-0.015 * width_parallel, 0], [0.015 * width_parallel, height_parallel - margin_parallel.bottom - margin_parallel.top]])
                        .on('end', brushed_parallel)
                    ))
            })

        function brushed_parallel() {
            selection = d3.brushSelection(this);
            if (selection) {
                var actives = [];
                var extents = [];
                dimensions.forEach(function (item, index) {
                    var t = d3.brushSelection(brush_parallel._groups[0][index])
                    if (t != null) {
                        actives.push(item);
                        extents.push(t)
                    }
                })
                d3.selectAll('.parallel_lines').style("display", function (d) {
                    return actives.every(function (p, i) {
                        return extents[i][0] <= y_parallel[p](d[p]) && y_parallel[p](d[p]) <= extents[i][1];
                    })
                        ? null
                        : "none";
                })
                var dt = [];
                d3.selectAll('.parallel_lines')
                    .filter(function () { return d3.select(this).style('display') != 'none' })
                    .data()
                    .forEach(function (d) {
                        dt.push(d.id)
                    })

                dots.attr('stroke', function (d) {
                    return dt.includes(d.id) ? 'white' : null
                })
            }
            else {
                dots.attr('stroke', null)
            }
        }
    });
};
