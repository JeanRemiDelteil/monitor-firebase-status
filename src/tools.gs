
var Tools = {};

/** 
 * Calculate the corresponding column index from a ABC column notation
 * 
 * @param {string} col_Letter
 * 
 * @return {number}
 * @constructor
 */
Tools.range_A_to_Num = function(col_Letter){
	col_Letter = col_Letter.toUpperCase();
	var index = 0;
	
	for (var i = col_Letter.length - 1, j = 0; i > -1; i--, j++){
		index += (col_Letter.charCodeAt(i) - 64) * Math.pow(26, j)
	}
	
	return index;
};

/** 
 * Return the corresponding A1 column notation from the column index
 * 
 * @param col_index
 * 
 * @return {string}
 */
Tools.range_num_to_A1 = function(col_index){
	var a1 = '';
	var modulo = 0;
	
	for (var i = 0; i < 6; i++){
		modulo = col_index % 26;
		if (modulo === 0) {
			a1 = 'Z'+ a1;
			col_index = col_index / 26 - 1;
		}
		else {
			a1 = String.fromCharCode(64 + modulo) + a1;
			col_index = (col_index - modulo) / 26;
		}
		
		if (col_index <= 0) break;
	}
	
	return a1;
};



SpreadsheetUtils = {};

/**
 * Directly write a double array in the spreadsheet
 * 
 * @this SpreadsheetApp.Spreadsheet
 * 
 * @param {SpreadsheetApp.Sheet} sheet
 * @param {string} firstCell - A1 notation selecting the top-left corner of the Array
 * @param {Array.<[]>} values
 * 
 * @return {SpreadsheetApp.Range}
 */
SpreadsheetUtils.writeArray = function (sheet, firstCell, values) {
	
	// get firsCell coordinate
	var firstCol = Tools.range_A_to_Num(firstCell.replace(/\d+$/, ''));
	var firstRow = +firstCell.replace(/^\D+/, '');
	
	if (!values.length){
		return sheet.getRange(firstRow, firstCol);
	}
	
	return sheet.getRange(firstRow, firstCol, values.length, values[0].length)
		.setValues(values);
};
