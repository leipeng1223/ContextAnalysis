id = []; // 全局变量id，用来筛选数据
pass = []; // 全局变量pass，用来储存筛选出的数据

//**********************Control Panel**********************
var panel = d3.select("#Control_Left").append('div').attr('id', 'panel')

panel.append('svg').attr('height',50)

// data选择框
panel.append('div').append('text').text('Select the dataset you want to use:')
var dataset = ["Team Right", "Team Left", 'Changed']
var dropdownButton_data = panel.append('select').attr('class', 'select')
dropdownButton_data
    .selectAll('myOptions') // Next 4 lines add 6 options = 6 colors
    .data(dataset)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .style('font-size','20px')
    .attr("value", function (d) { return d; })

function changeData(myOptions) {
    Initialize(myOptions)
}

dropdownButton_data.on("change", function (d) {
    // recover the option that has been chosen
    var selectedOption = d3.select(this).property("value")
    // run the updateParallel function with this selected option
    changeData(selectedOption)
})

panel.append('svg').attr('height',50)

// parallel选择框
panel.append('div').append('text').text('Select the cluster you want to show:')
var c = ["All", "k0", "k1", "k2", "k3", "k4", "k5", "Clear"]
var dropdownButton_cluster = panel.append('select').attr('class', 'select')
dropdownButton_cluster
    .selectAll('myOptions') // Next 4 lines add 6 options = 6 colors
    .data(c)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .style('font-size','20px')
    .attr("value", function (d) { return d; })

function updateParallel(myOptions) {
    d3.selectAll('.brushed_lines').remove()
    d3.selectAll('.track').remove()
    d3.selectAll('.brush_on_parallel').call(d3.brush().clear)
    d3.selectAll('.brush_on_clusters').call(d3.brush().clear)


    d3.select('.legend').remove()
    legend(legend_2)

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


//**********************Stack**********************
var svg_stack = d3.select("#Div_stack")
    .append("svg")
    .attr('class', 'svg_stack')
    .attr("width", 2400)
    .attr("height", 150)

var margin_stack = { top: 10, right: 0, bottom: 75, left: 20 },
    width_stack = 2400 - margin_stack.left - margin_stack.right,
    height_stack = 150 - margin_stack.top - margin_stack.bottom;

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
var margin_timeline = { top: 20, right: 0, bottom: 30, left: 20 },
    width_timeline = 2400 - margin_timeline.left,
    height_timeline = 100,
    brushHeight = 20;

const svg_timeline = d3
    .select("#Div_timeline")
    .append("svg")
    .attr('width', width_timeline + margin_timeline.left)
    .attr('height', height_timeline + margin_timeline.bottom)

// 加入一个tooltip
var div = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


//**********************Clusters**********************
var size_clusters = 800; // Cluster画布宽, 可调参数, 其余参数自动计算

var margin_clusters = { top: 50, right: 30, bottom: 50, left: 30 },
    width_clusters = size_clusters - margin_clusters.left - margin_clusters.right,
    height_clusters = width_clusters / 8.5 // 默认cluster长宽 7:1

var k = 6

// 添加绘制Clusters的画布svg_clusters
// 注意之后svg_cluster指svg里面那个用来画图的g
var svg_clusters = d3.select("#Div_clusters")
    .attr('class', 'svg_cluster')
    .append("svg")
    .attr("width", size_clusters)
    .attr("height", 1.5 * height_clusters * k)
    .append("g")
    .attr('class', 'brush_on_clusters')
// .attr("transform",
//     "translate(" + margin_clusters.left + "," + margin_clusters.top + ")")

// 创建比例尺scale

var y_clusters = d3.scaleLinear()
    .domain([0, 51])
    .range([height_clusters, 0])
    .nice()


//**********************Space**********************    
var width_space = 800,
    height_space = 800;

var margin_space = 20;

// 创建绘制Team Space的画布svg_space
var svg_space = d3.select("#Div_space")
    .append('svg')
    .attr('class', 'svg_space')
    .attr('width', width_space)
    .attr('height', height_space);

// 创建比例尺scale
var y_space = d3.scaleLinear().domain([0, 1]).range([0, height_space - 2 * margin_space]);
var x_space = d3.scaleLinear().domain([0, 1]).range([0, width_space - 2 * margin_space]);

// 绘制坐标轴
svg_space.append("g")
    .attr("transform", "translate(" + margin_space + "," + 0.5 * height_space + ")")
    .call(d3.axisTop(x_space).ticks(10))

svg_space.append("g")
    .attr("transform", "translate(" + 0.5 * width_space + "," + margin_space + ")")
    .call(d3.axisRight(y_space).ticks(10))


//**********************Legend**********************
d3.select("#Div_parallel")
    .append("svg")
    .attr('class', 'svg_legend')
    .attr("width", 2400)
    .attr("height", 50)
    .append('g')

var legend_1 = {
    color: d3.scaleSequential([-25, 25], d3.interpolateRdYlBu),
    title: "Time from the pass(0):",
    id: ".svg_legend",
    marginLeft: 30,
    ticks: 5,
    tickFormat: d => parseInt(d),
    width: 500,
    height: 50,
};

var legend_2 = {
    color: d3.scaleOrdinal(['k0', 'k1', 'k2', 'k3', 'k4', 'k5'], d3.schemeSet2),
    title: "Clusters:",
    tickSize: 0,
    id: '.svg_legend',
    marginLeft: 30,
    ticks: 5,
    width: 500,
    height: 50,
};

legend(legend_2)


//**********************Parallel**********************
var margin_parallel = { top: 30 * 2, right: 20 * 2, bottom: 10 * 2, left: 20 * 2 },
    width_parallel = 2400,
    height_parallel = 600;

var x_parallel = d3.scalePoint(),
    y_parallel = {},
    dragging = {};

var line = d3.line(),
    background,
    foreground;

// 创建绘制平行坐标的画布svg_parallel
var svg_parallel = d3.select("#Div_parallel")
    .append("svg")
    .attr('class', 'svg_parallel')
    .attr("width", width_parallel)
    .attr("height", height_parallel)
    .append("g")
    .attr("transform", "translate(" + margin_parallel.left + "," + margin_parallel.top + ")");

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

    //console.log(contexts)

    var map = d3.scalePoint().domain(contexts).range([0, 1])

    svg_space.append('g')
        .attr('class', 'removable team_space')
        .selectAll('circle')
        .data(pass)
        .enter(0)
        .append('circle')
        .attr('class', 'track')
        .attr('cx', d => x_space(d['left-right'] + margin_space))
        .attr('cy', d => y_space(d['back-front'] + margin_space))
        .attr('r', d => d.Y / 10)
        .attr('fill', d => d3.interpolateSpectral(map(d.Pass_ID)))
};

// 依照刷选绘制平行坐标图
function draw(pass) {
    d3.selectAll(".foreground path").attr('visibility', 'hidden');
    d3.selectAll(".brushed_lines").remove();
    d3.selectAll('.brush_on_parallel').call(d3.brush().clear)
    d3.select('.legend').remove()
    legend(legend_1)

    brushed_lines = svg_parallel
        .append("g")
        .attr("class", "removable brushed_lines")
        .selectAll("path")
        .data(pass)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "parallel_lines")
        .attr("fill", "none")
        .attr("shape-rendering", "crispEdges")
        .attr("stroke", function (d) {
            return d3.interpolateRdYlBu((parseInt(d.Y) + 1) / 51)
        })
        .attr("opacity", 0.7);
}


//**********************Histogram**********************
var svg_histogram = d3.select("#Div_histogram")
    .append("svg")
    .attr('class', 'svg_histogram')
    .attr("width", 800)
    .attr("height", 800)


//**********************初始化画布**********************
Initialize("Team Right")