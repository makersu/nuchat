'use strict';

angular.module('Nuchatapp.translate', ['pascalprecht.translate'])
	.config(chtTranslate)
	.config(enTranslate)
	.config(function($translateProvider) {
		// Set default language
  	$translateProvider.preferredLanguage('en');
	});