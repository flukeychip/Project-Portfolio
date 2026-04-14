// ============================================================
//  PROJECTS DATA — edit this file to update your portfolio
// ============================================================
//
//  HOW TO ADD PHOTOS:
//    - Put new project media in a new folder at repo root: "<project-folder>/"
//    - Run: powershell -ExecutionPolicy Bypass -File scripts/sync-assets.ps1
//    - Keep paths here relative to project folder (spaces become %20)
//      e.g.  images: ["6dof%20arm/photo1.jpg", "6dof%20arm/photo2.jpg"]
//    - The site auto-resolves these to "assets/<...>" at runtime
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
    description: "Inspired by the Universal Robots UR16e on campus, I am building a six-degree-of-freedom robot arm. My main goal is to design an efficient robotic arm, using 20:1 cycloidal drives for the base, shoulder, and elbow, and 8:1 cycloidal drives for the wrists. I am developing a PCB for each motor. I plan to integrate the driver, IMU, microcontroller, and power regulation to the reduce wiring on each joint. Once the design is finalized, I plan to train the arm in Isaac Sim to clean my desk.",
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
    tagline: "Interactive physics simulation",
    description: "One of my favorite and most interactive weekend projects. I saw someone who built something similar on X, and I knew I wanted my own. Within about half an hour, I had fully planned out how I wanted the system to work, gave it to Claude code, and after some debugging, it was fully working. It is extremely satisfying to place a Post-it note on the wall and watch projected ping pong balls appear from it and interact with other Post-it notes on the wall.",
    skills: ["Computer Vision", "AprilTag Detection", "Homography Calibration", "Projective Geometry"],
    model: null,
    videos: [
      "AR%20pingpong/ar-cover.mp4"
    ],
    images: [],
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
    tagline: "Kinetic sand art table",
    description: "I was inspired to build this after seeing it at a science museum and being impressed by how satisfying it was to draw patterns and watch all the parts move. It was the first large project I made, and all it took was some extruded aluminum, stepper motors, electronics, magnets, sand, and a trip to Home Depot.",
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
    description: "I took the 5W laser diode from my modified Ender 3 and repurposed it into a larger standalone engraver. My earlier Sand Plotter project inspired the frame design, but I improved areas where that build struggled: rigidity, motion smoothness, and overall reliability. After spending a few hours on CAD and 3D printing, I built a machine with a working area of 0.25 m². If I revisit this project, I will add a second stepper motor to the Y-axis for even smoother, more stable motion.",
    skills: ["GRBL", "Stepper Motors", "CAD", "Laser Control", "Motion Control", "3D Printing"],
    model: "2%20axis%20laser%20engraver/laser-engraver.glb",
    videos: [
      "2%20axis%20laser%20engraver/laser-engraver-demo.mp4"
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
    name: "Low Cost Switching Power Supply",
    tagline: "Custom switching power supply PCB",
    description: "This was my first time soldering SMD components, and I knew that this project was just a test bench. It taught me the process and allowed me to incorporate it into other designs.",
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
    description: "This is a continuation of the 5V buck converter. It still outputs 5V, but at the highest current I have worked with so far. This project is still a test bench for a future design.",
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
      "ESP32%20devboard%20testbench/Hot%20plare.jpg",
      "ESP32%20devboard%20testbench/Screenshot%202026-01-07%20174032.png",
      "ESP32%20devboard%20testbench/Screenshot%202026-04-01%20171213.png"
    ],
    timeline: [],
    files: []
  },
  {
    id: "led-controller",
    name: "WiFi Smart LED Controller",
    tagline: "Multi-channel PWM LED control system",
    description: "I have been working on this project for a while and hope to turn it into a product. In the next iteration, I plan to incorporate lessons from my last two projects to address the shortcomings of the current version. The new design will use an SMD-soldered ESP32 instead of a dev board, and it will be powered through USB-C, capable of delivering up to 60W.",
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
    name: "3D Printed Drone With Bistable Arms",
    tagline: "Custom-built folding arm quadcopter",
    description: "This project sprang from boredom during COVID, when my school was closed. Coincidentally, my school had just given me drone parts because they did not know what to do with them. I spent a few months refining the design to be as lightweight and inexpensive as possible. It uses an ultrasonic sensor to estimate height from the ground, and its bistable locking arms are held in position using pen springs (putting a few together is surprisingly effective). Unfortunately, I had no idea what I was doing with PID tuning, and the drone would seem to be working fine, then oscillate wildly. This may also have been due to PETG's relative flexibility. If I revisit this project, I would redesign it from the ground up using everything I have learned since then.",
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
    description: "This is the only school-required project I have on here because I thought it was so cool. We were given a bucket of ICs and passive components and told we needed to build a circuit that would flash an LED every time our heart beat. Other than that, we were given a few constraints but not told how to actually build it. I thought the freedom to choose how it was built and what to use was really cool, and a good preview of what the industry would actually be like.",
    skills: ["Op-Amps", "Analog Filters", "PCB Design", "Signal Conditioning"],
    model: null,
    images: [
      "Analog%20heart%20beat%20detector/Oscilscope%20with%20ADC.png",
      "Analog%20heart%20beat%20detector/Complete%20Schmatic.png"
    ],
    timeline: [
      { src: "Analog%20heart%20beat%20detector/Choosing%20wavelength%20to%20read%20bloodflow.png", label: "Choosing right wavelength" },
      { src: "Analog%20heart%20beat%20detector/Design%20of%20first%20filer.png", label: "Design of first filter" },
      { src: "Analog%20heart%20beat%20detector/Design%20of%20second%20filter.png", label: "Design of second filter" },
      { src: "Analog%20heart%20beat%20detector/Convert%20analog%20signal%20to%20digital.png", label: "Convert analog to digital" },
      { src: "Analog%20heart%20beat%20detector/Display%20digital%20signal%20on%20led.png", label: "Display sigital signal" }
    ],
    files: []
  },
  {
    id: "drink-dispenser",
    name: "Drink Dispenser",
    tagline: "Automated drink dispensing system",
    description: "Inspired by a YouTube video of an Alexa-controlled drink maker, I decided to design my own improved version over the course of a month. My system uses a custom PCB and a load cell in the base for closed-loop feedback. It's also designed for easy 3D printing and assembly.",
    skills: ["Embedded Systems", "Motor Control", "CAD", "3D Printing"],
    model: "Drink%20dispenser/drink-dispenser.glb",
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
    tagline: "Flexible, easy-to-use jewelry organizer",
    description: "This started as my little sister's request to organize all her necklaces while traveling. Apparently, one of the biggest issues travelers face is that their necklaces get tangled even when kept in a pouch. After massively over-engineering the first version—a print-in-place ratcheting mechanism with a release button—I refined it into a design that does the same job with shorter print times and comparable ease of use.",
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
    tagline: "Two-axis servo-driven camera and sensor platform",
    description: "This project started when someone began stealing furniture from the front of our house. A friend and I were given a $100 budget to build something that would stop it. We came up with the idea of attaching a gel blaster (basically a jello launcher) to a pan-tilt motion system. It took a lot of refinement to get where it is now, but it is finally complete. It features a custom PCB, a wide-field-of-view camera and a narrow-field-of-view camera, as well as night vision. A powerful computer runs a program that uses OpenCV to detect people and ReID checks to determine whether they are in the system. If they are not, it calculates how far away they are and then computes a ballistic lead with gravity compensation. There are plenty more features, and it serves as a great deterrent.",
    skills: ["Stepper Control", "CAD", "3D Printing", "Computer Vision", "PID Tuning", "PCB Design"],
    model: null,
    videos: [
      "pantilt/pantilt-demo.mp4",
      "pantilt/testing-software.mp4",
      "pantilt/img-2555.mp4",
      "pantilt/ryan-running.mp4",
      "pantilt/sam-moving-no-end-effector.mp4"
    ],
    images: [],
    timeline: [],
    files: []
  },
  {
    id: "parametric-speaker",
    name: "Parametric Speaker",
    tagline: "Ultrasonic \"sound laser\"",
    description: "I had heard of parametric speakers before—devices that use arrays of ultrasonic transducers to create highly directional audio beams, earning them the nickname \"sound laser.\" The effect is difficult to convey unless experienced in person. After a couple of late nights, I completed a working version on a perfboard that amplitude modulates an audio signal onto an ultrasonic carrier. While there are improvements I plan to make to the prototype, aiming the speaker at a flat surface illustrates how the modulated sound demodulates in air, causing the surface itself to \"emit\" sound—a phenomenon best appreciated live.",
    skills: ["Ultrasonic Transducers", "AM Modulation", "STM 32", "PCB Design"],
    model: null,
    videos: [
      "Parametric%20speaker/lab-video.mp4"
    ],
    images: [],
    timeline: [],
    files: []
  }
];
