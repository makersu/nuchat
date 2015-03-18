function ImageFilterService() {
	var _canvasId = null;

	function setCanvasId(id) {
		_canvasId = id;
	}

	function getPixels(img) {
	  var c = getCanvas(img.width, img.height);
	  var ctx = c.getContext('2d');
	  ctx.drawImage(img, 0, 0, img.width, img.height);
	  return ctx.getImageData(0, 0, c.width, c.height);
	};

	function getCanvas(w,h) {
	  var c = document.getElementById(_canvasId);
	  c.width = w;
	  c.height = h;
	  return c;
	};

	function putImageData(pixels) {
		var c = document.getElementById(_canvasId);
		var ctx = c.getContext('2d');
		ctx.putImageData(pixels, 0, 0);
	}

	function filterImage(filter, image, var_args) {
	  var args = [getPixels(image)];
	  for (var i = 2; i < arguments.length; i++) {
	    args.push(arguments[i]);
	  }
	  return filter.apply(null, args);
	};

	function createImageData(w,h) {
		var c = getCanvas(w, h);
		var ctx = c.getContext('2d');
	  return ctx.createImageData(w,h);
	};

	/* Gaussian Blur Algorithm by Ivanuckir, refrence: http://blog.ivank.net/fastest-gaussian-blur.html
	 *
	 * @param pixels  source image pixels
	 * @param w				image width
	 * @param h				image height
	 * @param r  			radius
	 *
	 * @return target channel
	 */
	function gaussianBlur (pixels, w, h, r) {
		var target = createImageData(w, h);
		var iter = 3;
		var bxs = boxesForGauss(r, iter);
		for (var i = 0; i < iter; i++) {
			boxBlur_4 (pixels.data, target.data, w, h, (bxs[i]-1)/2);
		}
		// var sigRadius = Math.ceil(r * 2.57);     // significant radius
		// var src = pixels.data;
		// for(var i = 0; i < h; i++)
		// 	for(var j = 0; j < w; j++) {
		// 		var val = 0, wsum = 0;
		// 		for(var iy = i-sigRadius; iy < i+sigRadius+1; iy++)
		// 			for(var ix = j-sigRadius; ix < j+sigRadius+1; ix++) {
		// 				var x = Math.min(w-1, Math.max(0, ix));
		// 				var y = Math.min(h-1, Math.max(0, iy));
		// 				var dsq = (ix-j)*(ix-j)+(iy-i)*(iy-i);
		// 				var wght = Math.exp( -dsq / (2*r*r) ) / (Math.PI*2*r*r);
		// 				val += src[y*w+x] * wght;  wsum += wght;
		// 			}
		// 			target.data[i*w+j] = Math.round(val/wsum);            
		// 	}
		return target;
	}
	// standard deviation, number of boxes
	function boxesForGauss(sigma, n) {
		var wIdeal = Math.sqrt((12*sigma*sigma/n)+1);  // Ideal averaging filter width 
		var wl = Math.floor(wIdeal);  if(wl%2==0) wl--;
		var wu = wl+2;
		
		var mIdeal = (12*sigma*sigma - n*wl*wl - 4*n*wl - 3*n)/(-4*wl - 4);
		var m = Math.round(mIdeal);
		// var sigmaActual = Math.sqrt( (m*wl*wl + (n-m)*wu*wu - n)/12 );

		var sizes = [];  for(var i=0; i<n; i++) sizes.push(i<m?wl:wu);
		return sizes;
	}
	function boxBlur_4 (scl, tcl, w, h, r) {
		for(var i=0; i<scl.length; i++) tcl[i] = scl[i];
		boxBlurH_4(tcl, scl, w, h, r);
		boxBlurT_4(scl, tcl, w, h, r);
	}
	function boxBlurH_4 (scl, tcl, w, h, r) {
		var iarr = 1 / (r+r+1);
		for (var i=0; i<h; i++) {
			var ti = i*w, li = ti, ri = ti+r;
			var fv = scl[ti], lv = scl[ti+w-1], val = (r+1)*fv;
			for (var j=0; j<r; j++) val += scl[ti+j];
			for (var j=0  ; j<=r ; j++) { val += scl[ri++] - fv       ;   tcl[ti++] = Math.round(val*iarr); }
			for (var j=r+1; j<w-r; j++) { val += scl[ri++] - scl[li++];   tcl[ti++] = Math.round(val*iarr); }
			for (var j=w-r; j<w  ; j++) { val += lv        - scl[li++];   tcl[ti++] = Math.round(val*iarr); }
		}
	}
	function boxBlurT_4 (scl, tcl, w, h, r) {
		var iarr = 1 / (r+r+1);
		for(var i=0; i<w; i++) {
			var ti = i, li = ti, ri = ti+r*w;
			var fv = scl[ti], lv = scl[ti+w*(h-1)], val = (r+1)*fv;
			for(var j=0; j<r; j++) val += scl[ti+j*w];
			for(var j=0  ; j<=r ; j++) { val += scl[ri] - fv     ;  tcl[ti] = Math.round(val*iarr);  ri+=w; ti+=w; }
			for(var j=r+1; j<h-r; j++) { val += scl[ri] - scl[li];  tcl[ti] = Math.round(val*iarr);  li+=w; ri+=w; ti+=w; }
			for(var j=h-r; j<h  ; j++) { val += lv      - scl[li];  tcl[ti] = Math.round(val*iarr);  li+=w; ti+=w; }
		}
	}

	function convolute(pixels, weights, opaque) {
	  var side = Math.round(Math.sqrt(weights.length));
	  var halfSide = Math.floor(side/2);
	  var src = pixels.data;
	  var sw = pixels.width;
	  var sh = pixels.height;
	  // pad output by the convolution matrix
	  var w = sw;
	  var h = sh;
	  var output = createImageData(w, h);
	  var dst = output.data;
	  // go through the destination image pixels
	  var alphaFac = opaque ? 1 : 0;
	  for (var y=0; y<h; y++) {
	    for (var x=0; x<w; x++) {
	      var sy = y;
	      var sx = x;
	      var dstOff = (y*w+x)*4;
	      // calculate the weighed sum of the source image pixels that
	      // fall under the convolution matrix
	      var r=0, g=0, b=0, a=0;
	      for (var cy=0; cy<side; cy++) {
	        for (var cx=0; cx<side; cx++) {
	          var scy = sy + cy - halfSide;
	          var scx = sx + cx - halfSide;
	          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
	            var srcOff = (scy*sw+scx)*4;
	            var wt = weights[cy*side+cx];
	            r += src[srcOff] * wt;
	            g += src[srcOff+1] * wt;
	            b += src[srcOff+2] * wt;
	            a += src[srcOff+3] * wt;
	          }
	        }
	      }
	      dst[dstOff] = r;
	      dst[dstOff+1] = g;
	      dst[dstOff+2] = b;
	      dst[dstOff+3] = a + alphaFac*(255-a);
	    }
	  }
	  return output;
	};

	/*	Implemented by Quasimondo, reference: http://www.quasimondo.com/BoxBlurForCanvas/FastBlur2Demo.html
	 */
	function stackBoxBlur(sourceImageID, targetCanvasID, radius, iterations) {
		stackBoxBlurImage( sourceImageID, targetCanvasID, radius, true, iterations );
	}

	function cssBlur(img, radius) {
		angular.element(img).css('-webkit-filter', 'blur('+radius+'px)');
	}

	var _filters = {
		setCanvasId: setCanvasId,
		getPixels: getPixels,
		getCanvas: getCanvas,
		putImageData: putImageData,
		filterImage: filterImage,
		convolution: convolute,
		gaussianBlur: gaussianBlur,
		stackBoxBlur: stackBoxBlur,
		cssBlur: cssBlur,
	};

	return _filters;
}