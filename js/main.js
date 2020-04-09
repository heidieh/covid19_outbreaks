//"use strict";
window.onresize = resize;

//**************************************************************************************************//
//
// Coronavirus - a playground for Covid19 visualizations
// Heidi El-Hosaini
// March - April 2020
//
// NOTES:
// Country codes source: https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes/blob/master/slim-3/slim-3.json
// Coronavirus data format: 1. hdx =  https://data.humdata.org/dataset/novel-coronavirus-2019-ncov-cases (John Hopkins University Center for Systems Science and Engineering (JHU CCSE))
//			            or: 2. rk = https://github.com/RamiKrispin/coronavirus / https://github.com/RamiKrispin/coronavirus-csv 
// 
// TO DO:
// - check China (Hubei) stats for outbreak start
// - add data loader
// - code clean-up
//
// LATER:
// - add option to select by date
// - add in 'intervention' lines to outbreak days
// - what about a 2nd wave? i.e. after an outbreak 'ends' it can re-start
// - option to turn off background location lines?
// - display list of countries defined as having an outbreak & start days
// - sum locations into whole countries?
// - add hover highlight lines to charts
//
//**************************************************************************************************//


let dataFormat = 'rk';   //hdx / rk
let dataSource = 'John Hopkins University Center for Systems Science and Engineering (JHU CCSE)';

let outbreakDay1Num = 10;
let outbreakDay1Type = 'confirmed';  // type = confirmed/death
let outbreakNumDaysUnfulfilledForEndDay = 14;  //i.e. 2 weeks incubation
let outbreakDay1MaxNumForDropdown= 20;


let statTypeOptions = [ {key: 'confirmed', text: 'confirmed cases', textCamel: 'Confirmed Cases'}, 
						{key: 'death', text: 'deaths', textCamel: 'Deaths'}
						];  
let accumTypeOptions = [ {key: 'daily', dKey: 'value', text: 'daily', textCamel: 'Daily' }, 
						 {key: 'cumulative', dKey: 'cumVal', text: 'cumulative', textCamel: 'Cumulative' }
					   ]							  

							  
let chartView = {
	locRowChart: { viewStatType: 'confirmed' },
	outbreakChart: { viewStatType: 'confirmed', viewAccumType: 'daily' },  
	timeSeriesChart: { viewStatType: 'confirmed', viewAccumType: 'daily' }
}
//let viewStatType = 'confirmed';   	// typeStatType = confirmed/death			
//let viewAccumType = 'daily';		// viewAccumType = daily/cumul	  
						  
let countryCodes;
let allData;
let locationList = [];
let locationErrorList = [];
let selectedLocList = [];
let minDate, maxDate;
// let tempHoverLoc = null;

let yellowHighlight = '#fee227';
let chartGrey = '#e9e9e9';
let barDark = '#c0b1b1';
let barLight = '#d2c7c7';

//let colors = [...d3.schemeCategory10, ...d3.schemeAccent];  //18 unique colors
//colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf", "#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f", "#bf5b17", "#666666"]
let colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#e377c2", "#bcbd22", "#17becf", "#f0027f", "#bf5b17"]
//console.log('COLORS: ', colors)
let replacePosition = 0;

//let cf, locCodeDim, typeByLocGroup;
let svg1a, svg1b, svg1b_axis, svg2, svg3, svg4, svg5;
let locRowChart_a, locRowChart_b, locRowChart_b_axis, timeSeriesChart, timeSeriesLegend, outbreakDayChart, outbreakDayLegend;


const id1a = '#loc-type-chart-a';
const id1a_axis = '#loc-type-chart-a-axis';
const id1b = '#loc-type-chart-b';
const id1b_axis = '#loc-type-chart-b-axis';
const id2 = '#timeseries-chart';
const id3 = '#timeseries-legend';
const id4 = '#outbreakDay-chart';
const id5 = '#outbreakDay-legend';

let svgDimensions = {};
svgDimensions[id1a] = {width: $(id1a).width(), height: 174}
svgDimensions[id1b] = {width: $(id1b).width(), height: 3000}
svgDimensions[id2] = {width: $(id2).width(), height: 130}
svgDimensions[id3] = {width: 180, height: 160}
svgDimensions[id4] = {width: $(id4).width(), height: 320}
svgDimensions[id5] = {width: $(id5).width(), height: 76}

let margin = {}; 
margin[id1a] = {top: 50, bottom: 6, left: 125, right: 50}
margin[id1b] = {top: 25, bottom: 10, left: 125, right: 50}
margin[id2] = {top: 20, bottom: 30, left: 100, right: 50}
margin[id3] = {top: 10, bottom: 10, left: 2, right: 2}
margin[id4] = {top: 20, bottom: 50, left: 60, right: 50}
margin[id5] = {top: 10, bottom: 10, left: 12, right: 12}


// const width1, width2, width3, width4, width5;
// const height1, height2, height3, height4, height5;
// let svgNum = [...Array(6).keys()];
// svgNum.shift();
// console.log('svgNum:', svgNum)

// svgNum.forEach(num => {
// 	let id = 'id' + num;
// 	'width'+num = svgDimensions[id].width - margin[id].left - margin[id].right;
// 	'height'+num = svgDimensions[id1].height - margin[id1].top - margin[id1].bottom;
// })
// console.log('width1 x height1: ', width1, ' x ', height1);

let width1a = svgDimensions[id1a].width - margin[id1a].left - margin[id1a].right, //width of main svg1a
	height1a = svgDimensions[id1a].height - margin[id1a].top - margin[id1a].bottom; //height of main svg1a
//console.log('width1a x height1a: ', width1a, ' x ', height1a);

let width1b = svgDimensions[id1b].width - margin[id1b].left - margin[id1b].right, //width of main svg1b
    height1b = svgDimensions[id1b].height - margin[id1b].top - margin[id1b].bottom; //height of main svg1b
//console.log('width1b x height1b: ', width1b, ' x ', height1b);

let width2 = svgDimensions[id2].width - margin[id2].left - margin[id2].right, //width of main svg2
	height2 = svgDimensions[id2].height - margin[id2].top - margin[id2].bottom; //height of main svg2
//console.log('width2 x height2: ', width2, ' x ', height2);

let width3 = svgDimensions[id3].width - margin[id3].left - margin[id3].right, //width of main svg3
    height3 = svgDimensions[id3].height - margin[id3].top - margin[id3].bottom; //height of main svg3
//console.log('width3 x height3: ', width3, ' x ', height3);

let width4 = svgDimensions[id4].width - margin[id4].left - margin[id4].right, //width of main svg4
	height4 = svgDimensions[id4].height - margin[id4].top - margin[id4].bottom; //height of main svg4
//console.log('width4 x height4: ', width4, ' x ', height4);

let width5 = svgDimensions[id5].width - margin[id5].left - margin[id5].right, //width of main svg5
	height5 = svgDimensions[id5].height - margin[id5].top - margin[id5].bottom; //height of main svg5
//console.log('width3 x height3: ', width5, ' x ', height5);


function processHDXData(origConfCasesData, origDeathsData) {
	// console.log('original ConfCasesData in processData: ', origConfCasesData)
	// console.log('original DeathsData in processData: ', origDeathsData)
	//let processedCaseData = [];
	//let processedDeathData = [];
	let processedData = [];
	let locCode, currentLocCode;
	let temp;


	let filteredConfCases = origConfCasesData.slice(1).filter(d => d['date'] != undefined)  //remove HXL tags & records with undefined date (may occur at end of file)
	filteredConfCases.forEach(function(record, i) {
		temp = {}
		//add location to list of locations using ISO3 and assigned regional code
		locCode = addLocationToListAndGetLocCode(record['country'], record['region'], record['lat'], record['lon'])
		//console.log('locCode: ', locCode)
		currentLocCode = processedData.find(d => d.locCode === locCode);
		if (currentLocCode == undefined) {
			temp = {}
			temp['locCode'] = locCode;
			temp['values'] = [];
			temp['values'].push({
				date: new Date (record['date']),
				//value: parseInt(record['value']),
				value: null,
				cumVal: parseInt(record['cumVal']),
				type: "confirmed"
			})
			processedData.push(temp)
		} else {
			currentLocCode['values'].push({
				date: new Date (record['date']),
				//value: parseInt(record['value']),
				value: null,
				cumVal: parseInt(record['cumVal']),
				type: "confirmed"
			})
		}
	});

	
	let filteredDeaths = origDeathsData.slice(1).filter(d => d['date'] != undefined)  //remove HXL tags & records with undefined date (may occur at end of file)
	filteredDeaths.forEach(function(record, i) {
		temp = {}
		//add location to list of locations using ISO3 and assigned regional code
		locCode = addLocationToListAndGetLocCode(record['country'], record['region'], record['lat'], record['lon'])
		//console.log('locCode: ', locCode)
		currentLocCode = processedData.find(d => d.locCode === locCode);
		if (currentLocCode == undefined) {
			temp = {}
			temp['locCode'] = locCode;
			temp['values'] = [];
			temp['values'].push({
				date: new Date (record['date']),
				//value: parseInt(record['value']),
				value: null,
				cumVal: parseInt(record['cumVal']),
				type: "death"
			})
			processedData.push(temp)
		} else {
			currentLocCode['values'].push({
				date: new Date (record['date']),
				//value: parseInt(record['value']),
				value: null,
				cumVal: parseInt(record['cumVal']),
				type: "death"
			})
		}
	});
	//console.log('processed data H: ', processedData)

	processedData.forEach(loc => loc.values.sort(function (loc1, loc2) {
		if (loc1.type > loc2.type) return 1;
		if (loc1.type < loc2.type) return -1;
		if (loc1.date > loc2.date) return 1;
		if (loc1.date < loc2.date) return -1;
	}));

	let combFiltData = filteredConfCases.concat(filteredDeaths);
	let datesArrStr = [...new Set(combFiltData.map(d => d.date))];
	let datesArr = datesArrStr.filter(d => d !== undefined).map(d => new Date(d));
	//console.log('datesArr: ', datesArr)
	maxDate = new Date(Math.max.apply(null, datesArr));
	minDate = new Date(Math.min.apply(null, datesArr));
	//console.log('minDate, maxDate: ', minDate, maxDate)
	//let formattedDateStrLong = formatDate(maxDate, 'long');
	//let formattedDateStr = formatDate(maxDate, 'long');
	//document.getElementById('max-date').innerHTML = formatDate(maxDate, 'short');
	document.getElementById('update_date').innerHTML = 'Data to: <i>' + formatDate(maxDate, 'long') + '</i>';
	


	let temp_locArray, temp_locArray_cases, temp_locArray_deaths, prev_value; 
	locationList.forEach(loc => {
		//console.log('loc in locationList: ', loc)

		//get array of all records for that location
		temp_locArray = processedData.find(record => record.locCode == loc.code).values;
		//console.log('temp_locArray: ', loc.code, temp_locArray)
		if (temp_locArray == undefined) {
			console.log('* Error with loc ', loc)
		} else {
			//sort by type & date
			temp_locArray_cases = temp_locArray.filter(rec => rec.type === 'confirmed').sort(function(a, b) {
				return a.date - b.date;
			});
			//console.log('temp_locArray_cases: ', temp_locArray_cases)
			//calculate daily 'value' from cumalative values
			prev_value = 0;
			temp_locArray_cases.forEach((locRecord, i) => {
				//console.log(i, 'locRecord: ', locRecord, prev_value)
				locRecord['value'] = locRecord['cumVal'] - prev_value;
				prev_value = locRecord['cumVal'];				
			})

			prev_value = 0;
			temp_locArray_deaths = temp_locArray.filter(rec => rec.type === 'death').sort(function(a, b) {
				return a.date - b.date;
			});
			//console.log('temp_locArray_deaths: ', temp_locArray_deaths)
			prev_value = 0;
			temp_locArray_deaths.forEach((locRecord, i) => {
				//console.log(i, 'locRecord: ', locRecord, prev_value)
				locRecord['value'] = locRecord['cumVal'] - prev_value;
				prev_value = locRecord['cumVal'];				
			})
		}
		
	})


	// console.log('final location list: ', locationList)
	// console.log('countries not found ISO3: ', locationErrorList)
	// console.log('final processed data: ', processedData)

	return processedData;
}



function processData(origData) {
	//console.log('originalData in processData: ', origData)	
	//console.log('location list: ', locationList)
	//console.log('country codes in processData: ', countryCodes)
	let processedData = [];
	let locCode, currentLocCode;
	let temp;

	//origData example: 
		// { region: "", country: "Afghanistan", lat: "33", lon: "65", date: "2020-01-22", value: "0", type: "confirmed"  }

	//create dataset as array of objects of id/value pairs where  with only location code, date, value, type
	origData.forEach(function(record, i) {
	
		if ((!(record.hasOwnProperty('country'))) || (!(record.hasOwnProperty('date')))) {
			console.log("ERROR - entry not included: ", i, record)
		} else {
			//add location to list of locations using ISO3 and assigned regional code
			locCode = addLocationToListAndGetLocCode(record['country'], record['region'], record['lat'], record['lon'])
			//console.log('locCode: ', locCode)
			currentLocCode = processedData.find(d => d.locCode === locCode);
			//console.log('currentLocCode', currentLocCode)
			if (currentLocCode == undefined) {
				temp = {}
				temp['locCode'] = locCode;
				temp['values'] = [];
				temp['values'].push({
					date: new Date (record['date']),
					value: parseInt(record['value']),
					type: record['type']
				})
				processedData.push(temp)
			} else {
				currentLocCode['values'].push({
					date: new Date (record['date']),
					value: parseInt(record['value']),
					type: record['type']
				})
			}
		
		}
	});

	//console.log('PROCESSED DATA before: ', processedData)
	processedData.forEach(loc => loc.values.sort(function (loc1, loc2) {
		if (loc1.type > loc2.type) return 1;
		if (loc1.type < loc2.type) return -1;
		if (loc1.date > loc2.date) return 1;
		if (loc1.date < loc2.date) return -1;
	}));

	let cumCas, cumDeath;
	processedData.forEach(loc => {
		cumCas = 0;
		cumDeath = 0;
		loc['values'].forEach(vals => {
			if (vals['type'] == 'confirmed') {
				vals['cumVal'] = cumCas + vals['value'];
				cumCas = vals['cumVal'];
			} else if (vals['type'] == 'death') {
				vals['cumVal'] = cumDeath + vals['value'];
				cumDeath = vals['cumVal'];
			}
		})
	})
	
	let datesArrStr = [...new Set(origData.map(d => d.date))];
	let datesArr = datesArrStr.filter(d => d !== undefined).map(d => new Date(d));
	maxDate = new Date(Math.max.apply(null, datesArr));
	minDate = new Date(Math.min.apply(null, datesArr));
	//console.log('minDate, maxDate: ', minDate, maxDate)
	//let formattedDateStr = formatDate(maxDate, 'long');
	//document.getElementById('max-date').innerHTML = formatDate(maxDate, 'short');
	document.getElementById('update_date').innerHTML = 'Data to: <i>' + formatDate(maxDate, 'long') + '</i>';

	// console.log('final location list: ', locationList)
	// console.log('countries not found ISO3: ', locationErrorList)
	// console.log('final processed data: ', processedData)

	return processedData;
}


function formatDate(date, param) {
	if (param == undefined) param = 'long';
	let dateStr = '';
	let days = ['Sun', 'Mon', 'Tues', 'Weds', 'Thurs', 'Fri', 'Sat'];
	let day = date.getDay();
	let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	//let month = date.getMonth() + 1 < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
	if (param == 'long') {
		dateStr = days[date.getDay()] + ' ' + date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
	} else if (param == 'short') {
		dateStr = date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
	} else if (param == 'daymonth') {
		dateStr = date.getDate() + ' ' + months[date.getMonth()];
	}
	
	return dateStr;
}

function calculateOutbreakDay1(data) {
	//console.log('calculateOutbreakDay1: ', data[0]);

	if (data == undefined) data = allData;
	// console.log('calculateOutbreakDay1: ', outbreakDay1Type, outbreakDay1Num);
	// console.log('data for calculateOutbreakDay1: ', data)
	
	//define day 1 for each location
	let temp_locRecords, day_1, day_1_rec;
	locationList.forEach(loc => {
		//get all records for that location and sort by date
		temp_locRecords = data.filter(record => record.locCode === loc.code).sort(function(a, b) {
			return a.date - b.date;
		});
		//console.log(loc.code, ': ', temp_locRecords)
		//find the first day that that the defined outbreak value & type are exceeded
		day_1 = null;
		loc['day_1'] = null;
		loc['ob_end_day'] = null;
		day_1_rec = temp_locRecords[0].values.find(locRecord => {
			//console.log(locRecord)
			return ((locRecord['value'] >= outbreakDay1Num) && (locRecord['type'] === outbreakDay1Type)) //define day 1 parameters
		});
		//console.log('day_1_rec: ', day_1_rec)
		//if an outbreak occurred, assign the date to the 'day_1' key in the location's object in locationList 
			//then look for end date for outbreak (i.e. same conditions not met for 7 consecutive days)
		//if an outbreak didn't occur, assign null to the 'day_1' key
		if (day_1_rec != null) {
			loc['day_1'] = day_1_rec['date'];
			loc['ob_end_day'] = getOutbreakEndDate(day_1_rec['date'])
		} else {
			loc['day_1'] = null;
			loc['ob_end_day'] = null;
		}

		//for each record for that location, add a key for 'dayNum' and assign the day number of the outbreak (null for no outbreak or >=1)
		day_1_rec = temp_locRecords[0].values.forEach(locRecord => {
			if (sameDay(loc['day_1'], locRecord['date'])) {   //first day of outbreak
				locRecord['dayNum'] = 1;
			} else if ((loc['day_1'] == null) || (locRecord['date'] < loc['day_1'])) {  //before outbreak
				locRecord['dayNum'] = null;
			} else {
				if ((loc['ob_end_day'] == null) || (loc['ob_end_day'] > locRecord['date'])) {
					locRecord['dayNum'] = Math.abs(differenceInDays(locRecord['date'], loc['day_1'])) + 1;		//day number of outbreak		
				} else {
					locRecord['dayNum'] = null;		//after outbreak
					//locRecord['dayNum'] = -1;	
				}
			}
			
		});

	
		function getOutbreakEndDate(day_1_date) {
			//console.log('getOutbreakEndDate: ', loc.code, day_1_date)
			//if (loc.code=="CHN_14") console.log(loc.code, day_1_date)
			let ob_end_day = null;
			let countDays = 0;
			let prevNoOBDate = null;
			let currentNoOBDate;

			for (let locRecord of temp_locRecords[0].values) {
				//if (loc.code=="CHN_14") console.log('__________________________')
				
				//check if record date is after outbreak start date
				if (locRecord['date'] > day_1_date) {
					//if (loc.code=="CHN_14") console.log('after OB start date: ', locRecord)
					
					//check if conditions fulfilled for *end* of outbreak (i.e. less than specificied daily number for same type of outbreak)
					if ((locRecord['value'] < outbreakDay1Num) && (locRecord['type'] === outbreakDay1Type)) {
						//if (loc.code=="CHN_14") console.log('*fulfills end of OB criteria: ', loc.code, locRecord)			

						currentNoOBDate = locRecord['date'];
						if (prevNoOBDate != null) {
							if (sameDay(prevNoOBDate.addDays(1), currentNoOBDate)) {
								countDays++;
								if (countDays == outbreakNumDaysUnfulfilledForEndDay) {
									ob_end_day = locRecord['date'];
									//console.log('!!!!!!!!! HALLELUJAH OUTBREAK OVER for ', loc.code, ' on ', ob_end_day)
									break;
								}
							} else {
								countDays = 0;
							}
						}
						prevNoOBDate = currentNoOBDate;
					}

				}

			}

			//console.log('outbreak end date: ', ob_end_day)
			//if (loc.code=="CHN_14") console.log('END OF OUTBREAK DAY for ', loc.code,': ', ob_end_day)
			return ob_end_day;

		}

	})

	allData = data;
	// console.log('location list after outbreak calc: ', locationList)
	// console.log('data after outbreak calc: ', allData)
}


function addLocationToListAndGetLocCode(countryName, regionName, latVal, lonVal) {
	//console.log('countryName, regionName, latVal, lonVal: ', countryName, regionName, latVal, lonVal)
	let getISO3 = (() => {
		switch (countryName) {
			case 'Bolivia' : return 'BOL'; 
			case 'Brunei': return 'BRN'; 
			case 'Burma': return 'MMR'; 
			case 'Congo (Brazzaville)': return 'COG';
			case 'Congo (Kinshasa)': return 'COD';
			case "Cote d'Ivoire": return 'CIV';
			case 'Iran': return 'IRN';
			case 'Korea, South': return 'KOR';
			case 'Kosovo': return 'RKS';        
			case 'Laos' : return 'LAO';
			case 'Moldova': return 'MDA';
			case 'occupied Palestinian territory': return 'PSE';
			case 'West Bank and Gaza': return 'PSE';
			case 'Republic of the Congo': return 'COG';
			case 'Reunion': return 'REU';
			case 'Russia': return 'RUS';
			case 'Syria': return 'SYR';
			case 'Taiwan*': return 'TWN';
			case 'Tanzania': return 'TZA';
			case 'The Bahamas': return 'BHS';
			case 'Venezuela': return 'VEN';
			case 'Vietnam': return 'VNM';
			case 'US': return 'USA';
			case 'United Kingdom': return 'GBR';
			default : if (locationErrorList.indexOf(countryName) === -1) locationErrorList.push(countryName);
				return 'XXX';
		}
	});

	let countryISO3 = countryCodes.find(cntry => cntry.name === countryName)
	let ISO3 = (countryISO3 === undefined)? getISO3() : countryISO3['alpha-3']
	let locsInCountry = locationList.filter(loc => loc.iso3 === ISO3)
	let exactLoc = locationList.find(loc => loc.iso3 === ISO3 && loc.country === countryName && loc.region === regionName && loc.lat === latVal && loc.lon === lonVal)	
	let locCode;

	if (exactLoc === undefined) {
		//console.log('record assign: ', record)
		let regionCode = locsInCountry.length + 1;
		locCode = ISO3 + '_' + regionCode;

		exactLoc = { country: countryName,
			iso3: ISO3, //assign ISO3 country code from manual case statement
			region: regionName, //assign own code id here
			regionCode: regionCode,
			code: locCode, 
			lat: latVal, 
			lon: lonVal
		}

		locationList.push(exactLoc)
	} else {
		locCode = exactLoc['code']
	}

	return locCode;

}

function differenceInDays(day1, day2) {
	return (day2 - day1) / (1000 * 3600 * 24);
};

function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}


function getBarSpacing(bar_height) {  //***!!!needs checking */
    return (bar_height < 1)? 0 : (bar_height/100)+0.1;
}




function createCharts(data) {
	console.log('data for createCharts: ', data)
	    //sample data record: 
		//  {  locCode: "CHN_7"
		//     values:  {  date: Wed Jan 22 2020 01:00:00 GMT+0100 (Central European Standard Time) {}
		//				   value: 0
		//				   type: "confirmed"
		//				   dayNum: null
		//			     }
		//  }

	let statTotalPerLoc = [];
	let tempX;
	locationList.forEach(loc => {
		tempX = { key: loc.code,
				 value: 0 };
		statTotalPerLoc.push(tempX);
	})

	let locTotal, locValues
	data.forEach(d => {
		locValues = d.values;
		locTotal = statTotalPerLoc.find(t => (t.key === d['locCode']));
		locValues.forEach(v => {
			locTotal['value'] += (v['type'] === chartView.locRowChart.viewStatType) ? v['value'] : 0;
		
		})
	});
	statTotalPerLoc.sort(function(a,b) { return a.value - b.value })   //descending order by value (cases)
	//console.log('*** statTotalPerLoc: ', statTotalPerLoc)

	let statTotalPerLoc_a = statTotalPerLoc.slice(statTotalPerLoc.length-10,statTotalPerLoc.length);  //top 10
	let statTotalPerLoc_b = statTotalPerLoc.slice(0, statTotalPerLoc.length-10);				//without top 10
	// console.log('statTotalPerLoc_a: ', statTotalPerLoc_a)
	// console.log('statTotalPerLoc_b: ', statTotalPerLoc_b)
	// console.log('statTotalPerLoc: ', statTotalPerLoc)


// ************* CREATE LOCATION TOTALS ROW CHART ***************** //
	
		//Render main SVGs
		svg1a = d3.select(id1a)
			.append("svg")
			.attr("width", width1a + margin[id1a].left + margin[id1a].right)
			.attr("height", height1a + margin[id1a].top + margin[id1a].bottom)
			.style("background", 'white');
		
		// svg1a_axis = d3.select(id1a_axis)
		// 	.append("svg")
		// 	.attr("width", width1a + margin[id1a].left + margin[id1a].right)
		// 	.attr("height",  margin[id1a].top )
		// 	.style("background", 'pink');

		svg1b = d3.select(id1b)
			.append("svg")
			.attr("width", width1b + margin[id1b].left + margin[id1b].right)
			.attr("height", height1b + margin[id1b].top + margin[id1b].bottom)
			.style("background", 'white');
	
		svg1b_axis = d3.select(id1b_axis)
			.append("svg")
			.attr("width", width1b + margin[id1b].left + margin[id1b].right)
			.attr("height",  margin[id1b].top + 1 )
			.style("background", 'white');

		let x1a = d3.scaleLinear().range([0, width1a]), //x-axis width, accounting for specified margins  //rename to xScale?
			y1a = d3.scaleBand().range([height1a, 0]);	
	
		let x1aAxis = d3.axisTop(x1a).ticks(5).tickFormat(function(d) {   //axisTop for labels/ticks above axis
				return formatNumber(d.toFixed(0))
			}),
			y1aAxis = d3.axisLeft(y1a).tickFormat(function(d) {
				return getLocNameFromCode(d);
			});

		
		let x1b = d3.scaleLinear().range([0, width1b]), //x-axis width, accounting for specified margins  //rename to xScale?
			y1b = d3.scaleBand().range([height1b, 0]);	
	
		let x1bAxis = d3.axisTop(x1b).ticks(5).tickFormat(function(d) {   //axisTop for labels/ticks above axis
				return formatNumber(d.toFixed(0))
			}),
			y1bAxis = d3.axisLeft(y1b).tickFormat(function(d) {
				return getLocNameFromCode(d);
			});
	

		svg1a.append("defs").append("clipPath")
			.attr("id", "clip-loc1a")
			.append("rect")
			.attr("width", width1a)
			.attr("height", height1a);

		svg1b.append("defs").append("clipPath")
			.attr("id", "clip-loc1b")
			.append("rect")
			.attr("width", width1b)
			.attr("height", height1b);
	

		locRowChart_a = svg1a.append("g")
			.attr("class", "locRowChart_a")
			.attr("transform", "translate(" + margin[id1a].left + "," + margin[id1a].top + ")");
	
		locRowChart_b = svg1b.append("g")
			.attr("class", "locRowChart_b")
			.attr("transform", "translate(" + margin[id1b].left + "," + margin[id1b].top + ")");
	
		locRowChart_b_axis = svg1b_axis.append("g")
			.attr("class", "locRowChart_b_axis")
			.attr("transform", "translate(" + margin[id1b].left + "," + margin[id1b].top + ")");
	
			
		//Set axes
		x1a.domain([0, d3.max(statTotalPerLoc_a, function(d) {
			return d.value;			// max is max for total values for any location (not max for a single day)
		})]);
		//console.log('x.domain = ', x.domain())
		
		y1a.domain(statTotalPerLoc_a.map(d => d.key)); 
		//console.log('y.domain = ', y.domain())


		x1b.domain([0, d3.max(statTotalPerLoc_b, function(d) {
			return d.value;			// max is max for total values for any location (not max for a single day)
		})]);
		//console.log('x.domain = ', x.domain())
		
		y1b.domain(statTotalPerLoc_b.map(d => d.key)); 
		//console.log('y.domain = ', y.domain())



		let bar_height_a = (height1a / statTotalPerLoc_a.length) - getBarSpacing(height1a / statTotalPerLoc_a.length); //setting bar height

		let bar_height_b = (height1b / statTotalPerLoc_b.length) - getBarSpacing(height1b / statTotalPerLoc_b.length); //setting bar height

		locRowChart_a.selectAll(".bar_a")
			.data(statTotalPerLoc_a)
			.enter().append("rect")
			.attr("class", "bar_a")
			.attr("id", function(d) { return "bar_a_" + d.key; })
			.attr("clip-path", "url(#clip-loc1a)")
			.attr("x", 0)
			.attr("y", function(d) {
				return y1a(d.key);
			})
			.attr("width", function(d) {
				return x1a(d.value)
			})
			.attr("height", function(d) {
				//console.log('height: ', bar_height)
				return bar_height_a;
			})
			.attr("fill",  function(d) {
				//return colorPicker(d.value); 
				//return '#666666';
				return getBarColor(d.key, true)  //true that it is in 'top 10' (i.e. in chart '_a')
			})
			.on("mouseover", handleMouseOver_a)
			.on("mouseout", handleMouseOut_a)
			.on("click", handleMouseClick_a);

		locRowChart_a.selectAll(".text")  //add label positions & values for each bar - but keep empty until mouseover
			.data(statTotalPerLoc_a)
			.enter()
			.append("text")
			.attr("class","bar_label_a")
			.attr("id", function(d) { return "bar_lbl_a_" + d.key; })
			.attr("x", function(d) { return x1a(d.value); } )
			.attr("y", function(d) { return y1a(d.key) + 1; })
			.attr("dy", ".75em")
			.text(function(d) { return ''});
				
		locRowChart_a.selectAll(".bar_overlay_a")
			.data(statTotalPerLoc_a)
			.enter().append("rect")
			.attr("class", "bar_overlay_a")
			.attr("id", function(d) { return "bar_overlay_a_" + d.key; })
			.attr("clip-path", "url(#clip-loc1a)")
			.attr("x", function(d) {return x1a(d.value)})
			.attr("y", function(d) {
				return y1a(d.key);
			})
			.attr("width", function(d) {return width1a - x1a(d.value)})
			.attr("height", bar_height_a)
			.attr('fill', chartGrey)
			.attr("fill-opacity",  0)
			.on("mouseover", handleMouseOver_a)
			.on("mouseout", handleMouseOut_a)
			.on("click", handleMouseClick_a);
	
		locRowChart_a.append("g")
			.attr("class", "axis axis--x1a")
			//.attr("transform", "translate(0," + height + ")")  //render at bottom of chart
			.call(x1aAxis);
	
		locRowChart_a.append("g")
			.attr("class", "axis axis--y1a")
			.call(y1aAxis);
	

		locRowChart_a
			.append('text')
			.attr("class", "top10")
			.attr("transform", "translate(" + (-80) + "," + (-10) + ")") 
			//.attr("text-anchor", "middle")
			// .attr("font-size", '0.9rem')
			// .style("stroke-color", "#ffff00")
			// .style("opacity", 1)
			.text('TOP 10')
			


		
		locRowChart_b.selectAll(".bar_b")
			.data(statTotalPerLoc_b)
			.enter().append("rect")
			.attr("class", "bar_b")
			.attr("id", function(d) { return "bar_b_" + d.key; })
			.attr("clip-path", "url(#clip-loc1b)")
			.attr("x", 0)
			.attr("y", function(d) {
				return y1b(d.key);
			})
			.attr("width", function(d) {
				//return 10;
				//console.log(d.key, d.value, x1b(d.value))
				return x1b(d.value)
			})
			.attr("height", function(d) {
				//console.log('height: ', bar_height)
				return bar_height_b;
			})
			.attr("fill",  function(d) {
				//return colorPicker(d.value); 
				//return '#a3a3a3';
				return getBarColor(d.key, false)  //false - it is not in 'top 10' (i.e. it is in chart '_b')
			})
			.on("mouseover", handleMouseOver_b)
			.on("mouseout", handleMouseOut_b)
			.on("click", handleMouseClick_b);

		locRowChart_b.selectAll(".text")  //add label positions & values for each bar - but keep empty until mouseover
			.data(statTotalPerLoc_b)
			.enter()
			.append("text")
			.attr("class","bar_label_b")
			.attr("id", function(d) { return "bar_lbl_b_" + d.key; })
			.attr("x", function(d) { return x1b(d.value); } )
			.attr("y", function(d) { return y1b(d.key) + 1; })
			.attr("dy", ".75em")
			.text(function(d) { return ''});
				
		locRowChart_b.selectAll(".bar_overlay_b")
			.data(statTotalPerLoc_b)
			.enter().append("rect")
			.attr("class", "bar_overlay_b")
			.attr("id", function(d) { return "bar_overlay_b_" + d.key; })
			.attr("clip-path", "url(#clip-loc1b)")
			.attr("x", function(d) {return x1b(d.value)})
			.attr("y", function(d) {
				return y1b(d.key);
			})
			//.attr("width", width1b)
			.attr("width", function(d) {return width1b - x1b(d.value)})
			.attr("height", bar_height_b)
			.attr('fill', chartGrey)
			.attr("fill-opacity",  0)
			.on("mouseover", handleMouseOver_b)
			.on("mouseout", handleMouseOut_b)
			.on("click", handleMouseClick_b);
	
		locRowChart_b.append("g")
			.attr("class", "axis axis--x1b")
			//.attr("transform", "translate(0," + height + ")")  //render at bottom of chart
			.call(x1bAxis);
	
		locRowChart_b.append("g")
			.attr("class", "axis axis--y1b")
			.call(y1bAxis);


		locRowChart_b_axis.selectAll(".bar_b_axis")
			.data([])
			.enter().append("rect")
			//.attr("class", "bar_b_axis")
			//.attr("id", function(d) { return "bar_a_" + d.key; })
			//.attr("clip-path", "url(#clip-loc1a)")
			.attr("x", 0)
			.attr("y", 0)
			.attr("height", 0)
			.attr("width", 0)
			
		locRowChart_b_axis.append("g")
			.attr("class", "axis axis--x1b_axis")
			//.attr("transform", "translate(0," + height + ")")  //render at bottom of chart
			.call(x1bAxis);

		// Create Event Handlers for mouse
		function handleMouseOver_a(d, i) {  // Add interactivity
			//console.log('handleMouseOver_a ', d, i, this)
			// tempHoverLoc = d.key;
			// console.log('tempHoverLoc: ', tempHoverLoc)
			d3.select('#bar_a_' + d.key).attr('fill', yellowHighlight)
			d3.select('#bar_overlay_a_' + d.key).attr("fill-opacity",  0.5)
			select_bar_label_a(d).attr('style', "font-family: sans-serif; font-size: 0.75rem; font-weight:").text('\u00A0'+formatNumber(d.value));
			select_axis_label_a(d).attr('style', "font-weight: bold;");
			//updateOutbreakDayChart();
			//updateTimeSeriesChart();
		}		  

        function handleMouseOut_a(d, i) {
			// tempHoverLoc = null;
			// console.log('tempHoverLoc: ', tempHoverLoc)
			//d3.select('#bar_a_' + d.key).attr('fill', colorPicker(d.value))
			//d3.select('#bar_a_' + d.key).attr('fill', '#666666')
			d3.select('#bar_a_' + d.key).attr('fill', getBarColor(d.key, true))
			d3.select('#bar_overlay_a_' + d.key).attr("fill-opacity",  0)
			select_bar_label_a(d).attr('style', "font-weight: regular;").text('');
			select_axis_label_a(d).attr('style', "font-weight: regular;");
			//updateOutbreakDayChart();
			//updateTimeSeriesChart();
		}
		  
		function handleMouseClick_a(d, i) {  // Add interactivity
			//console.log('handleMouseClick ', d, i)  //this = rect
			updateSelectedLocations(d);		
		}

		function select_axis_label_a(d) {
			//console.log('d: ', d)
			return d3.select('.axis--y1a')
				.selectAll('text')
				.filter(function(x) { return x == d.key; });
		}

		function select_bar_label_a(d) {
			//console.log('select_bar_label d: ', d)
			return d3.select('#bar_lbl_a_'+d.key)
		}



		// Create Event Handlers for mouse
		function handleMouseOver_b(d, i) {  // Add interactivity
			//console.log('handleMouseOver_b ', d, i, this)
			// tempHoverLoc = d.key;
			// console.log('tempHoverLoc: ', tempHoverLoc)
			d3.select('#bar_b_' + d.key).attr('fill', yellowHighlight)
			d3.select('#bar_overlay_b_' + d.key).attr("fill-opacity",  0.5)
			select_bar_label_b(d).attr('style', "font-family: sans-serif; font-size: 0.75rem; font-weight:").text('\u00A0'+formatNumber(d.value));
			select_axis_label_b(d).attr('style', "font-weight: bold;");	
			//updateOutbreakDayChart();
			//updateTimeSeriesChart();	
		}
			
		function handleMouseOut_b(d, i) {
			// tempHoverLoc = null;
			// console.log('tempHoverLoc: ', tempHoverLoc)
			//d3.select('#bar_b_' + d.key).attr('fill', colorPicker(d.value))
			//d3.select('#bar_b_' + d.key).attr('fill', '#a3a3a3')
			d3.select('#bar_b_' + d.key).attr('fill', getBarColor(d.key, false))
			d3.select('#bar_overlay_b_' + d.key).attr("fill-opacity",  0)	
			select_bar_label_b(d).attr('style', "font-weight: regular;").text('');
			select_axis_label_b(d).attr('style', "font-weight: regular;");
			//updateOutbreakDayChart();
			//updateTimeSeriesChart();	
		}
			
		function handleMouseClick_b(d, i) {  // Add interactivity
			//console.log('handleMouseClick ', d, i)  //this = rect
			updateSelectedLocations(d);		
		}

		function select_axis_label_b(d) {
			//console.log('d: ', d)
			return d3.select('.axis--y1b')
				.selectAll('text')
				.filter(function(x) { return x == d.key; });
		}

		function select_bar_label_b(d) {
			//console.log('select_bar_label d: ', d)
			return d3.select('#bar_lbl_b_'+d.key)
		}

	
		//add x-axis titles
		locRowChart_a
			.append("text")
			.attr("class", "x-axis-title")
			.attr("transform", "translate(20," + (-35) + ")")   //axis/title at top of chart
			.text("Total Number of " + statTypeOptions.find(t => t.key === chartView.locRowChart.viewStatType).textCamel + " (" + formatDate(maxDate, 'short') + ")");



// ************* CREATE TIMESERIES CHART ***************** //

		//Render main SVGs
		svg2 = d3.select(id2)
			.append("svg")
			.attr("width", width2 + margin[id2].left + margin[id2].right)
			.attr("height", height2 + margin[id2].top + margin[id2].bottom)
			.style("background", 'white');

	
		var x2 = d3.scaleTime().range([0, width2]), //x-axis width, accounting for specified margins
			y2 = d3.scaleLinear().range([height2, 0])
			//ylet = d3.scaleLinear().range([height2, 0]),
	
		let x2Axis = d3.axisBottom(x2).tickFormat(d3.timeFormat('%b %d')),
			y2Axis = d3.axisLeft(y2).ticks(5).tickFormat(function(d) {
				return formatNumber(d.toFixed(0));
			});
			// yletAxis = d3.axisRight(ylet).ticks(5).tickFormat(function(d) {
			// 	if (d3.max(g.currentvars.currentTimeSeries, function(d) { return d.value.let; }) <= 0.003) {
			// 		return formatNumber((d*100).toFixed(2))+'%';
			// 	}
			// 	else {
			// 		return formatNumber((d*100).toFixed(1))+'%';
			// 	}
			// });
	
		svg2.append("defs").append("clipPath")
			.attr("id", "clip-ts")
			.append("rect")
			.attr("width", width2)
			.attr("height", height2);
	
		timeSeriesChart = svg2.append("g")
			.attr("class", "timeSeriesChart")
			.attr("transform", "translate(" + margin[id2].left + "," + margin[id2].top + ")")
		

		// set axes
		x2.domain([minDate,maxDate]);
		//console.log('x2.domain = ', x2.domain())
		
		//console.log('data for y2 domain: ', data);
		let domainMaxArr = [];
		domainMaxArr = data.map(d => d3.max(d.values, rec => (rec.type === chartView.outbreakChart.viewStatType) ? rec.value : undefined)).filter(v => v != undefined);  //max value for each location for selected statType
		//console.log('domainMaxArr: ', domainMaxArr)
		y2.domain([0, d3.max(domainMaxArr) ]); //.nice();
		//y2.domain([0,1000]); 
		//console.log('y2.domain = ', y2.domain())



		timeSeriesChart.append("g")
			.attr("class", "axis axis--x2")
			.attr("transform", "translate(0," + height2 + ")")  //render at bottom of chart
			.call(x2Axis);
	
		timeSeriesChart.append("g")
			.attr("class", "axis axis--y2")
			.call(y2Axis);

		let y_ts_title = accumTypeOptions.find(o => o.key === chartView.timeSeriesChart.viewAccumType).textCamel + ' ' + statTypeOptions.find(o => o.key === chartView.timeSeriesChart.viewStatType).textCamel;
		//console.log('y_ts_title: ', y_ts_title)
		timeSeriesChart.append("text")
			.attr("class", "y-axis-title")
			.attr("transform", "rotate(-90) translate(-102, -50)")  //axis rotated and left of chart 
			.text(y_ts_title)



// let statTypeOptions = [ {key: 'confirmed', text: 'confirmed cases', textCamel: 'Confirmed Cases'}, 
// {key: 'death', text: 'deaths', textCamel: 'Deaths'}
// ];  
// let accumTypeOptions = [ {key: 'daily', text: 'Daily' }, 
// {key: 'cumul', text: 'Cumulative' }
// ]							  


// let chartView = {
// locRowChart: { viewStatType: 'confirmed' },
// outbreakChart: { viewStatType: 'confirmed', viewAccumType: 'daily' },
// timeSeriesChart: { viewStatType: 'confirmed', viewAccumType: 'daily' },
// }





		timeSeriesChart.append("g")
			.attr('class', 'locLines')
			.attr("clip-path", "url(#clip-ts)");


		// Define line constructor (i.e. define x,y coordinates)
		const locationLine = d3.line()
			.curve(d3.curveMonotoneX)
			.x(function(d) { return x2(d['date']); })  //rename to x2Scale???
			.y(function(d) { return y2(d['value']); });  //rename to y2Scale???
			

		//HEIDI - READ http://datawanderings.com/2019/10/28/tutorial-making-a-line-chart-in-d3-js-v-5/
		
		// Draw lines
		//console.log('data for timeseries chart: ', data)
		const lines = timeSeriesChart.selectAll('.locLines').selectAll("lines")
			.data(data)  //array of all data with an object for each location
			.enter();
   

		let pos;
		lines.append("path")
			.attr("class", function(d) {
				//console.log('assign line class: ', d.locCode)
				return 'line line-' + d.locCode;
			})
			//.attr("d", function(d) { return locationLine(d.values); });  //d.values should be the array of object datapoints for a location e.g. [{date: xxx, value: yyy}, {date: xxx, value: yyy}, ...]
			.attr("d", function(d) {   //with filter
				//console.log('for line path: ', d.values.filter(rec => rec['type'] == 'confirmed')); 
				return locationLine(d.values.filter(rec => rec['type'] == 'confirmed')); //locationLine should receive array of object datapoints for a location e.g. [{date: xxx, value: yyy}, {date: xxx, value: yyy}, ...]
				
			})
			.attr("stroke", function(d) {
				//console.log('need color for: ', d.locCode)
				//pos = selectedLocList.indexOf(d.locCode);
				//console.log('color pos: ', pos, colors[pos])
				//return (pos==-1)? chartGrey : colors[pos];
				return getLocationColor(d.locCode); 
			})
			//.attr("stroke-width", 5);
			.attr("stroke-width", 1);
	
		let focus = timeSeriesChart.append("g")
		//let focus = svg2.append("g")
			.attr("class", "focus")
			.style("display", "none")
			//.attr("width", width2)
			//.attr("height", height2)
	
		focus.append("line")
			.attr("class", "lineHover")
			.style("stroke", "#999")
			//.style("stroke", 'yellow')
			.attr("stroke-width", 1)
			.style("shape-rendering", "crispEdges")
			.style("opacity", 0.5)
			.attr("y1", 0)
			.attr("y2", height2); 
	
		focus.append("text").attr("class", "lineHoverDate")
			.attr("text-anchor", "middle")
			.attr("font-size", '0.6rem')
			//.style("stroke", "#999")
			.style("opacity", 0.5);
	
		let overlay = timeSeriesChart.append("rect")
			.attr("class", "overlay")
			// .attr("x", margin[id2].left)
			.attr("width", width2)
			.attr("height", height2)
			
		//Time Series Legend
		// svg3 = d3.select(id3)
		// 	.append("svg")
		// 	.attr("width", width3 + margin[id3].left + margin[id3].right)
		// 	.attr("height", height3 + margin[id3].top + margin[id3].bottom)
		// 	//.style("background", 'orange');

		// timeSeriesLegend = svg3.append("g")
		// 	.attr("class", "timeSeriesLegend")
		// 	.attr("transform", "translate(" + margin[id3].left + "," + margin[id3].top + ")");

		// timeSeriesLegend
		// 	.append('text')
		// 	.attr("class", "tS-legend-title")
		// 	.attr("transform", "translate(0," + (10) + ")") 
		// 	//.attr("text-anchor", "middle")
		// 	.attr("font-size", '0.7rem')
		// 	//.style("stroke", "#999")
		// 	.style("opacity", 0.6)
		// 	.text('Selected Locations:')

		// timeSeriesLegend
		// 	.append('text')
		// 	.attr("class", "tS-legend-item")
		// 	.attr("transform", "translate(8," + (24) + ")") 
		// 	.attr("font-size", '0.7rem')
		// 	.style("opacity", 0.6)
		// 	.text('None selected');
		

	

// ************* CREATE OUTBREAK DAY CHART ***************** //

		//Render main SVGs
		svg4 = d3.select(id4)
			.append("svg")
			.attr("width", width4 + margin[id4].left + margin[id4].right)
			.attr("height", height4 + margin[id4].top + margin[id4].bottom)
			.style("background", 'white');

	
		var x4 = d3.scaleLinear().range([0, width4]), //x-axis width, accounting for specified margins
			y4 = d3.scaleLinear().range([height4, 0])
	
		let x4Axis = d3.axisBottom(x4).tickFormat(function(d) {
				return formatNumber(d.toFixed(0));  
			}),
			y4Axis = d3.axisLeft(y4).ticks(5).tickFormat(function(d) {
				return formatNumber(d.toFixed(0));
			});

		// gridlines in x axis function
		function make_x_gridlines() {		
			return d3.axisBottom(x4)
				.ticks(5)
		}

		// gridlines in y axis function
		function make_y_gridlines() {		
			return d3.axisLeft(y4)
				.ticks(5)
		}
	
		svg4.append("defs").append("clipPath")
			.attr("id", "clip-ob")
			.append("rect")
			.attr("width", width4)
			.attr("height", height4);
	
		outbreakDayChart = svg4.append("g")
			.attr("class", "outbreakDayChart")
			.attr("transform", "translate(" + margin[id4].left + "," + margin[id4].top + ")")

		// set axes
		// let domainDayNumArr, domainMaxDayNumArr = [];
		// //domainMaxDayNumArr = data.map(d => d3.max(d.values, rec => rec.dayNum));  //max dayNum for each location
		// domainDayNumArr = data.filter(d => selectedLocList.indexOf(d.locCode)!=-1);  //data for selected locations only
		// //console.log('domainArr.length: ', domainArr.length)
		// if (domainDayNumArr.length==0) {
		// 	domainMaxDayNumArr = data.map(d => d3.max(d.values, rec => rec.dayNum));  //max value for all locations
		// } else {
		// 	domainMaxDayNumArr = domainDayNumArr.map(d => d3.max(d.values, rec => rec.dayNum));  //max value for each selected location
		// }
		// console.log('domainMaxDayNumArr: ', domainMaxDayNumArr)
		// x4.domain([0, d3.max(domainMaxDayNumArr) ]); //.nice();  //max day num of outbreak for selected locations
		// console.log('x4.domain = ', x4.domain())

		let maxDayNum = 1;
		let allDayNumsArr = data.map(d => d3.max(d.values, rec => rec.dayNum)).filter(v => v != undefined); 
		if (allDayNumsArr.length > 0) {
			maxDayNum = d3.max(allDayNumsArr)
		}
		//console.log('allDayNumsArr: ', allDayNumsArr)
		//console.log('maxDayNum: ', maxDayNum)
		x4.domain([1, maxDayNum]); //.nice();  //max day num of outbreak for all data
		//console.log('x4.domain = ', x4.domain())

		//console.log('data for y4 domain: ', data);
		//let domainMaxArr = [];
		//domainMaxArr = data.map(d => d3.max(d.values, rec => rec.value));  //max value for each location
		//console.log('domainMaxArr: ', domainMaxArr)
		y4.domain([0, d3.max(domainMaxArr) ]); //.nice();
		//console.log('y4.domain = ', y4.domain())
		
	


		outbreakDayChart.append("g")
			.attr("class", "axis axis--x4")
			.attr("transform", "translate(0," + height4 + ")")  //render at bottom of chart
			.call(x4Axis);
	
		outbreakDayChart.append("g")
			.attr("class", "axis axis--y4")
			.call(y4Axis);

		outbreakDayChart.append("text")
			.attr("class", "x-axis-title")
			.attr("transform", "translate(100, " + (height4 + 35) + ")")  //axis bottom of chart 
			.text("Outbreak Day Number");

		let y_ob_title = accumTypeOptions.find(o => o.key === chartView.outbreakChart.viewAccumType).textCamel + ' ' + statTypeOptions.find(o => o.key === chartView.outbreakChart.viewStatType).textCamel;
		//console.log('y_ob_title: ', y_ob_title)
		outbreakDayChart.append("text")
			.attr("class", "y-axis-title")
			.attr("transform", "rotate(-90) translate(-170, -50)")  //axis rotated and left of chart 
			//.text("Daily Confirmed Cases");
			.text(y_ob_title);

		//add the X gridlines  (vertical)
		outbreakDayChart.append("g")			
			.attr("class", "grid grid-x")
			.attr("transform", "translate(0," + height4 + ")")
			.call(make_x_gridlines()
				.tickSize(-height4)
				.tickFormat("")
			)
	
		//add the Y gridlines (horizontal)
		outbreakDayChart.append("g")			
			.attr("class", "grid grid-y")
			//.attr("transform", "translate(0," + height4 + ")")
			.call(make_y_gridlines()
				.tickSize(-width4)
				.tickFormat("")
			)

		outbreakDayChart.append("g")
		 	.attr('class', 'outbreakLines')
			.attr("clip-path", "url(#clip-ob)");

		//Define line constructor (i.e. define x,y coordinates)
		const outbreakLine = d3.line()
			.curve(d3.curveMonotoneX)
			.x(function(d) { return x4(d['dayNum']); })  //rename to x4Scale???
			.y(function(d) { return y4(d['value']); });  //rename to y4Scale???

		
			
		//console.log('-------------------------------')
		//console.log('--- Create Outbreak Day chart ----')
		//console.log('data for createCharts: ', data)	//ALL DATA POINTS FOR ALL LOCATIONS
		// Draw outbreak lines
		
		//Get outbreak data
		let outbreakData = []; 
		let temp;
		for (let d in data) {
			temp = {};
			temp['locCode'] = data[d]['locCode']
			temp['values'] = data[d]['values'].filter(rec => rec.dayNum != null);
			outbreakData.push(temp)
		} 
		//console.log('outbreakData: ', outbreakData)		//OUTBREAK DATA POINTS FOR ALL LOCATIONS (i.e. locations with no outbreaks have empty data 'values' arrays)


		//console.log('data for outbreak day chart: ', data)
		const o_lines = outbreakDayChart.selectAll('.outbreakLines').selectAll("lines")
			.data(outbreakData)  //array of all data with an object for each location
			.enter();
   

		let o_pos;
		o_lines.append("path")
			.attr("class", function(d) {
				//console.log('assign line class: ', d.locCode)
				return 'oline oline-' + d.locCode;
			})
			.attr("d", function(d) {   //with filter
				//console.log('for line path: ', d.values.filter(rec => rec['type'] == chartView.outbreakChart.viewStatType)); 
				return outbreakLine(d.values.filter(rec => rec['type'] == chartView.outbreakChart.viewStatType)); //outbreakLine should receive array of object datapoints for a location e.g. [{date: xxx, value: yyy}, {date: xxx, value: yyy}, ...]
				//return null;
			})
			.attr("stroke", function(d) {
				//console.log('need color for: ', d.locCode)
				//pos = selectedLocList.indexOf(d.locCode);
				//console.log('color pos: ', pos, colors[pos])
				//return (pos==-1)? chartGrey : colors[pos];
				return getLocationColor(d.locCode); 
			})
			//.attr("stroke-width", 5);
			.attr("stroke-width", 1);

		
			let o_focus = outbreakDayChart.append("g")
			//let focus = svg2.append("g")
				.attr("class", "o_focus")
				.style("display", "none")
				//.attr("width", width2)
				//.attr("height", height2)
		
			o_focus.append("line")
				.attr("class", "o_lineHover")
				.style("stroke", "#999")
				//.style("stroke", 'yellow')
				.attr("stroke-width", 1)
				.style("shape-rendering", "crispEdges")
				.style("opacity", 0.5)
				.attr("y1", 0)
				.attr("y2", height4); 
		
			o_focus.append("text")
				.attr("class", "o_lineHoverDayNum")
				.attr("text-anchor", "middle")
				.attr("font-size", '0.6rem')
				//.style("stroke", "#999")
				.style("opacity", 0.5);
		
			let o_overlay = outbreakDayChart.append("rect")
				.attr("class", "o_overlay")
				// .attr("x", margin[id2].left)
				.attr("width", width4)
				.attr("height", height4)



		//Outbreak Day Legend
		svg5 = d3.select(id5)
			.append("svg")
			.attr("width", width5 + margin[id5].left + margin[id5].right)
			.attr("height", height5 + margin[id5].top + margin[id5].bottom)
			.style("background", 'white');

		outbreakDayLegend = svg5.append("g")
			.attr("class", "outbreakDayLegend")
			.attr("transform", "translate(" + margin[id5].left + "," + margin[id5].top + ")");

		// outbreakDayLegend
		// 	.append('text')
		// 	.attr("class", "oD-legend-title")
		// 	.attr("transform", "translate(0," + (4) + ")") 
		// 	//.attr("text-anchor", "middle")
		// 	.attr("font-size", '0.7rem')
		// 	//.style("stroke", "#999")
		// 	.style("opacity", 0.6)
		// 	.text('Selected Locations:')

		// outbreakDayLegend
		// 	.append('text')
		// 	.attr("class", "oD-legend-item")
		// 	.attr("transform", "translate(8," + (18) + ")") 
		// 	.attr("font-size", '0.7rem')
		// 	.style("opacity", 0.6)
		// 	.text('None selected');

		outbreakDayLegend
			.append('text')
			.attr("class", "oD-legend-item")
			.attr("transform", "translate(0," + (16) + ")") 
			//.attr("text-anchor", "middle")
			.attr("font-size", '0.7rem')
			//.style("stroke", "#999")
			.style("opacity", 0.6)
			.text('No locations selected')

		
}



function viewLocChartBy(type) {
	//console.log('CLICKED ON BUTTON: ', type)
	if (type=='confirmed' && document.getElementById('loc-type-death-btn').classList.contains('on')) {
		//console.log('CHANGE locChart to: ', type)
		chartView.locRowChart.viewStatType = type;
		document.getElementById('loc-type-conf-btn').classList.toggle('on');
		document.getElementById('loc-type-death-btn').classList.toggle('on');
		updateLocationTotalsRowChart(type);
	} else if (type=='death' && document.getElementById('loc-type-conf-btn').classList.contains('on')){ 
		//console.log('CHANGE locChart to: ', type)
		chartView.locRowChart.viewStatType = type;
		document.getElementById('loc-type-conf-btn').classList.toggle('on');
		document.getElementById('loc-type-death-btn').classList.toggle('on');
		updateLocationTotalsRowChart(type);
	} 
}


function viewOutbreakChartBy(type) {
	//console.log('CLICKED ON BUTTON: ', type)
	if (type=='confirmed' && document.getElementById('outbreak-type-death-btn').classList.contains('on')) {
		//console.log('CHANGE OutbreakChart to: ', type)
		chartView.outbreakChart.viewStatType = type;
		document.getElementById('outbreak-type-conf-btn').classList.toggle('on');
		document.getElementById('outbreak-type-death-btn').classList.toggle('on');
		updateOutbreakDayChart();
	} else if (type=='death' && document.getElementById('outbreak-type-conf-btn').classList.contains('on')){ 
		//console.log('CHANGE OutbreakChart to: ', type)
		chartView.outbreakChart.viewStatType = type;
		document.getElementById('outbreak-type-conf-btn').classList.toggle('on');
		document.getElementById('outbreak-type-death-btn').classList.toggle('on');
		updateOutbreakDayChart();
	} 
}

function viewOutbreakDayAccum(type) {
	//console.log('CLICKED ON BUTTON: ', type)
	if (type=='daily' && document.getElementById('outbreak-total-cum-btn').classList.contains('on')) {
		//console.log('CHANGE OutbreakChart to: ', type)
		chartView.outbreakChart.viewAccumType = type;
		document.getElementById('outbreak-total-daily-btn').classList.toggle('on');
		document.getElementById('outbreak-total-cum-btn').classList.toggle('on');
		updateOutbreakDayChart();
	} else if (type=='cumulative' && document.getElementById('outbreak-total-daily-btn').classList.contains('on')){ 
		//console.log('CHANGE OutbreakChart to: ', type)
		chartView.outbreakChart.viewAccumType = type;
		document.getElementById('outbreak-total-daily-btn').classList.toggle('on');
		document.getElementById('outbreak-total-cum-btn').classList.toggle('on');
		updateOutbreakDayChart();
	} 
}

function viewTimeSeriesChartBy(type) {
	//console.log('CLICKED ON BUTTON: ', type)
	if (type=='confirmed' && document.getElementById('timeSeries-type-death-btn').classList.contains('on')) {
		//console.log('CHANGE TimeSeries Chart to: ', type)
		chartView.timeSeriesChart.viewStatType = type;
		document.getElementById('timeSeries-type-conf-btn').classList.toggle('on');
		document.getElementById('timeSeries-type-death-btn').classList.toggle('on');
		updateTimeSeriesChart();
	} else if (type=='death' && document.getElementById('timeSeries-type-conf-btn').classList.contains('on')){ 
		//console.log('CHANGE TimeSeries Chart to: ', type)
		chartView.timeSeriesChart.viewStatType = type;
		document.getElementById('timeSeries-type-conf-btn').classList.toggle('on');
		document.getElementById('timeSeries-type-death-btn').classList.toggle('on');
		updateTimeSeriesChart();
	} 
}

function viewTimeSeriesAccum(type) {
	//console.log('CLICKED ON BUTTON: ', type)
	if (type=='daily' && document.getElementById('timeSeries-total-cum-btn').classList.contains('on')) {
		//console.log('CHANGE timeSeriesChart to: ', type)
		chartView.timeSeriesChart.viewAccumType = type;
		document.getElementById('timeSeries-total-daily-btn').classList.toggle('on');
		document.getElementById('timeSeries-total-cum-btn').classList.toggle('on');
		updateTimeSeriesChart();
	} else if (type=='cumulative' && document.getElementById('timeSeries-total-daily-btn').classList.contains('on')){ 
		//console.log('CHANGE timeSeriesChart to: ', type)
		chartView.timeSeriesChart.viewAccumType = type;
		document.getElementById('timeSeries-total-daily-btn').classList.toggle('on');
		document.getElementById('timeSeries-total-cum-btn').classList.toggle('on');
		updateTimeSeriesChart();
	} 
}



function updateCharts() {
	updateLocationTotalsRowChart();
	updateTimeSeriesChart();
	updateOutbreakDayChart();
}



function updateLocationTotalsRowChart(type) {
	//console.log('updateLocationTotalsRowChart to: ', type)
	let data = allData;
	//console.log('updateLocationTotals: data: ', data)

	let statTotalPerLoc = [];
	let tempX;
	locationList.forEach(loc => {
		tempX = { key: loc.code,
				 value: 0 };
		statTotalPerLoc.push(tempX);
	})
	//console.log('statTotalPerLoc: ', statTotalPerLoc)
	let locTotal, locValues
	data.forEach(d => {
		//console.log('d: ', d)
		locValues = d.values;
		locTotal = statTotalPerLoc.find(t => (t.key === d['locCode']));
		//console.log('locTotal: ', locTotal)
		locValues.forEach(v => {
			locTotal['value'] += (v['type'] === chartView.locRowChart.viewStatType) ? v['value'] : 0;
		
		})
	});
	// console.log('*** statTotalPerLoc: ', statTotalPerLoc.sort(function(a, b) {
	// 	return b.value - a.value;
	// }))
	
	//typeByLocGroup = statTotalPerLoc;

	// let allTypePerLoc = typeByLocGroup; //JSON.parse(JSON.stringify(typeByLocGroup.top(Infinity))); //deep copy & reverse sort
	// allTypePerLoc
	// console.log('allTypePerLoc: ', allTypePerLoc)
	//statTotalPerLoc.sort(function(a,b) { return +b.value - +a.value })   //descending order by value (cases)
	statTotalPerLoc.sort(function(a,b) { return a.value - b.value })   //descending order by value (cases)
	let statTotalPerLoc_a = statTotalPerLoc.slice(statTotalPerLoc.length-10,statTotalPerLoc.length);  //top 10
	let statTotalPerLoc_b = statTotalPerLoc.slice(0, statTotalPerLoc.length-10);				//without top 10
	// console.log('statTotalPerLoc_a: ', statTotalPerLoc_a)
	// console.log('statTotalPerLoc_b: ', statTotalPerLoc_b)
	// console.log('*** statTotalPerLoc: ', statTotalPerLoc)
	
	
	//Resize main SVGs
	svg1a.attr("width", width1a + margin[id1a].left + margin[id1a].right)
		  .attr("height", height1a + margin[id1a].top + margin[id1a].bottom);
	svg1b.attr("width", width1b + margin[id1b].left + margin[id1b].right)
	      .attr("height", height1b + margin[id1b].top + margin[id1b].bottom);
	svg1b_axis.attr("width", width1b + margin[id1b].left + margin[id1b].right)
		  .attr("height", margin[id1b].top + 1);
		  
	svg1a.select("defs").select("#clip-loc1a").select("rect")
		.attr("width", width1a)
		.attr("height", height1a);
	svg1b.select("defs").select("#clip-loc1b").select("rect")
		.attr("width", width1b)
		.attr("height", height1b);


	let x1a = d3.scaleLinear().range([0, width1a]), //x-axis width, accounting for specified margins  //rename to xScale?
		y1a = d3.scaleBand().range([height1a, 0]);		//rename to yScale?

	let x1aAxis = d3.axisTop(x1a).ticks(5).tickFormat(function(d) {   //axisTop for labels/ticks above axis
			return formatNumber(d.toFixed(0))
		}),
		y1aAxis = d3.axisLeft(y1a).tickFormat(function(d) {
			//console.log('tickFormat: ', d)
			//let loc = locationList.find(loc => d === loc.code);
			//return (loc == 'undefined') ? 'NA' : (loc.region.length == 0) ? loc.country : loc.country + ' (' + loc.region + ')';
			//console.log('for yAxis: ', d)
			return getLocNameFromCode(d);
		});
	
	let x1b = d3.scaleLinear().range([0, width1b]), //x-axis width, accounting for specified margins  //rename to xScale?
		y1b = d3.scaleBand().range([height1b, 0]);	

	let x1bAxis = d3.axisTop(x1b).ticks(5).tickFormat(function(d) {   //axisTop for labels/ticks above axis
			return formatNumber(d.toFixed(0))
		}),
		y1bAxis = d3.axisLeft(y1b).tickFormat(function(d) {
			return getLocNameFromCode(d);
		});



	//Set axes
	x1a.domain([0, d3.max(statTotalPerLoc_a, function(d) {
		return d.value;			// max is max for total values for any location (not max for a single day)
	})]);
	//console.log('x.domain = ', x.domain())
	
	y1a.domain(statTotalPerLoc_a.map(d => d.key)); 
	//console.log('y.domain = ', y.domain())


	x1b.domain([0, d3.max(statTotalPerLoc_b, function(d) {
		return d.value;			// max is max for total values for any location (not max for a single day)
	})]);
	//console.log('x.domain = ', x.domain())
	
	y1b.domain(statTotalPerLoc_b.map(d => d.key)); 
	//console.log('y.domain = ', y.domain())


	let bar_height_a = (height1a / statTotalPerLoc_a.length) - getBarSpacing(height1a / statTotalPerLoc_a.length); //setting bar height

	let bar_height_b = (height1b / statTotalPerLoc_b.length) - getBarSpacing(height1b / statTotalPerLoc_b.length); //setting bar height

	
	//xyz
	locRowChart_a.select(".axis--x1a") //transition the x axis
		.transition()
	 	.duration(750)
		.call(x1aAxis);

	locRowChart_a.select(".axis--y1a") //transition the y axis
		.transition()
	 	.duration(750)
		.call(y1aAxis);	

	locRowChart_b.select(".axis--x1b") //transition the x axis
		.transition()
	 	.duration(750)
		.call(x1bAxis);

	locRowChart_b_axis.select(".axis--x1b_axis")
		.transition()
		.duration(750)
		.call(x1bAxis);

	locRowChart_b.select(".axis--y1b") //transition the y axis
		.transition()
	 	.duration(750)
		.call(y1bAxis);

	locRowChart_b.select(".axis--x1b_axis") //transition the x axis
		.transition()
	 	.duration(750)
		.call(x1bAxis);

	locRowChart_b.select(".axis--y1b_axis") //transition the y axis
		.transition()
	 	.duration(750)
		.call(y1bAxis);



	locRowChart_a.selectAll(".bar_a")
		.data(statTotalPerLoc_a)
		.attr("class", "bar_a")
		.attr("id", function(d) { return "bar_a_" + d.key; })
		//.attr("clip-path", "url(#clip-loc1a)")
		.transition()
		.duration(750)
		.attr("x", 0)
		.attr("y", function(d) {
			return y1a(d.key);
		})
		.attr("width", function(d) {
			return x1a(d.value)
		})
		.attr("height", function(d) {
			//console.log('height: ', bar_height)
			return bar_height_a;
		})
		.attr("fill",  function(d) {
			//return colorPicker(d.value); 
			//return '#666666';
			return getBarColor(d.key, true)  //true that it is in 'top 10' (i.e. it is in chart '_a')
		})
		// .on("mouseover", handleMouseOver)
		// .on("mouseout", handleMouseOut)
		// .on("click", handleMouseClick);

		
	locRowChart_a.selectAll(".bar_label_a")  //add label positions & values for each bar - but keep empty until mouseover
		.data(statTotalPerLoc_a)
		.attr("class","bar_label_a")
		.attr("id", function(d) { return "bar_lbl_a_" + d.key; })
		.transition()
		.duration(750)
		.attr("x", function(d) { return x1a(d.value); } )
		.attr("y", function(d) { return y1a(d.key) + 1; })
		.attr("dy", ".75em")
		.text(function(d) { return ''});
		
	
	locRowChart_a.selectAll(".bar_overlay_a")
		.data(statTotalPerLoc_a)
		.attr("class", "bar_overlay_a")
		.attr("id", function(d) { return "bar_overlay_a_" + d.key; })
		.transition()
		.duration(750)
		.attr("x", function(d) {return x1a(d.value)})
		.attr("y", function(d) {
			return y1a(d.key);
		})
		.attr("width", function(d) {return width1a - x1a(d.value)})
		//.attr("width", width1a)
		.attr("height", bar_height_a)
		.attr('fill', chartGrey)
		.attr("fill-opacity",  0)
		// .on("mouseover", handleMouseOver)
		// .on("mouseout", handleMouseOut)
		// .on("click", handleMouseClick);	

	locRowChart_b.selectAll(".bar_b")
		.data(statTotalPerLoc_b)
		.attr("class", "bar_b")
		.attr("id", function(d) { return "bar_b_" + d.key; })
		//.attr("clip-path", "url(#clip-loc1b)")
		.transition()
		.duration(750)
		.attr("x", 0)
		.attr("y", function(d) {
			return y1b(d.key);
		})
		.attr("width", function(d) {
			return x1b(d.value)
		})
		.attr("height", function(d) {
			//console.log('height: ', bar_height)
			return bar_height_b;
		})
		.attr("fill",  function(d) {
			//return colorPicker(d.value); 
			//return '#a3a3a3';
			return getBarColor(d.key, false)  //false that it is not in 'top 10' (i.e. so is in chart '_b')
		})
		// .on("mouseover", handleMouseOver)
		// .on("mouseout", handleMouseOut)
		// .on("click", handleMouseClick);

		
	locRowChart_b.selectAll(".bar_label_b")  //add label positions & values for each bar - but keep empty until mouseover
		.data(statTotalPerLoc_b)
		.attr("class","bar_label_b")
		.attr("id", function(d) { return "bar_lbl_b_" + d.key; })
		.transition()
		.duration(750)
		.attr("x", function(d) { return x1b(d.value); } )
		.attr("y", function(d) { return y1b(d.key) + 1; })
		.attr("dy", ".75em")
		.text(function(d) { return ''});
		
	
	locRowChart_b.selectAll(".bar_overlay_b")
		.data(statTotalPerLoc_b)
		.attr("class", "bar_overlay_b")
		.attr("id", function(d) { return "bar_overlay_b_" + d.key; })
		.transition()
		.duration(750)
		.attr("x", function(d) {return x1b(d.value)})
		.attr("y", function(d) {
			return y1b(d.key);
		})
		.attr("width", function(d) {return width1b - x1b(d.value)})
		//.attr("width", width1a)
		.attr("height", bar_height_b)
		.attr('fill', chartGrey)
		.attr("fill-opacity",  0)
		// .on("mouseover", handleMouseOver)
		// .on("mouseout", handleMouseOut)
		// .on("click", handleMouseClick);


	// Create Event Handlers for mouse
	// function handleMouseOver(d, i) {  // Add interactivity
	// 	console.log('handleMouseOver ', d.key) //, i, this)
	// 	// Use D3 to select element, change color and size
	// 	d3.select('#bar_'+d.key).attr('fill', yellowHighlight)
	// 	d3.select('#bar_overlay_'+d.key).attr("fill-opacity",  0.5)

	// 	select_bar_label(d).attr('style', "font-family: sans-serif; font-size: 0.75rem; font-weight:").text('\u00A0'+formatNumber(d.value));
	// 	select_axis_label(d).attr('style', "font-weight: bold;");

	// }

	// function handleMouseOut(d, i) {
	// 	// Use D3 to select element, change color back to normal
	// 	d3.select('#bar_'+d.key).attr('fill', colorPicker(d.value))
	// 	d3.select('#bar_overlay_'+d.key).attr("fill-opacity",  0)

	// 	select_bar_label(d).attr('style', "font-weight: regular;").text('');
	// 	select_axis_label(d).attr('style', "font-weight: regular;");
	// }
	
	// function handleMouseClick(d, i) {  // Add interactivity
	// 	//console.log('handleMouseClick ', d, i)  //this = rect
	// 	updateSelectedLocations(d);		
	// }

	// function select_axis_label(d) {
	// 	//console.log('d: ', d)
	// 	return d3.select('.axis--y')
	// 		.selectAll('text')
	// 		.filter(function(x) { return x == d.key; });
	// }

	// function select_bar_label(d) {
	// 	//console.log('select_bar_label d: ', d)
	// 	return d3.select('#bar_lbl_'+d.key)
	// }

	//add x-axis titles
	locRowChart_a.select('.x-axis-title')  
		.attr("transform", function() {         //axis/title at top of chart
			if (chartView.locRowChart.viewStatType === 'confirmed') {
				return "translate(20," + (-35) + ")"
			} else if (chartView.locRowChart.viewStatType === 'death') {
				return "translate(30," + (-35) + ")" 
			} else {
				return "";
			}
		})  
		.text("Total Number of " + statTypeOptions.find(t => t.key === chartView.locRowChart.viewStatType).textCamel + " (" + formatDate(maxDate, 'short') + ")");

	// locRowChart.select(".axis--y") //transition the y axis
	// 	.transition()
	//  	.duration(750)
	// 	.call(yAxis);

}



function updateTimeSeriesChart() {
	//console.log('updateTimeSeriesChart ')
	//console.log('in updateTimeSeriesChart, data: ', allData)
	let data = allData;


    //Resize main SVGs
    svg2.attr("width", width2 + margin[id2].left + margin[id2].right)
        .attr("height", height2 + margin[id2].top + margin[id2].bottom);

	svg2.select("defs").select("#clip-ts").select("rect")
		.attr("width", width2)
		.attr("height", height2);

	let x2 = d3.scaleTime().range([0, width2]), //x-axis width, accounting for specified margins
		y2 = d3.scaleLinear().range([height2, 0]);
		x2.domain([minDate,maxDate]);
		//console.log('x2.domain = ', x2.domain())


		
	
	let selectedData = data.filter(d => selectedLocList.indexOf(d.locCode)!=-1);  //selectedData: ONLY OUTBREAK DATA POINTS, ONLY SELECTED LOCATIONS
	//console.log('selectedData: ', selectedData)

	let currentAccumType = chartView.timeSeriesChart.viewAccumType == 'daily' ? 'value' : 'cumVal';


	//FOR Y-DOMAIN: get max value for selectedOutbreakData (or if empty then for outbreakData)
	let domainArray, domainArrayMax;
	// if (selectedOutbreakData.length == 0) {
	// 	domainArray = outbreakData.filter(d => selectedLocList.indexOf(d.locCode) != -1)
	// } else {
	// 	domainArray = selectedOutbreakData.filter(d => selectedLocList.indexOf(d.locCode) != -1)
	// }
	domainArray = selectedData;
	//console.log('domainArray: ', domainArray.length, domainArray)

	if (domainArray.length==0) {		
		domainArrayMax = data.map(d => d3.max(d.values, rec => (rec.type === chartView.timeSeriesChart.viewStatType) ? rec[currentAccumType] : undefined));  //max value for all locations
	} else {
		domainArrayMax = domainArray.map(d => d3.max(d.values, rec => (rec.type === chartView.timeSeriesChart.viewStatType) ? rec[currentAccumType] : undefined)).filter(v => v != undefined);  //max value for each selected location
	}
	//console.log('domainArrayMax: ', domainArrayMax.length, domainArrayMax)

	if (domainArrayMax.length == 0) {
		y2.domain([0,1])
	} else {
		y2.domain([0, d3.max(domainArrayMax) ]); 
	}	
	// console.log('--- y2.domain = ', y2.domain())


	function numYTicks(maxY) {
		switch (maxY) {
			case 1: return 1;
			case 2: return 2;
			case 3: return 3;
			case 4: return 4;
			default: return 5;
		}			
	}

	let x2Axis = d3.axisBottom(x2).tickFormat(d3.timeFormat('%b %d')),
		y2Axis = d3.axisLeft(y2).ticks(numYTicks(y2.domain()[1])).tickFormat(function(d) {
			return formatNumber(d.toFixed(0));
		});

	
	timeSeriesChart = svg2.select('.timeSeriesChart')

	//transition axes 
	timeSeriesChart.select(".axis--x2")  //transition x-axis (for window resize)
		.transition()
	 	.duration(750)
		.call(x2Axis);
	timeSeriesChart.select(".axis--y2")  //transition y-axis
		.transition()
	 	.duration(750)
		.call(y2Axis);

	timeSeriesChart.select(".overlay")
		.attr("width", width2)
		.attr("height", height2)

		
	let y_ts_title = accumTypeOptions.find(o => o.key === chartView.timeSeriesChart.viewAccumType).textCamel + ' ' + statTypeOptions.find(o => o.key === chartView.timeSeriesChart.viewStatType).textCamel;
	// console.log('y_ts_title: ', y_ts_title)
	timeSeriesChart.select(".y-axis-title")  //position title depending on text
		.attr("transform", function() {
			if ((chartView.timeSeriesChart.viewStatType === 'confirmed') && (chartView.timeSeriesChart.viewAccumType === "daily")) {
				return "rotate(-90) translate(-102, -50)"
			} else if ((chartView.timeSeriesChart.viewStatType === 'death') && (chartView.timeSeriesChart.viewAccumType === "daily")) {
				return "rotate(-90) translate(-80, -50)" 
			} else if ((chartView.timeSeriesChart.viewStatType === 'confirmed') && (chartView.timeSeriesChart.viewAccumType === "cumulative")) {
				return "rotate(-90) translate(-124, -50)" 
			} else if ((chartView.timeSeriesChart.viewStatType === 'death') && (chartView.timeSeriesChart.viewAccumType === "cumulative")) {
				return "rotate(-90) translate(-90, -50)" 
			} else {
				return "" 
			}
		})  
		.text(y_ts_title);	


	//Define line constructor (i.e. define x,y coordinates)
	const locationLine = d3.line()
		.curve(d3.curveMonotoneX)
		.x(function(d) { return x2(d['date']); })  //rename to x2Scale???
		.y(function(d) { return y2(d[currentAccumType]); });  //rename to y2Scale???
		


   
	// //HEIDI - READ http://datawanderings.com/2019/10/28/tutorial-making-a-line-chart-in-d3-js-v-5/
	// // Draw lines

	//let lines = timeSeriesChart.select('.locLines').selectAll('path.line-AFG_1')   //selection for specific line
	//let lines = timeSeriesChart.select('.locLines').selectAll('path')   //selection good for all lines
	//let lines = timeSeriesChart.select('.locLines').selectAll('.line')  //selection good for all lines
	//	.remove();
	

	let pos;
	let lines = timeSeriesChart.select('.locLines').selectAll('path');
	lines
	    .data(data)    //an array of all data with an object for each location
		.transition()
		.duration(750)
		.attr("d", function(d) {   //with filter
			//console.log('for line path: ', d.values.filter(rec => rec['type'] == chartView.timeSeriesChart.viewStatType)); 
			return locationLine(d.values.filter(rec => rec['type'] == chartView.timeSeriesChart.viewStatType)); //locationLine should receive array of object datapoints for a location e.g. [{date: xxx, value: yyy}, {date: xxx, value: yyy}, ...]
			
		})
	    .attr("stroke", function(d) {
			//if (d.locCode == tempHoverLoc) d3.select(this).raise();
			//pos = selectedLocList.indexOf(d.locCode);
			if (selectedLocList.indexOf(d.locCode) != -1)  d3.select(this).raise();
			//console.log('color pos: ', pos, colors[pos])
			//return (pos==-1)? chartGrey : colors[pos];
			return getLocationColor(d.locCode);
		})
	    .attr("stroke-width", function(d) {
			// if (d.locCode == tempHoverLoc) return 2;
			pos = selectedLocList.indexOf(d.locCode);
			//console.log('color pos: ', pos, colors[pos])
			return (selectedLocList.indexOf(d.locCode) == -1) ? 1 : 2;
		});

	
	
	//let selectedData = data.filter(d => selectedLocList.indexOf(d.locCode) != -1 )
	//console.log('selectedData for legend / tooltip: ', selectedData)	

	// timeSeriesLegend.selectAll(".tS-legend-item").remove();

	// if (selectedData.length == 0) {
	// 	timeSeriesLegend
	// 		.append('text')
	// 		.attr("class", "tS-legend-item")
	// 		.attr("transform", "translate(8," + (24) + ")") 
	// 		.attr("font-size", '0.7rem')
	// 		.style("opacity", 0.6)
	// 		.text('None selected');
	
	// } else {
	// 	selectedData.forEach((loc,i) => {
	// 		//console.log('add loc to timeSeriesLegend: ', i, loc)
			
	// 		//draw location line
	// 		timeSeriesLegend      
	// 			.append('line')
	// 			.attr("class", "tS-legend-item tS-legend-item_" + i)
	// 			.attr("transform", "translate(0," + (6 + (i+1) * 14) + ")")
	// 			.attr("x1", 0)  
	// 			.attr("y1", 0)    			
	// 			.attr("x2", 16)  
	// 			.attr("y2", 0)		
	// 			.style("stroke", getLocationColor(loc['locCode']))
	// 			.attr("stroke-width", 2);

	// 		//write location name
	// 		timeSeriesLegend    
	// 			.append('text')
	// 			.attr("class", "tS-legend-item tS-legend-item_" + i)
	// 			.attr("transform", "translate(20," + (10 + (i+1) * 14) + ")") 
	// 			//.attr("text-anchor", "middle")
	// 			.attr("font-size", '0.7rem')
	// 			//.style("stroke", getLocationColor(loc['locCode']))
	// 			//.style("stroke", 'black')
	// 			.style("opacity", 0.6)
	// 			.text(getLocNameFromCode(loc['locCode']))
	// 			//.attr("stroke-width", 1);

	// 		//add grey rect for button to right of location name
	// 		timeSeriesLegend
	// 			.append('rect')
	// 			.attr("class", 'tS-legend-item tS-legend-xbutton-' + loc['locCode'])
	// 			.attr("transform", "translate(140," + (2 + (i+1) * 14) + ")") 
	// 		    .attr("width", 10)
	// 			.attr("height", 10)
	// 			.attr("rx", 2)	// how much to round corners
	// 			.attr("ry", 2)			
	// 			.attr('fill', chartGrey)
	// 			.attr('font-size', '1rem')
	// 			//.on("mouseover", e => handleMouseOverXLegendItem(d3.event))
	// 			.on("mouseover", function(){
	// 				d3.select(this).style("cursor", "pointer");
	// 			})
	// 			//.on("mouseout", handleMouseOut)
	// 			.on("click", function() {
	// 				//console.log('clicked on ', loc['locCode'])
	// 				updateSelectedLocations({key: loc['locCode']}) 
	// 			});
			
	// 		//add 'x' text for button to right of location name
	// 		timeSeriesLegend
	// 			.append('text')
	// 			.attr("class", 'tS-legend-item tS-legend-xtext-' + loc['locCode'])
	// 			.attr("transform", "translate(142," + (10 + (i+1) * 14) + ")") 
	// 			.attr('font-size', '0.8rem')
	// 			.attr('opacity', 0.7)
	// 			.text('x')
	// 			.on("mouseover", function() {
	// 				d3.select(this).style("cursor", "pointer");
	// 				//console.log('mouseover ', loc['locCode'])
	// 			})
	// 			.on("click", function() {
	// 				//console.log('clicked on ', loc['locCode'])
	// 				updateSelectedLocations({key: loc['locCode']}) 
	// 			});
	// 		})	

	// }

	tooltip(selectedData);

}


function updateOutbreakDayChart() {
	//console.log('--------------------------------------')
	// console.log('------ updateOutbreakDayChart ----------')
	//console.log('in updateOutbreakDayChart, data: ', allData)
	let data = allData;				//data: ALL DATA POINTS FOR ALL LOCATIONS
	//console.log('data: ', data)   
	
	//Get outbreak data
	let outbreakData = [];  	//outbreakData: ONLY OUTBREAK DATA POINTS, ALL LOCATIONS (i.e. locations with no outbreaks have empty 'values' arrays)
	let temp;
	for (let d in data) {
		temp = {};
		temp['locCode'] = data[d]['locCode']
		temp['values'] = data[d]['values'].filter(rec => rec.dayNum != null);
		outbreakData.push(temp)
	} 
	//console.log('outbreakData: ', outbreakData)
	let selectedOutbreakData = outbreakData.filter(d => selectedLocList.indexOf(d.locCode)!=-1);  //selectedOutbreakData: ONLY OUTBREAK DATA POINTS, ONLY SELECTED LOCATIONS
	// console.log('selectedOutbreakData: ', selectedOutbreakData)

	let currentAccumType = chartView.outbreakChart.viewAccumType == 'daily' ? 'value' : 'cumVal';


	// ************* UPDATE OUTBREAK DAY CHART ***************** //
	svg4.attr("width", width4 + margin[id4].left + margin[id4].right)
		.attr("height", height4 + margin[id4].top + margin[id4].bottom);
	svg5.attr("width", width5 + margin[id5].left + margin[id5].right)
		.attr("height", height5 + margin[id5].top + margin[id5].bottom);

	svg4.select("defs").select("#clip-ob").select("rect")
		.attr("width", width4)
		.attr("height", height4);
		  
	let x4 = d3.scaleLinear().range([0, width4]), //x-axis width, accounting for specified margins
		y4 = d3.scaleLinear().range([height4, 0]);
		

	//FOR Y-DOMAIN: get max value for selectedOutbreakData (or if empty then for outbreakData)
	let domainArray, domainArrayMax;
	if (selectedOutbreakData.length == 0) {
		domainArray = outbreakData.filter(d => selectedLocList.indexOf(d.locCode) != -1)
	} else {
		domainArray = selectedOutbreakData.filter(d => selectedLocList.indexOf(d.locCode) != -1)
	}
	//console.log('domainArray: ', domainArray.length, domainArray)

	if (domainArray.length==0) {		
		domainArrayMax = data.map(d => d3.max(d.values, rec => (rec.type === chartView.outbreakChart.viewStatType) ? rec[currentAccumType] : undefined));  //max value/cumVal for all locations
	} else {
		domainArrayMax = domainArray.map(d => d3.max(d.values, rec => (rec.type === chartView.outbreakChart.viewStatType) ? rec[currentAccumType] : undefined)).filter(v => v != undefined);  //max value/cumVal for each selected location
	}
	//console.log('domainArrayMax: ', domainArrayMax.length, domainArrayMax)

	if (domainArrayMax.length == 0) {
		y4.domain([0,1])
	} else {
		y4.domain([0, d3.max(domainArrayMax) ]); 
	}	
	//console.log('y4.domain = ', y4.domain())


	//FOR X-DOMAIN:
	let maxDayNum = 1;
	let allDayNumsArr = [];
	if (domainArray.length==0) {
		allDayNumsArr = data.map(d => d3.max(d.values, rec => rec.dayNum)).filter(v => v != undefined); 
	} else {
		allDayNumsArr = domainArray.map(d => d3.max(d.values, rec => rec.dayNum)).filter(v => v != undefined);
	}
	if (allDayNumsArr.length > 0) {
		maxDayNum = d3.max(allDayNumsArr)
	}
	//console.log('allDayNumsArr: ', allDayNumsArr)
	//console.log('maxDayNum: ', maxDayNum)
	x4.domain([1, maxDayNum]); //.nice();  //max day num of outbreak for selected locations
	//console.log('x4.domain = ', x4.domain())

	function numXTicks(maxX) {
		switch (maxX) {
			case 1: return 1;
			case 2: return 1;
			case 3: return 2;
			case 4: return 3;
			default: return 5;
		}			
	}
	function numYTicks(maxY) {
		switch (maxY) {
			case 1: return 1;
			case 2: return 2;
			case 3: return 3;
			case 4: return 4;
			default: return 5;
		}			
	}
	let x4Axis = d3.axisBottom(x4).ticks(numXTicks(maxDayNum)).tickFormat(function(d) {
			return formatNumber(d.toFixed(0))
		}),
		y4Axis = d3.axisLeft(y4).ticks(numYTicks(y4.domain()[1])).tickFormat(function(d) {
			return formatNumber(d.toFixed(0))
		});

	// gridlines in x axis function
	function make_x_gridlines() {		
		return d3.axisBottom(x4)
			.ticks(5)
	}

	// gridlines in y axis function
	function make_y_gridlines() {		
		return d3.axisLeft(y4)
			.ticks(5)
	}


	outbreakDayChart = svg4.select('.outbreakDayChart')
	outbreakDayChart.select(".axis--x4") // change the x axis
		.transition()
	 	.duration(750)
		.call(x4Axis);

	outbreakDayChart.select(".axis--y4") // change the y axis
		.transition()
	 	.duration(750)
		.call(y4Axis);

	outbreakDayChart.select(".o_overlay")
		.attr("width", width4)
		.attr("height", height4)

	//transition X gridlines  (vertical)
	outbreakDayChart.select(".grid-x")			
		.transition()
	 	.duration(750)
		//.attr("transform", "translate(0," + height4 + ")")
		.call(make_x_gridlines()
			.tickSize(-height4)
			.tickFormat("")
		)

	//transition Y gridlines (horizontal)
	outbreakDayChart.select(".grid-y")			
		.transition()
	 	.duration(750)
		.call(make_y_gridlines()
			.tickSize(-width4)
			.tickFormat("")
		)

	let y_ob_title = accumTypeOptions.find(o => o.key === chartView.outbreakChart.viewAccumType).textCamel + ' ' + statTypeOptions.find(o => o.key === chartView.outbreakChart.viewStatType).textCamel;
	outbreakDayChart.select(".y-axis-title")
		.attr("transform", function() {
			if ((chartView.outbreakChart.viewStatType === 'confirmed') && (chartView.outbreakChart.viewAccumType === "daily")) {
				return "rotate(-90) translate(-170, -50)"
			} else if ((chartView.outbreakChart.viewStatType === 'death') && (chartView.outbreakChart.viewAccumType === "daily")) {
				return "rotate(-90) translate(-150, -50)" 
			} else if ((chartView.outbreakChart.viewStatType === 'confirmed') && (chartView.outbreakChart.viewAccumType === "cumulative")) {
				return "rotate(-90) translate(-180, -50)" 
			} else if ((chartView.outbreakChart.viewStatType === 'death') && (chartView.outbreakChart.viewAccumType === "cumulative")) {
				return "rotate(-90) translate(-160, -50)" 
			} else {
				return "";
			}
		}) 
		.text(y_ob_title);

	//Define line constructor (i.e. define x,y coordinates)
	const outbreakLine = d3.line()
		.curve(d3.curveMonotoneX)
		.x(function(d) { 
			//console.log(d, d['dayNum'], x4(d['dayNum'])); 
			return x4(d['dayNum']); 
		})  //rename to x4Scale???
		.y(function(d) { 
			//console.log(d['value'], y4(d['value])); 
			return y4(d[currentAccumType]); 
		});  //rename to y4Scale???


	//Draw lines
	let o_pos;
	let o_lines = outbreakDayChart.select('.outbreakLines').selectAll('path');
	o_lines
		.data(outbreakData)
		//.data(selectedOutbreakData)    //an array of all data with an object for each location
		.transition()
		.duration(750)
		.attr("d", function(d) {   //with filter
			return outbreakLine(d.values.filter(rec => rec['type'] === chartView.outbreakChart.viewStatType)); //outbreakLine should receive array of object datapoints for a location e.g. [{date: xxx, value: yyy}, {date: xxx, value: yyy}, ...]
		})
	    .attr("stroke", function(d) {
			//pos = selectedLocList.indexOf(d.locCode);
			// if (d.locCode == tempHoverLoc) d3.select(this).raise();
			if (selectedLocList.indexOf(d.locCode) != -1)  d3.select(this).raise();
			//console.log('color pos: ', pos, colors[pos])
			//return (pos==-1)? chartGrey : colors[pos];
			return getLocationColor(d.locCode);
		})
	    .attr("stroke-width", function(d) {
			//console.log('selectedLocList: ', selectedLocList.length, selectedLocList.filter(l => l != null).length, selectedLocList)
			// if (d.locCode == tempHoverLoc) return 2;
			pos = selectedLocList.indexOf(d.locCode);
			//console.log('color pos: ', pos, colors[pos])
			//return (selectedLocList.indexOf(d.locCode) == -1) ? 0 : 2;
			return (selectedLocList.filter(l => l != null).length==0) ? 1 : (selectedLocList.indexOf(d.locCode) == -1) ? 0 : 2;
		});

	
	
	//let selectedData = data.filter(d => selectedLocList.indexOf(d.locCode) != -1 )
	let selectedData = outbreakData.filter(d => selectedLocList.indexOf(d.locCode) != -1 )
	
	//console.log('selectedData for legend / tooltip: ', selectedData)	

	outbreakDayLegend.selectAll(".oD-legend-item").remove();

	if (selectedData.length == 0) {
		outbreakDayLegend
			.append('text')
			.attr("class", "oD-legend-item")
			.attr("transform", "translate(0," + (16) + ")") 
			.attr("font-size", '0.7rem')
			.style("opacity", 0.6)
			.text('No locations selected');
	
	} else {
		selectedData.forEach((loc,i) => {
			//console.log('add loc to timeSeriesLegend: ', i, loc)
			
			//draw location line
			outbreakDayLegend      
				.append('line')
				.attr("class", "oD-legend-item oD-legend-item_" + i)
				.attr("transform", "translate(" + (Math.floor(i/5)*200 + 0) + "," + (-14 + (i%5+1) * 14) + ")")
				.attr("x1", 0)  
				.attr("y1", 0)    			
				.attr("x2", 16)  
				.attr("y2", 0)		
				.style("stroke", getLocationColor(loc['locCode']))
				.attr("stroke-width", 2);

			//write location name
			outbreakDayLegend    
				.append('text')
				.attr("class", "oD-legend-item oD-legend-item_" + i)
				.attr("transform", "translate(" + (Math.floor(i/5)*200 + 20) + "," + (-10 + (i%5+1) * 14) + ")") 
				//.attr("text-anchor", "middle")
				.attr("font-size", '0.7rem')
				//.style("stroke", getLocationColor(loc['locCode']))
				//.style("stroke", 'black')
				.style("opacity", 0.6)
				.text(getLocNameFromCode(loc['locCode']))
				//.attr("stroke-width", 1);

			//add grey rect for button to right of location name
			outbreakDayLegend
				.append('rect')
				.attr("class", 'oD-legend-item oD-legend-xbutton-' + loc['locCode'])
				.attr("transform", "translate(" + (Math.floor(i/5)*200 + 140) + "," + (-18 + (i%5+1) * 14) + ")") 
			    .attr("width", 10)
				.attr("height", 10)
				.attr("rx", 2)	// how much to round corners
				.attr("ry", 2)			
				.attr('fill', chartGrey)
				.attr('font-size', '1rem')
				//.on("mouseover", e => handleMouseOverXLegendItem(d3.event))
				.on("mouseover", function(){
					d3.select(this).style("cursor", "pointer");
				})
				//.on("mouseout", handleMouseOut)
				.on("click", function() {
					//console.log('clicked on ', loc['locCode'])
					updateSelectedLocations({key: loc['locCode']}) 
				});
			
			//add 'x' text for button to right of location name
			outbreakDayLegend
				.append('text')
				.attr("class", 'oD-legend-item oD-legend-xtext-' + loc['locCode'])
				.attr("transform", "translate(" + (Math.floor(i/5)*200 + 142) + "," + (-10 + (i%5+1) * 14) + ")") 
				.attr('font-size', '0.8rem')
				.attr('opacity', 0.7)
				.text('x')
				.on("mouseover", function() {
					d3.select(this).style("cursor", "pointer");
					//console.log('mouseover ', loc['locCode'])
				})
				.on("click", function() {
					//console.log('clicked on ', loc['locCode'])
					updateSelectedLocations({key: loc['locCode']}) 
				});
		

		})

	}

	obTooltip(outbreakData);

}


function colorPicker(v) {
	if (v <= 5000) {
	  return "#666666";
	} else {
	  return "#FF0033";
	}
}


function updateSelectedLocations(d) {
	//console.log('in updateSelectedLocations: ', d)

	if (d != null) {
		//console.log('old selectedLocList: ', selectedLocList)
		let idx = selectedLocList.indexOf(d.key);
		
		if (idx != -1) {		   //if loc is already in list then remove it and replace it with null
			//selectedLocList.splice(idx, 1)
			selectedLocList[idx] = null;
		} else if (idx == -1) {	  //if loc not already in list... 
			//selectedLocList.push(d.key)  

			let nullIdx = selectedLocList.findIndex(d => d == null);
			if (nullIdx == -1) {    			//if there is no null in list...
				if (selectedLocList.length < 10) {            //and list is <10 then add it to the end
					selectedLocList.push(d.key) 		
				} else if (selectedLocList.length >= 10) {	  //and list is >=10 then replace the first location
					selectedLocList[replacePosition] = d.key;
					if (replacePosition >= 9) replacePosition = 0;
					else replacePosition++;
				}
				
			} else {							//if there is a null in list, then put it in that position
				selectedLocList[nullIdx] = d.key
			}
		} 
		//console.log('new selectedLocList: ', selectedLocList)
		//updateCharts(d);
		updateCharts();
	}
	//updateCharts();
	
	//let locations_html = '<div class="row justify-content-around">';

	// selectedLocList.forEach(loc => {
	// 	//console.log('for selectedLocList, loc: ', loc)
	// 	if (loc != null) {
	// 		locations_html += '<div class="col-sm-6 mb-0 p-1"><div class="card"><div class="card-body p-2">';
	// 		locations_html += '<span class="card-title">' + getLocNameFromCode(loc) + '</span><hr class="mt-2 mb-1">';
	// 		locations_html += '<div class="card-text">' + getLocStatsFromCode(loc) + '</div>';
	// 		locations_html += '</div></div></div>';
	// 	}	
	// })

	// e.g. <div class="col-sm-4 mb-3">
	// 	<div class="card">
	// 		<div class="card-body">
	// 			<p class="card-title">TITLE</p>
	// 			<p class="card-text">This is the descriptive part of the card.</p>
	// 		</div>
	// 	</div>
	// </div>
					
	//locations_html += '</div>';

	//console.log('selectedLocList: ', selectedLocList)
}


function getLocNameFromCode(code) {
	//console.log('getLocNameFromCode: ', code, locationList)
	let locMatch = locationList.find(loc => code === loc.code);
	//console.log('locMatch: ', locMatch);

	function shortName(longName) {
		switch(longName) {
			case 'Australia (Australian Capital Territory)': return 'Australia (ACT)'; 
			case 'Australia (New South Wales)': return 'Australia (NSW)'; 
			case 'Australia (Northern Territory)': return 'Australia (NT)'; 
			case 'Australia (Queensland)': return 'Australia (QLD)';
			case 'Australia (South Australia)': return 'Australia (SA)';
			case 'Australia (Western Australia)': return 'Australia (WA)';
			case 'Bosnia and Herzegovina': return 'Bosnia & Herzegovina';
			case 'Canada (British Columbia)': return 'Canada (BC)';
			case 'Canada (Grand Princess)': return 'Canada (Grand Princess)';  //not abbrev
			case 'Canada (New Brunswick)': return 'Canada (NB)';
			case 'Canada (Newfoundland and Labrador)': return 'Canada (NL)';
			case 'Canada (Northwest Territories)': return 'Canada (NT)';
			case 'Canada (Prince Edward Island)': return 'Canada (PE Isl.)';
			case 'Canada (Saskatchewan)': return 'Canada (Sask.)';
			case 'Canada (Diamond Princess)': return 'Canada (Diamond Pr.)';
			case 'Central African Republic': return 'Central African Rep.';
			case 'Denmark (Faroe Islands)': return 'Denmark (Faroe Isl.)';
			case 'France (French Guiana)': return 'France (Fr. Guiana)';
			case 'France (French Polynesia)': return 'France (Fr. Polynesia)';
			case 'France (New Caledonia)': return 'France (N. Caledonia)';
			case 'France (Saint Barthelemy)': return 'France (St Barthelemy)';
			case 'Netherlands (Bonaire, Sint Eustatius and Saba)': return 'Netherlands (BQ)';
			case 'Netherlands (Sint Maarten)': return 'Netherlands (St Maarten)';
			case 'Saint Vincent and the Grenadines': return 'St Vincent & Grenadines';
			//case 'United Kingdom': return 'UK';
			case 'United Kingdom (Bermuda)': return 'UK (Bermuda)';
			case 'United Kingdom (Cayman Islands)': return 'UK (Cayman Isl.)';
			case 'United Kingdom (Channel Islands)': return 'UK (Channel Isl.)';
			case 'United Kingdom (Gibraltar)': return 'UK (Gibraltar)';
			case 'United Kingdom (Falkland Islands (Islas Malvinas))': return 'UK (Falkland Islands)';
			case 'United Kingdom (Isle of Man)': return 'UK (Isle of Man)';
			case 'United Kingdom (Montserrat)': return 'UK (Montserrat)';
			case 'United Kingdom (Turks and Caicos Islands)': return 'UK (Turks & Caicos Isl.)';
			case 'United Kingdom (British Virgin Islands)': return 'UK (British Virgin Isl.)';
			case 'United Kingdom (Anguilla)': return 'UK (Anguilla)';

			default: return longName;
		}
	}
	
	return (locMatch == 'undefined') ? 'NA' : shortName((locMatch.region.length == 0) ? locMatch.country : locMatch.country + ' (' + locMatch.region + ')');			
}


// function getLocStatsFromCode(code) {
// 	let stats_html = '';

// 	let obStartDateStr = 'None';
// 	let obStartDate = locationList.find(loc => loc.code === code).day_1;

// 	if (obStartDate != null) {
// 		let month = obStartDate.getMonth() + 1 < 9 ? '0' + (obStartDate.getMonth() + 1) : obStartDate.getMonth() + 1;
// 		obStartDateStr = obStartDate.getDate() + '/' + month + '/' + obStartDate.getFullYear();
// 	}

// 	stats_html += '<span>Confirmed: <b>' + 'x' + '</b></span><br>';
// 	stats_html += '<span>Recovered: <b>' + 'x' + '</b></span><br>';
// 	stats_html += '<span>Deaths: <b> ' + 'x' + '</b></span><br>';
// 	stats_html += '<span>Outbreak Day 1: <b> ' + obStartDateStr + '</b></span>';

// 	let locMatch = locationList.find(loc => code === loc.code);
// 	//console.log('locMatch: ', locMatch);
// 	return stats_html;
// }


function tooltip(selectedData) {
	//console.log('width2, height2: ', width2, height2)
	//console.log('tooltip selectedData: ', selectedData)
	let data = allData;
	let x2 = d3.scaleTime().range([0, width2]), //x-axis width, accounting for specified margins
		y2 = d3.scaleLinear().range([height2, 0])
		x2.domain([minDate,maxDate]);

	let currentAccumType = chartView.timeSeriesChart.viewAccumType == 'daily' ? 'value' : 'cumVal';

	//let selectedData = data.filter(d => selectedLocList.indexOf(d.locCode)!=-1);
	//console.log('NEW selectedData: ', selectedData)
	//FOR Y-DOMAIN: get max value for selectedData (or if empty then for data)
	//let domainArray;
	let domainArrayMax;
	// if (selectedData.length == 0) {
	// 	domainArray = data.filter(d => selectedLocList.indexOf(d.locCode) != -1)
	// } else {
	// 	domainArray = selectedData.filter(d => selectedLocList.indexOf(d.locCode) != -1)
	// }
	//console.log('domainArray: ', domainArray.length, domainArray)

	if (selectedData.length==0) {		
		domainArrayMax = data.map(d => d3.max(d.values, rec => (rec.type === chartView.timeSeriesChart.viewStatType) ? rec[currentAccumType] : undefined));  //max value for all locations
	} else {
		domainArrayMax = selectedData.map(d => d3.max(d.values, rec => (rec.type === chartView.timeSeriesChart.viewStatType) ? rec[currentAccumType] : undefined)).filter(v => v != undefined);  //max value for each selected location
	}
	//console.log('domainArrayMax: ', domainArrayMax.length, domainArrayMax)
	//console.log('MAX 2: ', d3.max(domainArrayMax) )
	if (domainArrayMax.length == 0) {
		y2.domain([0,1])
	} else {
		y2.domain([0, d3.max(domainArrayMax) ]); 
	}	
	//console.log('y2.domain = ', y2.domain())
  


	var labels = timeSeriesChart.select('.focus').selectAll(".lineHoverText")
		.data(selectedData)

	labels.enter().append("text")
		.attr("class", "lineHoverText")
		//.style("fill", d => z(d))
		.style("fill", function(d) {
			//console.log('xlabel ', d.locCode, getLocationColor(d.locCode)); 
			return getLocationColor(d.locCode)
		})  //get correct color for current location)  
		.attr("text-anchor", "start")
		.attr("font-size", '0.7rem')
		//.attr("dy", (_, i) => 1 + i * 2 + "em")
		.attr("dy", (_, i) => -2 + (i*1.2)  + "em")
		.merge(labels);
	labels.exit().remove();		//remove unneeded labels


	var circles = timeSeriesChart.select('.focus').selectAll(".hoverCircle")
			.data(selectedData)

	circles.enter().append("circle")
		.attr("class", "hoverCircle")
		.style("fill", function(d) {
			//console.log('xcircle ', d.locCode, getLocationColor(d.locCode)); 
			return getLocationColor(d.locCode)
		})  //get correct color for current location
		.attr("r", 2.5)
		.merge(circles);
	circles.exit().remove();		//remove unneeded circles


	timeSeriesChart.select(".overlay")
		.on("mouseover", function() { timeSeriesChart.select('.focus').style("display", null); })
		.on("mouseout", function() { timeSeriesChart.select('.focus').style("display", "none"); })
		.on("mousemove", mousemove);



	function mousemove() {
		//console.log('in mousemove for labels: ', selectedData)
		let data = allData;

		// This allows to find the closest X index of the mouse:
		let bisectDate = d3.bisector(function(d) { 
			//console.log('bisector ', d);
			return d.date; 
		}).left;

		var x2 = d3.scaleTime().range([0, width2]); //x-axis width, accounting for specified margins
		y2 = d3.scaleLinear().range([height2, 0])
		x2.domain([minDate,maxDate]);
		let x0 = x2.invert(d3.mouse(this)[0]);  //date hovered
		//console.log('date hovered: ', x0)

		let selectedData = data.filter(d => selectedLocList.indexOf(d.locCode)!=-1);

		if (selectedData.length > 0) {
			let firstLoc = selectedData[0].values.filter(v => v.type === chartView.timeSeriesChart.viewStatType);
			//console.log('firstLoc: ', firstLoc)
			const i = bisectDate(firstLoc, x0, 1);
			//console.log('i: ', i)
			const d0 = firstLoc[i - 1];
			//console.log('d0: ', d0)
			const d1 = firstLoc[i];
			//console.log('d1: ', d1)
			const currentPoint = x0 - d0['date'] > d1['date'] - x0 ? d1 : d0;
			//console.log('currentPoint: ', currentPoint)
			x0 = currentPoint.date;
		} 
		

		// let domainArr, domainMaxArr = [];
		// //domainMaxArr = data.map(d => d3.max(d.values, rec => rec.value));  //max value for each location
		// domainArr = data.filter(d => selectedLocList.indexOf(d.locCode)!=-1);  //data for selected locations only
		// //console.log('domainArr.length: ', domainArr.length)
		// if (domainArr.length==0) {
		// 	domainMaxArr = data.map(d => d3.max(d.values, rec => rec.value));  //max value for all locations
		// } else {
		// 	domainMaxArr = domainArr.map(d => d3.max(d.values, rec => rec.value));  //max value for each selected location
		// }
		// //console.log('domainMaxArr: ', domainMaxArr)
		// y2.domain([0, d3.max(domainMaxArr) ]); //.nice();
		//console.log('y2.domain = ', y2.domain())
		//********* */
		//let selectedData = data.filter(d => selectedLocList.indexOf(d.locCode)!=-1);
		//console.log('NEW selectedData: ', selectedData)
		//FOR Y-DOMAIN: get max value for selectedData (or if empty then for data)
		//let domainArray;
		let domainArrayMax;
		// if (selectedData.length == 0) {
		// 	domainArray = data.filter(d => selectedLocList.indexOf(d.locCode) != -1)
		// } else {
		// 	domainArray = selectedData.filter(d => selectedLocList.indexOf(d.locCode) != -1)
		// }
		//console.log('domainArray: ', domainArray.length, domainArray)

		if (selectedData.length==0) {		
			domainArrayMax = data.map(d => d3.max(d.values, rec => (rec.type === chartView.timeSeriesChart.viewStatType) ? rec[currentAccumType] : undefined));  //max value for all locations
		} else {
			domainArrayMax = selectedData.map(d => d3.max(d.values, rec => (rec.type === chartView.timeSeriesChart.viewStatType) ? rec[currentAccumType] : undefined)).filter(v => v != undefined);  //max value for each selected location
		}
		//console.log('domainArrayMax: ', domainArrayMax.length, domainArrayMax)
		//console.log('MAX 2: ', d3.max(domainArrayMax) )
		if (domainArrayMax.length == 0) {
			y2.domain([0,1])
		} else {
			y2.domain([0, d3.max(domainArrayMax) ]); 
		}	
		//console.log('y2.domain = ', y2.domain())


		timeSeriesChart.select('.focus').select(".lineHover")
			.attr("transform", "translate(" + x2(x0) + "," + 0 + ")");

		timeSeriesChart.select('.focus').select(".lineHoverDate")
			.attr("transform", "translate(" + x2(x0) + "," + (-5) + ")")
			.text(formatDate(x0));

		//console.log('selectedData for circles: ', selectedData)
		let circles = timeSeriesChart.select('.focus').selectAll(".hoverCircle")
							.data(selectedData);
		circles.attr("class", "hoverCircle")
			.style("fill", function(d) {
				//console.log('ycircle ', d.locCode, getLocationColor(d.locCode)); 
				return getLocationColor(d.locCode)
			})  //get correct color for current location
			.attr("r", 2.5)
			.merge(circles)
			.attr("cy", function(e) {
							//console.log('e: ', e); 
							let val = e.values.find(v => (sameDay(v.date, x0) && v.type === chartView.timeSeriesChart.viewStatType))[currentAccumType];
							return y2(val)
						})
			.attr("cx", x2(x0));


		timeSeriesChart.select('.focus').selectAll(".lineHoverText")
			.attr("transform", 
				"translate(" + (x2(x0)) + "," + height2 / 2.5 + ")")
			.style("fill", function(d) {
				//console.log('xlabel ', d.locCode, getLocationColor(d.locCode)); 
				return getLocationColor(d.locCode)
			})  //get correct color for current location)  
			.text(function(d) {return getLocNameFromCode(d.locCode) + ': ' + getValue(d.locCode,x0) }) 

		x2(x0) > (width2 - width2 / 4) 
			? timeSeriesChart.select('.focus').selectAll("text.lineHoverText")
				.attr("text-anchor", "end")
				.attr("dx", -10)
			: timeSeriesChart.select('.focus').selectAll("text.lineHoverText")
				.attr("text-anchor", "start")
				.attr("dx", 10)

		
		function getValue(locCode, date) {
			//console.log('in getValuefor labels: ', locCode, date, selectedData)
			let values = selectedData.find(d => d.locCode === locCode).values;
			//console.log('values: ', values)
			let val = values.find(v => sameDay(v.date, date) && v.type === chartView.timeSeriesChart.viewStatType);
			if (val==undefined) return 'NA';
			return formatNumber(val[currentAccumType]);
		}

	}
}



function obTooltip(outbreakData) {
	//console.log('width4, height4: ', width4, height4)
	//console.log('obTooltip outbreakData: ', outbreakData)
	let data = outbreakData;
	let x4 = d3.scaleLinear().range([0, width4]), //x-axis width, accounting for specified margins
		y4 = d3.scaleLinear().range([height4, 0]);

	let selectedOutbreakData = outbreakData.filter(d => selectedLocList.indexOf(d.locCode)!=-1);
	let currentAccumType = chartView.outbreakChart.viewAccumType == 'daily' ? 'value' : 'cumVal';


	//FOR Y-DOMAIN: get max value for selectedOutbreakData (or if empty then for outbreakData)
	let domainArray, domainArrayMax;
	if (selectedOutbreakData.length == 0) {
		domainArray = outbreakData.filter(d => selectedLocList.indexOf(d.locCode) != -1)
	} else {
		domainArray = selectedOutbreakData.filter(d => selectedLocList.indexOf(d.locCode) != -1)
	}
	//console.log('domainArray: ', domainArray.length, domainArray)


	if (domainArray.length==0) {		
		domainArrayMax = data.map(d => d3.max(d.values, rec => (rec.type === chartView.outbreakChart.viewStatType) ? rec[currentAccumType] : undefined));  //max value for all locations
	} else {
		domainArrayMax = domainArray.map(d => d3.max(d.values, rec => (rec.type === chartView.outbreakChart.viewStatType) ? rec[currentAccumType] : undefined)).filter(v => v != undefined);  //max value for each selected location
	}
	//console.log('domainArrayMax: ', domainArrayMax.length, domainArrayMax)

	if (domainArrayMax.length == 0) {
		y4.domain([0,1])
	} else {
		y4.domain([0, d3.max(domainArrayMax) ]); 
	}	
	//console.log('y4.domain = ', y4.domain())


	
	let maxDayNum = 1;
	let allDayNumsArr = [];
	if (selectedOutbreakData.length==0) {
		allDayNumsArr = outbreakData.map(d => d3.max(d.values, rec => rec.dayNum)).filter(v => v != undefined); 
	} else {
		allDayNumsArr = selectedOutbreakData.map(d => d3.max(d.values, rec => rec.dayNum)).filter(v => v != undefined);
	}
	if (allDayNumsArr.length > 0) {
		maxDayNum = d3.max(allDayNumsArr)
	}
	//console.log('allDayNumsArr: ', allDayNumsArr)
	//console.log('maxDayNum: ', maxDayNum)
	x4.domain([1, maxDayNum]); //.nice();  //max day num of outbreak for selected locations
	//console.log('x4.domain = ', x4.domain())
	//x4.domain([minDate,maxDate]);


	// let x4Axis = d3.axisBottom(x4).ticks(5).tickFormat(function(d) {
	// 		return formatNumber(d.toFixed(0))
	// 	}),
	// 	y4Axis = d3.axisLeft(y4).ticks(5).tickFormat(function(d) {
	// 		return formatNumber(d.toFixed(0))
	// 	});


	let o_labels = outbreakDayChart.select('.o_focus').selectAll(".o_lineHoverText")
		.data(selectedOutbreakData)

	o_labels.enter().append("text")
		.attr("class", "o_lineHoverText")
		//.style("fill", d => z(d))
		.style("fill", function(d) {
			//console.log('xlabel ', d.locCode, getLocationColor(d.locCode)); 
			return getLocationColor(d.locCode)
		})  //get correct color for current location)  
		.attr("text-anchor", "start")
		.attr("font-size", '0.7rem')
		//.attr("dy", (_, i) => 1 + i * 2 + "em")
		.attr("dy", (_, i) => -2 + (i*1.2)  + "em")
		.merge(o_labels);
	o_labels.exit().remove();		//remove unneeded labels


	let o_circles = outbreakDayChart.select('.o_focus').selectAll(".o_hoverCircle")
		.data(selectedOutbreakData)

	o_circles.enter()
		.append("circle")
		.attr("class", "o_hoverCircle")
		.style("fill", function(d) {
			//console.log('xcircle ', d.locCode, getLocationColor(d.locCode)); 
			return getLocationColor(d.locCode)
		})  //get correct color for current location
		.attr("r", 2.5)
		.merge(o_circles);
	o_circles.exit().remove();		//remove unneeded circles


	outbreakDayChart.select(".o_overlay")
		.on("mouseover", function() { outbreakDayChart.select('.o_focus').style("display", null); })
		.on("mouseout", function() { outbreakDayChart.select('.o_focus').style("display", "none"); })
		.on("mousemove", mousemove);



	function mousemove() {
		//console.log('in mousemove for labels: ', selectedOutbreakData)
		//let data = allData;

		// This allows to find the closest X index of the mouse:
		let bisectDayNum = d3.bisector(function(d) { 
			//console.log('bisector ', d);
			return d.dayNum; 
		}).left;

		let x4 = d3.scaleLinear().range([0, width4]), //x-axis width, accounting for specified margins
			y4 = d3.scaleLinear().range([height4, 0])
		x4.domain([1, maxDayNum]);
		//x4.domain([minDate,maxDate]);
		let x0 = x4.invert(d3.mouse(this)[0]);  //value hovered
		//console.log('dayNum hovered: ', x0)

		let obData;
		if (selectedOutbreakData.length > 0) {
			obData = selectedOutbreakData
		} else {
			obData = outbreakData
		}

			let lengthOfOB;
			let obLengths = outbreakData.map(d => {
				lengthOfOB = d.values.filter(v => v.type === outbreakDay1Type).length
				return {
					loc: d.locCode,
					length: lengthOfOB
				}
			})
			//let maxOutbreakLengths = d3.sort(outbreakLengths, d => d.length)
			//console.log('selectedOutbreakLengths: ', selectedOutbreakLengths)
			//console.log('obData: ', obData)
			let maxObLength = obLengths.sort(function (a, b) {
				return b.length - a.length;
			  })[0];
			//console.log('maxObLength: ', maxObLength)

			let idxMaxObLength = outbreakData.findIndex(d => d.locCode === maxObLength.loc)
			//console.log('idxMaxObLength: ', idxMaxObLength)

			let firstLoc = outbreakData[idxMaxObLength].values.filter(v => v.type === chartView.outbreakChart.viewStatType);
			//console.log('firstLoc: ', firstLoc)
			const i = bisectDayNum(firstLoc, x0, 1);
			//console.log('i: ', i)
			const d0 = firstLoc[i - 1];
			//console.log('d0: ', d0)
			const d1 = firstLoc[i];
			//console.log('d1: ', d1)
			const currentPoint = x0 - d0['dayNum'] > d1['dayNum'] - x0 ? d1 : d0;
			//console.log('currentPoint: ', currentPoint)
			x0 = currentPoint.dayNum;
			//console.log('x0: ', x0)
		//} 
		

		// let domainArr, domainMaxArr = [];   //selectedOutbreakData == domainArr
		
		// //domainMaxArr = data.map(d => d3.max(d.values, rec => rec.value));  //max value for each location
		// domainArr = outbreakData.filter(d => selectedLocList.indexOf(d.locCode)!=-1);  //data for selected locations only
		// console.log('***** DOMAIN ARR: ', domainArr.length, domainArr)
		// //console.log('domainArr.length: ', domainArr.length)
		// console.log('***** selectedOutbreakData: ', selectedOutbreakData)
		// if (domainArr.length==0) {
		// 	domainMaxArr = outbreakData.map(d => d3.max(d.values, rec => rec.value));  //max value for all locations
		// } else {
		// 	domainMaxArr = domainArr.map(d => d3.max(d.values, rec => rec.value));  //max value for each selected location
		// }
		// //console.log('domainMaxArr: ', domainMaxArr)
		// y4.domain([0, d3.max(domainMaxArr) ]); //.nice();
		// //console.log('y2.domain = ', y2.domain())

		//********* */
		// //FOR Y-DOMAIN: get max value for selectedOutbreakData (or if empty then for outbreakData)
		// let domainArray, domainArrayMax;
		// //get max value for each selected loc (or all locs if none are selected)
		// console.log('outbreakData: ', outbreakData)
		// if (selectedOutbreakData.length == 0) {
		// 	domainArray = outbreakData.filter(d => selectedLocList.indexOf(d.locCode) != -1)
		// } else {
		// 	domainArray = selectedOutbreakData.filter(d => selectedLocList.indexOf(d.locCode) != -1)
		// }
		// console.log('domainArray: ', domainArray.length, domainArray)

		// //FOR Y-DOMAIN: get max value for selectedOutbreakData (or for all data if no selection)
		let domainArrayMax;
		if (domainArray.length==0) {		
			domainArrayMax = data.map(d => d3.max(d.values, rec => (rec.type === chartView.outbreakChart.viewStatType) ? rec[currentAccumType] : undefined)).filter(v => v != undefined);  //max value for all locations
		} else {
			domainArrayMax = selectedOutbreakData.map(d => d3.max(d.values, rec => (rec.type === chartView.outbreakChart.viewStatType) ? rec[currentAccumType] : undefined)).filter(v => v != undefined);  //max value for each selected location
		}
		//console.log('domainArrayMax: ', domainArrayMax.length, domainArrayMax)

		if (domainArrayMax.length == 0) {
			y4.domain([0,1])
		} else {
			y4.domain([0, d3.max(domainArrayMax) ]); 
		}	
		//console.log('y4.domain = ', y4.domain())




		outbreakDayChart.select('.o_focus').select(".o_lineHover")
			.attr("transform", "translate(" + x4(x0) + "," + 0 + ")");

		outbreakDayChart.select('.o_focus').select(".o_lineHoverDayNum")
			.attr("transform", "translate(" + x4(x0) + "," + (-5) + ")")
			.text('Day ' + x0); //formatDate(x0));

		//console.log('selectedData for circles: ', selectedData)
		let o_circles = outbreakDayChart.select('.o_focus').selectAll(".o_hoverCircle")
							.data(obData);
		o_circles.attr("class", "o_hoverCircle")
			.style("fill", function(d) {
				return getLocationColor(d.locCode)
			})  //get correct color for current location
			.attr("r", 2.5)
			.merge(o_circles)
			.attr("cy", function(e) {
							//console.log('e: ', e.values, x0); 
							let val = e.values.find(v => (v.dayNum == x0 && v.type===chartView.outbreakChart.viewStatType))
							if (val==null) return null;
							else return y4(val[currentAccumType])
							// let val = e.values.find(v => (v.dayNum == x0 && v.type===chartView.outbreakChart.viewStatType)).value;
							// return y4(val.value);
						})
			.attr("cx", x4(x0))
			.style("opacity", function(d) {		//if the value is null (i.e. no outbreak) then hide the circle
							let val = d.values.find(v => (v.dayNum == x0 && v.type===chartView.outbreakChart.viewStatType))
							if (val==null) return 0;
							else return 1;
						})

		outbreakDayChart.select('.o_focus').selectAll(".o_lineHoverText")
			.attr("transform", 
				"translate(" + (x4(x0)) + "," + height4 / 2.5 + ")")
			.style("fill", function(d) {
				//console.log('xlabel ', d.locCode, getLocationColor(d.locCode)); 
				return getLocationColor(d.locCode)
			})  //get correct color for current location)  
			.text(function(d) {
				//console.log('hover d: ', d); 
				return getLocNameFromCode(d.locCode) + ': ' + getValue(d.locCode,x0)
			}) 

		x4(x0) > (width4 - width4 / 4) 
			? outbreakDayChart.select('.o_focus').selectAll("text.o_lineHoverText")
				.attr("text-anchor", "end")
				.attr("dx", -10)
			: outbreakDayChart.select('.o_focus').selectAll("text.o_lineHoverText")
				.attr("text-anchor", "start")
				.attr("dx", 10)


		
		function getValue(locCode, dayNum) {
			//console.log('in getValuefor labels: ', locCode, dayNum)
			let values = obData.find(d => d.locCode === locCode).values;
			//console.log('values: ', values)
			let val = values.find(v => v.dayNum == x0 && v.type === chartView.outbreakChart.viewStatType);
			//console.log('val: ', val)
			let maxLocDayNum = d3.max(values, v => v['dayNum'])
			//console.log(locCode, dayNum, maxLocDayNum)
			if ((val==undefined) && (dayNum >= maxLocDayNum)) return 'NA'; // '?'
			else if (val==undefined) return 'No outbreak'
			return formatNumber(val[currentAccumType]) + ' (' + formatDate(val.date, 'daymonth') + ')';
		}

	}
}

// *********************************************************************************************
// FIELD VALIDITY
// *********************************************************************************************

// function checkField(field) {
// 	var output = field;
// 	if ((field == null) || (field == '')) {
// 		output = blank;
// 	} else if (typeof field == 'string') {
// 		/*var num_linebreaks = (field.match(/\n/g)||[]).length;
// 		if (num_linebreaks>0) {
// 			console.log(num_linebreaks, field);
// 			output = field.replace(/[\n]+/g, '. ');
// 			console.log(output)
// 		};*/
// 		output = field.replace(/[\n]+/g, '. ');  //remove carriage returns from string
// 		if (field.indexOf(',')!=-1) {
// 			//console.log(field);
// 			output = '"'+field+'"';
// 		} 

// 	} 
// 	return output;
// }


// //inputs list of optional fields to select from and row of data
// //outputs [value, key] relating to the first valid field from the list of optional fields
// function getFirstValidField(fields, row) {
// 	//console.log('in getFirstValidField: ', fields, row);
// 	var fields_list = fields.split('&&');
// 	//console.log(fields_list)
	
// 	var i = 0;
// 	while (i<=fields_list.length-1) {
// 		//console.log('field: ', fields_list[i], row[fields_list[i]]);
// 		if (row[fields_list[i]]!=null) {
// 			return [row[fields_list[i]],fields_list[i]];
// 		};
// 		i++
// 	};
// 	//console.log(fields,row, row[fields_list[0]], row[fields_list[1]])
// 	return [];	
// }

// //inputs list of all fields to select from and row of data
// //outputs string with all valid fields concatenated
// function getAllValidFields(fields, row) {
// 	//console.log(fields, row);
// 	var fields_list = fields.split('&&');
// 	var all_valid = '';
// 	//console.log(fields_list)
	
// 	var i = 0;
// 	while (i<=fields_list.length-1) {
// 		if (row[fields_list[i]]!=null) {
// 			all_valid += row[fields_list[i]];
// 		};
// 		i++
// 	};
	
// 	//check valididty of multiple fields:
// 	//if (row[fields_list[0]]!=null) {console.log('field 0: ', row[fields_list[0]])}
// 	//if (row[fields_list[1]]!=null) {console.log('field 1: ', row[fields_list[1]])}
// 	//if ((row[fields_list[0]]!=null) || (row[fields_list[1]]!=null)) {console.log('Multiple valid fields: ', all_valid)}
	
// 	if (all_valid.length==0) {all_valid = blank};
// 	return all_valid;
// }




// *********************************************************************************************
// DATE/TIME FUNCTIONS
// *********************************************************************************************

// Date.prototype.isValid = function () {
//     // An invalid date object returns NaN for getTime(), and NaN is the only object not strictly equal to itself
//     return this.getTime() === this.getTime();
// }; 

// function msToTime(duration) {
//     var milliseconds = parseInt((duration%1000)/100)
//         , seconds = parseInt((duration/1000)%60)
//         , minutes = parseInt((duration/(1000*60))%60)
//         , hours = parseInt((duration/(1000*60*60))%24);

//     hours = (hours < 10) ? "0" + hours : hours;
//     minutes = (minutes < 10) ? "0" + minutes : minutes;
//     seconds = (seconds < 10) ? "0" + seconds : seconds;

//     return hours + ":" + minutes + ":" + seconds;
// }


// function getDateTimeFromDatetime(datetime){
// 	//console.log('datetime input: ', datetime)

// 	//Parsing time (the time below is assumed to be GMT+2) from string
// 	//Removing timezone stamp at end of string - need to check this with SIMS
// 	if(datetime.indexOf('+')>0){
// 		datetime = datetime.substring(0,datetime.indexOf('+')-4);
// 	} else {
// 		let parts = datetime.split('-');
// 		let loc = parts.pop();
// 		datetime = parts.join('-');
// 	}

// 	let newDate = new Date(datetime);
// 	//console.log('CHECK getDateTimeFromDatetime: ', datetime, ' => ', newDate);
// 	return newDate;
// }


Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}



function sameDay(d1, d2) {
  //console.log(d1, d2, typeof(d1), typeof(d2))
  d1 = new Date(d1);
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

// var yesterday = function(date1) {
//    var dt = new Date(date1);
//    return new Date((dt.setDate(dt.getDate()-1)));
// };

// function formatDate(date, format) {
// 	//console.log(date, format);
// 	let months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];
// 	let date_parsed = new Date(parseInt(date.substr(0,4)), parseInt(date.substr(5,7))-1, parseInt(date.substr(8,10)));
// 	let newdate;

// 	if (format=='csv') {
// 		newdate = date_parsed.getDate() + '/' + date_parsed.getMonth() + '/' + date_parsed.getFullYear();
// 		//console.log(date, newdate)
// 	} else if (format=='screen') {
// 		newdate = date_parsed.getDate() + '-' + months[date_parsed.getMonth()] + '-' + date_parsed.getFullYear();
// 		//console.log(date, newdate)
// 	};

// 	return newdate;
// }

// function deepCopyDate(date_in) {
// 	return new Date(date_in.getFullYear(), date_in.getMonth(), date_in.getDate());
// }

// function formatDateTime(date, format) {
// 	let months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];
// 	let newdate;

// 	function checkTime(i) {
// 	  if (i < 10) {
// 	    i = "0" + i;
// 	  }
// 	  return i;
// 	}

// 	//let time = date.getTime();
// 	let h = date.getHours();
// 	let m = date.getMinutes();
// 	let s = date.getSeconds();
// 	//add a zero in front of numbers<10
// 	m = checkTime(m);
// 	s = checkTime(s);
// 	let time = h + ":" + m + ":" + s;
	
// 	if (format=='csv') {
// 		newdate = date.getDate() + '/' + (date.getMonth()+1) + '/' + date.getFullYear();
// 	} else if (format=='screen') {
// 		newdate = date.getDate() + '-' + months[date.getMonth()] + '-' + date.getFullYear();
// 	};

// 	return [newdate, time];
// }


// *********************************************************************************************
// OTHER HELPER FUNCTIONS
// *********************************************************************************************


function getLocationColor(loc) {
	//console.log('getLocationColor: ', loc, selectedLocList)
	if (loc == null) return chartGrey;
	//if (loc == tempHoverLoc) return yellowHighlight;
	let pos = selectedLocList.indexOf(loc);
	if (pos != -1) {
		//console.log('getLocationColor: ', loc, selectedLocList)
		//console.log('pos: ', pos, colors[pos])
	}
	return pos == -1 ? chartGrey : colors[pos];
}

function getBarColor(loc, top10) {
	let pos = selectedLocList.indexOf(loc);
	if (pos != -1) {
		return colors[pos];
	} else if (top10) return barDark;
	else return barLight;
}



//function to reverse sort array of objects by a given key
// function reverseSortByKey(array, key) {
// 	//console.log(array, key)
//     return array.sort(function(a, b) {
//         var x = a[key]; 
//         var y = b[key];
//         //return ((x < y) ? -1 : ((x > y) ? 1 : 0));   //sort
//         return ((x > y) ? -1 : ((x < y) ? 1 : 0));   //reverse sort
//     });
// }


// function onlyUnique(value, index, self) { 
//     return self.indexOf(value) === index;
// }


// function formatNames(str) {   //replace underscores with space, then capitalise each word
//    str = str.replace(/\_/g,' ');
//    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
// };



// *********************************************************************************************
// INIT / DATA IMPORT FUNCTIONS
// *********************************************************************************************

function resize() {
	//Update svg dimensions:
	width1a = $(id1a).width() - margin[id1a].left - margin[id1a].right, //width of main svg1a
	height1a = svgDimensions[id1a].height - margin[id1a].top - margin[id1a].bottom; //height of main svg1a

	width1b = $(id1b).width() - margin[id1b].left - margin[id1b].right, //width of main svg1b
	height1b = svgDimensions[id1b].height - margin[id1b].top - margin[id1b].bottom; //height of main svg1b

	width2 = $(id2).width() - margin[id2].left - margin[id2].right, //width of main svg2
	height2 = svgDimensions[id2].height - margin[id2].top - margin[id2].bottom; //height of main svg2
	//console.log('width2 x height2: ', width2, ' x ', height2);
	
	width4 = $(id4).width() - margin[id4].left - margin[id4].right, //width of main svg4
	height4 = svgDimensions[id4].height - margin[id4].top - margin[id4].bottom; //height of main svg4
	//console.log('width4 x height4: ', width4, ' x ', height4);
	
	width5 = $(id5).width() - margin[id5].left - margin[id5].right, //width of main svg5
	height5 = svgDimensions[id5].height - margin[id5].top - margin[id5].bottom; //height of main svg5
	//console.log('width5 x height5: ', width5, ' x ', height5);
	
	updateCharts();
}


function transformHeader(hdr) {
	//console.log('transformHeaders headers: ', hdr);
	switch(hdr) {
		case 'Province.State': return 'region'; 
		case 'Country.Region': return 'country';
		case 'Lat': return 'lat';
		case 'Long': return 'lon';
		case 'cases': return 'value';
		default: return hdr;
	}
}

function transformHDXHeader(hdr) {
	//console.log('transformHeaders headers: ', hdr);
	switch(hdr) {
		case 'Province/State': return 'region'; 
		case 'Country/Region': return 'country';
		case 'Lat': return 'lat';
		case 'Long': return 'lon';
		case 'Date': return 'date';
		case 'Value': return 'cumVal';
		default: return hdr;
	}
}

function changeOutbreakType(opt) {
	console.log('changed outbreak type: ', opt)
	let ob = statTypeOptions.find(type => type.key == opt);
	outbreakDay1Type = ob.key;
	//document.getElementById('outbreak_day1_type').innerHTML = ob.text;

	calculateOutbreakDay1();
	updateOutbreakDayChart();

}

function changeOutbreakNum(opt) {
	console.log('changed outbreak number: ', opt)
	outbreakDay1Num = parseInt(opt);
	//document.getElementById('outbreak_day1_num').innerHTML = outbreakDay1Num;

	calculateOutbreakDay1();
	updateOutbreakDayChart();
}


(function initOutbreakDropDowns() {
	console.log('initOutbreakDropDowns: ', outbreakDay1Num, outbreakDay1Type)

	let days = [...Array(outbreakDay1MaxNumForDropdown + 1).keys()];
	days.shift();
	//console.log('days:', days)

	days.forEach(day => {
		ob_day1_num.options[day-1] = new Option(day, day);
	})
	ob_day1_num.selectedIndex = outbreakDay1Num - 1;
	//document.getElementById('outbreak_day1_num').innerHTML = outbreakDay1Num;


	statTypeOptions.forEach((type, i) => {
		ob_day1_type.options[i] = new Option(statTypeOptions[i].text, statTypeOptions[i].key)
	})

	let idx = statTypeOptions.findIndex(type => type.key == outbreakDay1Type);
	ob_day1_type.selectedIndex =  idx;
	outbreakDay1Type = statTypeOptions[idx].key;
	//document.getElementById('outbreak_day1_type').innerHTML = statTypeOptions[idx].text;

	//console.log('initOutbreakDropDowns: ', outbreakDay1Num, outbreakDay1Type)	
})();





$(document).ready(function () {
	
	
	

	document.getElementById('data-source').innerHTML = 'Data source: <i>' + dataSource + '</i>';

	if (dataFormat == 'hdx') {		// Get raw data from HDX: 

		$('#modalLoadingData').modal('show');

		var d1 = $.ajax({		//confirmed cases
			type: 'GET',
			url: 'https://data.humdata.org/hxlproxy/data/download/time_series_covid19_confirmed_global_narrow.csv?dest=data_edit&filter01=explode&explode-header-att01=date&explode-value-att01=value&filter02=rename&rename-oldtag02=%23affected%2Bdate&rename-newtag02=%23date&rename-header02=Date&filter03=rename&rename-oldtag03=%23affected%2Bvalue&rename-newtag03=%23affected%2Binfected%2Bvalue%2Bnum&rename-header03=Value&filter04=clean&clean-date-tags04=%23date&filter05=sort&sort-tags05=%23date&sort-reverse05=on&filter06=sort&sort-tags06=%23country%2Bname%2C%23adm1%2Bname&tagger-match-all=on&tagger-default-tag=%23affected%2Blabel&tagger-01-header=province%2Fstate&tagger-01-tag=%23adm1%2Bname&tagger-02-header=country%2Fregion&tagger-02-tag=%23country%2Bname&tagger-03-header=lat&tagger-03-tag=%23geo%2Blat&tagger-04-header=long&tagger-04-tag=%23geo%2Blon&header-row=1&url=https%3A%2F%2Fraw.githubusercontent.com%2FCSSEGISandData%2FCOVID-19%2Fmaster%2Fcsse_covid_19_data%2Fcsse_covid_19_time_series%2Ftime_series_covid19_confirmed_global.csv',
			//url: 'https://data.humdata.org/hxlproxy/data/download/time_series_covid19_confirmed_global_narrow.csv',
			// url: './data/coronavirus_dataset.csv',
			dataType: 'text'
		});

		var d2 = $.ajax({		//deaths
			type: 'GET',
			url: 'https://data.humdata.org/hxlproxy/data/download/time_series_covid19_deaths_global_narrow.csv?dest=data_edit&filter01=explode&explode-header-att01=date&explode-value-att01=value&filter02=rename&rename-oldtag02=%23affected%2Bdate&rename-newtag02=%23date&rename-header02=Date&filter03=rename&rename-oldtag03=%23affected%2Bvalue&rename-newtag03=%23affected%2Binfected%2Bvalue%2Bnum&rename-header03=Value&filter04=clean&clean-date-tags04=%23date&filter05=sort&sort-tags05=%23date&sort-reverse05=on&filter06=sort&sort-tags06=%23country%2Bname%2C%23adm1%2Bname&tagger-match-all=on&tagger-default-tag=%23affected%2Blabel&tagger-01-header=province%2Fstate&tagger-01-tag=%23adm1%2Bname&tagger-02-header=country%2Fregion&tagger-02-tag=%23country%2Bname&tagger-03-header=lat&tagger-03-tag=%23geo%2Blat&tagger-04-header=long&tagger-04-tag=%23geo%2Blon&header-row=1&url=https%3A%2F%2Fraw.githubusercontent.com%2FCSSEGISandData%2FCOVID-19%2Fmaster%2Fcsse_covid_19_data%2Fcsse_covid_19_time_series%2Ftime_series_covid19_deaths_global.csv',		// url: './data/coronavirus_dataset.csv',
			//url: 'https://data.humdata.org/hxlproxy/data/download/time_series_covid19_deaths_global_narrow.csv',
			dataType: 'text'
		});
		
		var d3 = $.ajax({
			type: 'GET',
			url: './data/country_codes.json',
			dataType: 'json'
		});

		//$.when(d1).then(function (a1) {
		$.when(d1, d2, d3).then(function (a1, a2, a3) {
			console.log('Ajax calls succeedeed');
			// console.log('raw data confirmed: ', a1)
			// console.log('raw data deaths: ', a2)

			countryCodes = a3[0];
			//console.log('country codes: ', countryCodes)
			let parsedConfirmedCasesData = Papa.parse(a1[0], {header: true, transformHeader: transformHDXHeader})
			let parsedDeathsData = Papa.parse(a2[0], {header: true, transformHeader: transformHDXHeader})
			// console.log('parsed CONFIRMED CASES data: ', parsedConfirmedCasesData)
			// console.log('parsed DEATHS data: ', parsedDeathsData)
			let processedData = processHDXData(parsedConfirmedCasesData.data, parsedDeathsData.data)
			// console.log('processed data: ', processedData)
			
			calculateOutbreakDay1(processedData);
			createCharts(processedData);

			$('#loader').addClass("hide-loader");
			$('#modalLoadingData').modal('hide');
			

		}, function (jqXHR, textStatus, errorThrown) {
			var x1 = d1;
			var x2 = d2;
			var x3 = d3;

			if (x1.readyState != 4) {
				x1.abort();
			};
			if (x2.readyState != 4) {
				x2.abort();
			};
			if (x3.readyState != 4) {
				x3.abort();
			};
			alert("Data request failed");
			console.log('Ajax request failed');
		});
	
	
	} else if (dataFormat == 'rk') {  //get raw data from RK's github:

		var d1 = $.ajax({	
			type: 'GET',
			url: './data/coronavirus_dataset.csv',
			dataType: 'text'
		});
		
		var d2 = $.ajax({
			type: 'GET',
			url: './data/country_codes.json',
			dataType: 'json'
		});

		//$.when(d1).then(function (a1) {
		$.when(d1, d2).then(function (a1, a2) {
			console.log('Ajax calls succeedeed');
			//console.log('raw data: ', a1)

			countryCodes = a2[0];
			//console.log('country codes: ', countryCodes)
			let parsedData = Papa.parse(a1[0], {header: true, transformHeader: transformHeader})
			//console.log('parsed data: ', parsedData)
			let processedData = processData(parsedData.data)
			//console.log('processed data: ', processedData)
			
			calculateOutbreakDay1(processedData);
			createCharts(processedData);
			

		}, function (jqXHR, textStatus, errorThrown) {
			var x1 = d1;
			var x2 = d2;

			if (x1.readyState != 4) {
				x1.abort();
			};
			if (x2.readyState != 4) {
				x2.abort();
			};
			alert("Data request failed");
			console.log('Ajax request failed');
		});

	}



});
