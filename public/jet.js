!function (e) { function n(r) { if (t[r]) return t[r].exports; var o = t[r] = { exports: {}, id: r, loaded: !1 }; return e[r].call(o.exports, o, o.exports, n), o.loaded = !0, o.exports } var t = {}; return n.m = e, n.c = t, n.p = "", n(0) }([function (e, n, t) { t(1) }, function (e, n) {
  window.addEventListener("DOMContentLoaded", function () {
    function e(e) { this.loadingUIText = e, this.intervalID = 0 } e.prototype.displayLoadingUI = function () { var e = document.getElementById("myBar"), n = 4, t = 93; this.intervalID = setInterval(function () { e.style.width = n + "%", t /= 2, n += t }.bind(this), 300), this.numberOfLoadedElemenets++ }, e.prototype.hideLoadingUI = function () { document.getElementById("loadingScreen").style.display = "none", document.getElementById("myProgress").style.display = "none", clearInterval(this.intervalID) }; var n = document.getElementById("game"); n.setAttribute("touch-action", "none"); var t = new BABYLON.Engine(n, !0), r = new BABYLON.Scene(t); r.clearColor = new BABYLON.Color3(0, 0, 0); var o = new e("I'm loading!!"); t.loadingScreen = o, t.loadingUIBackgroundColor = "black", t.loadingUIText = "Loading..."; var a, i = 1, c = [], B = (window.navigator.standalone, window.navigator.userAgent.toLowerCase()), s = (/safari/.test(B), /iphone|ipod|ipad/.test(B)), l = new BABYLON.AssetsManager(r), A = [{ name: "powerButton", src: "assets/power/power.png" }, { name: "muteSound", src: "assets/Sound-Mute.png" }, { name: "powerAxis", src: "assets/power/powerAxis.png" }]; A.forEach(function (e) { var n = l.addTextureTask(e.name, e.src); n.onSuccess = function (e) { c[e.name] = e.texture } }), l.onFinish = function () {
      camera2 = new BABYLON.ArcRotateCamera("Camera", 0, 1.5, 400, BABYLON.Vector3.Zero(), r), camera2.attachControl(n, !0); var e = .9, o = BABYLON.Mesh.CreatePlane("closeButton", 4, r); o.scaling = new BABYLON.Vector3(.3, .225, .3); var B = new BABYLON.StandardMaterial("matCloseButton", r); B.diffuseTexture = new BABYLON.Texture("assets/open.png", r), B.specularColor = new BABYLON.Color3(0, 0, 0), o.material = B, B.emissiveColor = BABYLON.Color3.White(), o.parent = camera2, o.position = new BABYLON.Vector3(-1, -3.3, 10), o.layerMask = 2147483648; var l = BABYLON.Mesh.CreatePlane("wireButton", 4, r); l.scaling = new BABYLON.Vector3(.3, .225, .3); var A = new BABYLON.StandardMaterial("matWireButton", r); A.diffuseTexture = new BABYLON.Texture("assets/wire.png", r), A.specularColor = new BABYLON.Color3(0, 0, 0), l.material = A, A.emissiveColor = BABYLON.Color3.White(), l.parent = camera2, l.position = new BABYLON.Vector3(1, -3.3, 10), l.layerMask = 2147483648, B.diffuseTexture.hasAlpha = !0, B.useAlphaFromDiffuseTexture = !0, A.diffuseTexture.hasAlpha = !0, A.useAlphaFromDiffuseTexture = !0; var g = BABYLON.Mesh.CreatePlane("background", 4, r), u = 1110; g.scaling = new BABYLON.Vector3(u, .57 * u, u); var O = new BABYLON.StandardMaterial("matbackground", r); O.diffuseTexture = new BABYLON.Texture("assets/background.jpg", r), O.specularColor = new BABYLON.Color3(0, 0, 0), g.material = O, O.emissiveColor = BABYLON.Color3.White(), g.parent = camera2, g.position = new BABYLON.Vector3(0, 0, 3e3), g.layerMask = 2147483648;

      var L = (new BABYLON.DirectionalLight("Dir0", new BABYLON.Vector3(10, 20, 0), r), new BABYLON.DirectionalLight("Dir1", new BABYLON.Vector3(-10, 20, 0), r), new BABYLON.DirectionalLight("Dir2", new BABYLON.Vector3(10, -15, 0), r), new BABYLON.DirectionalLight("Dir3", new BABYLON.Vector3(-10, -0, 0), r), new BABYLON.HemisphericLight("light4", new BABYLON.Vector3(0, 1, -1), r), -1.3);

      BABYLON.SceneLoader.ImportMesh("", "assets/", "jetEngine2.babylon", r, function (e) {
        actionManagerClose = new BABYLON.ActionManager(r), actionManagerWire = new BABYLON.ActionManager(r), o.actionManager = actionManagerClose, l.actionManager = actionManagerWire;

        var n = function (e, n, t, r, o) { e.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPickTrigger, n, "position", new BABYLON.Vector3(n.position.x + t, n.position.y + r, n.position.z + o), 1e3)).then(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPickTrigger, n, "position", new BABYLON.Vector3(n.position.x, n.position.y, n.position.z), 1e3)) },

          a = function (e, n, t) { s ? e.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, n.material, "alpha", .5)).then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, n.material, "alpha", 1)) : e.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, n.material, "wireframe", !0)).then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, n.material, "wireframe", !1)), e.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, n.material, "diffuseTexture", new BABYLON.Texture("assets/wire2.jpg", t))).then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, n.material, "diffuseTexture", new BABYLON.Texture("assets/RB211D.jpg", t))), e.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, n.material, "emissiveColor", new BABYLON.Color3(1, 1, 1))).then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, n.material, "emissiveColor", new BABYLON.Color3(1, 1, 1))), e.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, n.material, "diffuseColor", new BABYLON.Color3(1, 1, 1))).then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, n.material, "diffuseColor", new BABYLON.Color3(1, 1, 1))) };

        n(o, e[0], 100, 0, 0), n(o, e[1], 100, 0, 0), n(o, e[7], -100, 0, 0), n(o, e[6], 0, 50, 0), n(o, e[9], -100, 0, 0), n(o, e[19], 0, 0, 10), n(o, e[23], 0, 0, -45), n(o, e[2], 45, 0, 0), n(o, e[3], 0, 0, -45), n(o, e[4], 0, 0, 80), n(o, e[5], 0, 0, 0), n(o, e[8], -45, 0, 0); for (var c = 0; c < e.length; c++)a(l, e[c], r), e[c].layerMask = 2147483648;

        var B = function (e) { e.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, e.material, "specularColor", e.material.specularColor)), e.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, e.material, "specularColor", new BABYLON.Color3(.6, .6, .6))), e.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPointerOutTrigger, e, "scaling", new BABYLON.Vector3(.3, .225, .3), 100)), e.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPointerOverTrigger, e, "scaling", new BABYLON.Vector3(.35, .2625, .35), 100)) };

        B(o);

        var A = function (e) { e.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, e.material, "specularColor", e.material.specularColor)), e.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, e.material, "specularColor", new BABYLON.Color3(.6, .6, .6))), e.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPointerOutTrigger, e, "scaling", new BABYLON.Vector3(.3, .225, .3), 100)), e.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPointerOverTrigger, e, "scaling", new BABYLON.Vector3(.35, .2625, .35), 100)) };

        A(l); for (var g = BABYLON.Mesh.CreatePlane("dummy", 1e-4, r), c = 0; c < e.length; c++)e[c].parent = g; r.registerBeforeRender(function () { g.rotation.y = L, L += .001, x = L, speed = .05 * L * (t.getRenderHeight() - i), e[10].rotation.z = speed, e[12].rotation.z = speed, e[15].rotation.z = speed })
      }),

        setTimeout(function () { var n = new bGUI.GUISystem(r, t.getRenderWidth(), t.getRenderHeight()); n.enableClick(), powerButtonPositionX = e * t.getRenderWidth(); var o = new bGUI.GUIPanel("powerAxisPanel", c.powerAxis, null, n); o.relativePosition(new BABYLON.Vector3(e, .5, 0)), o.mesh.material.specularColor = new BABYLON.Color3(0, 0, 0), o.mesh.position.z = 1e3, a = new bGUI.GUIPanel("power", c.powerButton, null, n), a.relativePosition(new BABYLON.Vector3(e, .85, 0)), a.mesh.material.specularColor = new BABYLON.Color3(0, 0, 0), a.mesh.position.z = 10, r.registerBeforeRender(function () { a.mesh.rotation.z = L }); var i = new BABYLON.Sound("engineSound", "sounds/128613__smidoid__jetengine-loop2.wav", r, null, { loop: !0, autoplay: !0 }), B = new bGUI.GUIPanel("soundMuteButton", c.muteSound, null, n); B.relativePosition(new BABYLON.Vector3(.04, .94, 0)), B.mesh.material.specularColor = new BABYLON.Color3(0, 0, 0); var s = !0; B.onClick = function () { s ? (s = !s, i.stop()) : (s = !s, i.play()) }, 0 === r.activeCameras.length && r.activeCameras.push(r.activeCamera), r.activeCameras.push(n.getCamera()), camera2.layerMask = 2147483648 }, 100), t.runRenderLoop(function () { r.render() }); var w, d = function (e) { var t = r.pick(e.clientX, e.clientY, function (e) { return e == a.mesh }); t.pickedMesh && (w = t.pickedMesh, setTimeout(function () { camera2.detachControl(n) }, 0)) }, p = function (e) { if (w) { var n = r.pick(e.clientX, e.clientY); e.clientY > .15 * t.getRenderHeight() && e.clientY < .9 * t.getRenderHeight() && (w.position.y = n.pickedPoint.y, i = e.clientY) } }, Y = function () { setTimeout(function () { camera2.attachControl(n, !1) }, 10), w = null }; n.addEventListener("pointerdown", d, !1), n.addEventListener("pointerup", Y, !1), n.addEventListener("pointermove", p, !1), r.onDispose = function () { n.removeEventListener("pointerdown", d), n.removeEventListener("pointerup", Y), n.removeEventListener("pointermove", p) }, setTimeout(function () { console.log("onFinish"), $("#logoButton").show(), $("#share-buttons").show(), $("#html").css({ height: "100%" }), document.getElementById("overlay").style.display = "none" }, 2e3)
    }, l.load(), window.addEventListener("resize", function () { t.resize() })
  }), document.ontouchmove = function (e) { e.preventDefault() }
}]);