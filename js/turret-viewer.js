/* ============================================================
   Turret Viewer — the laser tracks the cursor.

   One fixed camera angle, transparent background, no orbit. The model
   stands in frame and the beam follows the pointer.

   Geometry comes from wrist_mesh.json, exported from the CAD by
   export_mesh.py. That file is the contract: world-space triangle soup in
   three groups (static / carrier / payload) plus the measured joint axes.
   The axes were measured from the CAD's cylindrical faces, not assumed
   from its orientation — assuming them produced a wrong pointing formula
   once already, so they are read from the file every time.

   Kinematics are a bevel differential: pitch about the lateral motor
   axis, yaw about an axis carried by the pitch joint. The two intersect
   at the wrist centre, which is the origin of every angle here.
   ============================================================ */

(function (global) {
  'use strict';

  var V = function (x, y, z) { return new THREE.Vector3(x, y, z); };
  function degToRad(d) { return d * Math.PI / 180; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  var BELT_RATIO    = 60 / 26, MITER = 1.0;
  var N_DRIVE       = BELT_RATIO * MITER;   // payload degrees -> motor degrees
  var PITCH_LIMIT   = 90;     // degrees, mechanical
  var TARGET_RANGE  = 1500;   // mm, radius of the aim sphere
  var HOME_VIEW     = { r: 520, th: 2.55, ph: 1.05 };

  // Part colours. Kept identical to the standalone sim so the two read as
  // the same machine.
  var C = {
    // Wheat. These parts were 0xeef1f6, which is a shade off the page's own
    // 0xFAFAFC background — on a transparent canvas they read as missing
    // rather than white, and only the rim light hinted at their edges.
    white:    0xd6b98c,   // base plate, A/B frames, camera shells
    motor:    0x6e757f,
    gear:     0x454b54,
    outGear:  0x8a93a3,
    orange:   0xd98a3a,   // end caps, carrier, rear plate, faceplate
    silk:     0x2f6fd0,
    ic:       0x15181d,
    beam:     0x3ddc84,
    board:    0x1f6b3b,   // the controller PCB
    part:     0x22262c    // through-hole components on it
  };

  function mat(color, opacity) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.62,
      metalness: 0.22,
      flatShading: true,
      // Not a style choice. The B frame mesh is not watertight — OpenCascade
      // tessellated the mirrored instance coarsely and left 26 boundary
      // edges. DoubleSide makes a gap show the inside wall rather than
      // showing straight through the part.
      side: THREE.DoubleSide,
      transparent: opacity < 1,
      opacity: opacity === undefined ? 1 : opacity
    });
  }

  function meshFromTris(tris, color, opacity) {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tris), 3));
    g.computeVertexNormals();   // non-indexed → flat normals, right for machined parts
    return new THREE.Mesh(g, mat(color, opacity));
  }

  /* ---- body recovery -------------------------------------------------
     The JSON has no per-part offsets, so bodies are recovered by union-find
     over shared vertices. Coordinate thresholds do not work: touching CAD
     solids share a plane, so any box test cuts through the middle of parts.
     Connected components on shared vertices is exact for solids that do not
     actually touch, which every body worth colouring here satisfies. */
  function findBodies(v) {
    var n = v.length / 9, parent = new Int32Array(n), key = {};
    for (var i = 0; i < n; i++) parent[i] = i;
    function find(a) { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; }
    function union(a, b) { a = find(a); b = find(b); if (a !== b) parent[b] = a; }

    for (var t = 0; t < n; t++) {
      for (var c = 0; c < 3; c++) {
        var o = t * 9 + c * 3;
        var kk = v[o].toFixed(3) + ',' + v[o + 1].toFixed(3) + ',' + v[o + 2].toFixed(3);
        if (key[kk] === undefined) key[kk] = t; else union(key[kk], t);
      }
    }

    var groups = {};
    for (var j = 0; j < n; j++) {
      var r = find(j);
      if (!groups[r]) groups[r] = [];
      groups[r].push(j);
    }
    return groups;
  }

  function extent(v, tris) {
    var e = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity, n: tris.length };
    for (var i = 0; i < tris.length; i++) {
      for (var c = 0; c < 3; c++) {
        var o = tris[i] * 9 + c * 3;
        var x = v[o], y = v[o + 1], z = v[o + 2];
        if (x < e.x0) e.x0 = x; if (x > e.x1) e.x1 = x;
        if (y < e.y0) e.y0 = y; if (y > e.y1) e.y1 = y;
        if (z < e.z0) e.z0 = z; if (z > e.z1) e.z1 = z;
      }
    }
    return e;
  }

  function collect(v, tris) {
    var out = new Float32Array(tris.length * 9);
    for (var i = 0; i < tris.length; i++) {
      for (var k = 0; k < 9; k++) out[i * 9 + k] = v[tris[i] * 9 + k];
    }
    return out;
  }

  /* ---- static structure ----------------------------------------------
     Five classes. The order of these tests is load-bearing, they are not
     mutually exclusive: the base plate is as wide in Z as the motors, and
     the frame plates run the full height, so both must be taken before the
     outboard tests see them. Reorder and parts swap colours. */
  function classifyStatic(e) {
    var zOut = Math.max(Math.abs(e.z0), Math.abs(e.z1));
    var zIn  = Math.min(Math.abs(e.z0), Math.abs(e.z1));
    if (e.y1 < -60)                 return C.white;    // base plate
    if (e.y1 - e.y0 > 100)          return C.white;    // A/B frames
    if (zOut > 60)                  return C.motor;
    if (zIn > 40 && e.n > 500)      return C.orange;   // end caps
    return C.gear;
  }

  function TurretViewer(container) {
    this.container = container;
    this.scene = null; this.camera = null; this.renderer = null;
    this.carrierPivot = null; this.payloadPivot = null;
    this.beamLine = null; this.beamDot = null;
    this.animationId = null; this.visible = false;
    this.observer = null; this.resizeObserver = null;
    this.pendingMove = null; this.pointerListener = null;
    this.state = { pitch: 0, yaw: 0 };
    this.ready = false;
  }

  TurretViewer.prototype.resize = function () {
    if (!this.container || !this.camera || !this.renderer) return;
    var w = Math.max(1, this.container.clientWidth);
    var h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
  };

  TurretViewer.prototype.init = function () {
    if (typeof THREE === 'undefined') return false;
    try {
      this.scene = new THREE.Scene();          // no background: stays transparent
      this.camera = new THREE.PerspectiveCamera(42, 1, 1, 12000);
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setClearAlpha(0);
      this.container.appendChild(this.renderer.domElement);
      this.resize();
    } catch (e) {
      return false;
    }

    // On a transparent background the rim light is what separates the white
    // frames from whatever sits behind them. If the model reads flat, raise
    // the rim before touching anything else.
    this.scene.add(new THREE.HemisphereLight(0x94a6c4, 0x0a0c10, 0.85));
    var key = new THREE.DirectionalLight(0xffffff, 0.75); key.position.set(300, 500, 220);
    this.scene.add(key);
    var rim = new THREE.DirectionalLight(0x5aa0ff, 0.35); rim.position.set(-350, 120, -260);
    this.scene.add(rim);

    var self = this;
    this.observer = new IntersectionObserver(function (entries) {
      self.visible = entries[0].isIntersecting;
      if (self.visible) { self.resize(); if (!self.animationId) self.animate(); }
    }, { threshold: 0.01, rootMargin: '0px 0px 10% 0px' });
    this.observer.observe(this.container);

    this.resizeObserver = new ResizeObserver(function () {
      self.resize();
      if (self.mini) self.layoutMini();
      if (self.visible && self.ready) self.renderer.render(self.scene, self.camera);
    });
    this.resizeObserver.observe(this.container);
    return true;
  };

  TurretViewer.prototype.loadModel = function (src, onFailed) {
    var self = this;
    fetch(src)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { self.build(d); })
      .catch(function () { if (onFailed) onFailed(); });
  };

  TurretViewer.prototype.build = function (d) {
    var self = this;

    this.WC = V(d.wrist_centre[0], d.wrist_centre[1], d.wrist_centre[2]);
    this.LASER0 = V(d.laser[0], d.laser[1], d.laser[2]);
    this.PITCH_AXIS = V(d.axes.carrier.dir[0], d.axes.carrier.dir[1], d.axes.carrier.dir[2]).normalize();
    this.YAW_AXIS_CAD = V(d.axes.payload.dir[0], d.axes.payload.dir[1], d.axes.payload.dir[2]).normalize();

    this.deriveZero();

    // ---- scene graph. Nesting is the entire reason a tilted yaw axis
    // works: the yaw axis is carried by the pitch joint, so parenting
    // payloadPivot inside carrierPivot makes that automatic.
    // Everything the model is made of hangs off one root, so the whole
    // machine can be scaled and moved as a unit. The mini instance in the
    // carousel needs exactly that: a canvas spanning the whole strip, with
    // the turret parked over one card and its beam free to run past it.
    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.carrierPivot = new THREE.Group();
    this.carrierPivot.position.copy(this.WC);
    this.root.add(this.carrierPivot);
    this.payloadPivot = new THREE.Group();
    this.carrierPivot.add(this.payloadPivot);

    this.addStatic(d.groups.static.v);
    if (d.groups.pcb && d.groups.pcb.v && d.groups.pcb.v.length) this.addPCB(d.groups.pcb.v);
    this.addPivotGroup(this.carrierPivot, d.groups.carrier.v, C.orange);
    this.addPayload(d.groups.payload.v);

    // ---- beam
    var bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    this.beamLine = new THREE.Line(bg, new THREE.LineBasicMaterial({ color: C.beam }));
    this.beamLine.frustumCulled = false;
    this.root.add(this.beamLine);
    this.beamDot = new THREE.Mesh(
      new THREE.SphereGeometry(6, 16, 12),
      new THREE.MeshBasicMaterial({ color: C.beam })
    );
    this.root.add(this.beamDot);

    // ---- fixed camera. High enough that both input bevels are visibly
    // meshing with the output gear, which is the whole point of looking at
    // a differential, and far enough back that the beam stays in frame
    // through a useful sweep.
    var t = this.WC;
    this.camera.position.set(
      t.x + HOME_VIEW.r * Math.sin(HOME_VIEW.ph) * Math.cos(HOME_VIEW.th),
      t.y + HOME_VIEW.r * Math.cos(HOME_VIEW.ph),
      t.z + HOME_VIEW.r * Math.sin(HOME_VIEW.ph) * Math.sin(HOME_VIEW.th)
    );
    this.camera.lookAt(t);
    this.resize();

    // With a fixed camera the pointer has no other job, so the beam follows
    // the bare cursor with no click. Moves are coalesced to one solve per
    // frame: a mouse emits well over 100 events a second in bursts, and
    // solving per event throws most of the work away, which reads as
    // choppiness even when the renderer is keeping up.
    // Listen on the document, not the canvas. The turret should keep
    // following the cursor while you read the text beside it, which is the
    // whole appeal of putting it there — tracking only inside its own box
    // means it freezes the moment you look away from it.
    if (!this.isTouch()) {
      this.pointerListener = function (e) { self.pendingMove = { x: e.clientX, y: e.clientY }; };
      document.addEventListener('pointermove', this.pointerListener);
    }

    if (this.mini) this.layoutMini();

    this.ready = true;
    this.apply(0, 0);
    if (this.visible && !this.animationId) this.animate();
    else this.renderer.render(this.scene, this.camera);
  };

  /* Park the model over a given element and shrink it, leaving the canvas
     itself spanning the full strip so the beam is not clipped to the card.
     The offset is derived by unprojecting the wanted screen point at the
     wrist's own depth, so the wrist lands exactly there whatever the camera
     is doing. */
  TurretViewer.prototype.layoutMini = function () {
    if (!this.mini || !this.root) return;
    var host = document.querySelector(this.mini.anchor);
    if (!host) return;
    var hr = host.getBoundingClientRect();
    var cr = this.container.getBoundingClientRect();
    if (!cr.width || !cr.height || !hr.width) return;

    var k = this.mini.scale || 0.55;
    this.root.scale.setScalar(k);

    var sx = hr.left + hr.width / 2;
    var sy = hr.top + hr.height / 2;
    var depth = this.WC.clone().project(this.camera).z;
    var want = new THREE.Vector3(
      (sx - cr.left) / cr.width * 2 - 1,
      -((sy - cr.top) / cr.height * 2 - 1),
      depth
    ).unproject(this.camera);

    this.root.position.copy(want.sub(this.WC.clone().multiplyScalar(k)));
  };

  TurretViewer.prototype.isTouch = function () {
    return global.matchMedia('(hover: none) and (pointer: coarse)').matches;
  };

  /* Derive the mechanism's zero rather than trusting the CAD's saved pose.
     A rotation about the pitch axis IS pitch, so a yaw axis that is not
     vertical just means the assembly was dragged somewhere before saving.
     Taking that as the datum makes "pitch 0" mean "however it was last
     dragged". Currently the payload axis is already vertical and this
     evaluates to zero — keep it anyway. It is nine lines, and it is the
     difference between a re-export being a non-event and a re-export
     silently rotating the entire machine. */
  TurretViewer.prototype.deriveZero = function () {
    var up = V(0, 1, 0);
    up.addScaledVector(this.PITCH_AXIS, -up.dot(this.PITCH_AXIS));
    if (up.lengthSq() < 1e-9) up.set(0, 1, 0);
    up.normalize();

    var a = this.YAW_AXIS_CAD.clone()
      .addScaledVector(this.PITCH_AXIS, -this.YAW_AXIS_CAD.dot(this.PITCH_AXIS))
      .normalize();
    var cross = new THREE.Vector3().crossVectors(a, up);
    this.PITCH_OFFSET = Math.atan2(cross.dot(this.PITCH_AXIS), clamp(a.dot(up), -1, 1));

    this.YAW_AXIS0 = up.clone();
    // The faceplate lives in a different assembly, so the beam cannot be
    // read from this mesh. It is pinned by two facts: perpendicular to the
    // yaw axis (else yaw would only roll the image) and perpendicular to
    // the pitch axis at rest. That leaves one line; only the sign is free,
    // and it is resolved by the bore, which fires along world -X.
    this.BEAM0 = this.PITCH_AXIS.clone().cross(this.YAW_AXIS0).normalize();
    if (this.BEAM0.x > 0) this.BEAM0.negate();

    var c2 = new THREE.Vector3().crossVectors(this.YAW_AXIS0, this.BEAM0);
    this.SGN = c2.dot(this.PITCH_AXIS) < 0 ? -1 : 1;
  };

  TurretViewer.prototype.addStatic = function (v) {
    var bodies = findBodies(v), self = this;
    var keys = Object.keys(bodies);

    // The two input gears are the only static bodies that move. They ride on
    // the pitch axis, outboard toward their own frame plate, and they are
    // the bevels rather than the motors or end caps. Picked geometrically,
    // because the JSON carries no triangle-to-part mapping.
    // Picked by mass on each side of centre, not by how far outboard they
    // sit: the frame hardware is further out than the gears, and sorting by
    // |z| grabbed 265-triangle screws instead. Both sides must also resolve
    // to a substantial body, or nothing is animated at all — a lopsided
    // drivetrain is worse than a still one.
    var gearA = null, gearB = null, bestA = 0, bestB = 0;
    keys.forEach(function (r) {
      var e = extent(v, bodies[r]);
      if (classifyStatic(e) !== C.gear) return;
      var cz = (e.z0 + e.z1) / 2;
      if (Math.abs(cz) < 12) return;            // central pulley sits near z=0
      if (e.n < 5000) return;                   // screws and standoffs
      if (cz > 0 && e.n > bestA) { bestA = e.n; gearA = r; }
      if (cz < 0 && e.n > bestB) { bestB = e.n; gearB = r; }
    });
    if (!gearA || !gearB) { gearA = null; gearB = null; }

    this.gearAPivot = new THREE.Group(); this.gearAPivot.position.copy(this.WC);
    this.gearBPivot = new THREE.Group(); this.gearBPivot.position.copy(this.WC);
    this.root.add(this.gearAPivot); this.root.add(this.gearBPivot);

    keys.forEach(function (r) {
      var tris = bodies[r];
      var e = extent(v, tris);
      var geo = collect(v, tris);
      if (r === gearA)      self.addPivotGroup(self.gearAPivot, geo, C.gear);
      else if (r === gearB) self.addPivotGroup(self.gearBPivot, geo, C.gear);
      else {
        var m = meshFromTris(geo, classifyStatic(e));
        m.userData.ext = e;
        self.root.add(m);
      }
    });
    this.foundGears = !!(gearA && gearB);
  };

  /* The controller board. Fully static, so it costs one draw call and no
     per-frame work — the only things that move are the payload, the carrier
     and the two input gears. */
  TurretViewer.prototype.addPCB = function (v) {
    var bodies = findBodies(v), self = this, keys = Object.keys(bodies);
    var boardKey = null, boardScore = 0;
    keys.forEach(function (r) {
      var e = extent(v, bodies[r]);
      var thin = (e.y1 - e.y0) < 4;
      var area = (e.x1 - e.x0) * (e.z1 - e.z0);
      if (thin && area > boardScore) { boardScore = area; boardKey = r; }
    });
    keys.forEach(function (r) {
      self.root.add(meshFromTris(collect(v, bodies[r]), r === boardKey ? C.board : C.part));
    });
  };

  // Every mesh in the JSON is in world space, so after parenting it to a
  // pivot the pivot origin must be subtracted. Skip this and the part
  // orbits the world origin instead of spinning about the wrist: it looks
  // like a physics bug and it is an arithmetic one.
  TurretViewer.prototype.addPivotGroup = function (pivot, v, color) {
    var m = meshFromTris(v, color);
    m.position.copy(this.WC).negate();
    pivot.add(m);
  };

  /* Payload: five classes by Y extent. The GY-85 substrate is not a
     separate solid in the CAD — only its components are — so the
     "silkscreen" is synthesised from the rear plate's top face where it
     falls under the IC cluster. That is why the board reads blue with
     black ICs without any board body existing. */
  TurretViewer.prototype.addPayload = function (v) {
    var bodies = findBodies(v), keys = Object.keys(bodies), self = this;
    var ex = {}, maxN = 0;
    keys.forEach(function (r) { ex[r] = extent(v, bodies[r]); if (ex[r].n > maxN) maxN = ex[r].n; });

    var gearKey = keys[0];
    keys.forEach(function (r) { if (ex[r].y0 < ex[gearKey].y0) gearKey = r; });

    var backKey = null;
    keys.forEach(function (r) {
      if (r === gearKey || ex[r].n < maxN * 0.10) return;
      if (backKey === null || ex[r].y1 < ex[backKey].y1) backKey = r;
    });

    var ceiling = backKey ? ex[backKey].y1 : Infinity;
    var icBox = null;
    keys.forEach(function (r) {
      if (r === gearKey || r === backKey) return;
      if (ex[r].y0 >= ceiling - 0.5) {
        if (!icBox) icBox = { x0: ex[r].x0, x1: ex[r].x1, z0: ex[r].z0, z1: ex[r].z1 };
        else {
          icBox.x0 = Math.min(icBox.x0, ex[r].x0); icBox.x1 = Math.max(icBox.x1, ex[r].x1);
          icBox.z0 = Math.min(icBox.z0, ex[r].z0); icBox.z1 = Math.max(icBox.z1, ex[r].z1);
        }
      }
    });

    keys.forEach(function (r) {
      var tris = bodies[r], color;
      if (r === gearKey) color = C.outGear;
      else if (r === backKey) color = C.orange;
      else if (ex[r].y0 >= ceiling - 0.5) color = C.ic;
      else color = C.white;

      if (r === backKey && icBox) {
        var PAD = 1.5, plate = [], silk = [];
        for (var i = 0; i < tris.length; i++) {
          var o = tris[i] * 9, onTop = true, inBox = true;
          for (var c = 0; c < 3; c++) {
            var x = v[o + c * 3], y = v[o + c * 3 + 1], z = v[o + c * 3 + 2];
            if (Math.abs(y - ex[r].y1) > 0.6) onTop = false;
            if (x < icBox.x0 - PAD || x > icBox.x1 + PAD || z < icBox.z0 - PAD || z > icBox.z1 + PAD) inBox = false;
          }
          (onTop && inBox ? silk : plate).push(tris[i]);
        }
        if (silk.length) self.addPivotGroup(self.payloadPivot, collect(v, silk), C.silk);
        tris = plate;
      }
      if (tris.length) self.addPivotGroup(self.payloadPivot, collect(v, tris), color);
    });
  };

  // ---- kinematics -----------------------------------------------------
  TurretViewer.prototype.forward = function (pitchDeg, yawDeg) {
    var b = this.BEAM0.clone();
    b.applyAxisAngle(this.YAW_AXIS0, degToRad(yawDeg));
    b.applyAxisAngle(this.PITCH_AXIS, degToRad(pitchDeg));
    return b;
  };

  TurretViewer.prototype.inverse = function (dir) {
    var d = dir.clone().normalize();
    var yaw = Math.asin(clamp(this.SGN * d.dot(this.PITCH_AXIS), -1, 1));
    var perp = new THREE.Vector3().crossVectors(this.PITCH_AXIS, this.BEAM0);
    var pitch = Math.atan2(d.dot(perp), d.dot(this.BEAM0));
    return { pitch: clamp(pitch * 180 / Math.PI, -PITCH_LIMIT, PITCH_LIMIT), yaw: yaw * 180 / Math.PI };
  };

  // The bore sits 64 mm from the wrist centre and rides on both joints, so
  // the direction from the centre is not the direction from the laser.
  // Solving from the centre leaves the dot a couple of degrees off. This is
  // the same parallax the real tracking stack has to correct for.
  TurretViewer.prototype.laserOrigin = function (pitchDeg, yawDeg) {
    var o = this.LASER0.clone().sub(this.WC);
    o.applyAxisAngle(this.YAW_AXIS_CAD, degToRad(yawDeg));
    o.applyAxisAngle(this.PITCH_AXIS, degToRad(pitchDeg) + this.PITCH_OFFSET);
    return o.add(this.WC);
  };

  TurretViewer.prototype.solveThroughPoint = function (point) {
    var s = this.inverse(point.clone().sub(this.WC));
    for (var i = 0; i < 3; i++) {
      var o = this.laserOrigin(s.pitch, s.yaw);
      var next = this.inverse(point.clone().sub(o));
      if (Math.abs(next.pitch - s.pitch) < 1e-4 && Math.abs(next.yaw - s.yaw) < 1e-4) { s = next; break; }
      s = next;
    }
    return s;
  };

  TurretViewer.prototype.apply = function (pitchDeg, yawDeg) {
    this.state.pitch = pitchDeg; this.state.yaw = yawDeg;
    this.carrierPivot.quaternion.setFromAxisAngle(this.PITCH_AXIS, degToRad(pitchDeg) + this.PITCH_OFFSET);
    // YAW_AXIS_CAD, not YAW_AXIS0: the payload mesh is stored in the CAD's
    // saved frame, so it spins about the axis as saved, and PITCH_OFFSET on
    // the carrier carries it to the right place.
    this.payloadPivot.quaternion.setFromAxisAngle(this.YAW_AXIS_CAD, degToRad(yawDeg));

    // Pitch is the SUM of the two motor angles and yaw is the DIFFERENCE.
    // That relation is what makes this a differential rather than a stack of
    // two joints, and watching the two inputs turn together for pitch and
    // against each other for yaw is the clearest way to show it.
    if (this.gearAPivot) {
      var a = N_DRIVE * (pitchDeg + yawDeg);
      var b = N_DRIVE * (pitchDeg - yawDeg);
      this.gearAPivot.quaternion.setFromAxisAngle(this.PITCH_AXIS, degToRad(a) + this.PITCH_OFFSET);
      this.gearBPivot.quaternion.setFromAxisAngle(this.PITCH_AXIS, degToRad(b) + this.PITCH_OFFSET);
    }

    var origin = this.laserOrigin(pitchDeg, yawDeg);
    var dir = this.forward(pitchDeg, yawDeg);
    var end = origin.clone().addScaledVector(dir, TARGET_RANGE);
    var pos = this.beamLine.geometry.attributes.position;
    pos.setXYZ(0, origin.x, origin.y, origin.z);
    pos.setXYZ(1, end.x, end.y, end.z);
    pos.needsUpdate = true;
    this.beamDot.position.copy(end);
  };

  /* Cursor -> aim target.
     The obvious approach, and the one the standalone sim uses, is to
     intersect the cursor ray with a sphere about the wrist and take the far
     root: "the point under the cursor, beyond the turret". That is right
     for a viewer you can orbit, and wrong here. This camera sits in front
     of the turret, on the same side the beam fires out of, so "beyond the
     turret" is always behind it: measured against the original, every
     cursor position on screen solves to a pitch of 148-170 degrees, well
     outside the +/-90 of travel, and the turret just pins at its limit
     pointing at the floor. The other root is reachable but sweeps only
     about 15 degrees of pitch across the whole screen, which reads as
     stuck.

     So the cursor drives a direction cone about the front axis instead.
     The IK still does real work: the target is a world point and
     solveThroughPoint corrects for the bore riding on both joints, which
     is the same parallax the real tracking stack has to handle. What is
     given up is that the beam's far end lands exactly under the cursor,
     which is not attainable from a fixed camera on this side anyway. */
  /* Aim so the beam POINTS AT THE CURSOR ON SCREEN.

     Two earlier approaches both failed, and both failures were measured
     rather than guessed:

     Intersecting the cursor ray with a sphere and taking the far root is
     what the standalone sim does, and it is right for a viewer you can
     orbit. Here the camera sits in front of the turret, on the side the
     beam fires out of, so "beyond the turret" is always behind it: every
     cursor position solved to a pitch of 148-170 degrees, outside the
     +/-90 of travel, and the turret pinned at its limit pointing at the
     floor. The near root is reachable but sweeps only ~15 degrees of pitch
     across the whole screen, which reads as stuck.

     Building a direction cone in the turret's own frame tracks smoothly
     but does not point where the cursor is, because this camera is oblique
     — 30 degrees up and 146 around — so deflecting along the turret's up
     axis is not deflecting up the screen. That is why the beam slid
     downward as it swung right.

     The aim is a screen-space property, so it is solved in screen space:
     find the pose whose beam projects along the direction from the bore to
     the cursor. Two-level grid search, coarse then refined, which is a few
     hundred cheap projections per frame and cannot fail to converge or
     wander outside the travel limits the way an iterative solve can. */
  var MAX_STEP_DEG = 12;
  var EASE         = 0.35;  // fraction of the remaining error taken per frame    // per frame, keeps the head from teleporting
  // mm along the beam, the point matched to the cursor. Measured, not
  // picked: at 500 the reachable points span ~5000px against a ~640px
  // canvas, so the cost surface is steep enough that the search walks to a
  // travel limit and sticks. At 250 the span is ~730px, about one canvas.
  var AIM_RANGE    = 250;

  /* Where a point on the beam lands on screen, in pixels.

     Matching the beam's projected DIRECTION instead of a point looks
     equivalent and is not: a whole cone of 3D directions projects to the
     same 2D direction, so two poses far apart score identically. The solver
     flipped between them every frame, which is what made the payload thrash
     while the cursor moved and settle when it stopped. Matching a point is
     well conditioned and is also the more literal reading of "the laser
     points at the cursor". */
  TurretViewer.prototype.beamPointOnScreen = function (pitchDeg, yawDeg, rect) {
    var o = this.laserOrigin(pitchDeg, yawDeg);
    var d = this.forward(pitchDeg, yawDeg);
    var pt = o.addScaledVector(d, AIM_RANGE);
    pt.project(this.camera);
    if (pt.z > 1 || pt.z < -1) return null;          // behind the camera
    return {
      x: rect.left + (pt.x + 1) / 2 * rect.width,
      y: rect.top + (1 - pt.y) / 2 * rect.height
    };
  };

  TurretViewer.prototype.aimAtScreen = function (sx, sy, rect) {
    var self = this;

    // A small preference for staying near the current pose. Where two poses
    // put the beam equally close to the cursor, the solver would otherwise
    // be free to alternate between them frame to frame, which is the
    // residual wobble. At 0.3px per degree this only decides genuine ties.
    var cp0 = this.state.pitch, cy0 = this.state.yaw;
    function score(p, y) {
      var s = self.beamPointOnScreen(p, y, rect);
      if (!s) return -1e9;
      var d = Math.hypot(s.x - sx, s.y - sy);
      var travel = Math.abs(p - cp0) + Math.abs(y - cy0);
      return -(d + 0.3 * travel);
    }

    function refine(cp, cy, halfP, halfY) {
      var bp = cp, by = cy, best = score(cp, cy);
      for (var lvl = 0; lvl < 4; lvl++) {
        var sp = halfP / 4, sy2 = halfY / 4;
        for (var p = bp - halfP; p <= bp + halfP + 1e-9; p += sp) {
          if (p < -PITCH_LIMIT || p > PITCH_LIMIT) continue;
          for (var y = by - halfY; y <= by + halfY + 1e-9; y += sy2) {
            if (y < -90 || y > 90) continue;
            var a = score(p, y);
            if (a > best) { best = a; bp = p; by = y; }
          }
        }
        halfP = sp; halfY = sy2;
      }
      return { p: bp, y: by, a: best };
    }

    // Track from where the head already is, so small cursor moves make small
    // pose changes.
    var res = refine(this.state.pitch, this.state.yaw, 20, 20);

    // Only sweep the whole travel when local tracking has genuinely lost it,
    // e.g. the cursor jumped across the page.
    if (res.a < -40) {
      var bp = 0, by = 0, best = -1e9;
      for (var p = -PITCH_LIMIT; p <= PITCH_LIMIT; p += 10) {
        for (var y = -90; y <= 90; y += 12) {
          var a = score(p, y);
          if (a > best) { best = a; bp = p; by = y; }
        }
      }
      var g = refine(bp, by, 10, 12);
      if (g.a > res.a) res = g;
    }

    // Ease toward the solution instead of snapping to it. A first-order lag
    // cannot overshoot, so the rate limiter can no longer set up a cycle of
    // stepping past the target and back, and the head reads like something
    // driven rather than teleported.
    var tp = clamp(res.p, this.state.pitch - MAX_STEP_DEG, this.state.pitch + MAX_STEP_DEG);
    var ty = clamp(res.y, this.state.yaw - MAX_STEP_DEG, this.state.yaw + MAX_STEP_DEG);
    var np = this.state.pitch + (tp - this.state.pitch) * EASE;
    var ny = this.state.yaw + (ty - this.state.yaw) * EASE;

    // Deadband: below this the move is invisible and only costs a redraw.
    if (Math.abs(np - this.state.pitch) < 0.02 && Math.abs(ny - this.state.yaw) < 0.02) return;
    this.apply(clamp(np, -PITCH_LIMIT, PITCH_LIMIT), clamp(ny, -90, 90));
  };

  TurretViewer.prototype.drainPointer = function () {
    if (!this.pendingMove || !this.ready) return;
    var rect = this.container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.aimAtScreen(this.pendingMove.x, this.pendingMove.y, rect);
  };

  TurretViewer.prototype.animate = function () {
    var self = this;
    this.animationId = requestAnimationFrame(function () { self.animate(); });
    if (!this.visible) { cancelAnimationFrame(this.animationId); this.animationId = null; return; }
    this.drainPointer();
    if (this.ready) this.renderer.render(this.scene, this.camera);
  };

  TurretViewer.prototype.dispose = function () {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.observer) this.observer.disconnect();
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.pointerListener) document.removeEventListener('pointermove', this.pointerListener);
    if (this.renderer) { this.renderer.dispose(); }
    if (this.container) this.container.innerHTML = '';
  };

  global.TurretViewer = TurretViewer;
})(window);
