angular.module('Nuchatapp.constants', [])
	.constant('FILETYPE', {
		site: 'Site',
		dir: 'Directory',
		img: 'Image',
		video: 'Video',
		audio: 'Audio',
		doc: 'Document',
		text: 'Text',
		html: 'Html',
		link: 'Link',
		bbs: 'BBS',
		indexContent: 'Index',
		time: 'Time',
	})
	.constant('TEMP_IMG', {
		photo: 'images/photo.png',
		video: 'images/video.png',
		music: 'images/music.png',
		excel: 'images/excel.png',
		word: 'images/word.png',
		pdf: 'images/pdf.png',
		txt: 'images/txt.png',
		html: 'images/html.png',
		url: 'images/url.png',
		unknown: 'images/unknown.png'
	})
	.constant('DOC_TYPE', {
		word: 'word',
		excel: 'excel',
		pdf: 'pdf'
	})
	.constant('WRS_PART_SIZE', 0x300000)
	.constant('TABLE_MODEL', {
		// account table
		account: {
			acn: 'text primary key',
			mail: 'text',
			pwd: 'text',
			pwd_raw: 'text',
			sca: 'text',
			ssn: 'text',
			sun: 'text',
			active_site_acn: 'text',
			updated_time: 'text'
		},
		// server table
		server: {
			ssn: 'text',
			type: 'text',
			acn: 'text',
			cs: 'text',
			sun: 'text',
			ip: 'text',
			ip_ext: 'text',
			ip_int: 'text',
			port: 'text',
			port_ext: 'text',
			port_int: 'text',
			url: 'text',
			last_alive: 'text',
			updated_time: 'text'
		},
		files: {
			acn: 'text',
			srv: 'text',
			site: 'text',
			url: 'text',
			description: 'text',
			dir_type: 'text',
			filename: 'text',
			info: 'text',
			last_acn: 'text',
			md5: 'text',
			mtime: 'text',
			owner: 'text',
			page_name: 'text',
			size: 'text',
			tag: 'text',
			time: 'text',
			type: 'text',
			thumbs: 'text',
			thumbCache: 'text',
			view_path: 'text',
			content: 'text',
			images: 'text',
			comments: 'text',
			dir: 'text',
			cachedPath: 'text',
			share_code: 'text',
			auto_download_disabled: 'integer',
			bAdmin: 'integer',
			PW_bDownload: 'integer',
			PW_bEdit: 'integer',
			PW_bUpload: 'integer',
			PW_bView: 'integer',
			updated_time: 'text'
		},
		settings: {
			acn: 'text primary key',
			thumb_quality: 'text',
			video_quality: 'text',
			auto_download_imgs: 'integer',
			auto_download_videos: 'integer',
			auto_download_music: 'integer',
			auto_download_docs: 'integer',
			auto_download_src: 'text',
			auto_download_wifi_only: 'integer',
			auto_download_ignore_list: 'text',
			auto_upload_imgs: 'integer',
			auto_upload_videos: 'integer',
			auto_upload_music: 'integer',
			auto_upload_src: 'text',
			auto_upload_wifi_only: 'integer',
			orderby_field: 'text',
			orderby_asc: 'integer',
			updated_time: 'text'
		},
		wall: {
			id: 'text primary key',
			type: 'text',
			mode: 'text',
			owner: 'text',
			author: 'text',
			authorImg: 'text',
			title: 'text',
			c: 'text',
			description: 'text',
			dirPath: 'text',
			dirs: 'text',
			imgs: 'text',
			atc: 'text',
			url: 'text',
			link_url: 'text',
			page_name: 'text',
			view_path: 'text',
			upload_time: 'text',
			share_code: 'text',
			cnt_like: 'integer',
			bAdmin: 'integer',
			bManager: 'integer',
			bMyLike: 'integer',
			srv: 'text',
			as: 'text',
			cachedView: 'text',
			t_first: 'integer',
			updated_time: 'text',
		},
		comment: {
			recordId: 'text',
			i: 'text',		// Index
			a: 'text',		// Author name
			aImg: 'text', // Author cover
			acn: 'text',	// Account
			c: 'text',		// Content
			atc: 'text', 	// Attached
			t: 'text',		// Time
			updated_time: 'text',
		}
	});