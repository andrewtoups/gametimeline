console.log("Hello World", d3);
puff.pollute(window);

var width = 800;
var height = 400;
var yearsPerPixel;
var pixelsPerYear;

d3.selection.prototype.moveToFront = function() {  
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
d3.selection.prototype.moveToBack = function() {  
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    });
};

var unselectedColor = "rgba(0,0,0,0.025)";
var unselectedTextColor = "rgba(0,0,0,0.10)";

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
	//console.log(actual,d,low,high,high-low);
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
    if(a.length===0){
	return function(s){
	    return true;
	};
    } else {
	return function(s){
	    return a.some(function(fragment){
		return s[2].includes(fragment);
	    });
	};
    }
}

function minAndMaxDates(data){
    return reduce(function(ac,d){
	var mn = min2(ac.min,d[0]);
	var mx = max2(ac.max,d[0]);
	return {min:mn, max:mx};
    },data,{min:Infinity,max:-Infinity});
}

function byDate(r1,r2){
    var a = r1[0];
    var b = r2[0];
    if(a<b) return -1;
    if(b>a) return 1;
    return 0;
}

function emptyP(a){
    return a.length === 0;
}

function adjustGamesList(data,namesToYears){
    var filterPhrases = rOn(document.querySelector("#filter-box").value,
		     split(","),
		     map(trim));
    console.log("Filter is", asNiceString(filterPhrases));
    var names = rOn(data,
		    filter(containsOneOf(filterPhrases)));
    var selectionWasEmpty = document.querySelector("#filter-box").value.trim() === "";
    console.log(names.length)
    names.sort(byDate);
    console.log(names.length)
    // console.log(names.slice(0,3));
    // console.log(names.map(id).reverse().slice(0,3));

    var noteString = ["<div>","earliest: ", first(names)[2],":", first(names)[1],"<br>",
		      "latest:", last(names)[2], ":", last(names)[1], "</div>"].join("");

    // d3.select("#notes")
    // 	.data([noteString])
    // 	.enter()
    // 	.append("div")
    // 	.html(noteString);
    document.querySelector("#notes").innerHTML = noteString;

    var selection = d3.select("#games").selectAll("span")
	    .data(rOn(names,
		      p_(unique,function(d){
			  return d[2];
		      })));
    selection
    	.enter()
	.append("span")
	.text(third)
	.attr("class","game-box");
    selection
	.text(third)
	.attr("class","game-box");
    selection
	.exit()
	.remove();
    var boundaries = widenRange(minAndMaxDates(names, namesToYears));
    if(boundaries.min === boundaries.max){
	boundaries.min = boundaries.min - 50;
	boundaries.max = boundaries.max + 50;
    }
    console.log("Boundaries",boundaries);

    var svg = d3.select("#timeline svg");

    var items = svg.selectAll(".item");
    items.transition()
        .duration(500)
        .attr("transform",function(d){
            return translate(transformX(d[0],boundaries.min,boundaries.max),d[4]);
        });
    items.select("text")
        .transition()
        .duration(500)
        .style("fill",function(d){
            if(!selectionWasEmpty && containsOneOf(filterPhrases)(d)){
                d.selected = true;
                return "rgba(255,0,0,1)";
            } else {
                d.selected = false;
                return unselectedTextColor;
            }
        });
    items.select("circle")
        .transition()
        .duration(500)
        .attr("fill",function(d){
            if(d.selected){
                return "rgba(255,0,0,1)";
            } else {
                return unselectedTextColor;
            }
        });               
}

function addYCoordinate(data){
    var i = 0;
    return rOn(data,
	       sort(2),
	       sort(0),
	       map(function(a){
		   a.push(Math.random()*(height-50)+25);
		   i++;
		   return a;
	       }));
}

function scaleYears(data){
    data.forEach(function(d){
        var y = Math.abs(d[1]);
        if(y<10000) return;
        if(y>1e6) d[1] = d[1]*1e-1;
        if(y>1e9) d[1] = d[1]*1e-3;
    });
}

function translate(x,y){
    return "translate("+[x,y].join(",")+")";
}

function main(data){
    var data = zipFields(data, a("year","yearName","game","info"));
    scaleYears(data);
    data.sort(byDate);
    document.querySelector("#filter-box").value = "";
    var namesToYears = {};
    data.forEach(function(d){
	var name = d[2].trim();
	var nameList = namesToYears[name] || [];
	namesToYears[name] = nameList;
	nameList.push(d);
    });
    adjustGamesList(data,namesToYears);
    document.querySelector("#filter-box").value = "";
    document.querySelector("#filter-box").addEventListener('change',
							   function(){
							       adjustGamesList(data, namesToYears);
							   });
    width = document.querySelector("#timeline").clientWidth;
    height = Math.round(0.80*window.innerHeight);

    d3.select("#games").attr("height",height);
    
    console.log("w,h",width,height);
    var svg = d3.select("#timeline")
	    .append("svg")
	    .attr("width",width)
	    .attr("height",height)
	    .append("g");

    data = addYCoordinate(data);

    var minYear = reduce(min2,map(p_(ix,0),data));
    var maxYear = reduce(max2,map(p_(ix,0),data));
    var range = widenRange({min:minYear, max:maxYear});
    // minYear = -2000;
    // maxYear = 4000;
    var yearRange = maxYear-minYear;
    yearsPerPixel = yearRange/width;
    pixelsPerYear = width/yearRange;

    svg.selectAll(".item")
        .data(data)
        .enter()
        .append("g")
        .attr("class","item")
        .attr("transform",function(d){
            return translate(transformX(d[0],range.min,range.max),d[4]);
        })
        .call(function(g){
            g.append("circle")
                .attr("cx",0)
                .attr("cy",0)
                .attr("r",5)
                .attr("fill",unselectedColor);
            g.append("text")
                .attr("x",0)
                .attr("y",-6)
                .text(function(d){
	            return d[2] + (d[3] ? d[3] : "") + " : " + d[1];
	        })
	        .attr("text-anchor","middle")
	        .style("fill",unselectedTextColor);
        })
        .on("mouseover",function(d){
            d3.select(this).select("text").transition().duration("200").style("fill","black");
            d3.select(this).select("circle").transition().duration("200").style("fill","black");
        })
        .on("mouseout",function(d){
            if(d.selected){
                d3.select(this).select("text").transition().duration("200").style("fill","rgba(255,0,0,1)");
                d3.select(this).select("circle").transition().duration("200").style("fill","rgba(255,0,0,1)");
            }else{
                d3.select(this).select("text").transition().duration("200").style("fill",unselectedTextColor);
                d3.select(this).select("circle").transition().duration("200").style("fill",unselectedColor);
            }
        });

    // svg.selectAll("circle")
    //     .data(data)
    //     .enter()
    //     .append("circle")
    //     .attr("cx",function(d){
    //         return transformX(d[0],range.min,range.max);
    //     })
    //     .attr("cy",function(d){
    //         return d[4];
    //     })
    //     .attr("r",5)
    //     .attr("fill",unselectedColor)
    //     .on('mouseover',function(d){
    //         if(!d.selected){
    //     	d3.select(this)
    //     	    .transition()
    //     	    .duration("200")
    //     	    .attr("fill","black");
    //         }
    //     })
    //     .on('mouseout',function(d){
    //         if(!d.selected){
    //     	d3.select(this)
    //     	    .transition()
    //     	    .duration("200")
    //     	    .attr("fill",unselectedColor);
    //         }
    //     });

    // svg.selectAll("text")
    //     .data(data)
    //     .enter()
    //     .append("text")
    //     .attr("x",function(d){
    //         return transformX(d[0],range.min,range.max);
    //     })
    //     .attr("y",function(d){
    //         return d[4]-6;
    //     })
    //     .text(function(d){
    //         return d[2] + (d[3] ? d[3] : "") + " : " + d[1];
    //     })
    //     .attr("text-anchor","middle")
    //     .attr("fill",unselectedColor)
    //     .on('mouseover',function(d){
    //         if(!d.selected){
    //     	d3.select(this)
    //     	    .transition()
    //     	    .duration("200")
    //     	    .attr("fill","black");
    //         }
    //     })
    //     .on('mouseout',function(d){
    //         if(!d.selected){
    //     	d3.select(this)
    //     	    .transition()
    //     	    .duration("200")
    //     	    .attr("fill",unselectedColor);
    //         }
    //     }); 
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

