id = []; // 全局变量id，用来筛选数据
pass = []; // 全局变量pass，用来储存筛选出的数据
var cluster_color = d3.scaleOrdinal()
    .domain(['0', '1', '2', '3', '4', '5'])
    .range(d3.schemeSet2);

//**********************Control Panel**********************
var panel_1 = d3.select("#Div_menu").append('div').attr('id', 'panel_1')
var panel_2 = d3.select("#Div_control").append('div').attr('id', 'panel_2')

// data选择框
panel_1.append('div')
    .append('text')
    .attr('class', 'select_text')
    .text('Dataset:')

var dataset = ["Team Right", "Team Left", 'Changed']
var dropdownButton_data = panel_1.append('select').attr('class', 'select')
dropdownButton_data
    .selectAll('myOptions') // Next 4 lines add 6 options = 6 colors
    .data(dataset)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    //.style('font-size', '20px')
    .attr("value", function (d) { return d; })

function changeData(myOptions) {
    d3.selectAll('.brush_on_parallel').call(d3.brush().clear)
    d3.selectAll('.brush_on_clusters').call(d3.brush().clear)
    Initialize(myOptions)
}

dropdownButton_data.on("change", function (d) {
    // recover the option that has been chosen
    var selectedOption = d3.select(this).property("value")
    // run the updateParallel function with this selected option
    changeData(selectedOption)
})


panel_2.append('div')
    .append('text')
    .attr('class', 'select_text')
    .text('Color the lines by:')

var c = ['Data Projection', "Clusters", "Time from Pass"]
var dropdownButton_color = panel_2.append('select').attr('class', 'select')

dropdownButton_color
    .selectAll('myOptions') // Next 4 lines add 6 options = 6 colors
    .data(c)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    //.style('font-size', '20px')
    .attr("value", function (d) { return d; })

dropdownButton_color.on("change", function (d) {
    var selectedOption = d3.select(this).property("value")
    var lines = d3.selectAll('.foreground path')
    if (selectedOption == 'Clusters') {
        lines.attr("stroke", d => cluster_color(d["k6"]))
        d3.select('.legend').remove()
        legend(legend_2)
    }
    else if (selectedOption == 'Time from Pass') {
        lines.attr("stroke", d => d3.interpolateRdYlBu((parseInt(d.Y) + 1) / 51))
        d3.select('.legend').remove()
        legend(legend_1)
    }
    else {
        lines.attr("stroke", d => d.color_tsne_5000)
        d3.select('.legend').remove()
    }
})

panel_2.append('div')
    .append('text')
    .attr('class', 'select_text')
    .text('Clusters to show:')

var c = ["All", "k0", "k1", "k2", "k3", "k4", "k5", "Clear"]
var dropdownButton_cluster = panel_2.append('select').attr('class', 'select')
dropdownButton_cluster
    .selectAll('myOptions') // Next 4 lines add 6 options = 6 colors
    .data(c)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    //.style('font-size', '20px')
    .attr("value", function (d) { return d; })

function updateParallel(myOptions) {
    d3.selectAll('.parallel_lines').style("display", 'inline').attr('stroke', d => d.color_tsne_5000)
    d3.selectAll('.brushed_lines').remove()
    d3.selectAll('.track').remove()
    d3.selectAll('.brush_on_parallel').call(d3.brush().clear)
    d3.selectAll('.brush_on_clusters').call(d3.brush().clear)

    d3.select('.legend').remove()

    if (myOptions == 'All') {
        d3.selectAll(".background path")
            .attr("visibility", "visible");
        d3.selectAll(".foreground path")
            .attr("visibility", "visible");
    }
    else if (myOptions == 'Clear') {
        d3.selectAll(".foreground path")
            .attr("visibility", "hidden");
        d3.selectAll(".background path")
            .attr("visibility", "hidden");
    }
    else {
        d3.selectAll(".background path")
            .attr("visibility", "visible");
        d3.selectAll(".foreground path")
            .attr("visibility", "hidden");
        d3.selectAll(".foreground path." + myOptions)
            .attr("visibility", "visible");
    }
}

dropdownButton_cluster.on("change", function (d) {
    // recover the option that has been chosen
    var selectedOption = d3.select(this).property("value")
    // run the updateParallel function with this selected option
    updateParallel(selectedOption)
})

var button_reset = panel_2.append('div').append('button').text('Reset')
button_reset.on('click', reset);

function reset() {
    d3.selectAll(".foreground path").attr('visibility', 'visible').attr("stroke", d => d.color_tsne_5000);
    d3.selectAll(".background path").attr('visibility', 'visible');
    d3.selectAll(".brushed_lines").remove();
    d3.selectAll('.parallel_lines').style("display", 'inline')
    d3.selectAll('.track').remove()
    d3.selectAll('.brush_on_parallel').call(d3.brush().clear)
    d3.selectAll('.brush_on_clusters').call(d3.brush().clear)
    d3.select('.legend').remove()
}

//**********************Stack**********************
var width_stack = parseFloat(d3.select('#Div_stack').style('width').slice(0, -2));
var height_stack = parseFloat(d3.select('#Div_stack').style('height').slice(0, -2)) / 2;
var margin_stack = { top: 0.01 * height_stack, right: 0.01 * width_stack, bottom: 0.01 * height_stack, left: 0.01 * width_stack };

var svg_stack = d3.select("#Div_stack")
    .append("svg")
    .attr('class', 'svg_stack')
    .attr("width", width_stack)
    .attr("height", height_stack * 2)

// 设置x,y
var x_stack = d3.scaleLinear().domain([0, 6400]).rangeRound([0, width_stack]); // 6400
var y1_stack = d3.scaleLinear().domain([0, 30]).range([height_stack, 0]);
var y2_stack = d3
    .scaleLinear()
    .domain([30, 0])
    .range([height_stack * 2, height_stack]);

var ticks = 100;

// 设置histogram参数
var histogram = d3
    .histogram()
    .value(function (d) {
        return d.time_past;
    })
    .domain(x_stack.domain())
    .thresholds(x_stack.ticks(ticks)); // d3.timeMonth ?? 可以修改

// body <- svg
// svg <- g
// g <- 左上角
var stack = svg_stack
    .append("g")
    .attr("transform", "translate(" + margin_stack.left + "," + margin_stack.top + ")");



//**********************Timeline**********************
var width_timeline = parseFloat(d3.select('#Div_timeline').style('width').slice(0, -2));
var height_timeline = parseFloat(d3.select('#Div_timeline').style('height').slice(0, -2));
var margin_timeline = { top: 0.1 * height_timeline, right: 0.01 * width_timeline, bottom: 0.3 * height_timeline, left: 0.01 * width_timeline };
var brushHeight = 0.2 * height_timeline;

const svg_timeline = d3
    .select("#Div_timeline")
    .append("svg")
    .attr('width', width_timeline)
    .attr('height', height_timeline)

// 加入一个tooltip
var div = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);



//**********************Legend**********************
var width_legend = parseFloat(d3.select('#Div_legend').style('width').slice(0, -2));
var height_legend = parseFloat(d3.select('#Div_legend').style('height').slice(0, -2));

d3.select("#Div_legend")
    .append("svg")
    .attr('class', 'svg_legend')

var legend_1 = {
    color: d3.scaleSequential([-25, 25], d3.interpolateRdYlBu),
    title: "Time from pass:",
    id: ".svg_legend",
    ticks: 5,
    tickFormat: d => parseInt(d),
};

var legend_2 = {
    color: d3.scaleOrdinal(['k0', 'k1', 'k2', 'k3', 'k4', 'k5'], d3.schemeSet2),
    title: "Clusters:",
    tickSize: 0,
    id: '.svg_legend',
    ticks: 5,
};


//**********************Parallel**********************
var width_parallel = parseFloat(d3.select('#Div_parallel').style('width').slice(0, -2));
var height_parallel = parseFloat(d3.select('#Div_parallel').style('height').slice(0, -2));
var margin_parallel = { top: 0.1 * height_parallel, bottom: 0.02 * height_parallel, left: 0.02 * width_parallel, right: 0.02 * width_parallel };

var x_parallel = d3.scalePoint(),
    y_parallel = {},
    dragging = {};

var line = d3.line(),
    background,
    foreground;

var tip = d3
    .select("body")
    .append("div")
    .attr("class", "tip_parallel")
    .style("opacity", 0);

// 创建绘制平行坐标的画布svg_parallel
var svg_parallel = d3.select("#Div_parallel")
    .append("svg")
    .attr('class', 'svg_parallel')
    .attr("width", width_parallel)
    .attr("height", height_parallel)
    .append('g')
    .attr("transform", "translate(" + margin_parallel.left + "," + margin_parallel.top + ")")

function position(d) {
    var v = dragging[d];
    return v == null ? x_parallel(d) : v;
}

function transition(g) {
    return g.transition().duration(500);
}

// 绘制线条
function path(d) {
    return line(
        dimensions.map(function (p) {
            return [position(p), y_parallel[p](d[p])];
        })
    );
}



//**********************Clusters**********************
var k = 6

var height_cluster = parseFloat(d3.select('#Div_clusters').style('height').slice(0, -2)) / k / 1.5;
var width_clusters = parseFloat(d3.select('#Div_clusters').style('width').slice(0, -2));

var margin_clusters = { top: 0.02 * width_clusters, right: 0.03 * width_clusters, bottom: 0.02 * width_clusters, left: 0.03 * width_clusters };

// 添加绘制Clusters的画布svg_clusters
// 注意之后svg_cluster指svg里面那个用来画图的g
var svg_clusters = d3.select("#Div_clusters")
    .attr('class', 'svg_cluster')
    .append("svg")
    .attr("width", width_clusters)
    .attr("height", 1.5 * height_cluster * k)
    .append("g")
    .attr('class', 'brush_on_clusters')
// .attr("transform",
//     "translate(" + margin_clusters.left + "," + margin_clusters.top + ")")

// 创建比例尺scale

var y_clusters = d3.scaleLinear()
    .domain([0, 51])
    .range([height_cluster, 0])
    .nice()


//**********************Space**********************    
var width_space = parseFloat(d3.select('#Div_space').style('width').slice(0, -2));
var height_space = parseFloat(d3.select('#Div_space').style('height').slice(0, -2));
var margin_space = { left: 0.05 * width_space, top: 0.05 * height_space };

// 创建绘制Team Space的画布svg_space
var svg_space = d3.select("#Div_space")
    .append('svg')
    .attr('class', 'svg_space')
    .attr('width', width_space)
    .attr('height', height_space);

// 创建比例尺scale
var y_space = d3.scaleLinear().domain([0, 1]).range([0, height_space - 2 * margin_space.top]);
var x_space = d3.scaleLinear().domain([0, 1]).range([0, width_space - 2 * margin_space.left]);

// 绘制坐标轴
svg_space.append("g")
    .attr("transform", "translate(" + margin_space.left + "," + 0.5 * height_space + ")")
    .call(d3.axisTop(x_space).ticks(10))

svg_space.append("g")
    .attr("transform", "translate(" + 0.5 * width_space + "," + margin_space.top + ")")
    .call(d3.axisRight(y_space).ticks(10))



//**********************Brush**********************
// 依照刷选绘制足球轨迹
function track(pass) {
    d3.selectAll(".track").remove()

    var contexts = [];
    pass.forEach(function (d) {
        if (!contexts.includes(d.Pass_ID)) {
            contexts.push(d.Pass_ID)
        }
    })

    var map = d3.scalePoint().domain(contexts).range([0, 1])

    svg_space.append('g')
        .attr('class', 'removable team_space')
        .selectAll('circle')
        .data(pass)
        .enter(0)
        .append('circle')
        .attr('class', 'track')
        .attr('cx', d => x_space(parseFloat(d['left-right'])) + margin_space.left)
        .attr('cy', d => y_space(parseFloat(d['back-front'])) + margin_space.top)
        .attr('r', d => d.Y / (50 / width_space) / 150)
        .attr('fill', d => d3.interpolateSpectral(map(d.Pass_ID)))
};

// 依照刷选绘制平行坐标图
function draw(id) {
    d3.selectAll(".foreground path").attr('visibility', 'hidden');
    var s = d3.selectAll(".foreground path").filter(function (d) {
        return id.includes(d.id)
    })
    s.attr('visibility', 'visible')
}

function highlight(pass_id) {
    d3.selectAll('.timepoint').attr("fill", (d, i) => {
        if (d.BallPossession == 1.0) {
            return "steelblue";
        } else {
            return "Crimson";
        }
    }).transition(1000).attr('r', 0.05 * height_timeline)
    var s = d3.selectAll(".timepoint").filter(function (d) {
        return pass_id.includes(d.Pass_ID)
    })
    s.transition(1000).attr('fill', 'orange').attr('r', 0.15 * height_timeline);
}


//**********************Histogram**********************
var svg_histogram = d3.select("#Div_histogram")
    .append("svg")
    .attr('class', 'svg_histogram')
    .attr("width", 800)
    .attr("height", 800)


//**********************初始化画布**********************
Initialize("Team Right")