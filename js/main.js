console.log("Hello World", d3);
puff.pollute(window);

var width = 800;
var height = 200;
var yearsPerPixel;
var pixelsPerYear;

function head(s,n){
    var n = (typeof n === "undefined") ? 10 : n;
    return s.slice(0,n);
}

function zipFields(s,keys){
    var keys = keys || Object.keys(s).sort();
    var seqs = keys.map(function(k){
	return s[k];
    });
    return map.apply(null, [a].concat(seqs));
}

function transformX(actual, low, high){
    var d = high-low;
    if(actual<0){
	console.log(actual,d,low,high,high-low);
    }
    return width*((actual-low)/d);
}

function log(v,b){
    return Math.log(v)/Math.log(b);
}

function round(v,b){
    return Math.round(v/b)*b;
}

function calcTics(range,n){
    var n = typeof n === "undefined" ? 10 : n;
    var d = range.max-range.min;
    var init;
    return;
}

function widenRange(range, amt){
    var amt = typeof amt === "undefined" ? 1.4 : amt;
    var d = range.max-range.min;
    var diff = (d*amt - d)/2;
    return {min:range.min-diff, max:range.max+diff};
}



var asNiceString = p_(JSON.stringify,null,'  ');

function containsOneOf(a){
    return function(s){
	return a.some(function(fragment){
	    return s.includes(fragment);
	});
    };
}

function minAndMaxDates(names,namesToYears){
    return reduce(
	function(ac,it){
	    if(it.min < ac.min) ac.min = it.min;
	    if(it.max > ac.max) ac.max = it.max;
	    return ac;
	},
	map(function(name){
	    return reduce(function(ac,it){
		if(it[0]<ac.min) ac.min = it[0];
		if(it[0]>ac.max) ac.max = it[0];
		return ac;
	    },namesToYears[name],
			  {min:Infinity, max:-Infinity});
	},names),
	{min:Infinity, max:-Infinity});
}

function adjustGamesList(data,namesToYears){
    var filterPhrases = rOn(document.querySelector("#filter-box").value,
		     split(","),
		     map(trim));
    console.log("Filter is", asNiceString(filterPhrases));
    var names = rOn(data,
		   map(p_(ix,
			  2)),
		   map(trim),
		   unique,
		   filter(containsOneOf(filterPhrases)));

    var selection = d3.select("#games").selectAll("span")
	    .data(names);
    selection
    	.enter()
	.append("span")
	.text(id)
	.attr("class","game-box");
    selection
	.text(id)
	.attr("class","game-box");
    selection
	.exit()
	.remove();
    var boundaries = widenRange(minAndMaxDates(names, namesToYears));

    var svg = d3.select("#timeline svg");
    
    svg.selectAll("circle")
	.transition()
	.duration(500)
	.attr("cx",function(d){
	    return transformX(d[0],boundaries.min,boundaries.max);
	})
	.attr("fill",function(d){
	    if(-1!==names.indexOf(d[2])){
		return "red";
	    } else {
		return "black";
	    }
	});
}

function main(data){
    var data = zipFields(data, a("year","yearName","game","info"));
    var namesToYears = {};
    data.forEach(function(d){
	var name = d[2].trim();
	var nameList = namesToYears[name] || [];
	namesToYears[name] = nameList;
	nameList.push(d);
    });
    adjustGamesList(data,namesToYears);
    document.querySelector("#filter-box").addEventListener('change',
							   function(){
							       adjustGamesList(data, namesToYears);
							   });
    var svg = d3.select("#timeline")
	    .append("svg")
	    .attr("width",width)
	    .attr("height",height)
	    .append("g");

    data = map(function(x){
	x.push(25+(Math.random()*(height-50)));
	return x;
    },data);

    var minYear = reduce(min2,map(p_(ix,0),data));
    var maxYear = reduce(max2,map(p_(ix,0),data));
    var range = widenRange({min:minYear, max:maxYear});
    // minYear = -2000;
    // maxYear = 4000;
    var yearRange = maxYear-minYear;
    yearsPerPixel = yearRange/width;
    pixelsPerYear = width/yearRange;

    svg.selectAll("circle")
	.data(data)
	.enter()
	.append("circle")
	.attr("cx",function(d){
	    return transformX(d[0],range.min,range.max);
	})
	.attr("cy",function(d){
	    return d[4];
	})
	.attr("r",5)
	.attr("fill","black");    
}

function loadStep(){
    d3.json("./data/observations.json",function(err, res){
	if(err instanceof Error){
	    throw err;
	} else {
	    main(res);
	}
    });
}

document.addEventListener('DOMContentLoaded', loadStep);

