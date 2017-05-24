//var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk
var watson = require('watson-developer-cloud'); 
var qs = require('querystring');

var PROTOCOL = 'https://';
var ELASTIC_HOST = 'sl-us-dal-9-portal7.dblayer.com:22882/';
//var ELASTIC_HOST = '182.18.168.17:9200/';
var ELASTIC_USERNAME = 'admin';
var ELASTIC_PASSWORD = 'MEGUUDRASIYQEAIM';
var WATSON_CONVERSATION_SERVICE = 'https://gateway.watsonplatform.net/conversation/api';
var port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;
//var CONVERSATION_USERNAME = process.env.CONVERSATION_USERNAME || '2edcb9e7-52c2-42ab-ba99-933c7aa84e47';
//var CONVERSATION_PASSWORD = process.env.CONVERSATION_PASSWORD || 'Hm0KCxHIoVdE';
//var WORKSPACE_ID = process.env.WORKSPACE_ID || '74bcdeb5-bf72-4622-8169-87168bcbe7f8';
//Production
//var WORKSPACE_ID = '36db3e9f-0036-4dbe-88d7-f03ec70d40f2';
//var CONVERSATION_USERNAME = 'ba813476-9349-49e6-8743-812f0afc92f7';
//var CONVERSATION_PASSWORD = '2u3PqlGkwXVZ';
//Local - iTuffy
var WORKSPACE_ID = 'eb59e38a-be44-4375-b60d-5dd2d056e91e';
var CONVERSATION_USERNAME = 'b1aba40f-8616-4ea4-a598-92eeca22b578';
var CONVERSATION_PASSWORD = 'yMnMrmL3bA52';
var ELASTIC_INDEX = 'events/';

// Create the service wrapper
var conversation = watson.conversation({
  //username: '2edcb9e7-52c2-42ab-ba99-933c7aa84e47',
  //password: 'Hm0KCxHIoVdE',
  username: CONVERSATION_USERNAME,
  password: CONVERSATION_PASSWORD,
  version: 'v1',
  version_date: '2017-02-03'
});

// Replace with the context obtained from the initial request
var context = {};
var rawData;
var _inputToWatson = '';

require('http').createServer(function(req, res) {
	var d = '', a, s, url, i, leni;
	req.on('data', function(d1) { d += d1 });
	req.on('end',function() {
		res.writeHead(200, {"Content-Type": "application/json; charset=UTF-8"});
		console.log("RAW Input=="+d);
		/*try {
			//rawData = JSON.parse(d);//.replace(/\'/g, "").replace(/\\\'/g, ''));
			//rawData = Object(d);
			
			rawData = qs.parse(d);
			console.log("rawData=="+rawData);
			_inputToWatson = rawData.text;
			console.log("Success="+_inputToWatson);
			context = rawData.context;
		} catch(e) {
			_inputToWatson = (/\"text\"\s*\:\"([^\"]+)\"/.test(d)) ? RegExp.$1 : 'Blank';
			var textStartIndex = d.indexOf(',"text":"');
			console.log("Failure="+_inputToWatson);
			var i, j, label;
			i = d.indexOf(label = '"context":'); 
			j = d.indexOf(',"text":');  
			context = (i == -1 || j == -1 || i > j) ? {} : JSON.parse(d.substring(i + label.length, j));
			console.log("Failure Context="+context);
		}
		if(/\?([\s\S]+)$/.test(url = '' + req.url)) d += '&' + RegExp.$1;*/
		/*for(s = {}, d = decodeURIComponent('' + d), i = 0, leni = (a = d.split('&')).length; i < leni; i++) {
			// Query Params
			if(!(k = a[i].trim())) continue;
			s[(k = k.split('='))[0]] = k[1];
		}*/
		try {
			rawData = JSON.parse(d);
			_inputToWatson = rawData.text;
			console.log("Success="+_inputToWatson);
			context = rawData.context;
			
		} catch(e) {
			_inputToWatson = (/\"text\"\s*\:\"([^\"]+)\"/.test(d)) ? RegExp.$1 : 'Blank';
			console.log("Failure="+_inputToWatson);
			var i, j, label;
			i = d.indexOf(label = '"context":'); 
			j = d.indexOf(',"text":');  
			context = (i == -1 || j == -1 || i > j) ? {} : JSON.parse(d.substring(i + label.length, j));
			console.log("Failure Context="+context);
		}
		if(/\?([\s\S]+)$/.test(url = '' + req.url)) d += '&' + RegExp.$1;
		/*for(s = {}, d = decodeURIComponent('' + d), i = 0, leni = (a = d.split('&')).length; i < leni; i++) {
			// Query Params
			if(!(k = a[i].trim())) continue;
			s[(k = k.split('='))[0]] = k[1];
		}*/
		switch(true) {
			default: 
				console.log('Default called - do nothing');
				break;
			case /messageApi/.test(url): 
				//_inputToWatson = rawData.text;
				//context = rawData.context;

				conversation.message({
				  workspace_id: WORKSPACE_ID,
				  input: {'text':_inputToWatson},
				  context: context
				}, function(err, response) {
					  if (err)
					    console.err('error:'+ err);
					  else {

						//response.output.action = 'GET_EVENT_DETAILS';
						if (response.output.action != null && response.output.action === 'GET_EVENT_DETAILS' ) {
							if (response.context != null){
								var myContext = response.context;

								var elasticFullUrl = PROTOCOL + ELASTIC_USERNAME + ':' + ELASTIC_PASSWORD + '@' + ELASTIC_HOST + ELASTIC_INDEX + '_search';
								//var elasticFullUrl = PROTOCOL + ELASTIC_HOST + 'events/event/1';
								var fromDateTime = response.output.FROM_DATETIME;
								var toDateTime = response.output.TO_DATETIME;
								var eventName = response.output.EVENT_NAME;
								var eventVenue = response.output.EVENT_VENUE;
								var searchText = response.output.SEARCH_TEXT;

								var queryToElastic = '';
								//searchText = 'K-12 Student';
								//fromDateTime = '2017-04-15 09:00:00';
								//toDateTime = '2017-04-17 23:00:00';

								if ( fromDateTime !== null && fromDateTime !== "" && fromDateTime !== " " && typeof fromDateTime !== "undefined" ) {
									var boolErr = false;
									try {
										fromDateTime.split(' ');
									} catch(e) {
										boolErr = true;
									}

									if ( boolErr || fromDateTime.split(' ')[1] === '' ) {
										fromDateTime = fromDateTime.trim() + ' 09:00:00';
									}
								if ( toDateTime === null || toDateTime === '' || toDateTime === ' ' || typeof toDateTime === "undefined" ) {
										toDateTime = fromDateTime.split(' ')[0] + ' 23:59:59';
										queryToElastic = '{"filter" : {"range" : {"fromDate" : {"from" : "' +fromDateTime+ '"},"toDate" : {"to" : "' +toDateTime + '"}}}}';
									} else if ( toDateTime !== null && toDateTime !== '' && typeof toDateTime !== "undefined" ) {
										queryToElastic = '{"filter" : {"range" : {"fromDate" : {"from" : "' +fromDateTime+ '"},"toDate" : {"to" : "' +toDateTime + '"}}}}';
									}
								} else if ( searchText !== null && searchText !== '' && typeof searchText !== "undefined" ) {
									queryToElastic = '{"query": {"query_string" : {"query" : "' + searchText + '"}}}';
								}
								console.log("Query --- " + queryToElastic);

								if ( queryToElastic !== '' ) {
									queryToElastic = JSON.parse(queryToElastic);
									require('request')({ method: 'POST', 
															uri: elasticFullUrl, 
															json: true,
															encoding: null,
															rejectUnauthorized: false,
															headers : {"Content-Type": "application/json"},
															body : queryToElastic
															}, function(e, eres, ebody) {

										var evtName = '', eventLocation = '', eventNameLocPair = '', totalCount = 0, startDt, endDt, eventURL;
										if(e || res.statusCode != 200) {
											console.err(e);
										} else {

											console.log("Elastic Body String --------- " + JSON.stringify(ebody));
											totalCount = JSON.stringify(ebody.hits.total);

											if ( ebody.hits.total > 0 ) {
												console.log(ebody.hits.total);
												console.log(ebody.hits.hits[1]._source.name);
												for ( var iCtr = 0; iCtr < ebody.hits.total; iCtr++) {
													console.log(iCtr);
													console.log(ebody.hits.hits[iCtr]._source.name);
													evtName += ebody.hits.hits[iCtr]._source.name + '\n';
													eventLocation += ebody.hits.hits[iCtr]._source.venue + 'n';
													eventNameLocPair += ebody.hits.hits[iCtr]._source.name + '-' + ebody.hits.hits[iCtr]._source.venue + '\n';
												}
												startDt = ebody.hits.hits[0]._source.fromDate;
												endDt = ebody.hits.hits[0]._source.toDate;
												
												var elasticResEventName = ebody.hits.hits[0]._source.name;
												eventURL = 'http://calendar.fullerton.edu';
												//eventURL = 'http://calendar.fullerton.edu/EventList.aspx?fromdate='+ebody.hits.hits[0]._source.fromDate+'&todate='+ebody.hits.hits[0]._source.toDate+'&view=DateTime';
											} else {
												//console.log('ZERO');
											}
										}

										myContext.RES_EVENTNAME = evtName;
										myContext.RES_EVENT_LOCATION = eventLocation;
										myContext.RES_EVENTNAME_LOCATION = eventNameLocPair;
										myContext.RES_EVENT_START_DATETIME = startDt;
										myContext.RES_EVENT_END_DATETIME = endDt;
										myContext.RES_EVENT_URL = eventURL;
										myContext.RES_EVENT_COUNT = totalCount;
										conversation.message({
											  workspace_id: WORKSPACE_ID,
											  input: {'text':response.input.text},
											  context: myContext
											}, function(err, response1) {
												  if (err)
												    console.err('error:'+ err);
												  else {
													//console.log('Full inner response Object ====  : ' + JSON.stringify(response1, null, 2));
													res.write(JSON.stringify(response1));//.replace(/\'/g, "")); 
													res.end();
												}
											});
									});
								} else {
									//console.log('Full original response Object : ' + JSON.stringify(response, null, 2));
									res.write(JSON.stringify(response));//.replace(/\'/g, "")); 
									res.end();
								}
							} else {
								//console.log('Full original response Object : ' + JSON.stringify(response, null, 2));
								res.write(JSON.stringify(response));//.replace(/\'/g, "")); 
								res.end();
							}
						} else {
							//console.log('Full original response Object : ' + JSON.stringify(response, null, 2));
							res.write(JSON.stringify(response));//.replace(/\'/g, "")); 
							res.end();
						}
					}
				});
				break;
		}
	});
}).listen(port);