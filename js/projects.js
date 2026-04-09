// ============================================================
//  PROJECTS DATA — edit this file to update your portfolio
// ============================================================
//
//  HOW TO ADD PHOTOS:
//    - Put images in the project's existing subfolder (e.g. "6dof arm/")
//    - Add the path to the "images" array below (spaces become %20)
//      e.g.  images: ["6dof%20arm/photo1.jpg", "6dof%20arm/photo2.jpg"]
//
//  HOW TO ADD TIMELINE / PROGRESS PHOTOS:
//    - Add build progress shots to the "timeline" array
//    - These are hidden by default, revealed via "Show Build Timeline" button
//    - Order them chronologically (earliest first)
//
//  HOW TO ADD 3D MODELS:
//    1. Export your F3Z from Fusion 360 as STL
//    2. Run: python convert_3d.py
//    3. Add to project: model: "6dof%20arm/model.glb"
//
//  HOW TO ADD FILE LINKS (CAD, schematics, etc.):
//    - Add to the "files" array: { name: "Label", url: "path/or/url" }
//
// ============================================================

const projects = [
  {
    id: "6dof-arm",
    name: "6-DOF Robot Arm",
    tagline: "Six-degree-of-freedom articulated robot arm",
    description: "I have always wanted to build one of these and was inspired by the Universal Robots UR16e we have on campus. I am still in the process of designing everything, but I am using 20:1 cycloidal drives on the base, shoulder, and elbow, with 8:1 cycloidal drives on wrist 1, wrist 2, and wrist 3. Additionally, I am working on a PCB that mounts to the back of each motor and contains a dedicated motor driver, IMU, microcontroller, and power regulation. I noticed that many other DIY 6-DOF arms have large wire bundles running to each joint, so this is my attempt to minimize that. After the design is complete, I will start training it in Isaac Sim to clean my desk.",
    skills: ["Stepper Control", "Kinematics", "3D Printing", "Computer Vision", "CAD"],
    model: null,
    images: [
      "6dof%20arm/Screenshot%202026-03-04%20224359.png"
    ],
    timeline: [],
    files: []
  },
  {
    id: "ar-physics-simulation",
    name: "AR Physics Simulation",
    tagline: "Add a short tagline here",
    description: "One of my favorite and most interactable weekend projects. Saw someone who built something similar on X and i knew i wanted my own. within about half an our i had fully planned out how i wanted the system to work, give it to claude code and after some debugging it was fully working",
    skills: ["Computer Vision", "AprilTag Detection", "Homography Calibration", "Projective Geometry"],
    model: null,
    videos: [
      "AR%20pingpong/Looping%20cover%20video.mov"
    ],
    images: [
      "Analog%20heart%20beat%20detector/Oscilscope%20with%20ADC.png",
      "Analog%20heart%20beat%20detector/Complete%20Schmatic.png"
    ],
    timeline: [
      { src: "AR%20pingpong/Unable%20to%20get%20CV%20to%20recgonize%20anything.png", label: "Initial Setup"      },
      { src: "AR%20pingpong/Still%20struggling%20to%20get%20CV%20to%20work.png",     label: "Debugging"          },
      { src: "AR%20pingpong/Debugging%20april%20tag.png",                            label: "AprilTag Testing"   },
      { src: "AR%20pingpong/CV%20recgonizing%20working.png",                         label: "CV Working"         }
    ],
    files: []
  },
  {
    id: "sand-plotter",
    name: "Sand Plotter",
    tagline: "Kinetic sand art table driven by stepper motors",
    description: "I was inspired to build this after seeing it in a science museum, and it was surprisingly simple. It was the first large project I made, and all it took was some extruded aluminum, stepper motors, electronics, magnets, sand, and a trip to Home Depot.",
    skills: ["Stepper Motors", "Motion Control", "CAD", "Embedded Systems"],
    model: null,
    images: [
      "2%20axis%20sand%20plotter/Camera%20Shot.jpg"
    ],
    timeline: [],
    files: []
  },
  {
    id: "laser-engraver",
    name: "2-Axis Laser Engraver",
    tagline: "Custom-built CNC laser engraver",
    description: "I had a 5W laser diode from my modified Ender 3 and wanted to repurpose it into a larger standalone engraver. The frame design was inspired by my earlier Sand Plotter project, but this version improved the areas where that build struggled: rigidity, motion smoothness, and overall reliability. After a few hours of CAD and 3D printing, I built a machine with a 0.25 m² working area. If I revisit this project, I would add a second stepper motor on the Y-axis for even smoother and more stable motion.",
    skills: ["GRBL", "Stepper Motors", "CAD", "Laser Control", "Motion Control", "3D Printing"],
    model: "2%20axis%20laser%20engraver/laser-engraver.glb",
    videos: [
      "2%20axis%20laser%20engraver/IMG_1022.mov"
    ],
    images: [],
    timeline: [
      { src: "2%20axis%20laser%20engraver/Cad.jpg",             label: "CAD Design" },
      { src: "2%20axis%20laser%20engraver/Mockup.jpg",          label: "Initial Mockup" },
      { src: "2%20axis%20laser%20engraver/Attaching%20parts.jpg", label: "Assembly" },
      { src: "2%20axis%20laser%20engraver/Almost%20complete.jpg",  label: "Almost Complete" }
    ],
    files: []
  },
  {
    id: "buck-5v",
    name: "5V Buck Converter",
    tagline: "Custom switching power supply PCB",
    description: "this was my first time soldering smd components and i knew that this project was just a testbench. it taught me the process, and allowed me to incorperate it into other designs.",
    skills: ["PCB Design", "Autodesk Eagle", "Power Electronics", "Switching Regulators"],
    model: null,
    images: [
      "5v%20buck%20converter/Screenshot%202026-04-01%20170513.png"
    ],
    timeline: [],
    files: []
  },
  {
    id: "buck-12a",
    name: "12A Buck Converter",
    tagline: "High-current switching power supply PCB",
    description: "This is a continuation of the 5V buck converter. It still outputs 5V, but at the highest current I have worked with so far. This project is still a testbench for a future design.",
    skills: ["PCB Design", "Autodesk Eagle", "Power Electronics", "Switching Regulators"],
    model: null,
    images: [
      "12A%20buck%20converter/Screenshot%202026-01-07%20155437.png",
      "12A%20buck%20converter/Screenshot%202026-04-01%20170715.png",
      "12A%20buck%20converter/Screenshot%202026-04-01%20170732.png"
    ],
    timeline: [],
    files: []
  },
  {
    id: "esp32-testbench",
    name: "ESP32 Dev Board Testbench",
    tagline: "Custom ESP32 development and test PCB",
    description: "This is another proof of concept. For many of my other projects, I use an ESP32 dev board. However, the dev board adds unnecessary cost, takes up space, and can introduce reliability issues. I intended to use the schematic from this project as my own dev board, so I could drop it into another project and wire everything the way I normally would.",
    skills: ["ESP32", "PCB Design", "Autodesk Eagle", "Embedded Systems"],
    model: null,
    images: [
      "ESP32%20devboard%20testbench/Screenshot%202026-01-07%20174032.png",
      "ESP32%20devboard%20testbench/Screenshot%202026-04-01%20171213.png"
    ],
    timeline: [],
    files: []
  },
  {
    id: "led-controller",
    name: "LED Controller",
    tagline: "Multi-channel PWM LED control system",
    description: "I have been working on this project for a while and hope to turn it into a product. In the next iteration, I plan to incorporate lessons from my last two projects to address the shortcomings of the current version. The new design will use an SMD-soldered ESP32 instead of a dev board, and it will be powered through USB-C capable of delivering up to 60W.",
    skills: ["PWM", "PCB Design", "ESP 32", "LED Drivers"],
    model: null,
    images: [
      "LED%20controller/V2%20Holding.jpg"
    ],
    timeline: [
      { src: "LED%20controller/V1%20PCB%20top%20Cad.jpg",       label: "V1 PCB Design" },
      { src: "LED%20controller/V1%20Assembled.jpg",             label: "V1 Assembled" },
      { src: "LED%20controller/V2%20Partily%20assembled.jpg",   label: "V2 In Progress" }
    ],
    files: []
  },
  {
    id: "drone",
    name: "Drone",
    tagline: "Custom-built folding arm quadcopter",
    description: "Back during COVID, I was bored out of my mind and looking for a project to start. Coincidentally, my school had just given me a bunch of drone parts because they did not know what to do with them. I spent a few months refining the design to be as lightweight and inexpensive as possible. It uses an ultrasonic sensor to estimate height from the ground, and its bistable locking arms are held in position using pen springs (putting a few together is surprisingly effective). Unfortunately, I had no idea what I was doing when it came to PID tuning, and the drone would appear to be working fine, then oscillate wildly. This may also have been due to PETG being relatively flexible. If I revisit this project, I would redesign it from the ground up using everything I have learned since then.",
    skills: ["Flight Controller", "ESC", "CAD", "3D Printing", "PID Tuning"],
    model: null,
    images: [
      "Foldable%20Quadracopter/Arms%20Extended.jpg",
      "Foldable%20Quadracopter/Arms%20Folded.jpg"
    ],
    timeline: [],
    files: []
  },
  {
    id: "heartbeat-detector",
    name: "Analog Heartbeat Detector",
    tagline: "Biomedical analog circuit for pulse detection",
    description: "This is the only school-required project I have on here because I thought it was so cool. We were given a bucket of ICs and passive components and told we needed to build a circuit that would flash an LED every time your heart beat. Other than that, we were given a few constraints but not told how to actually build it. I thought the freedom to choose how it was built and what to use was really cool, and a good preview of what industry would actually be like.",
    skills: ["Op-Amps", "Analog Filters", "PCB Design", "Signal Conditioning"],
    model: null,
    images: [],
    timeline: [],
    files: []
  },
  {
    id: "drink-dispenser",
    name: "Drink Dispenser",
    tagline: "Automated drink dispensing system",
    description: "The inspiration for this came from YouTube, where I saw someone build an Alexa-controlled automated drink maker. I thought I could build a better one, so I spent about a month designing it. My version features a custom PCB (I did not know what a ground plane was at the time) and a load cell in the base, giving it closed-loop feedback on how many milliliters have been poured. It is also designed to be quickly and easily 3D printed, then assembled.",
    skills: ["Embedded Systems", "Motor Control", "CAD", "3D Printing"],
    model: null,
    images: [
      "Drink%20dispenser/PCB%20Top.jpg",
      "Drink%20dispenser/PCB%20Bottom.jpg"
    ],
    timeline: [],
    files: []
  },
  {
    id: "necklace-organizer",
    name: "Necklace Organizer",
    tagline: "Precision-designed parametric organizer",
    description: "Add your description here — what problem did this solve, how did you design and build it, what were the interesting challenges?",
    skills: ["CAD", "Fusion 360", "3D Printing", "Parametric Design"],
    model: null,
    images: [
      "Necklace%20orginizer/lockitprodphoto.jpg"
    ],
    timeline: [
      { src: "Necklace%20orginizer/Screenshot%202026-03-02%20160103.png", label: "3D Model" },
      { src: "Necklace%20orginizer/Screenshot%202026-03-02%20161246.png", label: "Drawing" },
      { src: "Necklace%20orginizer/Lockit%20full%20bed.jpg",               label: "3D Printing" }
    ],
    files: []
  },
  {
    id: "pantilt",
    name: "Pan-Tilt Mount",
    tagline: "Two-axis servo-driven camera and sensor mount",
    description: "When I started this project, I assumed it would take a week to finish. However, we kept adding features and improving it, and I ended up designing a custom PCB for it. It uses two stepper motors and OpenCV, and it also runs a small deep-learning ReID model to identify people and associate faces with names. It calculates a person's acceleration, subtracts the system's own movement, and predicts where the person will be.",
    skills: ["Stepper Control", "CAD", "3D Printing", "Computer Vision", "PID Tuning", "PCB Design"],
    model: null,
    images: [],
    timeline: [],
    files: []
  },
  {
    id: "parametric-speaker",
    name: "Parametric Speaker",
    tagline: "Ultrasonic directional audio transducer array",
    description: "Add your description here — what problem did this solve, how did you design and build it, what were the interesting challenges?",
    skills: ["Ultrasonic Transducers", "AM Modulation", "STM 32", "PCB Design"],
    model: null,
    images: [],
    timeline: [],
    files: []
  }
];
