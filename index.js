'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');

  // Detect mobile / desktop
  if (window.matchMedia) {
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    var setMode = function() {
      document.body.classList.toggle('mobile', mql.matches);
      document.body.classList.toggle('desktop', !mql.matches);
    };
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  // Touch detection
  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  // IE fallback
  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  // Viewer
  var viewer = new Marzipano.Viewer(panoElement, {
    controls: { mouseViewMode: data.settings.mouseViewMode }
  });

  // Scenes
  var scenes = data.scenes.map(function(sceneData) {
    var urlPrefix = "tiles";
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + sceneData.id + "/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/" + sceneData.id + "/preview.jpg" }
    );

    var geometry = new Marzipano.CubeGeometry(sceneData.levels);

    var limiter = Marzipano.RectilinearView.limit.traditional(
      sceneData.faceSize, 100*Math.PI/180, 120*Math.PI/180
    );

    var view = new Marzipano.RectilinearView(
      sceneData.initialViewParameters, limiter
    );

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    return { data: sceneData, scene: scene, view: view };
  });

  // Autorotate
  var autorotate = Marzipano.autorotate({
    yawSpeed: 0.03,
    targetPitch: 0,
    targetFov: Math.PI/2
  });

  if (autorotateToggleElement) {
    if (data.settings.autorotateEnabled) {
      autorotateToggleElement.classList.add('enabled');
    }

    autorotateToggleElement.addEventListener('click', function() {
      if (autorotateToggleElement.classList.contains('enabled')) {
        autorotateToggleElement.classList.remove('enabled');
        stopAutorotate();
      } else {
        autorotateToggleElement.classList.add('enabled');
        startAutorotate();
      }
    });
  }

  function startAutorotate() {
    if (!autorotateToggleElement || !autorotateToggleElement.classList.contains('enabled')) return;
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }

  // Fullscreen (optional)
  if (screenfull && screenfull.enabled && fullscreenToggleElement) {
    fullscreenToggleElement.addEventListener('click', function() {
      screenfull.toggle();
    });
  }

  // Scene switching (safe)
  function switchScene(scene) {
    stopAutorotate();
    scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    startAutorotate();
  }

  // Start first scene
  if (scenes.length > 0) {
    switchScene(scenes[0]);
  }

})();
