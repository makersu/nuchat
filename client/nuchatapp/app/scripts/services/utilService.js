function UtilService() {
	function sameDate(date1, date2) {
		var d1 = new Date(date1);
		var d2 = new Date(date2);
		return d1.getFullYear() == d2.getFullYear() && d1.getMonth() == d2.getMonth() && d1.getDate() == d2.getDate();
	}

	return {
		sameDate: sameDate,
	};
}