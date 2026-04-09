#!/usr/bin/env node
/**
 * Convert 3MF files to GLB (binary glTF) format
 *
 * Installation:
 *   npm install three three-io-3mf
 *
 * Usage:
 *   node convert-3mf-to-glb.js <input.3mf> <output.glb>
 *
 * Example:
 *   node convert-3mf-to-glb.js "2 axis laser engraver/Laser cutter.3mf" "2 axis laser engraver/laser-cutter.glb"
 */

const fs = require('fs');
const path = require('path');
const THREE = require('three');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');
const { ThreeMFLoader } = require('three/examples/jsm/loaders/3MFLoader.js');

async function convertFile(inputPath, outputPath) {
  // Convert to absolute paths
  const absInputPath = path.resolve(inputPath);
  const absOutputPath = path.resolve(outputPath);

  console.log(`Converting: ${absInputPath}`);
  console.log(`Output: ${absOutputPath}`);

  // Check if input file exists
  if (!fs.existsSync(absInputPath)) {
    throw new Error(`Input file not found: ${absInputPath}`);
  }

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(absOutputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Load 3MF file using file:// URL
  const loader = new ThreeMFLoader();
  const fileUrl = 'file://' + absInputPath.replace(/\\/g, '/');
  const model = await new Promise((resolve, reject) => {
    loader.load(fileUrl, resolve, undefined, reject);
  });

  // Create scene and add model
  const scene = new THREE.Scene();
  scene.add(model);

  // Export to GLB
  const exporter = new GLTFExporter();
  const data = await new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (gltf) => resolve(gltf),
      (error) => reject(error),
      { binary: true }
    );
  });

  // Write GLB file
  fs.writeFileSync(absOutputPath, Buffer.from(data));
  console.log(`✓ Conversion complete: ${absOutputPath}`);
}

// Command-line interface
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node convert-3mf-to-glb.js <input.3mf> <output.glb>');
  process.exit(1);
}

const [inputPath, outputPath] = args;

if (!fs.existsSync(inputPath)) {
  console.error(`Error: File not found: ${inputPath}`);
  process.exit(1);
}

convertFile(inputPath, outputPath).catch((error) => {
  console.error('Conversion failed:', error.message);
  process.exit(1);
});
