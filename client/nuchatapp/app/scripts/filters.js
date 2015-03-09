function amChatCalendar(moment, $filter) {
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

function amChatGrouping(moment, $filter) {
	function amFilter(value, preprocess) {
		moment.locale(moment.locale(), {
			'calendar': {
				'lastDay': '['+$filter('translate')('YESTERDAY')+']',
				'sameDay': '['+$filter('translate')('TODAY')+']',
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
	.filter('amChatCalendar', ['moment', '$filter', amChatCalendar])
	.filter('amChatGrouping', ['moment', '$filter', amChatGrouping])
	.filter('brief', ['$filter', '$checkFormat', brief])
	.filter('nl2br', ['$filter',
	  function($filter) {
	    return function(data) {
	    	console.log('data='+data)
	      if (!data) return data;
	      return data.replace(/\n\r?/g, '<br />');
	    };
	  }
	]);