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

angular.module('Nuchatapp.filters', [])
	.filter('amChatCalendar', ['moment', 'amMoment', 'angularMomentConfig', '$filter', amChatCalendar]);