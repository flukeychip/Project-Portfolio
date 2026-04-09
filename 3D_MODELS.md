# Adding 3D Models to Your Portfolio

Interactive 3D models are **way more impressive** to employers than static images. Here's how to set them up.

## Quick Start

### 1. Export from Fusion 360
- Open your design in Fusion 360
- **File** → **Export** → Select **3MF format**
- Save to your project folder (e.g. `6dof arm/model.3mf`)

### 2. Convert to Web Format
```bash
pip install trimesh
python convert_3d.py
```

This automatically finds all `.3mf` files and converts them to `.glb` (web-optimized).

### 3. Add to Portfolio
Edit `js/projects.js` and add the model path:

```js
{
  id: "6dof-arm",
  name: "6-DOF Robot Arm",
  // ... other fields ...
  model: "6dof%20arm/model.glb",  // ← Add this line
  images: [...],
  files: []
}
```

**Note:** Spaces in folder names become `%20` in the path.

Done! The model will appear as an interactive 3D viewer in the project modal.

## Supported Formats
- **3MF** (Fusion 360 native — best quality)
- **STL** (alternative CAD export)
- **OBJ** (Wavefront)
- **PLY** (Point cloud / mesh)

## Tips
- **File size** — STL files can be large. Keep them under 10 MB for fast loading.
- **Simplify models** — Remove internal details that viewers won't see.
- **One model per project** — The `model` field is a single file, not an array.
- **Keep photos too** — Photos for different angles complement the 3D view.

## Interaction
When viewing a 3D model:
- **Scroll** — Rotate the model
- **Drag** — Pan the camera
- **Right-click + drag** — Zoom

## Troubleshooting

**"Model doesn't load"**
- Check the file path in `projects.js` (use `%20` for spaces)
- Make sure the `.glb` file exists in the project folder
- Check browser console for errors (F12)

**"Model looks tiny/huge"**
- This is normal for some exports. The viewer auto-scales, but you can:
  - Simplify the model in Fusion 360 before exporting
  - Scale in Blender if you have it

**"Conversion fails"**
- Install trimesh: `pip install trimesh`
- Make sure your `.3mf` files are valid (export again from Fusion)
- 3MF files are usually more robust than STL, so if one doesn't convert, try a different project first
