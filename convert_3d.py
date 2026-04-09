#!/usr/bin/env python3
"""
Convert 3D model files (STL, 3MF) to GLTF format for web viewing.

Usage:
  python convert_3d.py
  python convert_3d.py <input_file>
  python convert_3d.py <input_folder>

If no argument provided, scans all project folders for .stl and .3mf files.
"""

import os
import sys
from pathlib import Path

try:
    import trimesh
except ImportError:
    print("❌ trimesh not found. Install it with:")
    print("  pip install trimesh")
    sys.exit(1)

def convert_file(input_path, output_path=None):
    """Convert a 3D model file to GLTF format."""
    input_path = Path(input_path)

    if not input_path.exists():
        print(f"❌ File not found: {input_path}")
        return False

    if input_path.suffix.lower() not in ['.stl', '.3mf', '.obj', '.ply']:
        print(f"❌ Unsupported format: {input_path.suffix}")
        return False

    if output_path is None:
        output_path = input_path.with_suffix('.glb')
    else:
        output_path = Path(output_path)

    try:
        print(f"📦 Loading {input_path.name}...")
        mesh = trimesh.load(str(input_path))

        print(f"💾 Saving to {output_path.name}...")
        mesh.export(str(output_path), file_type='glb')

        print(f"✅ Converted: {input_path.name} → {output_path.name}")
        return True
    except Exception as e:
        print(f"❌ Error converting {input_path.name}: {e}")
        return False

def find_and_convert_all():
    """Scan all project folders and convert any .stl or .3mf files found."""
    base_dir = Path(__file__).parent
    converted = 0

    for file_path in base_dir.rglob('*'):
        if file_path.suffix.lower() in ['.stl', '.3mf']:
            output_path = file_path.with_suffix('.glb')
            if not output_path.exists():
                if convert_file(file_path, output_path):
                    converted += 1

    if converted == 0:
        print("\n📂 No .stl or .3mf files found.")
        print("\n📝 Next steps:")
        print("  1. Export your F3Z files from Fusion 360 as STL")
        print("  2. Place STL files in your project folders (e.g. '6dof arm/model.stl')")
        print("  3. Run this script again: python convert_3d.py")
    else:
        print(f"\n✅ Converted {converted} file(s)!")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        target = sys.argv[1]
        target_path = Path(target)

        if target_path.is_file():
            convert_file(target_path)
        elif target_path.is_dir():
            for file_path in target_path.rglob('*'):
                if file_path.suffix.lower() in ['.stl', '.3mf']:
                    convert_file(file_path, file_path.with_suffix('.glb'))
        else:
            print(f"❌ Path not found: {target}")
    else:
        find_and_convert_all()
