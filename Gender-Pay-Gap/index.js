// Load the CSV data.
const stages = d3.csv("data/IndustryPayGap.csv", d3.autoType);

// Set up the bubble chart
const padding = 0.75;
const legwidth = 123;

// Dimensions of chart.
let margin = { top: 20, right: 100, bottom: 40, left: 100 },
    width = parseInt(d3.select('#chart').style('width'), 10) - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

let svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Scales: Radius and x
let r = d3.scaleSqrt()
    .domain([0, 1200])
    .range([5, 40]);

// Define x scale
let x = d3.scaleLinear()
    .domain([-10, 40])
    .range([0, width]);

// x-axis
let xAxis = d3.axisBottom(x)
    .tickFormat(d => d + "%")
    .tickSize(8)
    .tickPadding(5);

var xAxisEl = svg.append("g")
    .attr("class", "x axis bottom")
    .attr("transform", "translate(0," + height + ")");

// Add vertical line at x=0
svg.append("line")
    .attr("x1", x(0))
    .attr("y1", 0)
    .attr("x2", x(0))
    .attr("y2", height)
    .style("stroke", "grey")
    .style("stroke-width", "2px")
    .style("stroke-dasharray", "5,5");


var div = d3.select("#chart").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px");

// Add the x axis title.
xAxisEl.append("text")
  .attr("class", "axistitle")
  .attr("x", x(0))
  .attr("y", 50)
  .attr("dx", "4px")
  .attr("dy", "-1em")
  .style("text-anchor", "middle")
  .text("Median Pay Gap");
xAxisEl.call(xAxis);

// Load data.
// console.log(stages)
// Use the data in the chart
stages.then(function(data) {
    // Create node data for each bubble
    let nodes = data.map(function(d,i) {		
        return {
            id: "node"+i,
            y: height/2 + Math.random(),
            x: x(d.MedianDiffMedianHourlyPercent) + Math.random(),
            r: r(d.NumberOfCompanies),
			rate: d.MedianDiffMedianHourlyPercent,
            color: d.Color,
			data: d,
            name: d.Industry
        }
	});

    // console.log(data)
    // Create the circle SVG element
      const circle = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
            .attr("id", d => "circle"+d.id)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("fill", d => d.color)

    // Event listener tooltip for hover
    circle.on("mouseover", function(event,d) {
        div.transition()
            .duration(10)
            .style("opacity", .9);
        // Select the current circle element
        d3.select(this) 
            .style("opacity", 1) 
            .style("filter", "drop-shadow(0 0 7px rgba(0, 0, 0, 2))") 
            .style("cursor", "pointer")
    });

    // Event listener tooltip for Name label, relative to mouse position
    circle.on("mousemove", function(event,d) {
        div.html(
            d.data.Industry +
            '<br/>' + d.data.MedianDiffMedianHourlyPercent + '%'
            )
        .style("left", (event.pageX +10) + "px") 
        .style("top", (event.pageY -20) + "px"); 
    });

    // Removing tooltip and styling when mouse moves off of the circle
    circle.on("mouseout", function (event, d) { 
        div.transition()
            .duration(0)
            .style("opacity", 0)
        d3.select(this) 
          .style("filter", "none") 
    })
    circle.on("click", function(event, d) {
        window.location.href = d.data.Link + ".html";
    });
    
    // Simulation transitions for bubbles
    circle.transition()
        // Set the delay and duration of the bubbles
    	.delay((d,i) => i * 1)
    	.duration(0.2)
        // Set the radius of the bubbles based of of the data
    	.attrTween("r", d => {
      	    const i = d3.interpolate(0, d.r);
      	    return t => d.r = i(t);
    	});

	// Forces on the bubble
	simulation = d3.forceSimulation(nodes)
        // Set the vertical force along the x axis
		.force("y", d3.forceY(height/2).strength(0))
        // Set the horizontal force based of the data
		.force("x", d3.forceX(d => x(d.rate)))
        // Set a collision force that will prevent the bubbles from overlapping.
		.force("collision", d3.forceCollide().radius(d => d.r + padding).strength(0.5))
		.alpha(0.5)
		.alphaDecay(0);
	
    // Iterating to position the circles based off of the simulation positioning
      simulation.on("tick", () => {    
		circle
			.attr("cx", d => d.x)
			.attr("cy", d => d.y)
			.attr("fill", d => d.color);
		d3.selectAll(".industrylabel")
			.attr("x", d => d.x)
			.attr("y", d => d.y)
	});

    // Legend
    let legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", "translate("+(width-legwidth)+",0)");
        
    legend.append("text")
        .attr("class", "axistitle")
        .attr("x", legwidth/2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .text("Number of Companies")
        // Gap between title an circles
        .attr("dy", "-1.5em"); 


   legend.selectAll(".ind")
        .data([100, 750, 1500])
        .join("circle")
        .attr("class", "ind")
        .attr("r", d => r(d))
        .attr("cx", legwidth/2)
        .attr("cy", d => legwidth-r(d));

    legend.selectAll("#legend text.leglabel")
        .data([100, 750, 1500])
        .join("text")
        .attr("class", "leglabel")
        .attr("x", legwidth/2)
        .attr("y", d => legwidth-2*r(d))
        .attr("dy", 0)
        .text(d => d3.format(",")(d));


  
    // Search
    const searchBox = document.getElementById("search-box");
    const dropdownList = document.getElementById("dropdown-list");
    let isSearchBoxFocused = false;
    
    // Add event listener to search box to keep track of focus
    searchBox.addEventListener("focusin", function() {
        isSearchBoxFocused = true;
    });
    
    searchBox.addEventListener("focusout", function() {
        isSearchBoxFocused = false;
    });
    
    // Add event listener to document to hide dropdown menu when clicked outside of search box or dropdown menu
    document.addEventListener("click", function(event) {
        if (!event.target.closest("#search-box-container") && !event.target.closest("#dropdown-container")) {
        dropdownList.innerHTML = "";
        }
    });
  
    // Add event listener to search box to detect input changes
    searchBox.addEventListener("input", function() {
        // Get search term from search box and convert to lowercase
        const searchTerm = searchBox.value.toLowerCase();
        // Filter nodes based on search term
        const results = nodes.filter(node => {
        const textContent = node.name.toLowerCase();
        return textContent.includes(searchTerm);
        });

    // Clear previous search results from dropdown list
    dropdownList.innerHTML = "";

    // If there are search results, create dropdown options for each result
    if (results.length > 0) {
        results.forEach(result => {
        // Create a new dropdown option for each result
        const option = document.createElement("div");
        option.classList.add("dropdown-option");
        option.textContent = result.name;
    
        // Add event listener to option to highlight selected node
        option.addEventListener("click", function() {
            console.log(result.name); // Print selected result to console
            // Clear search box and dropdown list
            searchBox.value = "";
            dropdownList.innerHTML = "";
            // Get the link from the data and navigate to the corresponding HTML page
            const link = result.data.Link + ".html";
            window.location.href = link;
        });
        
        // Add option to dropdown list
        dropdownList.appendChild(option);
        });
    } else {
        // If no search results, display a message in dropdown list
        const message = document.createElement("div");
        message.classList.add("dropdown-message");
        message.textContent = "No results found";
        dropdownList.appendChild(message);
    }
    });

    // Add event listener to document to resume search when user clicks on search box again
    document.addEventListener("click", function(event) {
    if (event.target.closest("#search-box-container") && !isSearchBoxFocused) {
        // If search box is clicked and not currently focused, focus on search box
        searchBox.focus();
    }
    });
});
