// Load the CSV data.
const stages = d3.csv("data/EmployerPayGap.csv", d3.autoType);

// Choose the industry for this page
const selectedIndustry = "Professional Services";

// Set up the bubble chart
const padding = 0.75;
const legwidth = 123;

let margin = { top: 20, right: 100, bottom: 50, left: 100 },
  width = parseInt(d3.select('#chart').style('width'), 10) * 0.80- margin.left - margin.right,
  height = 520 - margin.top - margin.bottom;

let svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right+100) 
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Set the radius scale, depends on number of bubbles, make sure they all fit in the chart
let r = d3.scaleSqrt()
  .domain([0, 1200])
  .range([1,4]);

// Set the x scale.
let x = d3.scaleLinear()
  .domain([-40, 50])
  .range([0, width]);

// Create the x axis.
let xAxis = d3.axisBottom(x)
  .tickFormat(d => d + "%")
  .tickSize(8)
  .tickPadding(5);

// Append the x axis to the chart.
var xAxisEl = svg.append("g")
  .attr("class", "x axis bottom")
  .attr("transform", "translate(0," + height + ")");

// Add a vertical line at x=0.
svg.append("line")
  .attr("x1", x(0))
  .attr("y1", 0)
  .attr("x2", x(0))
  .attr("y2", height)
  .style("stroke", "grey")
  .style("stroke-width", "2px")
  .style("stroke-dasharray", "5,5")

// Add a div for the tooltip.
var div = d3.select("#chart")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("border", "solid")
  .style("border-width", "0.5px")
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

// Call the x axis.
xAxisEl.call(xAxis);

// Info panel
let rectWidth = 200;
let rectHeight = 100;
let rectX = width + margin.right+80;
let rectY = margin.top;
let infoDiv = d3.select("#chart")
  .append("div")
  .attr("class", "info")
  .style("position", "absolute")
  .style("right", "0")
  .style("top", "0")
  .style("width", rectWidth + "px")
  .style("min-height", "100px") 
  .style("background-color", "white")
  .style("display", "none");

// Close info pop up button
function hideInfoPanel() {
  // Select the info panel
  var infoDiv = d3.select(".info");
  // Hide the info panel
  infoDiv.style("display", "none");
  d3.selectAll("circle").attr("stroke", "none");
}

// Create the color gradient of the bubbles
// Define a function to create a darker version of a color
function colorDarker(percent, color) {
  // Convert the input color string to a d3 color object
  let hex = d3.color(color);
  // If the color is invalid then return the input color
  if (!hex) {
    // console.warn(`Invalid color: ${color}`);
    return color;
  }
  // Extract the RGB components from the color object
  let rgb = [hex.r, hex.g, hex.b];
  // Get the darker RGB by reducing each component by the given percentage
  let darkerRGB = rgb.map(function(d) {
    return Math.round(d * (1 - percent/100));
  });
  // Create a new d3 color object using the darker RGB 
  return d3.rgb(darkerRGB[0], darkerRGB[1], darkerRGB[2]);
}
  
stages.then(function(data) {
  // Create node data for each node, filter from chosen industry
  let nodes = data.filter(d => d.Industry === selectedIndustry).map(function(d, i) {		
    return {
      id: "node"+i,
      y: height/2 + Math.random(),
      x: x(d.DiffMedianHourlyPercent) + Math.random(),
      r: r(d.Midpoint),
      rate: d.DiffMedianHourlyPercent, 
      color: colorDarker(d.DiffMedianHourlyPercent, d.Color),
      data: d,
      name: d.EmployerName
    }
  });

  // Function to trigger the Information pop up
  function infoPopUp(event, d) {
    // Calculating the difference in pay
    // Set men's hourly wage to £1
    const menHourlyWage = 1; 
    // Get the gender pay gap percentage from the clicked data
    const genderPayGapPercent = d.data.DiffMedianHourlyPercent;
    // Convert the gender pay gap percentage to decimal form
    const genderPayGapDecimal = genderPayGapPercent / 100;
    // Calculate women's hourly wage based on men's hourly wage and gender pay gap percentage
    const womenHourlyWage = menHourlyWage * (1 - genderPayGapDecimal);
    // Assign the color of the boxes based off of the color of the bubbles but darker
    const colorBar = d3.color(d.data.Color).darker(1.5);
    const companyLink = d.data.CompanyLinkToGPGInfo;

    let linkHtml = "";
    // Some companys had linked their own reports in the data
    // Html link to company website
    if (companyLink) {
      linkHtml = `<a href="${companyLink}"target="_blank">Gender Pay Gap Report published by ` + d.data.EmployerName;
    } else {
      linkHtml = "";
    }

    // Remove stroke from any previous circles
    d3.selectAll("circle").attr("stroke", "none");

    // Add stroke to the clicked circle
    // console.log(d.id)
    d3.select("circle#circle"+d.id)
      .attr("stroke", "black")
      .attr("stroke-width", 3);
    // Hide any previous info box
    d3.selectAll(".info").style("display", "none");

    // Get the data for the stacked percentage chart
    var quartileData = [    { quartile: "Q1", percentage: d.data.FemaleTopQuartile },    { quartile: "Q2", percentage: d.data.FemaleUpperMiddleQuartile },    { quartile: "Q3", percentage: d.data.FemaleLowerMiddleQuartile},    { quartile: "Q4", percentage: d.data.FemaleLowerQuartile }  ];

    // Create HTML content for the info box
    var html = "<button class='close-button' onclick='hideInfoPanel()'>X</button>" +

     "<h3>" + d.data.EmployerName + "</h3>" +
      "<h4>" + d.data.EmployerSize + " employees</h4>" +
      "<div class='box' style='display:inline-block; background-color:"+colorBar+";'><div>Median</div><br>" + 
      "<div class='value'>" + d.data.DiffMedianHourlyPercent + "%</div></div>" +
      "<div class='box' style='display:inline-block; background-color:"+colorBar+";'><div>Mean</div><br>" + 
      "<div class='value'>" + d.data.DiffMeanHourlyPercent + "%</div></div>" +
      "<h5>For every £1 earned by a man, a woman earns £" + womenHourlyWage.toFixed(2) + "</h5>" +
      "<h4 class='small-header'>Percentage of women in each pay quartile</h4>";
  
    // Add horizontal bars for each quartile
    for (var i = 0; i < quartileData.length; i++) {
      var quartile = quartileData[i];
      html += "<div class='bar-wrapper'>" +
        "<div class='bar-label'>" +
        quartile.quartile +
        "</div>" +
        "<div class='bar-fill' style='width: " + quartile.percentage + "%;'></div>" +
        "<div class='bar-fill' style='width: " + quartile.percentage + "%;'></div>" +
        "<div class='bar-percentage'>" +
        quartile.percentage + "%" +
        "</div></div>";
    }

    // Continue the HTML code for the Bonus Pay
    html += "<div class='small-header'> Bonus pay gap </div>"+
    "<div class='bonus-info'>" +d.data.MaleBonusPercent +"% of men receive bonuses"+ 
    "<br>" + d.data.FemaleBonusPercent +"% of women receive bonuses </div>"+
    "<div class='bonusbox' style='display:inline-block; background-color:"+colorBar+";'><div>Median</div><br>" + 
    "<div class='value'>" + d.data.DiffMedianBonusPercent + "%</div></div>" +
    "<div class='bonusbox' style='display:inline-block; background-color:"+colorBar+";'><div>Mean</div><br>" + 
    "<div class='value'>" + d.data.DiffMeanBonusPercent + "%</div></div>" + 
    "<div class='companylink'>" + linkHtml + "</div>" ;

    // Show the new info box and highlight the clicked circle
    infoDiv.style("display", "block")
      .html(html)
      .style("left", (rectX) + "px")
      .style("top", (rectY + rectHeight+10) + "px");

    // Making sure no other events are triggered by the click
    event.stopPropagation();
  }

  // Create the circle SVG element
  const circle = svg.append("g")
    .selectAll("circle") 
    .data(nodes) 
    .join("circle") 
  // Assigning attributes (co-ordinates and color) based on the data
    .attr("id", d => "circle" + d.id) 
    .attr("cx", d => d.x) 
    .attr("cy", d => d.y) 
    .attr("fill", d => d.color) 

  // Event listener tooltip
  circle.on("mouseover", function (event, d) { 
    div.transition()
      .duration(10)
      .style("opacity", .9); 
    // Select the current circle element
    d3.select(this) 
      .style("opacity", 1)
      .style("filter", "drop-shadow(0 0 7px rgba(0, 0, 0, 2)")
      .style("cursor", "pointer")
    div.html( 
      d.data.EmployerName 
      )
      // Positioning of the tooltip depends on the mouse
      .style("left", (event.pageX) + "px") 
      .style("top", (event.pageY - 30) + "px"); 
  })

  // Event listner to remove previous style
  circle.on("mouseout", function (event, d) { 
    div.transition()
        .duration(0)
        .style("opacity", 0);
    d3.select(this) 
      .style("filter", "none")
  })

  // Info pop up when user clicks on the bubble
  circle.on("click", function(event, d) {
    infoPopUp(event,d)
  });

  // Simulation transitions for bubbles
  circle.transition() 
    .delay((d,i) => i * 1) 
    .duration(0.2) 
    // Set the radius of the buubbles based of of the data
    .attrTween("r", d => { 
          const i = d3.interpolate(0, d.r); 
          return t => d.r = i(t); 
    });

  // Forces
  simulation = d3.forceSimulation(nodes)
    // Set the vertical force along the x axis
    .force("y", d3.forceY(height/2).strength(0)) 
    // Set the horizontal force based of the data

    .force("x", d3.forceX(d => x(d.rate)))
    // Set a collision force that will prevent the nodes from overlapping.
    .force("collision", d3.forceCollide().radius(d => d.r + padding).strength(0.5)) 
    .alpha(0.1) 
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

  // Search box feature
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
    // Filter nodes based on search term and industry type
    const results = nodes.filter(node => {
      const textContent = node.name.toLowerCase();
      const industry = node.data.Industry;
      return industry === selectedIndustry && textContent.includes(searchTerm);
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
        // console.log(result.name); // Print selected result to console
        // Clear search box and dropdown list
        searchBox.value = "";
        dropdownList.innerHTML = "";
        // Remove stroke from all circles and add stroke to selected node
        d3.selectAll("circle")
          .attr("stroke", "none")
          .filter(function(d) {
            return d.data.EmployerName === result.name;
          })
          .attr("stroke", "black")
          .attr("stroke-width", 3);
          // Call infoPopUp function with the clicked data
         infoPopUp(event, result);
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
