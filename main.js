var u = require("./utils.js");
var Promise = require("bluebird");
var cheerio = require("cheerio");
var fs = require("fs");


function main(html){
    var table = [];
    var $ = cheerio.load(html);
    var trs = $('tr');
    trs.each(processRow);

    function processRow(i,row){
	var tds = $(row).find("td");
	var row = [];
	tds.each(processElement);
	function processElement(j,el){	    
	    var colspan = $(el).attr("colspan")*1;
	    colspan = !isNaN(colspan) && colspan>0 ? colspan : 1;
	    for(var k=0; k < colspan; k = k + 1){
		row.push($(el).text());
	    }
	}
	if(row.length>0){
	    table.push(row);
	}	
    }
    table = table.filter(function(row){
	return row.filter(u.nonEmptyString).length > 0;
    });
    fs.writeFileSync("./data/processed.json",JSON.stringify(table,null,"  "));
}

fs.readFile("./data/raw.html",function(err, content){
    if(err instanceof Error){
	throw err;
    } else {
	main(content);
    }
});

