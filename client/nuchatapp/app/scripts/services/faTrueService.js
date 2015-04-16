function faTrueService($famous) {
  function height(cl) {
    if ($famous.find(cl)[0].renderNode._currentTarget !== null
    		&& $famous.find(cl)[0].renderNode._currentTarget.children[0] !== undefined) {
      return $famous.find(cl)[0].renderNode._currentTarget.children[0].clientHeight;
    }
  };

  function width(cl) {
    if ($famous.find(cl)[0].renderNode._currentTarget !== null
    		&& $famous.find(cl)[0].renderNode._currentTarget.children[0] !== undefined) {
      return $famous.find(cl)[0].renderNode._currentTarget.children[0].clientWidth;
    }
  };

  var _service = {
    height: height,
    width: width
  };
  return _service;
};