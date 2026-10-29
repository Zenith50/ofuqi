# Element Templates

Copy-paste JSON templates for each Excalidraw element type. The `strokeColor` and `backgroundColor` values MUST pull from `color-palette.md`.

## Free-Floating Text (no container)
All text dynamically scales based on length/lines.
```json
{
  "type": "text",
  "id": "label1",
  "x": 100, "y": 100,
  "width": 200, "height": 25,
  "text": "Section Title",
  "originalText": "Section Title",
  "fontSize": 20,
  "fontFamily": 3,
  "textAlign": "left",
  "verticalAlign": "top",
  "strokeColor": "<title color from palette>",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 1,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100
}
```

## Rectangle Dashboard Panes (Sub-zones)
For inner sections, use a dashed or solid border with 1px width.
```json
{
  "type": "rectangle",
  "id": "pane1",
  "x": 120, "y": 120, "width": 400, "height": 200,
  "strokeColor": "<stroke from palette based on semantic purpose>",
  "backgroundColor": "<fill box color from palette based on semantic purpose>",
  "fillStyle": "solid",
  "strokeWidth": 1,
  "strokeStyle": "dashed",
  "roughness": 0,
  "opacity": 100,
  "roundness": null
}
```

## Large Outer Bounding Boxes (Main Zones)
For macro architecture pieces, use a 2px solid border with rounded edges.
```json
{
  "type": "rectangle",
  "id": "zone1",
  "x": 100, "y": 100, "width": 500, "height": 400,
  "strokeColor": "<stroke from palette based on semantic purpose>",
  "backgroundColor": "<fill from palette based on semantic purpose>",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "roundness": {"type": 3, "value": 16}
}
```

## Structural Line / Divider
```json
{
  "type": "line",
  "id": "line1",
  "x": 100, "y": 100,
  "width": 0, "height": 200,
  "strokeColor": "<structural line color from palette>",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "points": [[0, 0], [0, 200]]
}
```

## Modern Triangle Arrow (with Text)
Floating labels sit directly over arrows to explain the connection or payload.
```json
{
  "type": "arrow",
  "id": "arrow1",
  "x": 200, "y": 145, "width": 118, "height": 0,
  "strokeColor": "<arrow color — match source element's stroke from palette>",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "points": [[0, 0], [118, 0]],
  "startArrowhead": null,
  "endArrowhead": "triangle"
}
```
