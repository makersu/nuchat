function amChatCalendar(moment, $filter) {
	function amFilter(value, preprocess) {
		moment.locale(moment.locale(), {
			calendar: {
				lastDay: '['+$filter('translate')('YESTERDAY')+']',
				lastWeek: 'MM-DD',
				sameDay: 'hh:mm',
				sameElse: 'MM-DD'
			}
		});

		return $filter('amCalendar')(value);
	}
	return amFilter;
}

function amChatGrouping(moment, $filter) {
	function amFilter(value, preprocess) {
		moment.locale(moment.locale(), {
			calendar: {
				lastDay: '['+$filter('translate')('YESTERDAY')+']',
				lastWeek: 'MM-DD ddd',
				sameDay: '['+$filter('translate')('TODAY')+']',
				sameElse: 'MM-DD'
			}
		});

		// console.log(moment($filter('amCalendar')(value)).format('MM-DD'));
		return $filter('amCalendar')(value);
	}
	return amFilter;
}

function brief($filter, $checkFormat) {
	function briefFilter(valObj) {
		if (valObj) {
			if ($checkFormat.isImg(valObj.type)) {
				return $filter('translate')('SENT_IMG');
			} else if ($checkFormat.isAudio(valObj.type)) {
				return $filter('translate')('SENT_AUDIO');
			} else if ($checkFormat.isVideo(valObj.type)) {
				return $filter('translate')('SENT_VIDEO');
			}
			return valObj.text;
		}
		return null;
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