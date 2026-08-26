#!/usr/bin/env python3
"""Create a simple textured GLB presentation model for the SWC logo."""

from __future__ import annotations

import base64
import json
import math
import struct
from pathlib import Path


ROOT = Path(__file__).resolve().parent
# JPEG rather than PNG: the artwork is photographic (gradients, glow, bevels) and has no
# transparency, so JPEG compresses it ~12x better with no visible loss at logo scale.
# glTF supports image/png and image/jpeg natively — no extension needed.
TEXTURE = ROOT / "swc-logo-texture.jpg"
OUTPUT = ROOT / "swc-logo-3d.glb"


class GlbBuilder:
    def __init__(self) -> None:
        self.bin = bytearray()
        self.buffer_views = []
        self.accessors = []

    def _align(self, multiple: int = 4) -> None:
        while len(self.bin) % multiple:
            self.bin.append(0)

    def add_blob(self, data: bytes, target: int | None = None) -> int:
        self._align()
        offset = len(self.bin)
        self.bin.extend(data)
        view = {"buffer": 0, "byteOffset": offset, "byteLength": len(data)}
        if target is not None:
            view["target"] = target
        self.buffer_views.append(view)
        return len(self.buffer_views) - 1

    def add_accessor(
        self,
        data: bytes,
        component_type: int,
        count: int,
        accessor_type: str,
        target: int | None = None,
        min_value=None,
        max_value=None,
    ) -> int:
        view_index = self.add_blob(data, target)
        accessor = {
            "bufferView": view_index,
            "byteOffset": 0,
            "componentType": component_type,
            "count": count,
            "type": accessor_type,
        }
        if min_value is not None:
            accessor["min"] = min_value
        if max_value is not None:
            accessor["max"] = max_value
        self.accessors.append(accessor)
        return len(self.accessors) - 1


def pack_floats(values: list[float]) -> bytes:
    return struct.pack("<" + "f" * len(values), *values)


def pack_uint16(values: list[int]) -> bytes:
    return struct.pack("<" + "H" * len(values), *values)


def add_primitive(builder: GlbBuilder, vertices, normals, uvs, indices, material):
    xs = vertices[0::3]
    ys = vertices[1::3]
    zs = vertices[2::3]
    return {
        "attributes": {
            "POSITION": builder.add_accessor(
                pack_floats(vertices),
                5126,
                len(vertices) // 3,
                "VEC3",
                34962,
                [min(xs), min(ys), min(zs)],
                [max(xs), max(ys), max(zs)],
            ),
            "NORMAL": builder.add_accessor(
                pack_floats(normals), 5126, len(normals) // 3, "VEC3", 34962
            ),
            "TEXCOORD_0": builder.add_accessor(
                pack_floats(uvs), 5126, len(uvs) // 2, "VEC2", 34962
            ),
        },
        "indices": builder.add_accessor(
            pack_uint16(indices), 5123, len(indices), "SCALAR", 34963
        ),
        "material": material,
    }


def cuboid(x1, y1, z1, x2, y2, z2, material):
    faces = [
        # normal, corners
        ((0, 0, 1), [(x1, y1, z2), (x2, y1, z2), (x2, y2, z2), (x1, y2, z2)]),
        ((0, 0, -1), [(x2, y1, z1), (x1, y1, z1), (x1, y2, z1), (x2, y2, z1)]),
        ((1, 0, 0), [(x2, y1, z2), (x2, y1, z1), (x2, y2, z1), (x2, y2, z2)]),
        ((-1, 0, 0), [(x1, y1, z1), (x1, y1, z2), (x1, y2, z2), (x1, y2, z1)]),
        ((0, 1, 0), [(x1, y2, z2), (x2, y2, z2), (x2, y2, z1), (x1, y2, z1)]),
        ((0, -1, 0), [(x1, y1, z1), (x2, y1, z1), (x2, y1, z2), (x1, y1, z2)]),
    ]
    vertices, normals, uvs, indices = [], [], [], []
    for face_index, (normal, corners) in enumerate(faces):
        base = face_index * 4
        for corner in corners:
            vertices.extend(corner)
            normals.extend(normal)
        uvs.extend([0, 0, 1, 0, 1, 1, 0, 1])
        indices.extend([base, base + 1, base + 2, base, base + 2, base + 3])
    return vertices, normals, uvs, indices, material


def main() -> None:
    texture_bytes = TEXTURE.read_bytes()
    builder = GlbBuilder()
    image_view = builder.add_blob(texture_bytes)

    # The source logo is 16:9, so the plaque keeps the same proportions.
    width = 4.8
    height = 2.7
    depth = 0.18
    border = 0.13
    raised = 0.05

    half_w = width / 2
    half_h = height / 2
    front_z = depth / 2 + 0.003

    primitives = []

    # Main dark plaque.
    primitives.append(
        add_primitive(
            builder,
            *cuboid(-half_w, -half_h, -depth / 2, half_w, half_h, depth / 2, 1),
        )
    )

    # Logo face as a thin textured plane.
    vertices = [-half_w, -half_h, front_z, half_w, -half_h, front_z, half_w, half_h, front_z, -half_w, half_h, front_z]
    normals = [0, 0, 1] * 4
    uvs = [0, 1, 1, 1, 1, 0, 0, 0]
    indices = [0, 1, 2, 0, 2, 3]
    primitives.append(add_primitive(builder, vertices, normals, uvs, indices, 0))

    # Raised warm-gold rim so it reads as a 3D badge even from the side.
    rim_z1 = depth / 2
    rim_z2 = depth / 2 + raised
    rim_parts = [
        (-half_w, half_h - border, rim_z1, half_w, half_h, rim_z2),
        (-half_w, -half_h, rim_z1, half_w, -half_h + border, rim_z2),
        (-half_w, -half_h, rim_z1, -half_w + border, half_h, rim_z2),
        (half_w - border, -half_h, rim_z1, half_w, half_h, rim_z2),
    ]
    for part in rim_parts:
        primitives.append(add_primitive(builder, *cuboid(*part, 2)))

    # Add a slight backward tilt-friendly origin and scale metadata.
    gltf = {
        "asset": {"version": "2.0", "generator": "Codex SWC logo GLB exporter"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": "SWC Logo 3D Plaque"}],
        "meshes": [{"name": "SWC Logo 3D Plaque Mesh", "primitives": primitives}],
        "materials": [
            {
                "name": "SWC embedded logo texture",
                "pbrMetallicRoughness": {
                    "baseColorTexture": {"index": 0},
                    "metallicFactor": 0.0,
                    "roughnessFactor": 0.45,
                },
                "doubleSided": True,
            },
            {
                "name": "Midnight navy sides",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.015, 0.025, 0.055, 1.0],
                    "metallicFactor": 0.0,
                    "roughnessFactor": 0.38,
                },
            },
            {
                "name": "Warm gold raised rim",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.95, 0.61, 0.13, 1.0],
                    "metallicFactor": 0.35,
                    "roughnessFactor": 0.28,
                },
            },
        ],
        "textures": [{"source": 0}],
        "images": [{"bufferView": image_view, "mimeType": "image/jpeg", "name": "SWC logo texture"}],
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 33071, "wrapT": 33071}],
        "bufferViews": builder.buffer_views,
        "accessors": builder.accessors,
        "buffers": [{"byteLength": len(builder.bin)}],
    }

    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4:
        json_bytes += b" "
    while len(builder.bin) % 4:
        builder.bin.append(0)

    total_length = 12 + 8 + len(json_bytes) + 8 + len(builder.bin)
    with OUTPUT.open("wb") as out:
        out.write(struct.pack("<4sII", b"glTF", 2, total_length))
        out.write(struct.pack("<I4s", len(json_bytes), b"JSON"))
        out.write(json_bytes)
        out.write(struct.pack("<I4s", len(builder.bin), b"BIN\x00"))
        out.write(builder.bin)

    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
