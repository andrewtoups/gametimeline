(function () {

  if ( typeof window.CustomEvent === "function" ) return false;

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
    return undefined;
})();

function scaleYear(y){
    var ya = Math.abs(y);
    if(ya<10000) return y;
    if(ya>1e6) return y*1e-1;
    if(ya>1e9) return y*1e-3;
    return y;
}

function remapData(data){
    var n = data.year.length;
    var output = [];
    for(var i =0; i<n; i++){
        output.push({
            id:i,
            year:scaleYear(data.year[i]),
            yearName:data.yearName[i],
            game:data.game[i],
            game_lower:data.game[i].toLowerCase(),
            info:data.info[i] ? data.info[i].trim() : data.info[i],
            y:Math.random()*0.8+0.1
        });
    }
    return output;
}

function loadStep(){
    d3.json("./data/observations.json",function(err, res){
	if(err instanceof Error){
	    throw err;
	} else {
	    main(remapData(res));
	}
    });
}


document.addEventListener('DOMContentLoaded', loadStep);

function transformX(actual, low, high,elementWidth){
    var d = high-low;
    if(actual<0){
	//console.log(actual,d,low,high,high-low);
    }
    var r = elementWidth*((actual-low)/d);
    if(isNaN(r)) debugger
    return r;
}

function translate(x,y){
    return "translate("+[x,y].join(",")+")";
}

function scale(x,y){
    return "scale("+[x,y].join(",")+")";
}

function idOf(d){
    return d.id;
}

function circleClickHandler(d){
    var game = d.game;
    document.querySelector("#filter-box").value = game;
    var evt = new CustomEvent("change",{});
    document.querySelector("#filter-box").dispatchEvent(evt);
}

function makeYearMarkers(data){
    var range = dataSelectionToRange(data);
    var largest = puff.max(Math.abs(range.min),Math.abs(range.max));
    var step = 1;
    var years = [];
    var year = 0;
    var id = 0;
    while(year<largest){
        year = year + yearToStep(year);
        years.push({year:year,id:id++});
        years.push({year:-year,id:id++});
    }
    return years;
    function yearToStep(year){
        if(year<5000) return 10;
        if(year<10000) return 1000;
        if(year<1000000) return 10000;
        if(year<100000000) return 1000000;
        return 100000000;
    }
}

function updateSelection(selections,containers,parentW,parentH,range){
    range = range || getRange(selections);
    var oldRange = containers.groupContainer.attr("rangeMin") ? {
        min:+(containers.groupContainer.attr("rangeMin")),
        max:+(containers.groupContainer.attr("rangeMax"))
    } : range;
    var mn = range.min;
    var mx = range.max;
    var omn = oldRange.min;
    var omx = oldRange.max;
    containers.groupContainer.attr("rangeMin",mn).attr("rangeMax",mx);
    Object.keys(selections).forEach(function(k){
        var selection = selections[k];
        var container = containers[k];
        if(container){
            var s = container.selectAll(".item")
                    .data(selection,idOf);
            s.transition().duration(500)
                .attr("transform",function(d){
                    return translate(transformX(d.year,mn,mx,parentW),d.y*parentH) + (k==="selected" ? " "+scale(1.5,1.5) : "");
                });
            s
                .enter()
                .append("g").attr("class","item")
                .attr("transform",function(d){
                    return translate(transformX(d.year,omn,omx,parentW),d.y*parentH) + (k==="selected" ? " "+scale(1.5,1.5) : "");
                })
                .call(function(g){
                    g.append("circle")
                        .attr("cx",0)
                        .attr("cy",0)
                        .attr("r",5)
                        .on("click",circleClickHandler)
                        .on("mouseover",bindInput);
                    g.append("text")
                        .attr("x",0)
                        .attr("y",-6)
                        .text(function(d){
	                    return d.game+ (d.info ? " "+d.info+" " : "") + " : " + d.yearName;
	                })
	                .attr("text-anchor","middle");
                })
                .transition().duration(500)
                .attr("transform",function(d){
                    return translate(transformX(d.year,mn,mx,parentW),d.y*parentH) + (k==="selected" ? " "+scale(1.5,1.5) : "");
                });
            s.exit()
                .remove();
        }
    });
    updateYearMarkers(containers);
}

function widenRange(range, amt){
    var amt = typeof amt === "undefined" ? 1.4 : amt;
    var d = range.max-range.min;
    var diff = (d*amt - d)/2;
    if(diff === 0) diff = 20;
    return {min:Math.round(range.min-diff), max:Math.round(range.max+diff)};
}


function dataSelectionToRange(data,pad){
    pad = typeof pad === "undefined" ? 1.25 : pad;
    var mn = Infinity;
    var mx = -Infinity;
    var n = data.length;
    var d = undefined;
    for(var i  = 0; i<n;i++){
        d = data[i];
        if(d.year < mn) mn = d.year;
        if(d.year > mx) mx = d.year;
    }
    return widenRange({min:mn,max:mx},pad);
}

function getRange(data){
    if(!data.selected || data.selected.length === 0){
        return dataSelectionToRange(data.unselected);
    } else {
        return dataSelectionToRange(data.selected);
    }
}

function setupSearch(box,data,containers){
    box.addEventListener("change",function(){
        var svg = d3.select("#timeline svg");
        var raw = box.value.trim();
        var s = box.value.trim().split(",").map(lower);
        var n = s.length;
        var selections = raw === "" ?
                {selected:[],unselected:data}
                : puff.groupBy(data, hash);
        updateSelection(selections,containers,
                        svg.attr("width"),
                        svg.attr("height"));
        function hash(d){
            for(var i = 0; i< n;i++){
                if(d.game_lower.includes(s[i])) return "selected";
            }
            return "unselected";
        };
        function lower(s){
            return s.toLowerCase();
        }
    });
}

function bindInput(data){
  document.getElementById('filter-box').value = data.game;
}

function getRangeFromContainers(containers){
    return {
        min:+containers.groupContainer.attr("rangeMin"),
        max:+containers.groupContainer.attr("rangeMax")
    };
}

function setRangeOnContainers(containers,range){
    containers.groupContainer.attr("rangeMin",range.min);
    containers.groupContainer.attr("rangeMax",range.max);
}

function numDigits(x) {
  return (Math.log10((x ^ (x >> 31)) - (x >> 31)) | 0) + 1;
}

function formatYearLabel(years){
    var absYear = Math.abs(years);
        if      (absYear>=100000000) {absYear=(absYear/100000000).toFixed(0)+' Billion Years';}
        else if (absYear>=100000)    {absYear=(absYear/100000).toFixed(0)+' Million Years';}
        else if (absYear>=1000)       {absYear=absYear+'';}
        else if (absYear>1)           {absYear=absYear+'';}
        else if (absYear==1)          {absYear=absYear+'';}
        else                        {absYear='';}
    return absYear+(years<0?' BCE':' CE');
}

function calculateYears(range,discount){
    discount = typeof discount === "undefined" ? 0 : discount;
    var ia = puff.ia;
    var always = puff.always;
    var width = Math.round(range.max-range.min);
    var nDigits = numDigits(width);
    var step = +("1"+ia(nDigits-2-discount,always("0")).join(""));
    var start = Math.floor(range.min/step)*step;
    var stop = Math.ceil(range.max/step)*step;
    var out = [start];
    while(out[out.length-1]<stop){
        out.push(out[out.length-1]+step);
    }
    out = out.map(function(y){
        return {
            year:y,
            yearName:formatYearLabel(y)
        };
    });
    if(out.length>20){
        return calculateYears(range,discount-1);
    } else {
        return out;
    }
}

function updateYearMarkers(containers,transition){
    transition = typeof transition === "undefined" ? true : transition;
    var range = getRangeFromContainers(containers);
    var years = calculateYears(range);
    var selection = containers.yearContainer.selectAll(".year-marker").data(years,yearItself);
    var parentW = containers.wholeSvg.attr("width");
    var parentH = containers.wholeSvg.attr("height");
    var mn = range.min;
    var mx = range.max;
    selection.exit().remove();
    (transition ? selection.transition().duration(500) : selection)
        .attr("transform",function(d){
            return translate(transformX(d.year,mn,mx,parentW),0);
        });
    (transition ? setTimeout : callDirectly)(function(){
                            selection.enter().append("g").attr("class","year-marker")
                            .attr("transform",function(d){
                                                          return translate(transformX(d.year,mn,mx,parentW),0);
                                                          })
                            .call(function(g){
                                              g.append("line")
                                              .attr("x1",0)
                                              .attr("x2",0)
                                              .attr("y1",0)
                                              .attr("y2",parentH);
                                              g.append("text").text(function(d){
                                                                                return d.yearName;
                                                                                }).attr("x",4).attr("y",20);
                                              });
                            },501);

    function yearItself(d){
        return d.year;
    }
    function callDirectly(f){
        f();
    }
}

function setupZoomButtons(inButton,outButton,containers,data){
    inButton.addEventListener('click',zoom(0.55));
    outButton.addEventListener('click',zoom(1.45));
    var zooming = false;
    function zoom(howMuch){
        return function(){
            if(!zooming){
                {
                    zooming = true;
                    var oldRange = getRangeFromContainers(containers);
                    var rangeW = oldRange.max-oldRange.min;
                    var newRange = widenRange(oldRange,howMuch);
                    setRangeOnContainers(containers,newRange);
                    var mn = newRange.min;
                    var mx = newRange.max;
                    var parentW = containers.wholeSvg.attr("width");
                    var parentH = containers.wholeSvg.attr("height");
                    var anyOnScreen = false;
                    containers.selected.selectAll(".item")
                        .transition().duration(500)
                        .attr("transform",function(d){
                            var newX = transformX(d.year,mn,mx,parentW);
                            if(newX>0&&newX<parentW) anyOnScreen = true;
                            return translate(newX,d.y*parentH) + " "+scale(1.5,1.5);
                        });
                    containers.unselected.selectAll(".item")
                        .transition().duration(500)
                        .attr("transform",function(d){
                            var newX = transformX(d.year,mn,mx,parentW);
                            if(newX>0&&newX<parentW) anyOnScreen = true;
                            return translate(newX,d.y*parentH);
                        });
                    updateYearMarkers(containers);
                    setTimeout(function(){
                        if(!anyOnScreen){
                            var center = newRange.min + (newRange.max-newRange.min)/2;
                            newRange.min = newRange.min-center+2000;
                            newRange.max = newRange.max-center+2000;
                            mn = newRange.min;
                            mx = newRange.max;
                            var newCenter = newRange.min + (newRange.max-newRange.min)/2;
                            setRangeOnContainers(containers,newRange);
                            containers.selected.selectAll(".item")
                                .transition().duration(500)
                                .attr("transform",function(d){
                                    var newX = transformX(d.year,mn,mx,parentW);
                                    if(newX>0&&newX<parentW) anyOnScreen = true;
                                    return translate(newX,d.y*parentH) + " "+scale(1.5,1.5);
                                });
                            containers.unselected.selectAll(".item")
                                .transition().duration(500)
                                .attr("transform",function(d){
                                    var newX = transformX(d.year,mn,mx,parentW);
                                    if(newX>0&&newX<parentW) anyOnScreen = true;
                                    return translate(newX,d.y*parentH);
                                });
                            updateYearMarkers(containers);
                            setTimeout(function(){
                                zooming = false;
                            },501);
                        } else {
                            zooming = false;
                        }
                    },501);
                }
            }
        };
    }
}


function setupDrag(containers){
    var dragging = false;
    var lastX = undefined;
    var svg = containers.wholeSvg;
    svg.on("mousedown",function(d,i){
        dragging = true;
        lastX = d3.event.clientX;
        return true;
    });
    svg.on("mouseup",function(d,i){
        dragging = false;
        clearSelection();
        return true;
    });
    svg.on("mousemove",function(d,i){
        if(dragging){
            var range = getRangeFromContainers(containers);
            var width = range.max-range.min;
            var yearsPerPixel = width/(+svg.attr("width"));
            var delta = yearsPerPixel*(lastX - d3.event.clientX);
            range.min += delta;
            range.max += delta;
            setRangeOnContainers(containers,range);
            var mn = range.min;
            var mx = range.max;
            var parentW = containers.wholeSvg.attr("width");
            var parentH = containers.wholeSvg.attr("height");
            containers.selected.selectAll(".item")
                .attr("transform",function(d){
                    return translate(transformX(d.year,mn,mx,parentW),d.y*parentH) + " "+scale(1.5,1.5);
                });
            containers.unselected.selectAll(".item")
                .attr("transform",function(d){
                    return translate(transformX(d.year,mn,mx,parentW),d.y*parentH);
                });
            lastX = d3.event.clientX;
            clearSelection();
            updateYearMarkers(containers,false);
        }
    });

    function clearSelection() {
        if(document.selection && document.selection.empty) {
            document.selection.empty();
        } else if(window.getSelection) {
            var sel = window.getSelection();
            sel.removeAllRanges();
        }
    }

}

function main(data){
    console.log(data);
    var selections = {
        selected:[],
        unselected:data
    };
    var range = getRange(selections);
    var width = document.querySelector("#timeline").clientWidth;
    var height = document.querySelector("#timeline").clientHeight;
    var wholeSvg = d3.select("#timeline")
	    .append("svg");
    var groupContainer = wholeSvg
	    .attr("width",width)
	    .attr("height",height)
	    .append("g")
            .attr("class","group-container")
            .attr("rangeMin",range.min)
            .attr("rangeMax",range.max);

    var yearContainer = groupContainer.append("g")
            .attr("class","year-markers");
    var containers = {
        wholeSvg:wholeSvg,
        groupContainer:groupContainer,
        yearContainer:yearContainer,
        unselected:groupContainer
	    .append("g")
            .attr("class","unselected"),
        selected:groupContainer
	    .append("g")
            .attr("class","selected")
    };
    updateSelection(selections, containers, width, height);
    updateYearMarkers(containers);
    setupSearch(document.querySelector("#filter-box"),data,containers);
    setupZoomButtons(document.querySelector("#zoom-in"),document.querySelector("#zoom-out"),containers,data);
    setupDrag(containers);
}
