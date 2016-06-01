var u = require("./utils.js");
var Promise = require("bluebird");
var cheerio = require("cheerio");
var fs = require("fs");
var yargs = require("yargs");
require("./puff-node.js").pollute(global);

var argv = yargs.argv;

var dataFile = argv.data || "./data/processed.json";

var data = require(dataFile);

var year = argv.year || "2016";

var game = argv.game || ".*";

var action = argv.action || "info";

console.log("Looking in ", dataFile, "for games in ", year, " matching ", game);

function allGamesForYear(data,year){
    var ii = data[0].indexOf(year);
    return data.slice(1).map(function(row){
	return row[ii];
    }).filter(u.nonEmptyString);
}

function parsesAsNumberP(s){
    return !isNaN(s*1);
}

function notParsesAsNumberP(s){
    return !parsesAsNumberP(s);
}

// console.log(allGamesForYear(data, year));

function parseDate(s){
    var s = s.toUpperCase();
    if(s.trim()==="THE END OF TIME"){
	return 80000000;
    }
    var containsBC = s.includes("BC");
    var containsMillion = s.includes("MILLION");
    var containsBillion = s.includes("BILLION");
    var s = s.replace(new RegExp("[ ]*BC[ ]*"),"").replace(new RegExp("[ ]*(MILLION|BILLION)[ ]*"),"");
    var y = s*1;
    if(containsMillion){
	y = y * 1e6;
    }
    if(containsBillion){
	y = y * 1e9;
    }
    if(containsBC){
	y = 0 - y;
    }
    return y;
}

function unique(seq){
    var out = {};
    seq.forEach(function(s){
	out[s] = true;
    });
    return Object.keys(out);
}

function info(argv){
    console.log("Information");
    console.log("Rows: ", data.length);
    console.log("Counts per row", data.map(function(row){
	return row.filter(u.nonEmptyString).length;
    }));
    console.log("Non-nummerical years: ",
		data[0]
		.filter(u.nonEmptyString)
		.filter(notParsesAsNumberP)
	       	.map(function(s){
		    return [s,parseDate(s)];
		}));
    var games = unique([].concat.apply([], data.slice(1)).filter(u.nonEmptyString).sort());
    console.log("Unique game count ",games.length);
}

function nonEmpty(s){
    return s.length !== 0;
}

function parseGame(s){
    if(s.includes("(")){
	var parts = rOn(s,p_(split,new RegExp("[()]","g")),filter(nonEmpty));
	return {name:parts[0],info:parts[1]};
    } else {
	return {name:s,info:null};
    }
}

function dumpObservations(argv,writeOut){
    if(typeof writeOut === "undefined"){
	writeOut = true;
    } 
    var outfile = argv.outfile || "./data/observations.json";
    var observations = {year:[],yearName:[],game:[],info:[]};
    data[0]
	.filter(u.nonEmptyString)
	.forEach(function(yearName){
	    allGamesForYear(data, yearName)
		.forEach(function(game){
		    observations.year.push(parseDate(yearName));
		    observations.yearName.push(yearName);
		    var gameInfo = parseGame(game);
		    observations.game.push(gameInfo.name);
		    observations.info.push(gameInfo.info);
		});
	});
    if(writeOut){
	fs.writeFileSync(outfile, JSON.stringify(observations,null,"  "));
    }
    return observations;
}

function unique(a){
    var hash = {};
    a.forEach(function(a){
	hash[a] = true;
    });
    return Object.keys(hash).sort();
}

function nGames(){
    var observations = dumpObservations(argv, false);
    console.log("Total video games:", unique(observations.game).length);
}

eval(action)(argv);
