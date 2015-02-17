function amChatCalendar(moment, amMoment, angularMomentConfig, $filter) {
	function amFilter(value, preprocess) {
		moment.locale(moment.locale(), {
			'calendar': {
				'lastDay': $filter('translate')('YESTERDAY'),
				'sameDay': 'hh:mm',
				'sameElse': 'MM-DD'
			}
		});

		return $filter('amCalendar')(value);
	}
	return amFilter;
}

function brief($filter, $checkFormat) {
	function briefFilter(value) {
		if (value) {
			if ($checkFormat.isImg(value)) {
				return $filter('translate')('SENT_IMG');
			}
		}
		return value;
	}

	return briefFilter;
}

angular.module('Nuchatapp.filters', [])
	.filter('amChatCalendar', ['moment', 'amMoment', 'angularMomentConfig', '$filter', amChatCalendar])
	.filter('brief', ['$filter', '$checkFormat', brief]);