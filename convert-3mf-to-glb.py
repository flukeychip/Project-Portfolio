#!/usr/bin/env python3
"""
Convert 3MF files to GLB (binary glTF) format using trimesh
Much more efficient for large files than Three.js

Installation:
  pip install trimesh numpy

Usage:
  python convert-3mf-to-glb.py <input.3mf> <output.glb>

Example:
  python convert-3mf-to-glb.py "2 axis laser engraver/Laser engraver.3mf" "2 axis laser engraver/laser-engraver.glb"
"""

import sys
import os
from pathlib import Path

try:
    import trimesh
except ImportError:
    print("Error: trimesh not installed. Run: pip install trimesh numpy")
    sys.exit(1)

def convert_3mf_to_glb(input_path, output_path):
    """Convert 3MF to GLB using trimesh"""

    # Resolve absolute paths
    input_path = Path(input_path).resolve()
    output_path = Path(output_path).resolve()

    print(f"Converting: {input_path}")
    print(f"Output: {output_path}")

    # Check if input file exists
    if not input_path.exists():
        print(f"Error: File not found: {input_path}")
        return False

    try:
        # Load 3MF file
        print("Loading 3MF file...")
        mesh = trimesh.load(str(input_path))

        # Create output directory if needed
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Export to GLB
        print("Exporting to GLB...")
        mesh.export(str(output_path), file_type='gltf')

        print(f"✓ Conversion complete: {output_path}")
        return True

    except Exception as e:
        print(f"Error during conversion: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python convert-3mf-to-glb.py <input.3mf> <output.glb>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    success = convert_3mf_to_glb(input_file, output_file)
    sys.exit(0 if success else 1)
