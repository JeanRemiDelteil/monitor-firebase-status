
/**
 * @typedef {{
 *   sps: SpreadsheetApp.Spreadsheet
 *   sheets: {
 *     issues: SpreadsheetApp.Sheet
 *     xmlFeed: SpreadsheetApp.Sheet
 *     email: SpreadsheetApp.Sheet
 *   }
 *   range: {
 *     lastUpdate: SpreadsheetApp.Range
 *   },
 *   FIREBASE_ISSUE_JSON: string
 *   FIREBASE_ISSUE_FEED: string
 *   FIREBASE_BASE_LINK: string
 *   
 *   FEED_HEADERS: {
 *     id: number,
 *     updated: number,
 *     service: number,
 *     title: number,
 *     link: number,
 *     content: number,
 *   }
 *   
 *   services: Object.<{}>
 * }} _self
 */

/**
 * Init the global variables or return those variables
 * 
 * @return {_self}
 */
function _init_(){
	if (this._INIT_) return this._self_;
	
	var _self = {};
	
	// Start initializing global variables
	_self.spsId = '134nDKuyJZ8kjZTWqB8uvQ6YW997qln_aAIVPd4GkPkw';
	// _self.sps = SpreadsheetApp.getActiveSpreadsheet(); --> For some reasons, this fails when called from a time trigger from the other account
	_self.sps = SpreadsheetApp.openById(_self.spsId);
	
	_self.sheets = {
		issues: _self.sps.getSheetByName('issues'),
		xmlFeed: _self.sps.getSheetByName('xmlFeed'),
		email: _self.sps.getSheetByName('emails')
	};
	
	// If sheets does not exist, create them
	if (!_self.sheets.issues) {
		_self.sheets.issues =_self.sps.insertSheet('issues');
		
		_initIssueSheet_(_self.sheets.issues);
	}
	if (!_self.sheets.xmlFeed) {
		_self.sheets.xmlFeed =_self.sps.insertSheet('xmlFeed');
		
		_init_XML_feedSheet_(_self.sheets.xmlFeed);
	}
	
	// Load email <-> service map
	_self.services = _self.sheets.email ? _loadEmailService(_self.sheets.email) : {};
	
	// get specific ranges
	_self.range = {
		// last update range
		lastUpdate: _self.sheets.issues.getRange('B1')
	};
	
	// Firebase Json status feed
	_self.FIREBASE_ISSUE_JSON = 'https://status.firebase.google.com/incidents.json';
	_self.FIREBASE_ISSUE_FEED = 'https://status.firebase.google.com/feed.atom';
	_self.FIREBASE_BASE_LINK = 'https://status.firebase.google.com';
	
	_self.FEED_HEADERS = {
		id: 0,
		updated: 1,
		service: 2,
		title: 3,
		link: 4,
		content: 5
	};
	
	// Save variables
	this._self_ = _self;
	this._INIT_ = true;
	
	return this._self_;
}

/**
 * Create the incident sheet from blank state
 *
 * @param {SpreadsheetApp.Sheet} sheet
 *
 * @private
 */
function _initIssueSheet_(sheet){
	
	// Last update cell is B1
	sheet.getRange('A1').setValue('Last update');
	
	// Table headers
	var headers = [
		'Timestamp',
		'Issue',
		'Link',
		'Product',
		'Info'
	];
	
	sheet.getRange(3, 1, 1, headers.length).setValues([headers]);
	sheet.setFrozenRows(3);
	
}

/**
 * Create the XML issue sheet from blank state
 *
 * @param {SpreadsheetApp.Sheet} sheet
 *
 * @private
 */
function _init_XML_feedSheet_(sheet){
	
	// Last update cell is B1
	sheet.getRange('A1').setValue('Last update');
	
	// Table headers
	var headers = [
		'Updated',
		'id',
		'title',
		'link',
		'message'
	];
	
	sheet.getRange(3, 1, 1, headers.length).setValues([headers]);
	sheet.setFrozenRows(3);
	
}

/**
 * load emails and services to send alert
 * 
 * @param {SpreadsheetApp.Sheet} sheet
 * 
 * @return {Object.<{}>}
 * 
 * @private
 */
function _loadEmailService(sheet) {
	var data = sheet.getDataRange()
		.getValues();
	
	var services = {};
	
	for (var i = 1; i < data.length; i++){
		var row = data[i];
		var res = row[1].replace(/\s*,\s*/, ',').split(',');
		
		// For each service, save emails
		res.forEach(function(serviceName){
			services[ serviceName ] = services[ serviceName ] || {};
			
			services[ serviceName ][row[0]] = true;
		});
	}
	
	return services;
}


/**
 * @typedef {{
 *   begin: string
 *   created: string
 *   end: string
 *   external_desc: string
 *   modified: string
 *   number: number
 *   public: boolean
 *   service_key: string
 *   service_name: string
 *   severity: string
 *   updates: Array.<IssueInfo>
 * }} Issue
 * 
 * @typedef {{
 *   created: string
 *   modified: string
 *   text: string
 *   when: string
 * }} IssueInfo
 *
 * @typedef {Array.<Issue>} IssueFeed
 */